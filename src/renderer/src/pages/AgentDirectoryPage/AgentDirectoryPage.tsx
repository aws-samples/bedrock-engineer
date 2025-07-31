import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiSearch } from 'react-icons/fi'
import { BsQuestionCircle } from 'react-icons/bs'
import { AgentDetailModal } from './components/AgentDetailModal'
import { AgentList } from './components/AgentList'
import { TagFilter } from './components/TagFilter'
import { OrganizationSelector } from './components/OrganizationSelector'
import { useContributorModal } from './components/ContributorModal'
import { useOrganizationModal } from './modals/useOrganizationModal'
import { useAgentDirectory } from '@renderer/contexts/AgentDirectoryContext'
import { CustomAgent } from '@/types/agent-chat'

export const AgentDirectoryPage: React.FC = () => {
  const { t } = useTranslation()
  const {
    agents,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedAgent,
    setSelectedAgent,
    addSelectedAgentToMyAgents,
    allTags,
    selectedTags,
    handleTagToggle,
    // 組織関連
    selectedOrganization,
    setSelectedOrganization,
    organizations,
    loadOrganizationAgents
  } = useAgentDirectory()

  const handleSelectAgent = (agent: CustomAgent) => {
    setSelectedAgent(agent)
  }

  const handleCloseModal = () => {
    setSelectedAgent(null)
  }

  const handleOrganizationSelect = async (orgId: string | 'all' | 'contributors') => {
    setSelectedOrganization(orgId)

    // 特定の組織が選択され、まだ読み込まれていない場合は読み込む
    if (orgId !== 'all' && orgId !== 'contributors') {
      await loadOrganizationAgents(orgId)
    }
  }

  // Use the contributor modal hook
  const { ContributorModal, openModal } = useContributorModal()

  // Use the organization modal hook
  const {
    OrganizationModal,
    openModal: openOrganizationModal,
    openDeleteModal: openDeleteOrganizationModal
  } = useOrganizationModal()

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <div>
          {/* タイトル行と組織セレクター */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold dark:text-white">{t('title')}</h1>
            <OrganizationSelector
              selectedOrganization={selectedOrganization}
              organizations={organizations}
              onSelectOrganization={handleOrganizationSelect}
              onAddOrganization={() => openOrganizationModal()}
              onEditOrganization={(org) => openOrganizationModal(org)}
              onDeleteOrganization={(org) => openDeleteOrganizationModal(org)}
            />
          </div>

          {/* 説明行 */}
          <div className="flex items-center">
            <p className="text-gray-600 dark:text-gray-400">{t('description')}</p>
            <div className="relative ml-2 group">
              <BsQuestionCircle
                className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                onClick={openModal}
              />
              <div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs
                            font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100
                            transition-opacity duration-300 whitespace-nowrap pointer-events-none"
              >
                {t('contributor.tooltip')}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-6">
        <div className="relative max-w-lg">
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
      </div>

      {allTags.length > 0 && (
        <div className="mb-6">
          <TagFilter tags={allTags} selectedTags={selectedTags} onSelectTag={handleTagToggle} />
        </div>
      )}

      <AgentList
        agents={agents}
        onSelectAgent={handleSelectAgent}
        onTagClick={handleTagToggle}
        isLoading={isLoading}
      />

      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={handleCloseModal}
          onAddToMyAgents={addSelectedAgentToMyAgents}
        />
      )}

      {/* Contributor Modal */}
      <ContributorModal />

      {/* Organization Modal */}
      <OrganizationModal />
    </div>
  )
}
