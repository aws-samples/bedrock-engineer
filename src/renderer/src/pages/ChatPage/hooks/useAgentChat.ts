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
import { generateSessionTitle } from '../utils/titleGenerator'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useLightProcessingModel } from '@renderer/lib/modelSelection'
import { useAgentTools } from './useAgentTools'
import { getThinkingSupportedModelIds } from '@common/models/models'

import { AttachedImage } from '../components/InputForm/TextArea'
import { ChatMessage } from '@/types/chat/history'
import { ToolName, isMcpTool } from '@/types/tools'
import { notificationService } from '@renderer/services/NotificationService'
import { limitContextLength } from '@renderer/lib/contextLength'
import { IdentifiableMessage } from '@/types/chat/message'
import { PromptCacheManager } from '@common/models/promptCache'
import { PricingCalculator } from '@common/models/pricing'

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

// reasoningContentを含むブロックを除外する関数
function removeReasoningContent(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.content && Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.filter((block) => !('reasoningContent' in block))
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
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0)
  const [heartbeatCount, setHeartbeatCount] = useState<number>(0)
  const [reasoning, setReasoning] = useState(false)
  const [executingTools, setExecutingTools] = useState<Set<ToolName>>(new Set())
  const [latestReasoningText, setLatestReasoningText] = useState<string>('')
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId)
  const lastAssistantMessageId = useRef<string | null>(null)
  const abortController = useRef<AbortController | null>(null)
  // キャッシュポイントを保持するための状態
  const lastCachePoint = useRef<number | undefined>(undefined)
  // タイトル生成済みフラグ（同じセッションで複数回生成しないため）
  const titleGenerated = useRef<Set<string>>(new Set())
  // メッセージ数が閾値を超えたときにタイトル生成を実行
  const MESSAGE_THRESHOLD = 4 // タイトル生成のためのメッセージ数閾値
  const { t } = useTranslation()
  const {
    notification,
    contextLength,
    guardrailSettings,
    getAgentTools,
    agents,
    enablePromptCache,
    inferenceParams,
    requestTimeout
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
    setExecutingTools(new Set())
  }, [messages, currentSessionId, t])

  // ChatHistoryContext から操作関数を取得
  const {
    getSession,
    createSession,
    addMessage,
    updateSessionTitle,
    setActiveSession,
    deleteMessage
  } = useChatHistory()

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
          lastCachePoint.current = undefined
        }
      } else if (enableHistory) {
        // 履歴保存が有効な場合のみ新しいセッションを作成
        const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
        setCurrentSessionId(newSessionId)
        // 新しいセッションを作成した場合はキャッシュポイントをリセット
        lastCachePoint.current = undefined
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
        lastCachePoint.current = undefined
      }
    }
  }, [currentSessionId, getSession, setActiveSession, abortCurrentRequest])

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
        await addMessage(currentSessionId, chatMessage)
      }

      return message
    },
    [currentSessionId, modelId, enabledTools, enableHistory, addMessage]
  )

  const streamChat = async (props: StreamChatCompletionProps, currentMessages: Message[]) => {
    // Track last data received time for timeout detection
    let lastDataTime = Date.now()
    let timedOut = false
    let requestCompleted = false
    const WAIT_THRESHOLD = 10000 // 10 seconds without data = waiting state
    const TIMEOUT_MS = requestTimeout * 60 * 1000 // Convert minutes to milliseconds
    const HEARTBEAT_INTERVAL = 30000 // 30 seconds heartbeat check
    
    const checkWaitingState = setInterval(() => {
      const timeSinceLastData = Date.now() - lastDataTime
      const isWaiting = timeSinceLastData > WAIT_THRESHOLD
      setWaitingForResponse(isWaiting)
      
      if (isWaiting) {
        const remainingTime = Math.max(0, TIMEOUT_MS - timeSinceLastData)
        setTimeoutCountdown(Math.floor(remainingTime / 1000))
        
        // Abort when timeout is reached
        if (remainingTime === 0 && abortController.current && !timedOut) {
          timedOut = true
          console.log(`Request timed out after ${requestTimeout} minutes - aborting request`)
          
          // Add timeout message to chat immediately
          const timeoutMessage = t('Request timed out after {{timeout}} minutes', { timeout: requestTimeout })
          const timeoutChatMessage: IdentifiableMessage = {
            id: generateMessageId(),
            role: ConversationRole.ASSISTANT,
            content: [{ text: timeoutMessage }]
          }
          setMessages((prev) => [...prev, timeoutChatMessage])
          
          abortController.current.abort()
        }
      }
    }, 1000)
    
    // Heartbeat check every 30 seconds
    const heartbeatCheck = setInterval(() => {
      if (!requestCompleted && abortController.current) {
        const timeSinceLastData = Date.now() - lastDataTime
        // If no data for 30+ seconds, verify connection is still alive
        if (timeSinceLastData >= HEARTBEAT_INTERVAL) {
          setHeartbeatCount(prev => prev + 1)
          console.log(`Heartbeat: ${Math.floor(timeSinceLastData / 1000)}s since last data`)
        }
      }
    }, HEARTBEAT_INTERVAL)
    
    try {
      // 既存の通信があれば中断
      if (abortController.current) {
        abortController.current.abort()
      }

      // 新しい AbortController を作成
      abortController.current = new AbortController()

      // モデルがthinkingをサポートしているか確認
      const thinkingSupportedModelIds = getThinkingSupportedModelIds()
      const supportsThinking = thinkingSupportedModelIds.some((id) => modelId.includes(id))

      // Context長に基づいてメッセージを制限
      let limitedMessages = removeTraces(limitContextLength(currentMessages, contextLength))

      // モデルがthinkingをサポートしていない場合、reasoningContentを除外
      if (!supportsThinking) {
        limitedMessages = removeReasoningContent(limitedMessages)
      }

      // Prompt Cache適用（enablePromptCacheが有効な場合）
      if (enablePromptCache) {
        const cacheManager = new PromptCacheManager(modelId)
        props.messages = cacheManager.addCachePointsToMessages(
          limitedMessages,
          lastCachePoint.current
        )

        // キャッシュポイントが更新された場合、次回の会話ためにキャッシュポイントのインデックスを更新
        if (props.messages[props.messages.length - 1].content?.some((b) => b.cachePoint?.type)) {
          // 次回の会話のために現在のキャッシュポイントを更新
          // 現在のメッセージ配列の最後のインデックスを次回の最初のキャッシュポイントとして設定
          lastCachePoint.current = props.messages.length - 1
        }

        // システムプロンプトとツール設定にもキャッシュポイントを追加
        if (props.system) {
          props.system = cacheManager.addCachePointToSystem(props.system)
        }

        if (props.toolConfig) {
          props.toolConfig = cacheManager.addCachePointToTools(props.toolConfig) as any
        }
      } else {
        props.messages = limitedMessages
      }

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
          lastDataTime = Date.now() // Update last data time on each chunk
          
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
            let parseInput: any
            // 空文字列の場合は空オブジェクトを使用（JSONパースエラーとしない）
            if (input === '' || input === '""' || input === "''") {
              parseInput = {}
            } else {
              try {
                parseInput = JSON.parse(input)
              } catch (e) {
                parseInput = {
                  __jsonParseError: true,
                  originalInput: input,
                  maxTokens: inferenceParams.maxTokens,
                  error:
                    (e instanceof Error ? e.message : 'JSON parse failed') +
                    '\n JSON parsing failed. This error might have occurred because the token limit (character count) was exceeded while the AI was trying to create the input JSON for tool use. \nThe output needs to fit within the maxTokens limit.'
                }
              }
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
          if (reasoningContent && supportsThinking) {
            setReasoning(true)
            if (reasoningContent?.text || reasoningContent?.signature) {
              reasoningContentText = reasoningContentText + (reasoningContent?.text || '')
              reasoningContentSignature = reasoningContent?.signature || ''

              // 最新のreasoningTextを状態として保持
              if (reasoningContent?.text) {
                setLatestReasoningText(reasoningContentText)
              }

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
          const metadata: IdentifiableMessage['metadata'] = {
            converseMetadata: {},
            sessionCost: undefined
          }
          metadata.converseMetadata = json.metadata

          let sessionCost: number
          // モデルIDがある場合、コストを計算
          if (
            modelId &&
            metadata.converseMetadata.usage &&
            metadata.converseMetadata.usage.inputTokens &&
            metadata.converseMetadata.usage.outputTokens
          ) {
            try {
              const pricingCalculator = new PricingCalculator(modelId)
              sessionCost = pricingCalculator.calculateTotalCost(
                metadata.converseMetadata.usage.inputTokens,
                metadata.converseMetadata.usage.outputTokens,
                metadata.converseMetadata.usage.cacheReadInputTokens || 0,
                metadata.converseMetadata.usage.cacheWriteInputTokens || 0
              )
              metadata.sessionCost = sessionCost
            } catch (error) {
              console.error('Error calculating cost:', error)
            }
          }

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
                      converseMetadata: metadata.converseMetadata,
                      sessionCost: metadata.sessionCost
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
                  converseMetadata: metadata.converseMetadata,
                  sessionCost: metadata.sessionCost
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
      } catch (innerError: any) {
        // Handle streaming errors
        if (innerError.name === 'AbortError') {
          console.log('Chat stream aborted')
          return
        }
        throw innerError
      } finally {
        requestCompleted = true
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Chat stream aborted')
        if (timedOut) {
          toast.error(t('Request timed out after {{timeout}} minutes', { timeout: requestTimeout }))
        }
        return
      }
      console.error({ streamChatRequestError: error })
      // エラーメッセージをそのままトーストに表示
      toast.error(error.message || t('request error'))
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
      // Cleanup intervals
      clearInterval(checkWaitingState)
      clearInterval(heartbeatCheck)
      setWaitingForResponse(false)
      setTimeoutCountdown(0)
      setHeartbeatCount(0)
      
      // 使用済みの AbortController をクリア
      if (abortController.current?.signal.aborted) {
        abortController.current = null
      }
    }
  }

  /**
   * 直近5回のassistantメッセージが全てJSONパースエラーを含むかチェック
   */
  const hasConsecutiveJsonParseErrors = (messages: Message[]): boolean => {
    const recentAssistantMessages = messages.filter((msg) => msg.role === 'assistant').slice(-3) // 最新の3つを取得

    return (
      recentAssistantMessages.length === 5 &&
      recentAssistantMessages.every((msg) =>
        msg.content?.some(
          (block) => block.toolUse?.input && (block.toolUse.input as any).__jsonParseError === true
        )
      )
    )
  }

  const recursivelyExecTool = async (contentBlocks: ContentBlock[], currentMessages: Message[]) => {
    const contentBlock = contentBlocks.find((block) => block.toolUse)
    if (!contentBlock) {
      return
    }

    // ツールブロックのみを抽出
    const toolUseBlocks = contentBlocks.filter(
      (block) => Object.keys(block).includes('toolUse') && block.toolUse?.name
    )

    // 全てのツール実行をPromiseとして準備
    const toolExecutionPromises = toolUseBlocks.map(async (contentBlock) => {
      const toolUse = contentBlock.toolUse!
      const toolInput = {
        type: toolUse.name!,
        ...(toolUse.input as any)
      }

      // 実行中ツールセットに追加
      setExecutingTools((prev) => new Set([...prev, toolInput.type]))

      try {
        const toolResult = await window.api.bedrock.executeTool(toolInput, {
          sessionId: currentSessionId
        })

        // 実行中ツールセットから削除
        setExecutingTools((prev) => {
          const next = new Set(prev)
          next.delete(toolInput.type)
          return next
        })

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

        return resultContentBlock
      } catch (e: any) {
        console.error(`Error executing tool ${toolInput.type}:`, e)

        // 実行中ツールセットから削除
        setExecutingTools((prev) => {
          const next = new Set(prev)
          next.delete(toolInput.type)
          return next
        })

        // エラー結果を返す
        return {
          toolResult: {
            toolUseId: toolUse.toolUseId,
            content: [{ text: e.toString() }],
            status: 'error'
          }
        } as ContentBlock
      }
    })

    // 全てのツール実行を並列実行し、全ての結果を待つ
    const settledResults = await Promise.allSettled(toolExecutionPromises)

    // 結果を処理
    const toolResults: ContentBlock[] = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // Promise自体が reject された場合（ここには来ないはずだが念のため）
        const toolUse = toolUseBlocks[index].toolUse!
        return {
          toolResult: {
            toolUseId: toolUse.toolUseId,
            content: [{ text: `Promise rejection: ${result.reason}` }],
            status: 'error'
          }
        } as ContentBlock
      }
    })

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

    if (stopReason === 'tool_use' || stopReason === 'max_tokens') {
      const lastMessage = currentMessages[currentMessages.length - 1].content
      if (lastMessage) {
        // max_tokensで連続JSONパースエラーの場合は処理中断
        if (stopReason === 'max_tokens' && hasConsecutiveJsonParseErrors(currentMessages)) {
          toast.error('Max token limit reached repeatedly. Stopping generation.')

          // 最後のtoolUseIdを取得
          const lastToolUse = lastMessage.find((block) => block.toolUse)?.toolUse
          const toolUseId = lastToolUse?.toolUseId || 'error-tool-use'

          const toolResultMessage: IdentifiableMessage = {
            role: 'user',
            content: [
              {
                toolResult: {
                  toolUseId: toolUseId,
                  content: [{ text: 'Max token limit reached repeatedly. Stopping generation.' }],
                  status: 'error'
                }
              }
            ],
            id: generateMessageId()
          }

          currentMessages.push(toolResultMessage)
          setMessages((prev) => [...prev, toolResultMessage])
          await persistMessage(toolResultMessage)

          setLoading(false)
          return
        }

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
      setExecutingTools(new Set())
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
    lastCachePoint.current = undefined
  }, [modelId, systemPrompt, abortCurrentRequest, createSession])

  // 軽量処理用モデルIDを取得
  const { getLightModelId } = useLightProcessingModel()

  // 現在のセッションにタイトルを生成する関数
  const generateTitleForCurrentSession = useCallback(async () => {
    if (!currentSessionId || !enableHistory) return

    // このセッションIDをタイトル生成済みとしてマーク
    titleGenerated.current.add(currentSessionId)

    try {
      // セッションの詳細を取得
      const session = getSession(currentSessionId)
      if (!session) return

      // セッションのタイトルが既にカスタマイズされている場合は生成しない
      // "Chat "で始まるデフォルトタイトルのみ置き換える
      if (!session.title.startsWith('Chat ')) return

      // 軽量処理用モデルIDを取得
      const lightModelId = getLightModelId()

      // 軽量モデルでタイトルを生成
      const newTitle = await generateSessionTitle(session, lightModelId, t)
      if (newTitle) {
        await updateSessionTitle(currentSessionId, newTitle)
      }
    } catch (error) {
      console.error('Error generating title for current session:', error)
    }
  }, [currentSessionId, modelId, t, enableHistory, getSession, updateSessionTitle])

  // メッセージ数を監視してタイトル生成を実行
  useEffect(() => {
    // メッセージが閾値を超え、まだタイトルが生成されていない場合に実行
    if (
      messages.length > MESSAGE_THRESHOLD &&
      currentSessionId &&
      !titleGenerated.current.has(currentSessionId) &&
      enableHistory
    ) {
      generateTitleForCurrentSession()
    }
  }, [messages.length, currentSessionId, generateTitleForCurrentSession, enableHistory])

  const setSession = useCallback(
    (newSessionId: string) => {
      // 既存のセッションにタイトルを生成
      if (
        currentSessionId &&
        messages.length > MESSAGE_THRESHOLD &&
        !titleGenerated.current.has(currentSessionId) &&
        enableHistory
      ) {
        generateTitleForCurrentSession()
      }

      // 進行中の通信を中断してから新しいセッションを設定
      abortCurrentRequest()
      setCurrentSessionId(newSessionId)
    },
    [
      abortCurrentRequest,
      messages.length,
      currentSessionId,
      MESSAGE_THRESHOLD,
      generateTitleForCurrentSession,
      enableHistory
    ]
  )

  return {
    messages,
    loading,
    reasoning,
    waitingForResponse,
    timeoutCountdown,
    heartbeatCount,
    executingTools,
    latestReasoningText, // 最新のreasoningTextを外部に公開
    handleSubmit,
    setMessages,
    currentSessionId,
    setCurrentSessionId: setSession, // 中断処理付きのセッション切り替え関数を返す
    clearChat,
    stopGeneration // 停止ボタン用の関数をエクスポート
  }
}
