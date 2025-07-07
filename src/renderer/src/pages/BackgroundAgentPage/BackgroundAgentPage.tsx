import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BsQuestionCircle } from 'react-icons/bs'
import { useBackgroundAgent } from './hooks/useBackgroundAgent'
import { ScheduleTaskForm } from './components/ScheduleTaskForm'
import { TaskList } from './components/TaskList'
import { useBackgroundAgentHelpModal } from './components/BackgroundAgentHelpModal'

const BackgroundAgentPage: React.FC = () => {
  const { t } = useTranslation()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const {
    tasks,
    isLoading,
    taskLoadingStates,
    createTask,
    updateTask,
    cancelTask,
    toggleTask,
    executeTaskManually,
    getTaskExecutionHistory,
    getSessionHistory,
    getTaskSystemPrompt,
    refreshAll
  } = useBackgroundAgent()

  // Use the background agent help modal hook
  const { BackgroundAgentHelpModal, openModal } = useBackgroundAgentHelpModal()

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
        <div className="flex items-center">
          <p className="text-gray-600 dark:text-gray-400">{t('backgroundAgent.pageDescription')}</p>
          <div className="relative ml-2 group">
            <BsQuestionCircle
              className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
              onClick={openModal}
            />
            <div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs
                            font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100
                            transition-opacity duration-300 whitespace-nowrap pointer-events-none"
            >
              {t('backgroundAgent.help.tooltip')}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
        </div>
      </header>

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        taskLoadingStates={taskLoadingStates}
        onToggleTask={toggleTask}
        onCancelTask={cancelTask}
        onExecuteTask={executeTaskManually}
        onUpdateTask={updateTask}
        onRefresh={refreshAll}
        onGetExecutionHistory={getTaskExecutionHistory}
        onGetSessionHistory={getSessionHistory}
        onGetTaskSystemPrompt={getTaskSystemPrompt}
        onCreateTask={() => setShowCreateForm(true)}
      />

      {/* Create Task Modal */}
      {showCreateForm && (
        <ScheduleTaskForm onSubmit={handleCreateTask} onCancel={() => setShowCreateForm(false)} />
      )}

      {/* Background Agent Help Modal */}
      <BackgroundAgentHelpModal />
    </div>
  )
}

export default BackgroundAgentPage
