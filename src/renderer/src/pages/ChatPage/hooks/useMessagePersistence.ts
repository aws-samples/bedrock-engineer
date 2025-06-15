import { useCallback } from 'react'
import { IdentifiableMessage } from '@/types/chat/message'
import { ChatMessage } from '@/types/chat/history'
import { generateMessageId } from '@/types/chat/metadata'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { ToolState } from '@/types/agent-chat'

interface UseMessagePersistenceProps {
  currentSessionId?: string
  modelId: string
  enabledTools: ToolState[]
  enableHistory: boolean
}

export function useMessagePersistence({
  currentSessionId,
  modelId,
  enabledTools,
  enableHistory
}: UseMessagePersistenceProps) {
  const { addMessage } = useChatHistory()

  /**
   * メッセージの永続化を行う関数
   */
  const persistMessage = useCallback(
    async (message: IdentifiableMessage) => {
      if (!enableHistory) return message

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

  return {
    persistMessage
  }
}
