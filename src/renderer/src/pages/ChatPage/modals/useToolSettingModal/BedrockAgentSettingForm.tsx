import { BedrockAgent } from '@/types/agent'
import { memo, useState } from 'react'

interface BedrockAgentSettingFormProps {
  bedrockAgents: BedrockAgent[]
  setBedrockAgents: (agents: BedrockAgent[]) => void
}

export const BedrockAgentSettingForm = memo(
  ({ bedrockAgents, setBedrockAgents }: BedrockAgentSettingFormProps) => {
    const [newAgentId, setNewAgentId] = useState('')
    const [newAliasId, setNewAliasId] = useState('')
    const [newDescription, setNewDescription] = useState('')

    const handleAddAgent = () => {
      if (newAgentId.trim() && newAliasId.trim() && newDescription.trim()) {
        setBedrockAgents([
          ...bedrockAgents,
          {
            agentId: newAgentId.trim(),
            aliasId: newAliasId.trim(),
            description: newDescription.trim()
          }
        ])
        setNewAgentId('')
        setNewAliasId('')
        setNewDescription('')
      }
    }

    const handleRemoveAgent = (agentId: string) => {
      setBedrockAgents(bedrockAgents.filter((agent) => agent.agentId !== agentId))
    }

    return (
      <div className="mt-4 space-y-4">
        {/* Agent 追加フォーム */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-grow">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Agent ID
              </label>
              <input
                type="text"
                value={newAgentId}
                onChange={(e) => setNewAgentId(e.target.value)}
                placeholder="e.g., VREKDPSXYP"
                className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div className="flex-grow">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Alias ID
              </label>
              <input
                type="text"
                value={newAliasId}
                onChange={(e) => setNewAliasId(e.target.value)}
                placeholder="e.g., ZHSSM0WPXS"
                className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g., Agent for processing customer inquiries"
              className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>
          <button
            onClick={handleAddAgent}
            disabled={!newAgentId.trim() || !newAliasId.trim() || !newDescription.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Agent
          </button>
        </div>

        {/* 登録済み Agent リスト */}
        <div className="space-y-2">
          {bedrockAgents.map((agent) => (
            <div
              key={agent.agentId + '_' + agent.aliasId}
              className="flex flex-col p-3 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded"
            >
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 w-full">
                  <span className="font-mono">Agent ID: {agent.agentId}</span>
                  <span className="font-mono">Alias ID: {agent.aliasId}</span>
                </div>
                <button
                  onClick={() => handleRemoveAgent(agent.agentId)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{agent.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

BedrockAgentSettingForm.displayName = 'BedrockAgentSettingForm'
