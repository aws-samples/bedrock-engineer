import { IdentifiableMessage } from '@/types/chat/message'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import { ChatMessage } from './Message'
import AILogo from '@renderer/assets/images/icons/ai.svg'

type MessageListProps = {
  messages: IdentifiableMessage[]
  loading: boolean
  reasoning: boolean
  waitingForResponse?: boolean
  timeoutCountdown?: number
  heartbeatCount?: number
  deleteMessage?: (index: number) => void
}

const LoadingMessage = memo(function LoadingMessage({
  waiting,
  countdown,
  heartbeats
}: {
  waiting?: boolean
  countdown?: number
  heartbeats?: number
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const dots = heartbeats ? '..'.repeat(Math.min(heartbeats, 10)) : ''

  return (
    <div className="flex gap-4">
      <div className="flex items-center justify-center w-10 h-10">
        <div className="h-4 w-4 animate-pulse">
          <AILogo />
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <span className="animate-pulse h-2 w-12 bg-slate-200 rounded"></span>
        {waiting && countdown !== undefined && (
          <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            ⏳ Processing... (Timeout in {formatTime(countdown)}){dots}
          </div>
        )}
        <div className="flex-1 space-y-6 py-1">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-2 bg-slate-200 rounded col-span-2"></div>
              <div className="h-2 bg-slate-200 rounded col-span-1"></div>
            </div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
})

// MessageListコンポーネントを定義
const MessageListBase: React.FC<MessageListProps> = ({
  messages,
  loading,
  reasoning,
  waitingForResponse,
  timeoutCountdown,
  heartbeatCount,
  deleteMessage
}) => {
  const handleDeleteMessage = useCallback(
    (messageIndex: number) => () => {
      if (deleteMessage) {
        deleteMessage(messageIndex)
      }
    },
    [deleteMessage]
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || index}
          message={message}
          reasoning={reasoning}
          onDeleteMessage={deleteMessage ? handleDeleteMessage(index) : undefined}
        />
      ))}
      {loading && (
        <LoadingMessage
          waiting={waitingForResponse}
          countdown={timeoutCountdown}
          heartbeats={heartbeatCount}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}

// React.memoを使用してメモ化したコンポーネントをエクスポート
export const MessageList = memo(MessageListBase)
