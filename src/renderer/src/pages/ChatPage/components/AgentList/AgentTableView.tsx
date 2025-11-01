import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { FiChevronUp, FiChevronDown } from 'react-icons/fi'
import { TbRobot } from 'react-icons/tb'
import { useTranslation } from 'react-i18next'
import { AGENT_ICONS } from '@renderer/components/icons/AgentIcons'
import { SortKey, SortOrder } from './useAgentFilter'
import { AgentActionsDropdown } from './AgentActionsDropdown'

interface AgentTableViewProps {
  agents: CustomAgent[]
  selectedAgentId?: string
  onSelectAgent: (agentId: string) => void
  onEditAgent: (agent: CustomAgent) => void
  onDuplicateAgent: (agent: CustomAgent) => void
  onDeleteAgent: (agentId: string) => void
  onSaveAsShared?: (agent: CustomAgent) => void
  onShareToOrganization?: (agent: CustomAgent) => void
  onConvertToStrands?: (agentId: string) => void
  sortKey: SortKey
  sortOrder: SortOrder
  onSort: (key: SortKey) => void
}

export const AgentTableView: React.FC<AgentTableViewProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onEditAgent,
  onDuplicateAgent,
  onDeleteAgent,
  onSaveAsShared,
  onShareToOrganization,
  onConvertToStrands,
  sortKey,
  sortOrder,
  onSort
}) => {
  const { t } = useTranslation()

  const SortIcon: React.FC<{ columnKey: SortKey }> = ({ columnKey }) => {
    if (sortKey !== columnKey) {
      return (
        <div className="flex flex-col opacity-30">
          <FiChevronUp className="w-3 h-3 -mb-1" />
          <FiChevronDown className="w-3 h-3" />
        </div>
      )
    }
    return sortOrder === 'asc' ? (
      <FiChevronUp className="w-4 h-4" />
    ) : (
      <FiChevronDown className="w-4 h-4" />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-4 py-3 w-16">
              {/* Icon column - no sort */}
            </th>
            <th
              scope="col"
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1">
                Name
                <SortIcon columnKey="name" />
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => onSort('description')}
            >
              <div className="flex items-center gap-1">
                Description
                <SortIcon columnKey="description" />
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => onSort('tags')}
            >
              <div className="flex items-center gap-1">
                Tags
                <SortIcon columnKey="tags" />
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center gap-1">
                {t('status')}
                <SortIcon columnKey="status" />
              </div>
            </th>
            <th scope="col" className="px-4 py-3 w-24">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => {
            const isCustomAgent = agent.isCustom ?? true
            const isSelected = agent.id === selectedAgentId

            return (
              <tr
                key={agent.id}
                className={`border-b dark:border-gray-700 cursor-pointer
                  ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                onClick={() => onSelectAgent(agent.id!)}
              >
                {/* Icon */}
                <td className="px-4 py-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center
                      ${!isCustomAgent ? 'bg-gray-200 dark:bg-gray-700/80' : 'bg-blue-100 dark:bg-blue-800/80'}
                      rounded-lg border border-transparent dark:border-gray-600 shadow-sm dark:shadow-inner`}
                  >
                    {agent.icon ? (
                      React.cloneElement(
                        (AGENT_ICONS.find((opt) => opt.value === agent.icon)
                          ?.icon as React.ReactElement) ?? AGENT_ICONS[0].icon,
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
                          isSelected
                            ? 'text-blue-700 dark:text-blue-200'
                            : 'text-blue-600 dark:text-gray-100'
                        } filter brightness-110 contrast-125`}
                      />
                    )}
                  </div>
                </td>

                {/* Name */}
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                  {agent.name}
                </td>

                {/* Description */}
                <td className="px-4 py-3">
                  <div className="line-clamp-2 text-gray-600 dark:text-gray-400">
                    {t(agent.description) || t('noDescription')}
                  </div>
                </td>

                {/* Tags */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {agent.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {agent.tags && agent.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{agent.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
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
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <AgentActionsDropdown
                    agent={agent}
                    onEdit={onEditAgent}
                    onDuplicate={onDuplicateAgent}
                    onDelete={onDeleteAgent}
                    onSaveAsShared={onSaveAsShared}
                    onShareToOrganization={onShareToOrganization}
                    onConvertToStrands={onConvertToStrands}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
