import React from 'react'
import { useTranslation } from 'react-i18next'
import { TbRobot } from 'react-icons/tb'
import { CustomAgent } from '@/types/agent-chat'
import { getIconByValue } from '@renderer/components/icons/AgentIcons'

interface AgentCardProps {
  agent: CustomAgent
  onSelect: (agent: CustomAgent) => void
  onTagClick?: (tag: string) => void
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, onTagClick }) => {
  const { t } = useTranslation()

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-all hover:shadow-md cursor-pointer"
      onClick={() => onSelect(agent)}
    >
      <div className="flex items-start">
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-blue-100 dark:bg-blue-900/40">
          {agent.icon ? (
            getIconByValue(agent.icon, agent.iconColor || '#3B82F6')
          ) : (
            <TbRobot className="w-5 h-5" style={{ color: agent.iconColor || '#3B82F6' }} />
          )}
        </div>
        <div>
          <h3 className="font-medium text-lg dark:text-white">{agent.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
            {agent.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      {agent.tags && agent.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {agent.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation() // Prevent card click from triggering
                if (onTagClick) onTagClick(tag)
              }}
            >
              {tag}
            </button>
          ))}
          {agent.tags.length > 3 && (
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
              +{agent.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Author */}
      {agent.author && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          {t('authorLabel')}: {agent.author}
        </div>
      )}
    </div>
  )
}
