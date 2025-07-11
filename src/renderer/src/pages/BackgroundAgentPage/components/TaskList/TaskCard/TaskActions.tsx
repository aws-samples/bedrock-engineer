import React from 'react'
import {
  PlayIcon,
  ArrowPathIcon,
  PencilIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ToggleSwitch } from '../atoms/ToggleSwitch'
import { ActionMenu } from '../atoms/ActionMenu'

interface TaskActionsProps {
  enabled: boolean
  isExecuting: boolean
  isTaskLoading: boolean
  onExecute: () => void
  onToggle: () => void
  onEdit: () => void
  onViewHistory: () => void
  onDelete: () => void
  // i18n labels
  executingLabel: string
  testExecutionLabel: string
  enableTaskLabel: string
  disableTaskLabel: string
  editTaskLabel: string
  viewHistoryLabel: string
  deleteTaskLabel: string
}

export const TaskActions: React.FC<TaskActionsProps> = ({
  enabled,
  isExecuting,
  isTaskLoading,
  onExecute,
  onToggle,
  onEdit,
  onViewHistory,
  onDelete,
  executingLabel,
  testExecutionLabel,
  enableTaskLabel,
  disableTaskLabel,
  editTaskLabel,
  viewHistoryLabel,
  deleteTaskLabel
}) => {
  const menuItems = [
    {
      key: 'edit',
      label: editTaskLabel,
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: onEdit
    },
    {
      key: 'history',
      label: viewHistoryLabel,
      icon: <CalendarIcon className="h-4 w-4" />,
      onClick: onViewHistory
    },
    {
      key: 'delete',
      label: deleteTaskLabel,
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'danger' as const,
      separator: true
    }
  ]

  return (
    <div className="flex items-center space-x-3">
      {/* Primary Action: Test Execution Button */}
      <button
        onClick={onExecute}
        disabled={isExecuting || isTaskLoading}
        className="inline-flex items-center justify-center min-w-[2.5rem] px-2 md:px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors shadow-sm whitespace-nowrap"
        title={isExecuting || isTaskLoading ? executingLabel : testExecutionLabel}
      >
        {isExecuting || isTaskLoading ? (
          <>
            <ArrowPathIcon className="h-4 w-4 mr-0 md:mr-1.5 animate-spin" />
            <span className="hidden md:inline">{executingLabel}</span>
          </>
        ) : (
          <>
            <PlayIcon className="h-4 w-4 mr-0 md:mr-1.5" />
            <span className="hidden md:inline">{testExecutionLabel}</span>
          </>
        )}
      </button>

      {/* Toggle Switch */}
      <div className="flex items-center space-x-3">
        <ToggleSwitch
          enabled={enabled}
          onToggle={onToggle}
          disabled={false}
          enabledLabel={disableTaskLabel}
          disabledLabel={enableTaskLabel}
        />
      </div>

      {/* Secondary Actions Menu */}
      <ActionMenu items={menuItems} />
    </div>
  )
}
