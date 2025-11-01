import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { FiMoreVertical } from 'react-icons/fi'
import { Dropdown } from 'flowbite-react'
import { useTranslation } from 'react-i18next'

interface AgentActionsDropdownProps {
  agent: CustomAgent
  onEdit?: (agent: CustomAgent) => void
  onDuplicate?: (agent: CustomAgent) => void
  onDelete?: (agentId: string) => void
  onSaveAsShared?: (agent: CustomAgent) => void
  onShareToOrganization?: (agent: CustomAgent) => void
  onConvertToStrands?: (agentId: string) => void
}

export const AgentActionsDropdown: React.FC<AgentActionsDropdownProps> = ({
  agent,
  onEdit,
  onDuplicate,
  onDelete,
  onSaveAsShared,
  onShareToOrganization,
  onConvertToStrands
}) => {
  const { t } = useTranslation()

  const isCustomAgent = agent.isCustom ?? true
  const isEditable = isCustomAgent && !agent.isShared

  // メニュー項目が1つもない場合は表示しない
  const hasAnyAction =
    (isEditable && onEdit) ||
    onDuplicate ||
    onConvertToStrands ||
    (!agent.isShared && onSaveAsShared) ||
    (isEditable && onShareToOrganization) ||
    (isEditable && onDelete)

  if (!hasAnyAction) {
    return null
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
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
        {isEditable && onEdit && (
          <Dropdown.Item onClick={() => onEdit(agent)} className="w-48">
            {t('edit')}
          </Dropdown.Item>
        )}
        {onDuplicate && (
          <Dropdown.Item onClick={() => onDuplicate(agent)} className="w-48">
            {t('duplicate')}
          </Dropdown.Item>
        )}
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
        {isEditable && onShareToOrganization && (
          <Dropdown.Item onClick={() => onShareToOrganization(agent)} className="w-48">
            {t('shareToOrganization')}
          </Dropdown.Item>
        )}
        {isEditable && onDelete && (
          <Dropdown.Item
            onClick={() => onDelete(agent.id!)}
            className="text-red-600 dark:text-red-400 w-48"
          >
            {t('delete')}
          </Dropdown.Item>
        )}
      </Dropdown>
    </div>
  )
}
