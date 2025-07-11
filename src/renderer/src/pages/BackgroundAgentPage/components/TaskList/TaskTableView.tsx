import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduledTask, ScheduleConfig } from '../../hooks/useBackgroundAgent'
import { TaskTableHeader } from './TaskTable/TaskTableHeader'
import { TaskTableRow } from './TaskTable/TaskTableRow'

interface TaskTableViewProps {
  tasks: ScheduledTask[]
  taskLoadingStates: { [taskId: string]: boolean }
  onToggleTask: (taskId: string, enabled: boolean) => Promise<void>
  onCancelTask: (taskId: string) => Promise<void>
  onExecuteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, config: ScheduleConfig) => Promise<void>
  onGetTaskSystemPrompt: (taskId: string) => Promise<string>
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  taskLoadingStates,
  onToggleTask,
  onCancelTask,
  onExecuteTask,
  onUpdateTask,
  onGetTaskSystemPrompt
}) => {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <TaskTableHeader
          nameLabel={t('backgroundAgent.table.name')}
          scheduleLabel={t('backgroundAgent.table.schedule')}
          agentLabel={t('backgroundAgent.table.agent')}
          statusLabel={t('backgroundAgent.table.status')}
          lastRunLabel={t('backgroundAgent.table.lastRun')}
          actionsLabel={t('backgroundAgent.table.actions')}
        />
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => (
            <TaskTableRow
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
        </tbody>
      </table>
    </div>
  )
}
