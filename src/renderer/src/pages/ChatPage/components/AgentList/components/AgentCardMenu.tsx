import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { FiMoreVertical } from 'react-icons/fi'
import { Dropdown } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { AgentCardActions } from '../types/agent-card'

interface AgentCardMenuProps {
  agent: CustomAgent
  isCustomAgent: boolean
  actions: AgentCardActions
  size?: 'sm' | 'md'
}

export const AgentCardMenu: React.FC<AgentCardMenuProps> = ({
  agent,
  isCustomAgent,
  actions,
  size = 'md'
}) => {
  const { t } = useTranslation()
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const buttonPadding = size === 'sm' ? 'p-1' : 'p-1.5'

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown
        label=""
        dismissOnClick={true}
        renderTrigger={() => (
          <button
            className={`${buttonPadding} text-gray-600 hover:text-gray-900 dark:text-gray-400
              dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
          >
            <FiMoreVertical className={iconSize} />
          </button>
        )}
      >
        {isCustomAgent && !agent.isShared && actions.onEdit && (
          <Dropdown.Item onClick={() => actions.onEdit?.(agent)} className="w-48">
            {t('edit')}
          </Dropdown.Item>
        )}
        {actions.onDuplicate && (
          <Dropdown.Item onClick={() => actions.onDuplicate?.(agent)} className="w-48">
            {t('duplicate')}
          </Dropdown.Item>
        )}
        {actions.onConvertToStrands && (
          <Dropdown.Item onClick={() => actions.onConvertToStrands?.(agent.id!)} className="w-48">
            {t('convertToStrands')}
          </Dropdown.Item>
        )}
        {!agent.isShared && actions.onSaveAsShared && (
          <Dropdown.Item onClick={() => actions.onSaveAsShared?.(agent)} className="w-48">
            {t('saveAsShared')}
          </Dropdown.Item>
        )}
        {isCustomAgent && !agent.isShared && actions.onShareToOrganization && (
          <Dropdown.Item onClick={() => actions.onShareToOrganization?.(agent)} className="w-48">
            {t('shareToOrganization')}
          </Dropdown.Item>
        )}
        {isCustomAgent && !agent.isShared && actions.onDelete && (
          <Dropdown.Item
            onClick={() => actions.onDelete?.(agent.id!)}
            className="text-red-600 dark:text-red-400 w-48"
          >
            {t('delete')}
          </Dropdown.Item>
        )}
      </Dropdown>
    </div>
  )
}
