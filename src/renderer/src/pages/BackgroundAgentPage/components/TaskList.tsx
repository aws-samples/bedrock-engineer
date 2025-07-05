import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PlayIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { ScheduledTask, TaskExecutionResult } from '../hooks/useBackgroundAgent'
import { TaskExecutionHistoryModal } from './TaskExecutionHistoryModal'

interface TaskListProps {
  tasks: ScheduledTask[]
  isLoading: boolean
  taskLoadingStates: { [taskId: string]: boolean }
  onToggleTask: (taskId: string, enabled: boolean) => Promise<void>
  onCancelTask: (taskId: string) => Promise<void>
  onExecuteTask: (taskId: string) => Promise<void>
  onRefresh: () => Promise<void>
  onGetExecutionHistory: (taskId: string) => Promise<TaskExecutionResult[]>
  onGetSessionHistory: (sessionId: string) => Promise<any[]>
}

interface TaskCardProps {
  task: ScheduledTask
  isTaskLoading?: boolean
  onToggle: (taskId: string, enabled: boolean) => Promise<void>
  onCancel: (taskId: string) => Promise<void>
  onExecute: (taskId: string) => Promise<void>
  onGetExecutionHistory: (taskId: string) => Promise<TaskExecutionResult[]>
  onGetSessionHistory: (sessionId: string) => Promise<any[]>
}

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}> = ({ enabled, onToggle, disabled = false }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-pressed={enabled}
    aria-label={enabled ? 'タスクを無効にする' : 'タスクを有効にする'}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isTaskLoading = false,
  onToggle,
  onCancel,
  onExecute,
  onGetExecutionHistory,
  onGetSessionHistory
}) => {
  const { t } = useTranslation()
  const [isExecuting, setIsExecuting] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const handleExecute = async () => {
    try {
      setIsExecuting(true)
      await onExecute(task.id)
    } catch (error) {
      console.error('Failed to execute task:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleToggle = async () => {
    await onToggle(task.id, !task.enabled)
  }

  const handleCancel = async () => {
    if (window.confirm(t('backgroundAgent.confirmDeleteTask'))) {
      await onCancel(task.id)
    }
  }

  const handleCardClick = () => {
    setShowHistoryModal(true)
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('backgroundAgent.never')
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = () => {
    if (!task.enabled) return 'text-gray-500'
    if (task.lastError) return 'text-red-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!task.enabled) return <XCircleIcon className="h-5 w-5" />
    if (task.lastError) return <XCircleIcon className="h-5 w-5" />
    return <CheckCircleIcon className="h-5 w-5" />
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{task.name}</h3>
            <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {task.enabled
                  ? task.lastError
                    ? t('backgroundAgent.status.error')
                    : t('backgroundAgent.status.active')
                  : t('backgroundAgent.status.disabled')}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>{task.cronExpression}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CogIcon className="h-4 w-4" />
              <span>
                {task.agentId} • {task.modelId}
              </span>
            </div>
            {task.projectDirectory && (
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {task.projectDirectory}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Test Execution Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting || isTaskLoading}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            {isExecuting || isTaskLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                実行中...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-1.5" />
                {t('backgroundAgent.testExecution')}
              </>
            )}
          </button>

          {/* Toggle Switch */}
          <div className="flex items-center space-x-2">
            <ToggleSwitch enabled={task.enabled} onToggle={handleToggle} disabled={false} />
            <span
              className={`text-sm font-medium ${
                task.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
              }`}
            >
              {task.enabled ? '有効' : '無効'}
            </span>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleCancel}
            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            title={t('backgroundAgent.deleteTask')}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Wake Word Preview */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('backgroundAgent.wakeWord')}:
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 text-sm text-gray-600 dark:text-gray-400">
          {task.wakeWord.length > 100 ? `${task.wakeWord.substring(0, 100)}...` : task.wakeWord}
        </div>
      </div>

      {/* Statistics - Clickable for Task Details */}
      <div
        className="grid grid-cols-2 gap-4 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-md p-3 -mx-3"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={t('backgroundAgent.taskDetails')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
      >
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">{task.runCount}</div>
          <div className="text-gray-500 dark:text-gray-400">{t('backgroundAgent.executions')}</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">
            {formatDate(task.lastRun)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{t('backgroundAgent.lastRun')}</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">
            {formatDate(task.nextRun)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{t('backgroundAgent.nextRun')}</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">
            {formatDate(task.createdAt)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{t('backgroundAgent.created')}</div>
        </div>
      </div>

      {/* Error Display */}
      {task.lastError && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start space-x-2">
            <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-red-800 dark:text-red-200">
                {t('backgroundAgent.lastError')}:
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">{task.lastError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Execution History Modal */}
      <TaskExecutionHistoryModal
        task={task}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onGetExecutionHistory={onGetExecutionHistory}
        onGetSessionHistory={onGetSessionHistory}
        onContinueSession={
          typeof window !== 'undefined' && window.api?.backgroundAgent?.continueSession
            ? window.api.backgroundAgent.continueSession
            : undefined
        }
      />
    </div>
  )
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  taskLoadingStates,
  onToggleTask,
  onCancelTask,
  onExecuteTask,
  onRefresh,
  onGetExecutionHistory,
  onGetSessionHistory
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('backgroundAgent.noTasks')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {t('backgroundAgent.noTasksDescription')}
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {t('backgroundAgent.scheduledTasks')} ({tasks.length})
        </h2>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isTaskLoading={taskLoadingStates[task.id] || false}
            onToggle={onToggleTask}
            onCancel={onCancelTask}
            onExecute={onExecuteTask}
            onGetExecutionHistory={onGetExecutionHistory}
            onGetSessionHistory={onGetSessionHistory}
          />
        ))}
      </div>
    </div>
  )
}
