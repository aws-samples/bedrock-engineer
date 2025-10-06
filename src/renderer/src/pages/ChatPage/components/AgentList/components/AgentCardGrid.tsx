import React from 'react'
import { useTranslation } from 'react-i18next'
import { AgentCardBaseProps } from '../types/agent-card'
import { AgentIcon } from './AgentIcon'
import { AgentCardMenu } from './AgentCardMenu'

export const AgentCardGrid: React.FC<AgentCardBaseProps> = ({
  agent,
  isCustomAgent,
  isSelected,
  onSelect,
  actions
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={`group relative flex items-start p-4 border
        ${isSelected ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}
        rounded-lg bg-white dark:bg-gray-800 hover:border-blue-500
        dark:hover:border-blue-400 transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
      onClick={() => onSelect(agent.id!)}
    >
      <div className="flex-shrink-0 mr-4">
        <AgentIcon agent={agent} isCustomAgent={isCustomAgent} isSelected={isSelected} size="md" />
      </div>
      <div className="flex-1 min-w-0 relative pr-10">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-medium text-gray-900 dark:text-white pr-6 truncate">
            {agent.name}
          </h3>
          <div className="flex items-center gap-1">
            {isSelected && (
              <span className="px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded">
                {t('active')}
              </span>
            )}
            {agent.isShared && (
              <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                {t('shared')}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 break-words">
          {t(agent.description) || t('noDescription')}
        </p>
        {!agent.isShared && (
          <div className="absolute right-0 top-0">
            <AgentCardMenu
              agent={agent}
              isCustomAgent={isCustomAgent}
              actions={actions}
              size="md"
            />
          </div>
        )}
      </div>
    </div>
  )
}
