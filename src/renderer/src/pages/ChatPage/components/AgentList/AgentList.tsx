import React from 'react'
import { FiSearch, FiGrid, FiList } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { CustomAgent } from '@/types/agent-chat'
import { AgentCard } from './components'
import { useAgentFilter } from './useAgentFilter'
import { useViewMode } from './hooks'
import { AgentCardActions } from './types/agent-card'

interface AgentListProps {
  agents: CustomAgent[]
  selectedAgentId?: string
  onSelectAgent: (agentId: string) => void
  onAddNewAgent: () => void
  onEditAgent: (agent: CustomAgent) => void
  onDuplicateAgent: (agent: CustomAgent) => void
  onDeleteAgent: (agentId: string) => void
  onSaveAsShared?: (agent: CustomAgent) => void
  onShareToOrganization?: (agent: CustomAgent) => void
  onConvertToStrands?: (agentId: string) => void
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onAddNewAgent,
  onEditAgent,
  onDuplicateAgent,
  onDeleteAgent,
  onSaveAsShared,
  onShareToOrganization,
  onConvertToStrands
}) => {
  const { t } = useTranslation()
  const { searchQuery, setSearchQuery, selectedTags, availableTags, filteredAgents, toggleTag } =
    useAgentFilter(agents)
  const { viewMode, toggleViewMode } = useViewMode()

  return (
    <div className="p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="search"
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg
              bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700
              dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
              dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder={t('searchAgents')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleViewMode}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200
              border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              dark:focus:ring-offset-gray-900"
            title={viewMode === 'grid' ? t('compactView') : t('gridView')}
          >
            {viewMode === 'grid' ? <FiList className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
          </button>
          <button
            onClick={onAddNewAgent}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700
              border border-transparent rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              dark:focus:ring-offset-gray-900 whitespace-nowrap flex gap-2 items-center"
          >
            {t('addNewAgent')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 mb-6">
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {tag}
            {selectedTags.includes(tag) && (
              <span className="ml-2 text-xs" aria-hidden="true">
                ×
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'lg:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'
        }`}
      >
        {filteredAgents.map((agent) => {
          const isSelected = agent.id === selectedAgentId
          const isCustomAgent = agent.isCustom ?? true
          const isEditable = isCustomAgent && !agent.isShared

          const actions: AgentCardActions = {
            onEdit: isEditable ? onEditAgent : undefined,
            onDuplicate: onDuplicateAgent,
            onDelete: isEditable ? onDeleteAgent : undefined,
            onSaveAsShared: onSaveAsShared,
            onShareToOrganization: isEditable ? onShareToOrganization : undefined,
            onConvertToStrands: onConvertToStrands
          }

          return (
            <AgentCard
              key={agent.id}
              agent={agent as CustomAgent}
              isSelected={isSelected}
              isCompact={viewMode === 'compact'}
              onSelect={onSelectAgent}
              actions={actions}
            />
          )
        })}
      </div>
    </div>
  )
}
