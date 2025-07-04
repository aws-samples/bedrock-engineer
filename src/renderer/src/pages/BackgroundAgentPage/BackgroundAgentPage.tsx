import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useBackgroundAgent } from './hooks/useBackgroundAgent'
import { ScheduleTaskForm } from './components/ScheduleTaskForm'
import { TaskList } from './components/TaskList'

const BackgroundAgentPage: React.FC = () => {
  const { t } = useTranslation()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const {
    tasks,
    isLoading,
    taskLoadingStates,
    createTask,
    cancelTask,
    toggleTask,
    executeTaskManually,
    getTaskExecutionHistory,
    getSessionHistory,
    refreshAll
  } = useBackgroundAgent()

  const handleCreateTask = async (taskConfig: any) => {
    try {
      await createTask(taskConfig)
      setShowCreateForm(false)
      await refreshAll()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Background Agent</h1>
        <p className="text-gray-600 dark:text-gray-400">
          スケジュールされたタスクを管理し、自動実行を設定できます
        </p>
      </header>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('backgroundAgent.createTask')}
        </button>
      </div>

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        taskLoadingStates={taskLoadingStates}
        onToggleTask={toggleTask}
        onCancelTask={cancelTask}
        onExecuteTask={executeTaskManually}
        onRefresh={refreshAll}
        onGetExecutionHistory={getTaskExecutionHistory}
        onGetSessionHistory={getSessionHistory}
      />

      {/* Create Task Modal */}
      {showCreateForm && (
        <ScheduleTaskForm onSubmit={handleCreateTask} onCancel={() => setShowCreateForm(false)} />
      )}
    </div>
  )
}

export default BackgroundAgentPage
