import React, { useState, useRef, useEffect } from 'react'
import { FiSend, FiLoader, FiSettings } from 'react-icons/fi'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: any[]
  timestamp: number
}

interface BackgroundChatAreaProps {
  sessionId: string | null
  messages: ChatMessage[]
  loading: boolean
  onSendMessage: (message: string) => void
  onOpenSettings: () => void
}

export const BackgroundChatArea: React.FC<BackgroundChatAreaProps> = ({
  sessionId,
  messages,
  loading,
  onSendMessage,
  onOpenSettings
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // メッセージが更新されたら最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // テキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading) return

    onSendMessage(inputMessage)
    setInputMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const formatMessageContent = (content: any[]) => {
    return content
      .map((block) => {
        if (block.text) return block.text
        if (block.toolUse) return `[Tool: ${block.toolUse.name}]`
        if (block.toolResult) return `[Tool Result]`
        return JSON.stringify(block)
      })
      .join('\n')
  }

  if (!sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSettings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            セッションを選択してください
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            左側のリストからセッションを選択するか、新規セッションを作成してください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Background Agent Chat
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Session: {sessionId}</p>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          title="設定"
        >
          <FiSettings className="w-5 h-5" />
        </button>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                このセッションにはまだメッセージがありません。
                <br />
                下のフォームからメッセージを送信してください。
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {formatMessageContent(message.content)}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI が応答しています...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 入力フォーム */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none min-h-[40px] max-h-[120px]"
              disabled={loading}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 self-end"
          >
            {loading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiSend className="w-4 h-4" />
            )}
            送信
          </button>
        </form>
      </div>
    </div>
  )
}
