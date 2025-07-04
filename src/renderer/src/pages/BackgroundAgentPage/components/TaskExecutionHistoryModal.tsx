import React, { useState, useEffect } from 'react'
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
  onGetSessionHistory
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

  // 履歴データを取得
  const fetchHistory = async () => {
    if (!isOpen) return

    try {
      setIsLoading(true)
      const historyData = await onGetExecutionHistory(task.id)
      setHistory(historyData)
      // 最初の実行結果を自動選択
      if (historyData.length > 0) {
        setSelectedExecution(historyData[0])
        await fetchSessionHistory(historyData[0].sessionId)
      }
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

  // 統計情報を計算
  const getStats = () => {
    const total = history.length
    const successful = history.filter((h) => h.success).length
    const failed = total - successful
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

    return { total, successful, failed, successRate }
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
        return 'ツール実行'
      case 'tool_result':
        return 'ツール結果'
      default:
        return message.role === 'user'
          ? t('backgroundAgent.history.user')
          : t('backgroundAgent.history.assistant')
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [isOpen, task.id])

  useEffect(() => {
    applyFilters()
  }, [history, filter])

  if (!isOpen) return null

  const stats = getStats()

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('backgroundAgent.history.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('backgroundAgent.history.totalExecutions')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.successful}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('backgroundAgent.history.successful')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('backgroundAgent.history.failed')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.successRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('backgroundAgent.history.successRate')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('backgroundAgent.history.filterStatus')}:
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter((prev) => ({ ...prev, status: e.target.value as any }))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              onChange={(e) => setFilter((prev) => ({ ...prev, dateRange: e.target.value as any }))}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh')}</span>
          </button>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left Column - Execution History List */}
          <div className="w-1/3 flex-shrink-0 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                実行履歴 ({filteredHistory.length})
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
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedExecution?.executedAt === execution.executedAt
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                          : execution.success
                            ? 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                            : 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {execution.success ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {execution.success ? '成功' : '失敗'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>{formatDateTime(execution.executedAt)}</div>
                        <div className="flex items-center space-x-3">
                          <span>メッセージ: {execution.messageCount}</span>
                          <span>セッション: {execution.sessionId.slice(0, 8)}...</span>
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
                      実行詳細 - {formatDateTime(selectedExecution.executedAt)}
                    </h4>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        実行時間:{' '}
                        {formatDuration(
                          selectedExecution.executedAt,
                          selectedExecution.executedAt + 60000
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        メッセージ数: {selectedExecution.messageCount}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-700 dark:text-gray-300 text-xs">
                          セッションID:
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
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <h5 className="text-md font-medium text-gray-900 dark:text-white">
                      セッション履歴
                    </h5>
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
                        メッセージを読み込み中...
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p>実行履歴を選択してください</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
