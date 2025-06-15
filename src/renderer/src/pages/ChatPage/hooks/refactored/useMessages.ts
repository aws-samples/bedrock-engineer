import { useState, useCallback } from 'react'
import { generateMessageId } from '@/types/chat/metadata'
import { IdentifiableMessage } from '@/types/chat/message'
import { ChatMessage } from '@/types/chat/history'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'

export interface UseMessagesProps {
  enableHistory?: boolean
  modelId: string
  enabledTools: any[]
}

export interface UseMessagesReturn {
  messages: IdentifiableMessage[]
  setMessages: React.Dispatch<React.SetStateAction<IdentifiableMessage[]>>
  persistMessage: (message: IdentifiableMessage) => Promise<IdentifiableMessage>
  addUserMessage: (content: any[]) => Promise<IdentifiableMessage>
  addAssistantMessage: (content: any[], id?: string) => IdentifiableMessage
  clearMessages: () => void
}

export const useMessages = ({
  enableHistory = true,
  modelId,
  enabledTools
}: UseMessagesProps): UseMessagesReturn => {
  const [messages, setMessages] = useState<IdentifiableMessage[]>([])
  const { addMessage } = useChatHistory()

  // メッセージの永続化を行うラッパー関数
  const persistMessage = useCallback(
    async (message: IdentifiableMessage, sessionId?: string) => {
      if (!enableHistory || !sessionId) return message

      if (message.role && message.content) {
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
            converseMetadata: message.metadata?.converseMetadata
          }
        }
        await addMessage(sessionId, chatMessage)
      }

      return message
    },
    [modelId, enabledTools, enableHistory, addMessage]
  )

  // ユーザーメッセージを追加
  const addUserMessage = useCallback(
    async (content: any[], sessionId?: string): Promise<IdentifiableMessage> => {
      const userMessage: IdentifiableMessage = {
        role: 'user',
        content,
        id: generateMessageId()
      }

      setMessages((prev) => [...prev, userMessage])

      if (sessionId) {
        await persistMessage(userMessage, sessionId)
      }

      return userMessage
    },
    [persistMessage]
  )

  // アシスタントメッセージを追加
  const addAssistantMessage = useCallback((content: any[], id?: string): IdentifiableMessage => {
    const messageId = id || generateMessageId()
    const assistantMessage: IdentifiableMessage = {
      role: 'assistant',
      content,
      id: messageId
    }

    setMessages((prev) => [...prev, assistantMessage])
    return assistantMessage
  }, [])

  // メッセージをクリア
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    setMessages,
    persistMessage,
    addUserMessage,
    addAssistantMessage,
    clearMessages
  }
}
