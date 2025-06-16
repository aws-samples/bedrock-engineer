import { ContentBlock, Message, ImageFormat } from '@aws-sdk/client-bedrock-runtime'
import { ToolState } from '@/types/agent-chat'
import { generateMessageId } from '@/types/chat/metadata'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useAgentTools } from './useAgentTools'

import { AttachedImage } from '../components/InputForm/TextArea'
import { ToolName, isMcpTool } from '@/types/tools'
import { IdentifiableMessage } from '@/types/chat/message'

// 新しいユーティリティとカスタムフックのインポート
import { useMessagePersistence } from './useMessagePersistence'
import { useSessionTitleGenerator } from './useSessionTitleGenerator'
import { useChatNotification } from './useChatNotification'
import { useStreamChat } from './useStreamChat'

export const useAgentChat = (
  modelId: string,
  systemPrompt?: string,
  agentId?: string, // エージェントIDを受け取る
  sessionId?: string,
  options?: {
    enableHistory?: boolean
    tools?: ToolState[] // 明示的なツールリストを受け取るオプション
  }
) => {
  const { enableHistory = true, tools: explicitTools } = options || {} // デフォルトで履歴保存は有効

  const [messages, setMessages] = useState<IdentifiableMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [reasoning, setReasoning] = useState(false)
  const [executingTool, setExecutingTool] = useState<ToolName | null>(null)
  const [latestReasoningText, setLatestReasoningText] = useState<string>('')
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId)
  const lastAssistantMessageId = useRef<string | null>(null)
  const abortController = useRef<AbortController | null>(null)
  const { t } = useTranslation()
  const {
    notification,
    contextLength,
    guardrailSettings,
    getAgentTools,
    agents,
    enablePromptCache
  } = useSettings()

  // エージェントIDからツール設定を取得
  const rawEnabledTools = useMemo(() => {
    // 明示的に渡されたツールがある場合はそちらを優先
    if (explicitTools) {
      return explicitTools.filter((tool) => tool.enabled)
    }
    // エージェントIDがある場合はエージェント設定から取得
    else if (agentId) {
      // エージェントオブジェクトを取得（MCPサーバー設定の確認用）
      const currentAgent = agents.find((a) => a.id === agentId)
      const hasMcpServers = currentAgent?.mcpServers && currentAgent.mcpServers.length > 0

      const agentTools = getAgentTools(agentId).filter((tool) => tool.enabled)

      // 有効なツールをフィルタリング
      return agentTools.filter((tool) => {
        const toolName = tool.toolSpec?.name
        if (!toolName) return false

        // Tavilyツールの場合は、API Keyが設定されていることを確認
        if (toolName === 'tavilySearch') {
          // API Keyが設定されていない場合は除外
          const tavilyApiKey = window.store.get('tavilySearch')?.apikey
          return !!tavilyApiKey && tavilyApiKey.length > 0
        }

        // MCPツールの場合は、MCPサーバーが設定されていることを確認
        if (isMcpTool(toolName)) {
          // MCPサーバーが設定されていない場合は除外
          if (!hasMcpServers) {
            console.warn(
              `MCP tool "${toolName}" is enabled but no MCP servers are configured. Tool will be disabled.`
            )
            return false
          }
        }

        return true
      })
    }
    // どちらもない場合は空の配列を返す
    return []
  }, [agentId, getAgentTools, explicitTools, agents])

  // Plan/Act モードに基づいてツールをフィルタリング
  const enabledTools = useAgentTools(rawEnabledTools)

  // メッセージ永続化カスタムフック
  const { persistMessage } = useMessagePersistence({
    currentSessionId,
    modelId,
    enabledTools,
    enableHistory
  })

  // チャット通知カスタムフック
  const { showChatCompleteNotification } = useChatNotification({
    notification
  })

  // セッションタイトル生成カスタムフック
  const { checkAndGenerateTitle, generateTitleForPreviousSession } = useSessionTitleGenerator({
    enableHistory
  })

  // ストリームチャットカスタムフック
  const { streamChat, resetCachePoint } = useStreamChat({
    modelId,
    contextLength,
    enablePromptCache,
    lastAssistantMessageId,
    persistMessage
  })

  // 通信を中断する関数
  const abortCurrentRequest = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
    setLoading(false)
  }, [])

  // 通信を中断し、不完全なtoolUse/toolResultペアを削除する関数
  const stopGeneration = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null

      if (messages.length > 0) {
        // メッセージのコピーを作成
        const updatedMessages = [...messages]

        // toolUseIdを収集して、完全なペアを特定する
        const toolUseIds = new Map<string, { useIndex: number; resultIndex: number }>()

        // すべてのメッセージをスキャンしてtoolUseIdを収集
        updatedMessages.forEach((msg, msgIndex) => {
          if (!msg.content) return

          msg.content.forEach((content) => {
            // toolUseを見つけた場合
            if ('toolUse' in content && content.toolUse?.toolUseId) {
              const toolUseId = content.toolUse.toolUseId
              const entry = toolUseIds.get(toolUseId) || { useIndex: -1, resultIndex: -1 }
              entry.useIndex = msgIndex
              toolUseIds.set(toolUseId, entry)
            }

            // toolResultを見つけた場合
            if ('toolResult' in content && content.toolResult?.toolUseId) {
              const toolUseId = content.toolResult.toolUseId
              const entry = toolUseIds.get(toolUseId) || { useIndex: -1, resultIndex: -1 }
              entry.resultIndex = msgIndex
              toolUseIds.set(toolUseId, entry)
            }
          })
        })

        // 削除するメッセージのインデックスを収集（後ろから削除するため降順でソート）
        const indicesToDelete = new Set<number>()

        // メッセージを削除する前に、不完全なペアの最新のメッセージを特定
        toolUseIds.forEach(({ useIndex, resultIndex }) => {
          // toolUseだけがある場合（toolResultがない）
          if (useIndex >= 0 && resultIndex === -1) {
            indicesToDelete.add(useIndex)
          }
        })

        // 削除するインデックスを降順にソートして、削除時のインデックスのずれを防ぐ
        const sortedIndicesToDelete = [...indicesToDelete].sort((a, b) => b - a)

        // 削除するメッセージがある場合のみ処理を実行
        if (sortedIndicesToDelete.length > 0) {
          // 特定したメッセージを削除
          for (const index of sortedIndicesToDelete) {
            updatedMessages.splice(index, 1)

            // メッセージ履歴からも削除
            if (currentSessionId) {
              deleteMessage(currentSessionId, index)
            }
          }

          // 更新されたメッセージ配列を設定
          setMessages(updatedMessages)

          toast.success(t('Generation stopped'))
        } else {
          // 不完全なペアがない場合は単に停止メッセージを表示
          toast.success(t('Generation stopped'))
        }
      }
    }

    setLoading(false)
    setExecutingTool(null)
  }, [messages, currentSessionId, t])

  // ChatHistoryContext から操作関数を取得
  const { getSession, createSession, setActiveSession, deleteMessage } = useChatHistory()

  // セッションの初期化
  useEffect(() => {
    const initSession = async () => {
      if (sessionId) {
        const session = getSession(sessionId)
        if (session) {
          // 既存の通信があれば中断
          abortCurrentRequest()
          setMessages(session.messages as Message[])
          setCurrentSessionId(sessionId)
          // 新しいセッションに切り替えた場合はキャッシュポイントをリセット
          resetCachePoint()
        }
      } else if (enableHistory) {
        // 履歴保存が有効な場合のみ新しいセッションを作成
        const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
        setCurrentSessionId(newSessionId)
        // 新しいセッションを作成した場合はキャッシュポイントをリセット
        resetCachePoint()
      }
    }

    initSession()
  }, [sessionId, enableHistory, getSession, createSession, abortCurrentRequest])

  // コンポーネントのアンマウント時にアクティブな通信を中断
  useEffect(() => {
    return () => {
      abortCurrentRequest()
    }
  }, [])

  // currentSessionId が変わった時の処理
  useEffect(() => {
    if (currentSessionId) {
      // セッション切り替え時に進行中の通信を中断
      abortCurrentRequest()
      const session = getSession(currentSessionId)
      if (session) {
        setMessages(session.messages as Message[])
        setActiveSession(currentSessionId)
        // セッション切り替え時にキャッシュポイントをリセット
        resetCachePoint()
      }
    }
  }, [currentSessionId, getSession, setActiveSession, abortCurrentRequest, resetCachePoint])

  const recursivelyExecTool = async (contentBlocks: ContentBlock[], currentMessages: Message[]) => {
    const contentBlock = contentBlocks.find((block) => block.toolUse)
    if (!contentBlock) {
      return
    }

    const toolResults: ContentBlock[] = []
    for (const contentBlock of contentBlocks) {
      if (Object.keys(contentBlock).includes('toolUse')) {
        const toolUse = contentBlock.toolUse
        if (toolUse?.name) {
          try {
            const toolInput = {
              type: toolUse.name,
              ...(toolUse.input as any)
            }
            setExecutingTool(toolInput.type)
            const toolResult = await window.api.bedrock.executeTool(toolInput)
            setExecutingTool(null)

            // ツール実行結果用のContentBlockを作成
            let resultContentBlock: ContentBlock
            if (Object.prototype.hasOwnProperty.call(toolResult, 'name')) {
              resultContentBlock = {
                toolResult: {
                  toolUseId: toolUse.toolUseId,
                  content: [{ json: toolResult as any }],
                  status: 'success'
                }
              }
            } else {
              resultContentBlock = {
                toolResult: {
                  toolUseId: toolUse.toolUseId,
                  content: [{ text: toolResult as any }],
                  status: 'success'
                }
              }
            }

            // GuardrailがActive状態であればチェック実行
            if (
              guardrailSettings.enabled &&
              guardrailSettings.guardrailIdentifier &&
              guardrailSettings.guardrailVersion
            ) {
              try {
                console.log('Applying guardrail to tool result')
                // ツール結果をガードレールで検証
                const toolResultText =
                  typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)

                console.log({ toolResultText })
                // ツール結果をGuardrailで評価
                const guardrailResult = await window.api.bedrock.applyGuardrail({
                  guardrailIdentifier: guardrailSettings.guardrailIdentifier,
                  guardrailVersion: guardrailSettings.guardrailVersion,
                  source: 'OUTPUT', // ツールからの出力をチェック
                  content: [
                    {
                      text: {
                        text: toolResultText
                      }
                    }
                  ]
                })
                console.log({ guardrailResult })

                // ガードレールが介入した場合は代わりにエラーメッセージを使用
                if (guardrailResult.action === 'GUARDRAIL_INTERVENED') {
                  console.warn('Guardrail intervened for tool result', guardrailResult)
                  let errorMessage = t('guardrail.toolResult.blocked')

                  // もしガードレールが出力を提供していれば、それを使用
                  if (guardrailResult.outputs && guardrailResult.outputs.length > 0) {
                    const output = guardrailResult.outputs[0]
                    if (output.text) {
                      errorMessage = output.text
                    }
                  }

                  // エラーステータスのツール結果を作成
                  resultContentBlock = {
                    toolResult: {
                      toolUseId: toolUse.toolUseId,
                      content: [{ text: errorMessage }],
                      status: 'error'
                    }
                  }

                  toast(t('guardrail.intervention'), {
                    icon: '⚠️',
                    style: {
                      backgroundColor: '#FEF3C7', // Light yellow background
                      color: '#92400E', // Amber text color
                      border: '1px solid #F59E0B' // Amber border
                    }
                  })
                }
              } catch (guardrailError) {
                console.error('Error applying guardrail to tool result:', guardrailError)
                // ガードレールエラー時は元のツール結果を使用し続ける
              }
            }

            // 最終的なツール結果をコレクションに追加
            toolResults.push(resultContentBlock)
          } catch (e: any) {
            console.error(e)
            toolResults.push({
              toolResult: {
                toolUseId: toolUse.toolUseId,
                content: [{ text: e.toString() }],
                status: 'error'
              }
            })
          }
        }
      }
    }

    const toolResultMessage: IdentifiableMessage = {
      role: 'user',
      content: toolResults,
      id: generateMessageId()
    }
    currentMessages.push(toolResultMessage)
    setMessages((prev) => [...prev, toolResultMessage])
    await persistMessage(toolResultMessage)

    const stopReason = await streamChat(
      {
        messages: currentMessages,
        modelId,
        system: systemPrompt ? [{ text: systemPrompt }] : undefined,
        toolConfig: enabledTools.length ? { tools: enabledTools } : undefined
      },
      currentMessages,
      {
        setMessages,
        setReasoning,
        setLatestReasoningText
      }
    )

    if (stopReason === 'tool_use') {
      const lastMessage = currentMessages[currentMessages.length - 1].content
      if (lastMessage) {
        await recursivelyExecTool(lastMessage, currentMessages)
        return
      }
    }
  }

  const handleSubmit = async (userInput: string, attachedImages?: AttachedImage[]) => {
    if (!userInput && (!attachedImages || attachedImages.length === 0)) {
      return toast.error('Please enter a message or attach images')
    }

    if (!modelId) {
      return toast.error('Please select a model')
    }

    let result
    try {
      setLoading(true)
      const currentMessages = [...messages]

      const imageContents: any =
        attachedImages?.map((image) => ({
          image: {
            format: image.file.type.split('/')[1] as ImageFormat,
            source: {
              bytes: image.base64
            }
          }
        })) ?? []

      // GuardRails形式のメッセージを構築
      const textContent = guardrailSettings.enabled
        ? {
            guardContent: {
              text: {
                text: userInput
              }
            }
          }
        : {
            text: userInput
          }

      const content = imageContents.length > 0 ? [...imageContents, textContent] : [textContent]

      const userMessage: IdentifiableMessage = {
        role: 'user',
        content,
        id: generateMessageId()
      }

      currentMessages.push(userMessage)
      setMessages((prev) => [...prev, userMessage])
      await persistMessage(userMessage)

      await streamChat(
        {
          messages: currentMessages,
          modelId,
          system: systemPrompt ? [{ text: systemPrompt }] : undefined,
          toolConfig: enabledTools.length ? { tools: enabledTools } : undefined
        },
        currentMessages,
        {
          setMessages,
          setReasoning,
          setLatestReasoningText
        }
      )

      const lastMessage = currentMessages[currentMessages.length - 1]
      if (lastMessage.content?.find((v) => v.toolUse)) {
        if (!lastMessage.content) {
          console.warn(lastMessage)
          result = null
        } else {
          result = await recursivelyExecTool(lastMessage.content, currentMessages)
        }
      }

      // チャット完了時に通知を表示（カスタムフック使用）
      await showChatCompleteNotification(currentMessages as IdentifiableMessage[])
    } catch (error: any) {
      console.error('Error in handleSubmit:', error)
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
      setExecutingTool(null)
    }
    return result
  }

  // チャットをクリアする機能
  const clearChat = useCallback(async () => {
    // 進行中の通信を中断
    abortCurrentRequest()

    // 新しいセッションを作成
    const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
    setCurrentSessionId(newSessionId)

    // メッセージをクリア
    setMessages([])

    // キャッシュポイントもリセット
    resetCachePoint()
  }, [modelId, systemPrompt, abortCurrentRequest, createSession, resetCachePoint])

  // メッセージ数を監視してタイトル生成を実行（カスタムフック使用）
  useEffect(() => {
    checkAndGenerateTitle(messages, currentSessionId)
  }, [messages.length, currentSessionId, checkAndGenerateTitle])

  const setSession = useCallback(
    (newSessionId: string) => {
      // 既存のセッションにタイトルを生成（カスタムフック使用）
      generateTitleForPreviousSession(messages, currentSessionId)

      // 進行中の通信を中断してから新しいセッションを設定
      abortCurrentRequest()
      setCurrentSessionId(newSessionId)
    },
    [abortCurrentRequest, messages, currentSessionId, generateTitleForPreviousSession]
  )

  return {
    messages,
    loading,
    reasoning,
    executingTool,
    latestReasoningText, // 最新のreasoningTextを外部に公開
    handleSubmit,
    setMessages,
    currentSessionId,
    setCurrentSessionId: setSession, // 中断処理付きのセッション切り替え関数を返す
    clearChat,
    stopGeneration // 停止ボタン用の関数をエクスポート
  }
}
