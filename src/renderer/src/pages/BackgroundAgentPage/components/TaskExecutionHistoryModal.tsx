import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  UserIcon,
  CpuChipIcon,
  WrenchIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { ScheduledTask, TaskExecutionResult } from '../hooks/useBackgroundAgent'

interface TaskExecutionHistoryModalProps {
  task: ScheduledTask
  isOpen: boolean
  onClose: () => void
  onGetExecutionHistory: (taskId: string) => Promise<TaskExecutionResult[]>
  onGetSessionHistory: (sessionId: string) => Promise<any[]>
  onContinueSession?: (params: {
    sessionId: string
    taskId: string
    userMessage: string
    options?: {
      enableToolExecution?: boolean
      maxToolExecutions?: number
      timeoutMs?: number
    }
  }) => Promise<any>
}

interface HistoryFilter {
  status: 'all' | 'success' | 'failure'
  dateRange: 'all' | 'today' | 'week' | 'month'
}

export const TaskExecutionHistoryModal: React.FC<TaskExecutionHistoryModalProps> = ({
  task,
  isOpen,
  onClose,
  onGetExecutionHistory,
  onGetSessionHistory,
  onContinueSession
}) => {
  const { t } = useTranslation()
  const [history, setHistory] = useState<TaskExecutionResult[]>([])
  const [filteredHistory, setFilteredHistory] = useState<TaskExecutionResult[]>([])
  const [selectedExecution, setSelectedExecution] = useState<TaskExecutionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionHistories, setSessionHistories] = useState<Record<string, any[]>>({})
  const [loadingSessions, setLoadingSessions] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<HistoryFilter>({
    status: 'all',
    dateRange: 'all'
  })
  // 会話継続用の状態
  const [showChatMode, setShowChatMode] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  // 履歴データを取得
  const fetchHistory = async () => {
    if (!isOpen) return

    try {
      setIsLoading(true)
      const historyData = await onGetExecutionHistory(task.id)
      setHistory(historyData)
      // 選択は applyFilters() で行うため、ここでは選択しない
    } catch (error) {
      console.error('Failed to fetch execution history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // フィルタリング処理
  const applyFilters = () => {
    let filtered = [...history]

    // ステータスフィルタ
    if (filter.status !== 'all') {
      filtered = filtered.filter((item) =>
        filter.status === 'success' ? item.success : !item.success
      )
    }

    // 日付フィルタ
    if (filter.dateRange !== 'all') {
      const now = Date.now()
      const cutoffTimes = {
        today: now - 24 * 60 * 60 * 1000,
        week: now - 7 * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000
      }
      const cutoff = cutoffTimes[filter.dateRange]
      filtered = filtered.filter((item) => item.executedAt >= cutoff)
    }

    // 時系列順（最新順）でソート
    filtered.sort((a, b) => b.executedAt - a.executedAt)

    setFilteredHistory(filtered)

    // 現在の選択がフィルタ結果に含まれているかチェック
    if (selectedExecution) {
      const isSelectedInFiltered = filtered.find(
        (ex) => ex.executedAt === selectedExecution.executedAt
      )
      if (!isSelectedInFiltered) {
        // 選択されたアイテムがフィルタ結果にない場合、最初のアイテムを選択するかクリア
        if (filtered.length > 0) {
          setSelectedExecution(filtered[0])
          fetchSessionHistory(filtered[0].sessionId)
        } else {
          setSelectedExecution(null)
        }
      }
    } else if (filtered.length > 0 && !selectedExecution) {
      // 選択がない場合は最初のアイテムを自動選択
      setSelectedExecution(filtered[0])
      fetchSessionHistory(filtered[0].sessionId)
    }
  }

  // 実行時間をフォーマット
  const formatDuration = (start: number, end?: number) => {
    if (!end) return t('backgroundAgent.history.unknown')
    const duration = Math.round((end - start) / 1000)
    if (duration < 60) return `${duration}${t('common.seconds')}`
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}${t('common.minutes')}${seconds}${t('common.seconds')}`
  }

  // 日時をフォーマット
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // セッション履歴を取得
  const fetchSessionHistory = async (sessionId: string) => {
    if (sessionHistories[sessionId] || loadingSessions.has(sessionId)) return

    try {
      setLoadingSessions((prev) => new Set([...prev, sessionId]))
      const messages = await onGetSessionHistory(sessionId)
      setSessionHistories((prev) => ({ ...prev, [sessionId]: messages }))
    } catch (error) {
      console.error('Failed to fetch session history:', error)
    } finally {
      setLoadingSessions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(sessionId)
        return newSet
      })
    }
  }

  // 実行履歴を選択
  const selectExecution = async (execution: TaskExecutionResult) => {
    setSelectedExecution(execution)
    await fetchSessionHistory(execution.sessionId)
  }

  // メッセージタイプを判定
  const getMessageType = (message: any) => {
    if (!Array.isArray(message.content)) return 'text'

    const hasToolUse = message.content.some((item: any) => item.type === 'tool_use')
    const hasToolResult = message.content.some((item: any) => item.type === 'tool_result')

    if (hasToolUse) return 'tool_use'
    if (hasToolResult) return 'tool_result'
    return 'text'
  }

  // メッセージのアイコンを取得（ツールメッセージ含む）
  const getMessageIcon = (message: any) => {
    const messageType = getMessageType(message)

    switch (messageType) {
      case 'tool_use':
        return <WrenchIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'tool_result':
        return <ClipboardDocumentListIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      default:
        return message.role === 'user' ? (
          <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <CpuChipIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
        )
    }
  }

  // メッセージの背景色を取得
  const getMessageBackgroundColor = (message: any) => {
    const messageType = getMessageType(message)

    switch (messageType) {
      case 'tool_use':
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400'
      case 'tool_result':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400'
      default:
        return message.role === 'user'
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'bg-gray-50 dark:bg-gray-800'
    }
  }

  // ツール使用メッセージをフォーマット
  const formatToolUseContent = (content: any[]): string => {
    const toolUseItems = content.filter((item: any) => item.type === 'tool_use')

    return toolUseItems
      .map((item: any) => {
        const toolName = item.name || 'Unknown Tool'
        const input = item.input ? JSON.stringify(item.input, null, 2) : 'No input'
        const toolId = item.id ? `\nID: ${item.id}` : ''

        return `🔧 ツール実行リクエスト\n📝 ツール名: ${toolName}${toolId}\n📥 入力パラメータ:\n${input}`
      })
      .join('\n\n')
  }

  // ツール結果メッセージをフォーマット
  const formatToolResultContent = (content: any[]): string => {
    const toolResultItems = content.filter((item: any) => item.type === 'tool_result')

    return toolResultItems
      .map((item: any) => {
        const isError = item.is_error || false
        const result = item.content || 'No result'
        const toolId = item.tool_use_id ? `\nツールID: ${item.tool_use_id}` : ''

        return `📋 ツール実行結果\n${isError ? '❌ 実行エラー' : '✅ 実行成功'}${toolId}\n📤 出力結果:\n${result}`
      })
      .join('\n\n')
  }

  // メッセージの内容をフォーマット
  const formatMessageContent = (message: any): string => {
    const messageType = getMessageType(message)
    const content = message.content

    if (messageType === 'tool_use') {
      return formatToolUseContent(content)
    } else if (messageType === 'tool_result') {
      return formatToolResultContent(content)
    }

    // 通常のテキストメッセージ
    if (!Array.isArray(content)) {
      if (typeof content === 'string') return content
      if (content && typeof content === 'object' && (content as any).text)
        return (content as any).text
      return String(content)
    }

    return content
      .map((item: any) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          if (item.type === 'text' && item.text) return item.text
          if (item.text) return item.text
        }
        return JSON.stringify(item)
      })
      .join('\n')
  }

  // メッセージのタイトルを取得
  const getMessageTitle = (message: any) => {
    const messageType = getMessageType(message)

    switch (messageType) {
      case 'tool_use':
        return t('backgroundAgent.history.toolExecution')
      case 'tool_result':
        return t('backgroundAgent.history.toolResult')
      default:
        return message.role === 'user'
          ? t('backgroundAgent.history.user')
          : t('backgroundAgent.history.assistant')
    }
  }

  // 会話継続機能のハンドラー
  const handleContinueSession = async () => {
    if (!selectedExecution || !onContinueSession || !chatMessage.trim()) return

    try {
      setIsSendingMessage(true)
      await onContinueSession({
        sessionId: selectedExecution.sessionId,
        taskId: task.id,
        userMessage: chatMessage.trim(),
        options: {
          enableToolExecution: true,
          maxToolExecutions: 5,
          timeoutMs: 300000 // 5分タイムアウト
        }
      })

      // メッセージ送信後、セッション履歴を再取得
      await fetchSessionHistory(selectedExecution.sessionId)
      setChatMessage('')
    } catch (error) {
      console.error('Failed to continue session:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleContinueSession()
    }
  }

  useEffect(() => {
    if (isOpen) {
      // モーダルが開かれた時に選択をリセットして最新履歴を選択させる
      setSelectedExecution(null)
      fetchHistory()
    }
  }, [isOpen, task.id])

  useEffect(() => {
    applyFilters()
  }, [history, filter])

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen, onClose])

  // 確実なモーダル閉じる処理
  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onClose()
    },
    [onClose]
  )

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80 bg-white dark:bg-gray-900 w-full h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('backgroundAgent.history.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.name}</p>
          </div>
          <button
            onClick={handleCloseClick}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('backgroundAgent.history.filterStatus')}:
              </label>
              <select
                value={filter.status}
                onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value as any }))}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="all">{t('backgroundAgent.history.all')}</option>
                <option value="success">{t('backgroundAgent.history.successOnly')}</option>
                <option value="failure">{t('backgroundAgent.history.failureOnly')}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('backgroundAgent.history.filterDate')}:
              </label>
              <select
                value={filter.dateRange}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, dateRange: e.target.value as any }))
                }
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="all">{t('backgroundAgent.history.allTime')}</option>
                <option value="today">{t('backgroundAgent.history.today')}</option>
                <option value="week">{t('backgroundAgent.history.thisWeek')}</option>
                <option value="month">{t('backgroundAgent.history.thisMonth')}</option>
              </select>
            </div>

            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>
          </div>

          {/* Main Content - 2 Column Layout */}
          <div className="flex-1 flex min-h-0">
            {/* Left Column - Execution History List */}
            <div className="w-1/4 flex-shrink-0 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
              <div className="p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('backgroundAgent.history.executionHistoryList')} ({filteredHistory.length})
                </h4>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                    <p>{t('backgroundAgent.history.noHistory')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHistory.map((execution) => (
                      <div
                        key={`${execution.taskId}-${execution.executedAt}`}
                        onClick={() => selectExecution(execution)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedExecution?.executedAt === execution.executedAt
                            ? 'bg-gray-100 dark:bg-gray-800'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          {execution.success ? (
                            <CheckCircleIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <XCircleIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          )}
                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                            {execution.success
                              ? t('backgroundAgent.history.success')
                              : t('backgroundAgent.history.failure')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <span>{formatDateTime(execution.executedAt)}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="hidden md:inline">{execution.messageCount}msg</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Selected Execution Details */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              {selectedExecution ? (
                <>
                  {/* Execution Details */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2 mb-4">
                      {selectedExecution.success ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      )}
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {t('backgroundAgent.history.executionDetails')} -{' '}
                        {formatDateTime(selectedExecution.executedAt)}
                      </h4>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t('backgroundAgent.history.duration')}:{' '}
                          {formatDuration(
                            selectedExecution.executedAt,
                            selectedExecution.executedAt + 60000
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {t('backgroundAgent.history.messageCount')}:{' '}
                          {selectedExecution.messageCount}
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <DocumentTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-gray-700 dark:text-gray-300 text-xs">
                            {t('backgroundAgent.history.sessionId')}:
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 font-mono text-xs break-all">
                            {selectedExecution.sessionId}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedExecution.error && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                        <div className="flex items-start space-x-2">
                          <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-red-800 dark:text-red-200">
                            {selectedExecution.error}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                      <h5 className="text-md font-medium text-gray-900 dark:text-white">
                        {t('backgroundAgent.history.sessionHistory')}
                      </h5>
                      {onContinueSession && (
                        <button
                          onClick={() => setShowChatMode(!showChatMode)}
                          className={`text-sm px-3 py-1 rounded border transition-colors ${
                            showChatMode
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-600'
                          }`}
                        >
                          {showChatMode
                            ? t('backgroundAgent.history.showHistoryOnly')
                            : t('backgroundAgent.history.continueConversation')}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      {loadingSessions.has(selectedExecution.sessionId) ? (
                        <div className="flex items-center justify-center py-8">
                          <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                        </div>
                      ) : sessionHistories[selectedExecution.sessionId] ? (
                        sessionHistories[selectedExecution.sessionId].length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <ChatBubbleBottomCenterTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                            <p className="text-sm">{t('backgroundAgent.history.noMessages')}</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sessionHistories[selectedExecution.sessionId].map((message, index) => (
                              <div
                                key={index}
                                className={`flex items-start space-x-3 p-4 rounded-lg ${getMessageBackgroundColor(message)}`}
                              >
                                <div className="flex-shrink-0 mt-1">{getMessageIcon(message)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    {getMessageTitle(message)}
                                  </div>
                                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                                    {formatMessageContent(message)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          {t('backgroundAgent.history.loadingMessages')}
                        </div>
                      )}
                    </div>

                    {/* Chat Input Form */}
                    {showChatMode && onContinueSession && (
                      <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex space-x-3">
                          <div className="flex-1">
                            <textarea
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              onKeyDown={handleKeyPress}
                              placeholder={t('backgroundAgent.history.enterMessage')}
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                              rows={3}
                              disabled={isSendingMessage}
                            />
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={handleContinueSession}
                              disabled={isSendingMessage || !chatMessage.trim()}
                              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSendingMessage ? (
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                              ) : (
                                t('backgroundAgent.history.send')
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {t('backgroundAgent.history.sendInstruction')}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                    <p>{t('backgroundAgent.history.selectExecutionHistory')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
