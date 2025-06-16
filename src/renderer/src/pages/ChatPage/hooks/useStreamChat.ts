import { useRef, useCallback } from 'react'
import {
  ConversationRole,
  ContentBlock,
  Message,
  ToolUseBlockStart
} from '@aws-sdk/client-bedrock-runtime'
import { StreamChatCompletionProps, streamChatCompletion } from '@renderer/lib/api'
import { IdentifiableMessage } from '@/types/chat/message'
import { generateMessageId } from '@/types/chat/metadata'
import { limitContextLength } from '@renderer/lib/contextLength'
import {
  addCachePointsToMessages,
  addCachePointToSystem,
  addCachePointToTools,
  logCacheUsage
} from '@renderer/lib/promptCacheUtils'
import { calculateCost } from '@renderer/lib/pricing/modelPricing'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { removeTraces } from '../utils/messageUtils'

interface UseStreamChatProps {
  modelId: string
  contextLength: number
  enablePromptCache: boolean
  lastAssistantMessageId: React.MutableRefObject<string | null>
  persistMessage: (message: IdentifiableMessage) => Promise<IdentifiableMessage | undefined>
}

interface StreamChatCallbacks {
  setMessages: (
    updater: IdentifiableMessage[] | ((prev: IdentifiableMessage[]) => IdentifiableMessage[])
  ) => void
  setReasoning: (reasoning: boolean) => void
  setLatestReasoningText: (text: string) => void
}

export function useStreamChat({
  modelId,
  contextLength,
  enablePromptCache,
  lastAssistantMessageId,
  persistMessage
}: UseStreamChatProps) {
  const { t } = useTranslation()
  const abortController = useRef<AbortController | null>(null)
  const lastCachePoint = useRef<number | undefined>(undefined)

  /**
   * キャッシュポイントをリセット
   */
  const resetCachePoint = useCallback(() => {
    lastCachePoint.current = undefined
  }, [])

  /**
   * 通信を中断
   */
  const abortCurrentRequest = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
  }, [])

  /**
   * ストリーミングチャット処理
   */
  const streamChat = useCallback(
    async (
      props: StreamChatCompletionProps,
      currentMessages: Message[],
      callbacks: StreamChatCallbacks
    ) => {
      const { setMessages, setReasoning, setLatestReasoningText } = callbacks

      // 既存の通信があれば中断
      if (abortController.current) {
        abortController.current.abort()
      }

      // 新しい AbortController を作成
      abortController.current = new AbortController()

      // Context長に基づいてメッセージを制限
      const limitedMessages = removeTraces(limitContextLength(currentMessages, contextLength))

      // キャッシュポイントを追加（前回のキャッシュポイントを引き継ぐ）
      props.messages = enablePromptCache
        ? addCachePointsToMessages(limitedMessages, modelId, lastCachePoint.current)
        : limitedMessages

      // キャッシュポイントが更新された場合、次回の会話ためにキャッシュポイントのインデックスを更新
      if (props.messages[props.messages.length - 1].content?.some((b) => b.cachePoint?.type)) {
        // 次回の会話のために現在のキャッシュポイントを更新
        // 現在のメッセージ配列の最後のインデックスを次回の最初のキャッシュポイントとして設定
        lastCachePoint.current = props.messages.length - 1
      }

      // システムプロンプトとツール設定にもキャッシュポイントを追加
      if (props.system && enablePromptCache) {
        props.system = addCachePointToSystem(props.system, modelId)
      }

      if (props.toolConfig && enablePromptCache) {
        props.toolConfig = addCachePointToTools(props.toolConfig, modelId)
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
          if (json.messageStart) {
            role = json.messageStart.role ?? 'assistant' // デフォルト値を設定
            messageStart = true
          } else if (json.messageStop) {
            if (!messageStart) {
              console.warn('messageStop without messageStart')
              console.log(currentMessages)
              await streamChat(props, currentMessages, callbacks)
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
                sessionCost = calculateCost(
                  modelId,
                  metadata.converseMetadata.usage.inputTokens,
                  metadata.converseMetadata.usage.outputTokens,
                  metadata.converseMetadata.usage.cacheReadInputTokens,
                  metadata.converseMetadata.usage.cacheWriteInputTokens
                )
                metadata.sessionCost = sessionCost
              } catch (error) {
                console.error('Error calculating cost:', error)
              }
            }

            // Prompt Cacheの使用状況をログ出力
            logCacheUsage(metadata.converseMetadata, modelId)

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
    },
    [modelId, contextLength, enablePromptCache, lastAssistantMessageId, persistMessage, t]
  )

  return {
    streamChat,
    abortCurrentRequest,
    resetCachePoint
  }
}
