import {
  ConversationRole,
  ContentBlock,
  Message,
  ToolUseBlockStart,
  ImageFormat
} from '@aws-sdk/client-bedrock-runtime'
import { ToolState } from '@/types/agent-chat'
import { generateMessageId } from '@/types/chat/metadata'
import { StreamChatCompletionProps, streamChatCompletion } from '@renderer/lib/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '@renderer/contexts/SettingsContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { AttachedImage } from '../components/InputForm/TextArea'
import { ChatMessage } from '@/types/chat/history'
import { ToolName, isMcpTool } from '@/types/tools'
import { notificationService } from '@renderer/services/NotificationService'
import { limitContextLength } from '@renderer/lib/contextLength'
import { IdentifiableMessage } from '@/types/chat/message'

// メッセージの送信時に、Trace を全て載せると InputToken が逼迫するので取り除く
function removeTraces(messages) {
  return messages.map((message) => {
    if (message.content && Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.map((item) => {
          if (item.toolResult) {
            return {
              ...item,
              toolResult: {
                ...item.toolResult,
                content: item.toolResult.content.map((c) => {
                  if (c?.json?.result?.completion) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { traces, ...restCompletion } = c.json.result.completion
                    return {
                      ...c,
                      json: {
                        ...c.json,
                        result: {
                          ...c.json.result,
                          completion: restCompletion
                        }
                      }
                    }
                  }
                  return c
                })
              }
            }
          }
          return item
        })
      }
    }
    return message
  })
}

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
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId)
  const lastAssistantMessageId = useRef<string | null>(null)
  const abortController = useRef<AbortController | null>(null)
  const { t } = useTranslation()
  const { notification, contextLength, guardrailSettings, getAgentTools, agents } = useSettings()

  // エージェントIDからツール設定を取得
  const enabledTools = useMemo(() => {
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
              window.chatHistory.deleteMessage(currentSessionId, index)
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

  // セッションの初期化
  useEffect(() => {
    const initSession = async () => {
      if (sessionId) {
        const session = window.chatHistory.getSession(sessionId)
        if (session) {
          // 既存の通信があれば中断
          abortCurrentRequest()
          setMessages(session.messages as Message[])
          setCurrentSessionId(sessionId)
        }
      } else if (enableHistory) {
        // 履歴保存が有効な場合のみ新しいセッションを作成
        const newSessionId = await window.chatHistory.createSession(
          'defaultAgent',
          modelId,
          systemPrompt
        )
        setCurrentSessionId(newSessionId)
      }
    }

    initSession()
  }, [sessionId, enableHistory])

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
      const session = window.chatHistory.getSession(currentSessionId)
      if (session) {
        setMessages(session.messages as Message[])
        window.chatHistory.setActiveSession(currentSessionId)
      }
    }
  }, [currentSessionId])

  // メッセージの永続化を行うラッパー関数
  const persistMessage = useCallback(
    async (message: IdentifiableMessage) => {
      if (!enableHistory) return

      if (currentSessionId && message.role && message.content) {
        // メッセージにIDがなければ生成する
        if (!message.id) {
          message.id = generateMessageId()
        }

        const chatMessage: ChatMessage = {
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: Date.now(),
          metadata: {
            modelId,
            tools: enabledTools,
            converseMetadata: message.metadata?.converseMetadata // メッセージ内のメタデータを使用
          }
        }
        await window.chatHistory.addMessage(currentSessionId, chatMessage)
      }

      return message
    },
    [currentSessionId, modelId, enabledTools, enableHistory]
  )

  const streamChat = async (props: StreamChatCompletionProps, currentMessages: Message[]) => {
    // 既存の通信があれば中断
    if (abortController.current) {
      abortController.current.abort()
    }

    // 新しい AbortController を作成
    abortController.current = new AbortController()

    // Context長に基づいてメッセージを制限
    const limitedMessages = limitContextLength(currentMessages, contextLength)
    props.messages = removeTraces(limitedMessages)

    const generator = streamChatCompletion(props, abortController.current.signal)

    let s = ''
    let reasoningContentText = ''
    let reasoningContentSignature = ''
    let redactedContent
    let input = ''
    let role: ConversationRole = 'assistant' // デフォルト値を設定
    let toolUse: ToolUseBlockStart | undefined = undefined
    let stopReason
    const content: ContentBlock[] = []

    let messageStart = false
    try {
      for await (const json of generator) {
        if (json.messageStart) {
          role = json.messageStart.role ?? 'assistant' // デフォルト値を設定
          messageStart = true
        } else if (json.messageStop) {
          if (!messageStart) {
            console.warn('messageStop without messageStart')
            console.log(messages)
            await streamChat(props, currentMessages)
            return
          }
          // 新しいメッセージIDを生成
          const messageId = generateMessageId()
          const newMessage: IdentifiableMessage = { role, content, id: messageId }

          // アシスタントメッセージの場合、最後のメッセージIDを保持
          if (role === 'assistant') {
            lastAssistantMessageId.current = messageId
          }

          // UI表示のために即時メッセージを追加
          setMessages([...currentMessages, newMessage])
          currentMessages.push(newMessage)

          // メッセージ停止時点では永続化せず、後のメタデータ処理で永続化する
          // この時点ではまだメタデータが来ていない可能性があるため

          stopReason = json.messageStop.stopReason
        } else if (json.contentBlockStart) {
          toolUse = json.contentBlockStart.start?.toolUse
        } else if (json.contentBlockStop) {
          if (toolUse) {
            let parseInput: string
            try {
              parseInput = JSON.parse(input)
            } catch (e) {
              parseInput = input
            }

            content.push({
              toolUse: { name: toolUse?.name, toolUseId: toolUse?.toolUseId, input: parseInput }
            })
          } else {
            if (s.length > 0) {
              const getReasoningBlock = () => {
                if (reasoningContentText.length > 0) {
                  return {
                    reasoningContent: {
                      reasoningText: {
                        text: reasoningContentText,
                        signature: reasoningContentSignature
                      }
                    }
                  }
                } else if (reasoningContentSignature.length > 0) {
                  return {
                    reasoningContent: {
                      redactedContent: redactedContent
                    }
                  }
                } else {
                  return null
                }
              }

              const reasoningBlock = getReasoningBlock()
              const contentBlocks = reasoningBlock ? [reasoningBlock, { text: s }] : [{ text: s }]
              content.push(...contentBlocks)
            }
          }
          input = ''
          setReasoning(false)
        } else if (json.contentBlockDelta) {
          const text = json.contentBlockDelta.delta?.text
          if (text) {
            s = s + text

            const getContentBlocks = () => {
              if (redactedContent) {
                return [
                  {
                    reasoningContent: {
                      redactedContent: redactedContent
                    }
                  },
                  { text: s }
                ]
              } else if (reasoningContentText.length > 0) {
                return [
                  {
                    reasoningContent: {
                      reasoningText: {
                        text: reasoningContentText,
                        signature: reasoningContentSignature
                      }
                    }
                  },
                  { text: s }
                ]
              } else {
                return [{ text: s }]
              }
            }

            const contentBlocks = getContentBlocks()
            setMessages([...currentMessages, { role, content: contentBlocks }])
          }

          const reasoningContent = json.contentBlockDelta.delta?.reasoningContent
          if (reasoningContent) {
            setReasoning(true)
            if (reasoningContent?.text || reasoningContent?.signature) {
              reasoningContentText = reasoningContentText + (reasoningContent?.text || '')
              reasoningContentSignature = reasoningContent?.signature || ''

              setMessages([
                ...currentMessages,
                {
                  role: 'assistant',
                  content: [
                    {
                      reasoningContent: {
                        reasoningText: {
                          text: reasoningContentText,
                          signature: reasoningContentSignature
                        }
                      }
                    },
                    { text: s }
                  ]
                }
              ])
            } else if (reasoningContent.redactedContent) {
              redactedContent = reasoningContent.redactedContent
              setMessages([
                ...currentMessages,
                {
                  role: 'assistant',
                  content: [
                    {
                      reasoningContent: {
                        redactedContent: reasoningContent.redactedContent
                      }
                    },
                    { text: s }
                  ]
                }
              ])
            }
          }

          if (toolUse) {
            input = input + json.contentBlockDelta.delta?.toolUse?.input

            const getContentBlocks = () => {
              if (redactedContent) {
                return [
                  {
                    reasoningContent: {
                      redactedContent: redactedContent
                    }
                  },
                  { text: s },
                  {
                    toolUse: { name: toolUse?.name, toolUseId: toolUse?.toolUseId, input: input }
                  }
                ]
              } else if (reasoningContentText.length > 0) {
                return [
                  {
                    reasoningContent: {
                      reasoningText: {
                        text: reasoningContentText,
                        signature: reasoningContentSignature
                      }
                    }
                  },
                  { text: s },
                  {
                    toolUse: { name: toolUse?.name, toolUseId: toolUse?.toolUseId, input: input }
                  }
                ]
              } else {
                return [
                  { text: s },
                  {
                    toolUse: { name: toolUse?.name, toolUseId: toolUse?.toolUseId, input: input }
                  }
                ]
              }
            }

            setMessages([
              ...currentMessages,
              {
                role,
                content: getContentBlocks()
              }
            ])
          }
        } else if (json.metadata) {
          // Metadataを処理
          const metadata = json.metadata

          // 直近のアシスタントメッセージにメタデータを関連付ける
          if (lastAssistantMessageId.current) {
            // メッセージ配列からIDが一致するメッセージを見つけてメタデータを追加
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (msg.id === lastAssistantMessageId.current) {
                  return {
                    ...msg,
                    metadata: {
                      ...msg.metadata,
                      converseMetadata: metadata
                    }
                  }
                }
                return msg
              })
            })

            // currentMessagesの最後（直近のメッセージ）を永続化する
            const lastMessageIndex = currentMessages.length - 1
            const lastMessage = currentMessages[lastMessageIndex]

            if (
              lastMessage &&
              'id' in lastMessage &&
              lastMessage.id === lastAssistantMessageId.current
            ) {
              // 型を明確にしてメタデータを追加
              const updatedMessage: IdentifiableMessage = {
                ...(lastMessage as IdentifiableMessage),
                metadata: {
                  ...(lastMessage as any).metadata,
                  converseMetadata: metadata
                }
              }

              // 配列の最後のメッセージを更新
              currentMessages[lastMessageIndex] = updatedMessage

              // メタデータを受信した時点で永続化を行う
              await persistMessage(updatedMessage)
            }
          }
        } else {
          console.error('unexpected json:', json)
        }
      }

      return stopReason
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Chat stream aborted')
        return
      }
      console.error({ streamChatRequestError: error })
      toast.error(t('request error'))
      const messageId = generateMessageId()
      const errorMessage: IdentifiableMessage = {
        role: 'assistant' as const,
        content: [{ text: error.message }],
        id: messageId
      }

      // エラーメッセージIDを記録
      lastAssistantMessageId.current = messageId
      setMessages([...currentMessages, errorMessage])
      await persistMessage(errorMessage)
      throw error
    } finally {
      // 使用済みの AbortController をクリア
      if (abortController.current?.signal.aborted) {
        abortController.current = null
      }
    }
  }

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
      currentMessages
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
        currentMessages
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

      // チャット完了時に通知を表示（設定が有効な場合のみ）
      if (notification) {
        // 最新のアシスタントメッセージを取得
        const lastAssistantMessage = currentMessages.filter((msg) => msg.role === 'assistant').pop()

        // テキストコンテンツを抽出
        let notificationBody = ''
        if (lastAssistantMessage?.content) {
          const textContent = lastAssistantMessage.content
            .filter((content) => 'text' in content)
            .map((content) => (content as { text: string }).text)
            .join(' ')

          // 最初の1-2文を抽出（または最初の100文字程度）
          notificationBody = textContent
            .split(/[.。]/)
            .filter((sentence) => sentence.trim().length > 0)
            .slice(0, 2)
            .join('. ')
            .trim()

          // 長すぎる場合は切り詰める
          if (notificationBody.length > 100) {
            notificationBody = notificationBody.substring(0, 100) + '...'
          }
        }

        // 応答が空の場合はデフォルトメッセージを使用
        if (!notificationBody) {
          notificationBody = t('notification.messages.chatComplete.body')
        }

        await notificationService.showNotification(t('notification.messages.chatComplete.title'), {
          body: notificationBody,
          silent: false // 通知音を有効化
        })
      }
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
    const newSessionId = await window.chatHistory.createSession(
      'defaultAgent',
      modelId,
      systemPrompt
    )
    setCurrentSessionId(newSessionId)

    // メッセージをクリア
    setMessages([])
  }, [modelId, systemPrompt, abortCurrentRequest])

  const setSession = useCallback(
    (newSessionId: string) => {
      // 進行中の通信を中断してから新しいセッションを設定
      abortCurrentRequest()
      setCurrentSessionId(newSessionId)
    },
    [abortCurrentRequest]
  )

  return {
    messages,
    loading,
    reasoning,
    executingTool,
    handleSubmit,
    setMessages,
    currentSessionId,
    setCurrentSessionId: setSession, // 中断処理付きのセッション切り替え関数を返す
    clearChat,
    stopGeneration // 停止ボタン用の関数をエクスポート
  }
}
