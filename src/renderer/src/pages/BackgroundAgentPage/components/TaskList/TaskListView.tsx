import React from 'react'
import { ScheduledTask, ScheduleConfig } from '../../hooks/useBackgroundAgent'
import { TaskCard } from './TaskCard'

interface TaskListViewProps {
  tasks: ScheduledTask[]
  taskLoadingStates: { [taskId: string]: boolean }
  onToggleTask: (taskId: string, enabled: boolean) => Promise<void>
  onCancelTask: (taskId: string) => Promise<void>
  onExecuteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, config: ScheduleConfig) => Promise<void>
  onGetTaskSystemPrompt: (taskId: string) => Promise<string>
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  taskLoadingStates,
  onToggleTask,
  onCancelTask,
  onExecuteTask,
  onUpdateTask,
  onGetTaskSystemPrompt
}) => {
  return (
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
  )
}
