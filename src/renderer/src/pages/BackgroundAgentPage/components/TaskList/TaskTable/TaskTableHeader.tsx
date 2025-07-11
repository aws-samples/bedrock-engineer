import React from 'react'

interface TaskTableHeaderProps {
  // i18n labels
  nameLabel: string
  scheduleLabel: string
  agentLabel: string
  statusLabel: string
  lastRunLabel: string
  actionsLabel: string
}

export const TaskTableHeader: React.FC<TaskTableHeaderProps> = ({
  nameLabel,
  scheduleLabel,
  agentLabel,
  statusLabel,
  lastRunLabel,
  actionsLabel
}) => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {nameLabel}
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {scheduleLabel}
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {agentLabel}
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {statusLabel}
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {lastRunLabel}
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {actionsLabel}
        </th>
      </tr>
    </thead>
  )
}
