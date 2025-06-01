import React, { useEffect, useRef } from 'react'
import { ChatHistory, ChatMessage } from '../lib/ChatHistoryManager'
import { ThinkingState } from '../hooks/useSpeakChat'
import { ThinkingIndicator } from './ThinkingIndicator'
import { LiaUserCircleSolid } from 'react-icons/lia'
import AILogo from '@renderer/assets/images/icons/ai.svg'

// Types
export interface ChatDisplayProps {
  chat: ChatHistory
  thinkingState: ThinkingState
  className?: string
  audioControls?: React.ReactNode
}

interface MessageItemProps {
  message: ChatMessage
  isLast: boolean
}

// Constants
enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

const MESSAGE_STYLES = {
  container: {
    [MessageRole.USER]: '',
    [MessageRole.ASSISTANT]: '',
    [MessageRole.SYSTEM]:
      'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded-lg p-4 shadow-sm'
  },
  text: {
    [MessageRole.USER]: 'text-gray-900 dark:text-gray-100',
    [MessageRole.ASSISTANT]: 'text-gray-900 dark:text-gray-100',
    [MessageRole.SYSTEM]: 'text-yellow-900 dark:text-yellow-100'
  },
  label: {
    [MessageRole.USER]: 'text-gray-600 dark:text-gray-400',
    [MessageRole.ASSISTANT]: 'text-gray-600 dark:text-gray-400',
    [MessageRole.SYSTEM]: 'text-yellow-700 dark:text-yellow-300'
  },
  indicator: {
    [MessageRole.USER]: 'text-gray-500 dark:text-gray-400',
    [MessageRole.ASSISTANT]: 'text-gray-500 dark:text-gray-400',
    [MessageRole.SYSTEM]: 'text-yellow-600 dark:text-yellow-400'
  }
} as const

// Utility functions
const getMessageRole = (role: string): MessageRole => {
  const upperRole = role.toUpperCase()
  return Object.values(MessageRole).includes(upperRole as MessageRole)
    ? (upperRole as MessageRole)
    : MessageRole.SYSTEM
}

const getMessageStyles = (role: MessageRole) => ({
  container: MESSAGE_STYLES.container[role],
  text: MESSAGE_STYLES.text[role],
  label: MESSAGE_STYLES.label[role],
  indicator: MESSAGE_STYLES.indicator[role]
})

// Sub-components
const MessageIcon: React.FC<{ role: MessageRole }> = ({ role }) => {
  const iconClasses = 'flex items-center justify-center w-8 h-8 dark:text-white'

  switch (role) {
    case MessageRole.USER:
      return (
        <div className={iconClasses}>
          <div className="flex justify-center items-center">
            <LiaUserCircleSolid className="h-6 w-6" />
          </div>
        </div>
      )

    case MessageRole.ASSISTANT:
      return (
        <div className={iconClasses}>
          <div className="h-8 w-8 flex justify-center items-center">
            <div className="h-4 w-4">
              <AILogo />
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className={iconClasses}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-yellow-300 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200">
            S
          </div>
        </div>
      )
  }
}

const MessageHeader: React.FC<{
  role: MessageRole
  styles: ReturnType<typeof getMessageStyles>
  endOfResponse?: boolean
}> = ({ role, styles, endOfResponse }) => (
  <div className="flex items-center space-x-2 mb-2">
    <MessageIcon role={role} />
    <span className={`text-xs font-medium ${styles.label}`}>{role}</span>
    {endOfResponse && <span className={`text-xs ${styles.indicator}`}>•</span>}
  </div>
)

const MessageContent: React.FC<{
  content: string
  styles: ReturnType<typeof getMessageStyles>
}> = ({ content, styles }) => (
  <div className={`text-sm leading-relaxed ${styles.text}`}>{content || 'No content'}</div>
)

const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
  const role = getMessageRole(message.role)
  const styles = getMessageStyles(role)
  const isUser = role === MessageRole.USER

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLast ? 'mb-2' : 'mb-4'}`}>
      <div className={`max-w-[80%] ${styles.container}`}>
        <MessageHeader role={role} styles={styles} endOfResponse={message.endOfResponse} />
        <MessageContent content={message.message} styles={styles} />
      </div>
    </div>
  )
}

const EmptyState: React.FC<{ audioControls?: React.ReactNode }> = ({ audioControls }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center text-gray-500 dark:text-gray-400">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium mb-2">Ready to chat</p>
      <p className="text-sm mb-4">
        Click &quot;Start Speaking&quot; to begin your voice conversation
      </p>
      {audioControls && <div className="mt-4">{audioControls}</div>}
    </div>
  </div>
)

// Custom hook for auto-scroll
const useAutoScroll = (dependencies: unknown[]) => {
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, dependencies)

  return { chatContainerRef }
}

// Main component
export const ChatDisplay: React.FC<ChatDisplayProps> = ({
  chat,
  thinkingState,
  className = '',
  audioControls
}) => {
  const { chatContainerRef } = useAutoScroll([chat.history, thinkingState])

  const hasMessages = chat.history.length > 0
  const hasThinking =
    thinkingState.waitingForUserTranscription || thinkingState.waitingForAssistantResponse

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasMessages && !hasThinking && <EmptyState audioControls={audioControls} />}

        {/* Render messages */}
        {chat.history.map((message, index) => (
          <MessageItem key={index} message={message} isLast={index === chat.history.length - 1} />
        ))}

        {/* Thinking indicators */}
        {hasThinking && (
          <div className="mt-4">
            <ThinkingIndicator thinkingState={thinkingState} />
          </div>
        )}
      </div>
    </div>
  )
}
