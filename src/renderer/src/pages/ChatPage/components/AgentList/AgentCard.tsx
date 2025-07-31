import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { FiMoreVertical } from 'react-icons/fi'
import { TbRobot } from 'react-icons/tb'
import { Dropdown } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { AGENT_ICONS } from '@renderer/components/icons/AgentIcons'

interface AgentCardProps {
  agent: CustomAgent
  isCustomAgent: boolean
  isSelected: boolean
  onSelect: (agentId: string) => void
  onEdit?: (agent: CustomAgent) => void
  onDuplicate?: (agent: CustomAgent) => void
  onDelete?: (agentId: string) => void
  onSaveAsShared?: (agent: CustomAgent) => void
  onShareToOrganization?: (agent: CustomAgent) => void
  onConvertToStrands?: (agentId: string) => void
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isCustomAgent,
  isSelected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onSaveAsShared,
  onShareToOrganization,
  onConvertToStrands
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
        <div
          className={`w-10 h-10 flex items-center justify-center
            ${!isCustomAgent ? 'bg-gray-200 dark:bg-gray-700/80' : 'bg-blue-100 dark:bg-blue-800/80'}
            rounded-lg border border-transparent dark:border-gray-600 shadow-sm dark:shadow-inner`}
        >
          {agent.icon ? (
            React.cloneElement(
              (AGENT_ICONS.find((opt) => opt.value === agent.icon)?.icon as React.ReactElement) ??
                AGENT_ICONS[0].icon,
              {
                className: `w-5 h-5 ${isSelected ? 'dark:text-blue-300' : 'dark:text-gray-100'}`,
                style: {
                  color:
                    agent.iconColor ||
                    (isSelected ? 'var(--tw-text-blue-600)' : 'var(--tw-text-gray-700)'),
                  filter: 'brightness(1.2) contrast(1.2)'
                }
              }
            )
          ) : (
            <TbRobot
              className={`w-5 h-5 ${
                isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-blue-600 dark:text-gray-100'
              } filter brightness-110 contrast-125`}
            />
          )}
        </div>
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
          <div className="absolute right-0 top-0" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              label=""
              dismissOnClick={true}
              renderTrigger={() => (
                <button
                  className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400
                    dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiMoreVertical className="w-4 h-4" />
                </button>
              )}
            >
              {isCustomAgent && !agent.isShared && (
                <Dropdown.Item onClick={() => onEdit?.(agent)} className="w-48">
                  {t('edit')}
                </Dropdown.Item>
              )}
              <Dropdown.Item onClick={() => onDuplicate?.(agent)} className="w-48">
                {t('duplicate')}
              </Dropdown.Item>
              {onConvertToStrands && (
                <Dropdown.Item onClick={() => onConvertToStrands(agent.id!)} className="w-48">
                  {t('convertToStrands')}
                </Dropdown.Item>
              )}
              {!agent.isShared && onSaveAsShared && (
                <Dropdown.Item onClick={() => onSaveAsShared(agent)} className="w-48">
                  {t('saveAsShared')}
                </Dropdown.Item>
              )}
              {isCustomAgent && !agent.isShared && onShareToOrganization && (
                <Dropdown.Item onClick={() => onShareToOrganization(agent)} className="w-48">
                  {t('shareToOrganization')}
                </Dropdown.Item>
              )}
              {isCustomAgent && !agent.isShared && (
                <Dropdown.Item
                  onClick={() => onDelete?.(agent.id!)}
                  className="text-red-600 dark:text-red-400 w-48"
                >
                  {t('delete')}
                </Dropdown.Item>
              )}
            </Dropdown>
          </div>
        )}
      </div>
    </div>
  )
}
