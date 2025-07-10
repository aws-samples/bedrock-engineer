import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PlayIcon,
  TrashIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  DocumentTextIcon,
  CpuChipIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { ScheduledTask, ScheduleConfig } from '../hooks/useBackgroundAgent'
import { TaskFormModal } from './TaskFormModal'
import { useTaskSystemPromptModal } from './TaskSystemPromptModal'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { getIconByValue } from '@renderer/components/icons/AgentIcons'
import { AgentIcon as AgentIconType } from '@/types/agent-chat'

interface TaskListProps {
  tasks: ScheduledTask[]
  isLoading: boolean
  taskLoadingStates: { [taskId: string]: boolean }
  onToggleTask: (taskId: string, enabled: boolean) => Promise<void>
  onCancelTask: (taskId: string) => Promise<void>
  onExecuteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, config: ScheduleConfig) => Promise<void>
  onRefresh: () => Promise<void>
  onGetTaskSystemPrompt: (taskId: string) => Promise<string>
  onCreateTask: () => void
}

interface TaskCardProps {
  task: ScheduledTask
  isTaskLoading?: boolean
  onToggle: (taskId: string, enabled: boolean) => Promise<void>
  onCancel: (taskId: string) => Promise<void>
  onExecute: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, config: ScheduleConfig) => Promise<void>
  onGetTaskSystemPrompt: (taskId: string) => Promise<string>
}

// Agent Icon Component
const AgentIcon: React.FC<{
  agent: { icon?: string; iconColor?: string; name: string } | null
  size?: 'sm' | 'md'
}> = ({ agent, size = 'sm' }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  if (!agent?.icon) {
    return <CogIcon className={`${iconSize} flex-shrink-0`} />
  }

  // 既存のAgentIconsコンポーネントを使用
  const iconElement = getIconByValue(agent.icon as AgentIconType, agent.iconColor)

  return (
    <div className={`${iconSize} flex items-center justify-center flex-shrink-0`}>
      {iconElement}
    </div>
  )
}

// Toggle Switch Component
const ToggleSwitch: React.FC<{
  enabled: boolean
  onToggle: (e: React.MouseEvent) => void
  disabled?: boolean
  t: (key: string) => string
}> = ({ enabled, onToggle, disabled = false, t }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-pressed={enabled}
    aria-label={enabled ? t('backgroundAgent.disableTask') : t('backgroundAgent.enableTask')}
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
  onUpdate,
  onGetTaskSystemPrompt
}) => {
  const { t } = useTranslation()
  const { agents, availableModels } = useSettings()
  const [isExecuting, setIsExecuting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isWakeWordExpanded, setIsWakeWordExpanded] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const actionsMenuRef = useRef<HTMLDivElement>(null)

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false)
      }
    }

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActionsMenu])

  // System Prompt Modal
  const {
    show: showSystemPromptModal,
    taskId: systemPromptTaskId,
    taskName: systemPromptTaskName,
    handleOpen: handleOpenSystemPrompt,
    handleClose: handleCloseSystemPrompt,
    TaskSystemPromptModal
  } = useTaskSystemPromptModal()

  // エージェント情報を取得する関数
  const getAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent || null
  }

  // エージェント名を取得する関数
  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent?.name || agentId
  }

  // モデル名を取得する関数
  const getModelName = (modelId: string) => {
    const model = availableModels.find((m) => m.modelId === modelId)
    return model?.modelName || modelId
  }

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

  const handleStatisticsClick = async () => {
    try {
      await window.api.window.openTaskHistory(task.id)
    } catch (error) {
      console.error('Failed to open task history window:', error)
    }
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleEditSubmit = async (config: ScheduleConfig, taskId?: string) => {
    try {
      if (taskId) {
        await onUpdate(taskId, config)
      }
      setShowEditModal(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('backgroundAgent.never')
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg dark:shadow-gray-900/80 border-[0.5px] border-gray-200 dark:border-gray-600 p-6 shadow-sm hover:shadow-md dark:hover:shadow-gray-900/90 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{task.name}</h3>
            {/* Show status badge only for error state */}
            {task.lastError && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <XCircleIcon className="h-3 w-3 mr-1" />
                エラー
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center space-x-2">
              <div className="w-5 flex justify-start items-center">
                <ClockIcon className="h-4 w-4" />
              </div>
              <span>{task.cronExpression}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-5 flex justify-start items-center">
                  <AgentIcon agent={getAgent(task.agentId)} size="sm" />
                </div>
                <span className="text-sm font-medium truncate" title={getAgentName(task.agentId)}>
                  {getAgentName(task.agentId)}
                </span>
                <button
                  onClick={() => handleOpenSystemPrompt(task.id, task.name)}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={t('backgroundAgent.systemPrompt.show')}
                >
                  <DocumentTextIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 flex justify-start items-center">
                  <CpuChipIcon className="h-4 w-4 text-gray-400" />
                </div>
                <span
                  className="text-xs text-gray-500 dark:text-gray-400 truncate"
                  title={getModelName(task.modelId)}
                >
                  {getModelName(task.modelId)}
                </span>
              </div>
            </div>
            <div className="h-6 flex items-center">
              {task.projectDirectory && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded truncate max-w-full">
                  {task.projectDirectory}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Primary Action: Test Execution Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting || isTaskLoading}
            className="inline-flex items-center px-2 md:px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors shadow-sm"
            title={
              isExecuting || isTaskLoading
                ? t('common.executing')
                : t('backgroundAgent.testExecution')
            }
          >
            {isExecuting || isTaskLoading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-0 md:mr-1.5 animate-spin" />
                <span className="hidden md:inline">{t('common.executing')}</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-0 md:mr-1.5" />
                <span className="hidden md:inline">{t('backgroundAgent.testExecution')}</span>
              </>
            )}
          </button>

          {/* Toggle Switch */}
          <div className="flex items-center space-x-3">
            <ToggleSwitch enabled={task.enabled} onToggle={handleToggle} disabled={false} t={t} />
          </div>

          {/* Secondary Actions Menu */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="More actions"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleEdit()
                      setShowActionsMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <PencilIcon className="h-4 w-4 mr-3" />
                    {t('backgroundAgent.editTask')}
                  </button>
                  <button
                    onClick={() => {
                      handleStatisticsClick()
                      setShowActionsMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <CalendarIcon className="h-4 w-4 mr-3" />
                    {t('backgroundAgent.history.viewHistory')}
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    onClick={() => {
                      handleCancel()
                      setShowActionsMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="h-4 w-4 mr-3" />
                    {t('backgroundAgent.deleteTask')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Statistics */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <span className="font-medium text-gray-900 dark:text-white">{task.runCount}</span>
              <span>回実行</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>最終:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatDate(task.lastRun)}
              </span>
            </span>
          </div>
          <button
            onClick={handleStatisticsClick}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title={t('backgroundAgent.viewExecutionHistory')}
          >
            {t('backgroundAgent.history.viewHistory')}
          </button>
        </div>
      </div>

      {/* Additional Info - Collapsible */}
      <div className="mb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsWakeWordExpanded(!isWakeWordExpanded)}
            className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
          >
            <span>詳細</span>
            {isWakeWordExpanded ? (
              <ChevronUpIcon className="h-3 w-3" />
            ) : (
              <ChevronDownIcon className="h-3 w-3" />
            )}
          </button>
          {task.continueSession && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
              継続
            </span>
          )}
        </div>

        {/* Expandable Details */}
        {isWakeWordExpanded && (
          <div className="mt-3 space-y-3">
            {/* Wake Word */}
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                ウェイクワード:
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 text-xs text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
                {task.wakeWord}
              </div>
            </div>

            {/* Session Continuation */}
            {task.continueSession && task.continueSessionPrompt && (
              <div>
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  継続プロンプト:
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-2 text-xs text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
                  {task.continueSessionPrompt}
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-3 w-3" />
              <span>作成: {formatDate(task.createdAt)}</span>
            </div>
          </div>
        )}
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

      {/* Edit Task Modal */}
      {showEditModal && (
        <TaskFormModal
          mode="edit"
          task={task}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* System Prompt Modal */}
      <TaskSystemPromptModal
        isOpen={showSystemPromptModal}
        onClose={handleCloseSystemPrompt}
        taskId={systemPromptTaskId}
        taskName={systemPromptTaskName}
        getTaskSystemPrompt={onGetTaskSystemPrompt}
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
  onUpdateTask,
  onRefresh,
  onGetTaskSystemPrompt,
  onCreateTask
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
          onClick={onCreateTask}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('backgroundAgent.createTask')}
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
        <div className="flex items-center space-x-3">
          <button
            onClick={onCreateTask}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('backgroundAgent.createTask')}
          </button>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isTaskLoading={taskLoadingStates[task.id] || false}
            onToggle={onToggleTask}
            onCancel={onCancelTask}
            onExecute={onExecuteTask}
            onUpdate={onUpdateTask}
            onGetTaskSystemPrompt={onGetTaskSystemPrompt}
          />
        ))}
      </div>
    </div>
  )
}
