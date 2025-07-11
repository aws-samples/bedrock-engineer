import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PlayIcon,
  ArrowPathIcon,
  PencilIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ScheduledTask, ScheduleConfig } from '../../../hooks/useBackgroundAgent'
import { TaskFormModal } from '../../TaskFormModal'
import { useTaskSystemPromptModal } from '../../TaskSystemPromptModal'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { AgentIcon } from '../atoms/AgentIcon'
import { ToggleSwitch } from '../atoms/ToggleSwitch'
import { StatusBadge } from '../atoms/StatusBadge'
import { ActionMenu } from '../atoms/ActionMenu'
import { ProjectPathDisplay } from '../atoms/ProjectPathDisplay'

interface TaskTableRowProps {
  task: ScheduledTask
  isTaskLoading?: boolean
  onToggle: (taskId: string, enabled: boolean) => Promise<void>
  onCancel: (taskId: string) => Promise<void>
  onExecute: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, config: ScheduleConfig) => Promise<void>
  onGetTaskSystemPrompt: (taskId: string) => Promise<string>
}

export const TaskTableRow: React.FC<TaskTableRowProps> = ({
  task,
  isTaskLoading = false,
  onToggle,
  onCancel,
  onExecute,
  onUpdate,
  onGetTaskSystemPrompt
}) => {
  const { t } = useTranslation()
  const { agents } = useSettings()
  const [isExecuting, setIsExecuting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // System Prompt Modal
  const {
    show: showSystemPromptModal,
    taskId: systemPromptTaskId,
    taskName: systemPromptTaskName,
    handleClose: handleCloseSystemPrompt,
    TaskSystemPromptModal
  } = useTaskSystemPromptModal()

  // Helper functions
  const getAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent || null
  }

  const getAgentName = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId)
    return agent?.name || agentId
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('backgroundAgent.never')
    return new Date(timestamp).toLocaleDateString()
  }

  // Event handlers
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

  const menuItems = [
    {
      key: 'edit',
      label: t('backgroundAgent.editTask'),
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: handleEdit
    },
    {
      key: 'history',
      label: t('backgroundAgent.history.viewHistory'),
      icon: <CalendarIcon className="h-4 w-4" />,
      onClick: handleStatisticsClick
    },
    {
      key: 'delete',
      label: t('backgroundAgent.deleteTask'),
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: handleCancel,
      variant: 'danger' as const,
      separator: true
    }
  ]

  return (
    <>
      <tr className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {/* Name Column */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                {task.name}
              </div>
              {task.lastError && (
                <StatusBadge type="error">{t('backgroundAgent.ui.error')}</StatusBadge>
              )}
            </div>
            {task.projectDirectory && (
              <ProjectPathDisplay
                path={task.projectDirectory}
                variant="table"
                className="mt-1 max-w-xs"
              />
            )}
          </div>
        </td>

        {/* Schedule Column */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-white font-mono">
            {task.cronExpression}
          </div>
        </td>

        {/* Agent Column */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <AgentIcon agent={getAgent(task.agentId)} size="sm" />
            <div className="text-sm text-gray-900 dark:text-white truncate max-w-32">
              {getAgentName(task.agentId)}
            </div>
          </div>
        </td>

        {/* Status Column */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-2">
            <ToggleSwitch
              enabled={task.enabled}
              onToggle={handleToggle}
              disabled={false}
              enabledLabel={t('backgroundAgent.disableTask')}
              disabledLabel={t('backgroundAgent.enableTask')}
            />
            {task.continueSession && (
              <StatusBadge type="info">{t('backgroundAgent.ui.continuation')}</StatusBadge>
            )}
          </div>
        </td>

        {/* Last Run Column */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div>{formatDate(task.lastRun)}</div>
            <div className="text-xs">
              {task.runCount}
              {t('backgroundAgent.ui.executionCount')}
            </div>
          </div>
        </td>

        {/* Actions Column */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={isExecuting || isTaskLoading}
              className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
              title={
                isExecuting || isTaskLoading
                  ? t('common.executing')
                  : t('backgroundAgent.testExecution')
              }
            >
              {isExecuting || isTaskLoading ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
              ) : (
                <PlayIcon className="h-3 w-3" />
              )}
            </button>

            {/* Actions Menu */}
            <ActionMenu items={menuItems} />
          </div>
        </td>
      </tr>

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
    </>
  )
}
