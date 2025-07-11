import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduledTask, ScheduleConfig } from '../../../hooks/useBackgroundAgent'
import { TaskFormModal } from '../../TaskFormModal'
import { useTaskSystemPromptModal } from '../../TaskSystemPromptModal'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { TaskHeader } from './TaskHeader'
import { TaskDetails } from './TaskDetails'
import { TaskActions } from './TaskActions'
import { TaskStatistics } from './TaskStatistics'
import { TaskExpandedDetails } from './TaskExpandedDetails'
import { TaskErrorDisplay } from './TaskErrorDisplay'

interface TaskCardProps {
  task: ScheduledTask
  isTaskLoading?: boolean
  onToggle: (taskId: string, enabled: boolean) => Promise<void>
  onCancel: (taskId: string) => Promise<void>
  onExecute: (taskId: string) => Promise<void>
  onUpdate: (taskId: string, config: ScheduleConfig) => Promise<void>
  onGetTaskSystemPrompt: (taskId: string) => Promise<string>
}

export const TaskCard: React.FC<TaskCardProps> = ({
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

  // System Prompt Modal
  const {
    show: showSystemPromptModal,
    taskId: systemPromptTaskId,
    taskName: systemPromptTaskName,
    handleOpen: handleOpenSystemPrompt,
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

  const getModelName = (modelId: string) => {
    const model = availableModels.find((m) => m.modelId === modelId)
    return model?.modelName || modelId
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('backgroundAgent.never')
    return new Date(timestamp).toLocaleString()
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg dark:shadow-gray-900/80 border-[0.5px] border-gray-200 dark:border-gray-600 p-6 shadow-sm hover:shadow-md dark:hover:shadow-gray-900/90 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <TaskHeader name={task.name} hasError={!!task.lastError} />

          <TaskDetails
            cronExpression={task.cronExpression}
            agent={getAgent(task.agentId)}
            agentName={getAgentName(task.agentId)}
            modelName={getModelName(task.modelId)}
            projectDirectory={task.projectDirectory}
            onShowSystemPrompt={() => handleOpenSystemPrompt(task.id, task.name)}
            systemPromptButtonTitle={t('backgroundAgent.systemPrompt.show')}
          />
        </div>

        <TaskActions
          enabled={task.enabled}
          isExecuting={isExecuting}
          isTaskLoading={isTaskLoading}
          onExecute={handleExecute}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onViewHistory={handleStatisticsClick}
          onDelete={handleCancel}
          executingLabel={t('common.executing')}
          testExecutionLabel={t('backgroundAgent.testExecution')}
          enableTaskLabel={t('backgroundAgent.enableTask')}
          disableTaskLabel={t('backgroundAgent.disableTask')}
          editTaskLabel={t('backgroundAgent.editTask')}
          viewHistoryLabel={t('backgroundAgent.history.viewHistory')}
          deleteTaskLabel={t('backgroundAgent.deleteTask')}
        />
      </div>

      <TaskStatistics
        runCount={task.runCount}
        lastRun={task.lastRun}
        onViewHistory={handleStatisticsClick}
        formatDate={formatDate}
        executionCountLabel="回実行"
        lastRunLabel="最終"
        viewHistoryLabel={t('backgroundAgent.history.viewHistory')}
        historyButtonTitle={t('backgroundAgent.viewExecutionHistory')}
      />

      <TaskExpandedDetails
        isExpanded={isWakeWordExpanded}
        onToggleExpanded={() => setIsWakeWordExpanded(!isWakeWordExpanded)}
        wakeWord={task.wakeWord}
        continueSession={task.continueSession}
        continueSessionPrompt={task.continueSessionPrompt}
        createdAt={task.createdAt}
        formatDate={formatDate}
        detailsLabel="詳細"
        continuationLabel="継続"
        wakeWordLabel="ウェイクワード"
        continuationPromptLabel="継続プロンプト"
        createdLabel="作成"
      />

      {/* Error Display */}
      {task.lastError && (
        <TaskErrorDisplay error={task.lastError} errorTitle={t('backgroundAgent.lastError')} />
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
