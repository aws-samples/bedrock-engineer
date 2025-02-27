import { Message as MessageType } from '@aws-sdk/client-bedrock-runtime'
import React from 'react'
import { ChatMessage } from './Message'
import AILogo from '@renderer/assets/images/icons/ai.svg'
import { FiInfo } from 'react-icons/fi'

type MessageListProps = {
  messages: MessageType[]
  loading: boolean
  deleteMessage?: (index: number) => void
  summarized?: boolean // 要約が使用されているかどうか
}

const LoadingMessage = () => (
  <div className="flex gap-4">
    <div className="flex items-center justify-center w-10 h-10">
      <div className="h-4 w-4 animate-pulse">
        <AILogo />
      </div>
    </div>
    <div className="flex flex-col gap-2 w-full">
      <span className="animate-pulse h-2 w-12 bg-slate-200 rounded"></span>
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

const SummarizedIndicator = () => (
  <div className="flex items-center justify-center py-2 px-4 my-2 bg-blue-50 text-blue-800 text-xs rounded-md mx-auto">
    <FiInfo className="h-3 w-3 mr-1" />
    <span>以前のメッセージは要約されています</span>
  </div>
)

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  deleteMessage,
  summarized
}) => {
  const handleDeleteMessage = (messageIndex: number) => () => {
    if (deleteMessage) {
      deleteMessage(messageIndex)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 要約が使用されている場合はインジケータを表示 */}
      {summarized && messages.length > 0 && <SummarizedIndicator />}

      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          message={message}
          onDeleteMessage={deleteMessage ? handleDeleteMessage(index) : undefined}
        />
      ))}
      {loading && <LoadingMessage />}
    </div>
  )
}
