import React from 'react'
import { useTranslation } from 'react-i18next'
import { CustomAgent } from '@/types/agent-chat'
import { TbRobot } from 'react-icons/tb'
import { getIconByValue } from '@renderer/components/icons/AgentIcons'

interface AgentListProps {
  agents: CustomAgent[]
  onSelectAgent: (agent: CustomAgent) => void
  onTagClick?: (tag: string) => void
  isLoading?: boolean
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  onSelectAgent,
  onTagClick,
  isLoading = false
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 animate-pulse"
          >
            <div className="flex items-start">
              {/* アイコンスケルトン */}
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 flex-shrink-0"></div>
              <div className="flex-1">
                {/* タイトルスケルトン */}
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
                {/* 説明スケルトン */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
                </div>
              </div>
            </div>

            {/* タグスケルトン */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-12"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-14"></div>
            </div>

            {/* 作者スケルトン */}
            <div className="mt-4">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">{t('noAgentsFound')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-all hover:shadow-md cursor-pointer"
          onClick={() => onSelectAgent(agent)}
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
      ))}
    </div>
  )
}
