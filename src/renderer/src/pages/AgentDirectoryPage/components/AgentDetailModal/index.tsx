import React from 'react'
import { Modal, Button } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { CustomAgent } from '@/types/agent-chat'
import { BsCheck2Circle } from 'react-icons/bs'
import { RiCloseLine } from 'react-icons/ri'
import { useAgentDetailModal } from './useAgentDetailModal'
import { AgentHeader } from './components/AgentHeader'
import { AgentMetadata } from './components/AgentMetadata'
import { SystemPromptSection } from './components/SystemPromptSection'
import { MCPServersList } from './components/MCPServersList'
import { ToolsList } from './components/ToolsList'
import { ScenariosList } from './components/ScenariosList'

interface AgentDetailModalProps {
  agent: CustomAgent
  onClose: () => void
  onAddToMyAgents?: () => void
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onAddToMyAgents
}) => {
  const { t } = useTranslation()
  const { isAdding, addSuccess, handleAddToMyAgents } = useAgentDetailModal({
    onAddToMyAgents,
    onClose
  })

  return (
    <Modal dismissible show={true} onClose={onClose} size="7xl" className="dark:bg-gray-900">
      <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
        {/* Header */}
        <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-800 rounded-t-lg p-6">
          <AgentHeader
            name={agent.name}
            description={agent.description}
            icon={agent.icon}
            iconColor={agent.iconColor}
          />
        </Modal.Header>

        {/* Body - Two Column Layout */}
        <Modal.Body className="p-0 bg-white dark:bg-gray-800 max-h-[calc(85vh-200px)]">
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <SystemPromptSection systemPrompt={agent.system} />
                <AgentMetadata author={agent.author} tags={agent.tags} />
              </div>

              {/* Right Column */}
              <div className="space-y-6 lg:max-h-[calc(85vh-200px)] lg:overflow-y-auto lg:pr-2">
                <MCPServersList servers={agent.mcpServers || []} />
                <ToolsList tools={agent.tools || []} />
                <ScenariosList scenarios={agent.scenarios || []} />
              </div>
            </div>
          </div>
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700/50 dark:bg-gray-800 rounded-b-lg">
          <div className="flex justify-end gap-3 w-full">
            <Button color="gray" onClick={onClose}>
              {t('close')}
            </Button>

            {onAddToMyAgents && (
              <Button
                color={addSuccess ? 'success' : 'blue'}
                onClick={handleAddToMyAgents}
                disabled={isAdding || addSuccess !== null}
              >
                {isAdding ? (
                  t('loading')
                ) : addSuccess !== null ? (
                  <div className="flex items-center">
                    {addSuccess ? (
                      <BsCheck2Circle className="mr-2" />
                    ) : (
                      <RiCloseLine className="mr-2" />
                    )}
                    {addSuccess ? t('agentAddedSuccess') : t('agentAddedError')}
                  </div>
                ) : (
                  t('addToMyAgents')
                )}
              </Button>
            )}
          </div>
        </Modal.Footer>
      </div>
    </Modal>
  )
}
