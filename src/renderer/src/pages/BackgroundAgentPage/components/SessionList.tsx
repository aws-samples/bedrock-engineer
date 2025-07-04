import React from 'react'
import { FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi'

interface SessionListProps {
  sessions: string[]
  selectedSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onCreateSession: () => void
  onDeleteSession: (sessionId: string) => void
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSessionId,
  onSessionSelect,
  onCreateSession,
  onDeleteSession
}) => {
  const formatSessionId = (sessionId: string) => {
    // タイムスタンプを含む場合は日時を表示
    if (sessionId.includes('-') && sessionId.match(/\d{13}$/)) {
      const timestamp = sessionId.split('-').pop()
      if (timestamp) {
        const date = new Date(parseInt(timestamp))
        return date.toLocaleString('ja-JP', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
    return sessionId.length > 20 ? sessionId.substring(0, 20) + '...' : sessionId
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sessions</h2>
          <span className="text-sm text-gray-500">{sessions.length}</span>
        </div>

        {/* 新規セッション作成ボタン */}
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          新規セッション
        </button>
      </div>

      {/* セッション一覧 */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center">
            <FiMessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              セッションがありません
              <br />
              新規セッションを作成してください
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((sessionId) => (
              <div
                key={sessionId}
                className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedSessionId === sessionId
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => onSessionSelect(sessionId)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FiMessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {formatSessionId(sessionId)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {sessionId}
                  </p>
                </div>

                {/* 削除ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('このセッションを削除しますか？')) {
                      onDeleteSession(sessionId)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500"
                  title="セッション削除"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
