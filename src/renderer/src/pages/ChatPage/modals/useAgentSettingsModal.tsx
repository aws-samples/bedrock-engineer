import React, { useState } from 'react'
import { CustomAgent } from '@/types/agent-chat'
import useSetting from '@renderer/hooks/useSetting'
import { useTranslation } from 'react-i18next'
import { Modal } from 'flowbite-react'
import { AgentForm } from '../components/AgentForm/AgentForm'
import { AgentList } from '../components/AgentList'
import toast from 'react-hot-toast'
import { FiInfo } from 'react-icons/fi'

export const useAgentSettingsModal = () => {
  const [show, setShow] = useState(false)

  const handleOpen = () => setShow(true)
  const handleClose = () => setShow(false)

  return {
    show,
    handleOpen,
    handleClose,
    AgentSettingsModal: AgentSettingsModal
  }
}

interface AgentSettingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAgentId?: string
  onSelectAgent?: (agentId: string) => void
}

const AgentSettingsModal = React.memo(
  ({ isOpen, onClose, selectedAgentId, onSelectAgent }: AgentSettingModalProps) => {
    const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null)
    const { customAgents, saveCustomAgents, agents, loadSharedAgents } = useSetting()
    const { t } = useTranslation()

    const handleSaveAgent = (agent: CustomAgent) => {
      console.log('handleSaveAgent called with agent:', agent)

      // 必須フィールドの検証
      if (!agent.name || !agent.name.trim()) {
        toast.error(t('Agent name is required'))
        return
      }

      if (!agent.description || !agent.description.trim()) {
        toast.error(t('Agent description is required'))
        return
      }

      try {
        // MCPサーバー情報を確認
        console.log('MCP Servers to save:', agent.mcpServers || [])

        // 最終的なエージェントデータ（MCPサーバー情報を明示的に含む）
        const finalAgentData: CustomAgent = {
          ...agent,
          // mcpServersが未定義または空配列の場合は明示的に空配列を設定
          mcpServers: agent.mcpServers || []
        }

        const updatedAgents = editingAgent?.id
          ? customAgents.map((a) => (a.id === agent.id ? finalAgentData : a))
          : [...customAgents, finalAgentData]

        console.log('Saving agent data:', finalAgentData)
        console.log('Updated agents list:', updatedAgents)

        saveCustomAgents(updatedAgents)
        toast.success(t('Agent saved successfully'))
        setEditingAgent(null)
        onClose()
      } catch (error) {
        console.error('Error saving agent:', error)
        toast.error(t('Failed to save agent'))
      }
    }

    const handleDeleteAgent = (id: string) => {
      const updatedAgents = customAgents.filter((agent) => agent.id !== id)
      saveCustomAgents(updatedAgents)
    }

    const handleDuplicateAgent = (agent: CustomAgent) => {
      const newAgent = {
        ...agent,
        id: crypto.randomUUID(),
        name: `${agent.name} (${t('copy')})`
      }
      saveCustomAgents([...customAgents, newAgent])
    }

    const handleSelectAgent = (agentId: string) => {
      if (onSelectAgent) {
        onSelectAgent(agentId)
        onClose()
      }
    }

    // Handler to save agent as a shared file
    const handleSaveAsShared = async (agent: CustomAgent) => {
      try {
        const result = await window.file.saveSharedAgent(agent)
        if (result.success) {
          // Show success notification or toast here if needed
          console.log('Agent saved as shared file:', result.filePath)

          // Load the updated shared agents to refresh the list in the UI
          await loadSharedAgents()

          // Show success message
          toast.success(t('agentSavedAsShared'), {
            duration: 5000
          })
        } else {
          console.error('Failed to save agent as shared file:', result.error)
          toast.error(result.error || t('failedToSaveShared'))
        }
      } catch (error) {
        console.error('Error saving shared agent:', error)
        toast.error(t('failedToSaveShared'))
      }
    }

    return (
      <Modal
        dismissible
        show={isOpen}
        onClose={() => {
          setEditingAgent(null)
          onClose()
        }}
        size="8xl"
        onClick={(e) => {
          // モーダル自体のクリックイベントは伝播させない
          e.stopPropagation()
        }}
      >
        <Modal.Header className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingAgent ? t('editAgent') : t('customAgents')}
            </h3>
          </div>
        </Modal.Header>
        <Modal.Body
          className="p-6"
          onClick={(e) => {
            // モーダルボディのクリックイベントは伝播させない
            e.stopPropagation()
          }}
        >
          <InfoPanel />
          <div className="space-y-6 min-h-[1100px]">
            {editingAgent ? (
              <AgentForm
                agent={editingAgent}
                onSave={handleSaveAgent}
                onCancel={() => setEditingAgent(null)}
              />
            ) : (
              <AgentList
                agents={agents}
                selectedAgentId={selectedAgentId}
                onSelectAgent={handleSelectAgent}
                onAddNewAgent={() => setEditingAgent({} as CustomAgent)}
                onEditAgent={setEditingAgent}
                onDuplicateAgent={handleDuplicateAgent}
                onDeleteAgent={handleDeleteAgent}
                onSaveAsShared={handleSaveAsShared}
              />
            )}
          </div>
        </Modal.Body>
      </Modal>
    )
  }
)

AgentSettingsModal.displayName = 'AgentSettingsModal'

// 情報パネルコンポーネント
const InfoPanel = () => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const togglePanel = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="mb-4">
      <div
        className="flex items-center cursor-pointer text-blue-600 dark:text-blue-400 hover:underline mb-2"
        onClick={togglePanel}
      >
        <FiInfo className="mr-1" />
        <span className="text-sm font-medium">{t('agentSettings.infoTitle')}</span>
      </div>

      {isExpanded && (
        <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700 transition-all duration-300">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('agentSettings.description')}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            {t('agentSettings.sharedAgentsDescription')}
          </p>
        </div>
      )}
    </div>
  )
}
