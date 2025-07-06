import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
        <p className="text-gray-600 dark:text-gray-400">{t('backgroundAgent.pageDescription')}</p>
      </header>

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
        onCreateTask={() => setShowCreateForm(true)}
      />

      {/* Create Task Modal */}
      {showCreateForm && (
        <ScheduleTaskForm onSubmit={handleCreateTask} onCancel={() => setShowCreateForm(false)} />
      )}
    </div>
  )
}

export default BackgroundAgentPage
