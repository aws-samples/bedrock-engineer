import React from 'react'
import { useTranslation } from 'react-i18next'
import { AgentCardBaseProps } from '../types/agent-card'
import { AgentIcon } from './AgentIcon'
import { AgentCardMenu } from './AgentCardMenu'

export const AgentCardCompact: React.FC<AgentCardBaseProps> = ({
  agent,
  isCustomAgent,
  isSelected,
  onSelect,
  actions
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={`group relative flex flex-col items-center p-3 border
        ${isSelected ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}
        rounded-lg bg-white dark:bg-gray-800 hover:border-blue-500
        dark:hover:border-blue-400 transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
      onClick={() => onSelect(agent.id!)}
      title={t(agent.description) || agent.name}
    >
      <div className="mb-2">
        <AgentIcon agent={agent} isCustomAgent={isCustomAgent} isSelected={isSelected} size="md" />
      </div>
      <p className="text-xs font-medium text-gray-900 dark:text-white text-center line-clamp-2 w-full px-1">
        {agent.name}
      </p>
      {isSelected && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full border-2 border-white dark:border-gray-800" />
      )}
      {!agent.isShared && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AgentCardMenu agent={agent} isCustomAgent={isCustomAgent} actions={actions} size="sm" />
        </div>
      )}
    </div>
  )
}
