import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowPathIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline'
import { ScheduledTask, ScheduleConfig } from '../hooks/useBackgroundAgent'
import { TaskViewToggle } from './TaskList/TaskViewToggle'
import { TaskListView } from './TaskList/TaskListView'
import { TaskTableView } from './TaskList/TaskTableView'

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
  const [isTableView, setIsTableView] = useState(false)

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
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('backgroundAgent.scheduledTasks')} ({tasks.length})
          </h2>
          <TaskViewToggle isTableView={isTableView} onToggle={setIsTableView} />
        </div>
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

      {/* View Content */}
      {isTableView ? (
        <TaskTableView
          tasks={tasks}
          taskLoadingStates={taskLoadingStates}
          onToggleTask={onToggleTask}
          onCancelTask={onCancelTask}
          onExecuteTask={onExecuteTask}
          onUpdateTask={onUpdateTask}
          onGetTaskSystemPrompt={onGetTaskSystemPrompt}
        />
      ) : (
        <TaskListView
          tasks={tasks}
          taskLoadingStates={taskLoadingStates}
          onToggleTask={onToggleTask}
          onCancelTask={onCancelTask}
          onExecuteTask={onExecuteTask}
          onUpdateTask={onUpdateTask}
          onGetTaskSystemPrompt={onGetTaskSystemPrompt}
        />
      )}
    </div>
  )
}
