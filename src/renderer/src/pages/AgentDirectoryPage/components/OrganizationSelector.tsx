import React from 'react'
import { Dropdown } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { HiOfficeBuilding, HiChevronDown, HiPlus, HiPencil, HiTrash } from 'react-icons/hi'
import { BsGlobeAmericas } from 'react-icons/bs'
import { HiUserGroup } from 'react-icons/hi2'

import { OrganizationConfig } from '@/types/agent-chat'

interface OrganizationSelectorProps {
  selectedOrganization: string | 'all' | 'contributors'
  organizations: OrganizationConfig[]
  onSelectOrganization: (orgId: string | 'all' | 'contributors') => void
  onAddOrganization: () => void
  onEditOrganization: (org: OrganizationConfig) => void
  onDeleteOrganization: (org: OrganizationConfig) => void
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  selectedOrganization,
  organizations,
  onSelectOrganization,
  onAddOrganization,
  onEditOrganization,
  onDeleteOrganization
}) => {
  const { t } = useTranslation()

  const getDisplayName = (orgId: string | 'all' | 'contributors'): string => {
    switch (orgId) {
      case 'all':
        return t('allAgents', 'All Agents')
      case 'contributors':
        return t('contributors', 'Contributors')
      default: {
        const org = organizations.find((o) => o.id === orgId)
        return org?.name || 'Unknown Organization'
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        label=""
        dismissOnClick={true}
        renderTrigger={() => (
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium
                            text-gray-700 dark:text-gray-300
                            border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                            rounded-lg transition-colors duration-200"
          >
            <HiOfficeBuilding className="w-4 h-4" />
            <span>{getDisplayName(selectedOrganization)}</span>
            <HiChevronDown className="w-3 h-3" />
          </button>
        )}
      >
        {/* すべて */}
        <Dropdown.Item
          onClick={() => onSelectOrganization('all')}
          className={`${selectedOrganization === 'all' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <div className="flex items-center">
            <BsGlobeAmericas className="w-4 h-4 mr-2" />
            {t('allAgents', 'All Agents')}
          </div>
        </Dropdown.Item>

        {/* コントリビューター */}
        <Dropdown.Item
          onClick={() => onSelectOrganization('contributors')}
          className={`${selectedOrganization === 'contributors' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        >
          <div className="flex items-center">
            <HiUserGroup className="w-4 h-4 mr-2" />
            {t('contributors', 'Contributors')}
          </div>
        </Dropdown.Item>

        {organizations.length > 0 && <Dropdown.Divider />}

        {/* 組織一覧 */}
        {organizations.map((org) => (
          <Dropdown.Item
            key={org.id}
            onClick={() => onSelectOrganization(org.id)}
            className={`group ${selectedOrganization === org.id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center min-w-0 flex-1">
                <HiOfficeBuilding className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{org.name}</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {/* 編集ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditOrganization(org)
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title={t('organization.editOrganization')}
                >
                  <HiPencil className="w-3 h-3" />
                </button>
                {/* 削除ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteOrganization(org)
                  }}
                  className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                  title={t('organization.deleteOrganization')}
                >
                  <HiTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          </Dropdown.Item>
        ))}

        <Dropdown.Divider />

        {/* 新しい組織を追加 */}
        <Dropdown.Item onClick={onAddOrganization}>
          <div className="flex items-center">
            <HiPlus className="w-4 h-4 mr-2" />
            {t('addOrganization', 'Add Organization')}
          </div>
        </Dropdown.Item>
      </Dropdown>
    </div>
  )
}
