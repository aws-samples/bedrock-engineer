import { useRef, useCallback } from 'react'
import {
  ConversationRole,
  ContentBlock,
  Message,
  ToolUseBlockStart
} from '@aws-sdk/client-bedrock-runtime'
import { generateMessageId } from '@/types/chat/metadata'
import { IdentifiableMessage } from '@/types/chat/message'
import { StreamChatCompletionProps, streamChatCompletion } from '@renderer/lib/api'
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

// メッセージの送信時に、Trace を全て載せると InputToken が逼迫するので取り除く
function removeTraces(messages: any[]) {
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

export interface UseStreamChatProps {
  contextLength: number
  enablePromptCache: boolean
  setMessages: React.Dispatch<React.SetStateAction<IdentifiableMessage[]>>
  setReasoning: (value: boolean) => void
  setLatestReasoningText: (text: string) => void
  persistMessage: (message: IdentifiableMessage) => Promise<IdentifiableMessage>
}

export interface UseStreamChatReturn {
  streamChat: (
    props: StreamChatCompletionProps,
    currentMessages: Message[],
    abortSignal: AbortSignal
  ) => Promise<string | undefined>
}

export const useStreamChat = ({
  contextLength,
  enablePromptCache,
  setMessages,
  setReasoning,
  setLatestReasoningText,
  persistMessage
}: UseStreamChatProps): UseStreamChatReturn => {
  const { t } = useTranslation()
  
  // キャッシュポイントを保持するための参照
  const lastCachePoint = useRef<number | undefined>(undefined)
  const lastAssistantMessageId = useRef<string | null>(null)

  const streamChat = useCallback(
    async (
      props: StreamChatCompletionProps,
      currentMessages: Message[],
      abortSignal: AbortSignal
    ) => {
      // Context長に基づいてメッセージを制限
      const limitedMessages = removeTraces(limitContextLength(currentMessages, contextLength))

      // キャッシュポイントを追加（前回のキャッシュポイントを引き継ぐ）
      props.messages = enablePromptCache
        ? addCachePointsToMessages(limitedMessages, props.modelId, lastCachePoint.current)
        : limitedMessages

      // キャッシュポイントが更新された場合、次回の会話ためにキャッシュポイントのインデックスを更新
      if (props.messages[props.messages.length - 1].content?.some((b) => b.cachePoint?.type)) {
        // 次回の会話のために現在のキャッシュポイントを更新
        // 現在のメッセージ配列の最後のインデックスを次回の最初のキャッシュポイントとして設定
        lastCachePoint.current = props.messages.length - 1
      }

      // システムプロンプトとツール設定にもキャッシュポイントを追加
      if (props.system && enablePromptCache) {
        props.system = addCachePointToSystem(props.system, props.modelId)
      }

      if (props.toolConfig && enablePromptCache) {
        props.toolConfig = addCachePointToTools(props.toolConfig, props.modelId)
      }

      const generator = streamChatCompletion(props, abortSignal)

      let s = ''
      let reasoningContentText = ''
      let reasoningContentSignature = ''
      let redactedContent
      let input = ''
      let role: ConversationRole = 'assistant'
      let toolUse: ToolUseBlockStart | undefined = undefined
      let stopReason
      const content: ContentBlock[] = []

      let messageStart = false
      try {
        for await (const json of generator) {
          if (json.messageStart) {
            role = json.messageStart.role ?? 'assistant'
            messageStart = true
          } else if (json.messageStop) {
            if (!messageStart) {
              console.warn('messageStop without messageStart')
              console.log(currentMessages)
              await streamChat(props, currentMessages, abortSignal)
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
              props.modelId &&
              metadata.converseMetadata.usage &&
              metadata.converseMetadata.usage.inputTokens &&
              metadata.converseMetadata.usage.outputTokens
            ) {
              try {
                sessionCost = calculateCost(
                  props.modelId,
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
            logCacheUsage(metadata.converseMetadata, props.modelId)

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
      }
    },
    [
      contextLength,
      enablePromptCache,
      setMessages,
      setReasoning,
      setLatestReasoningText,
      persistMessage,
      t
    ]
  )

  return {
    streamChat
  }
}