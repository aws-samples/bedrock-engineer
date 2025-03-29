import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BedrockAgent } from '@/types/agent'
import { BedrockAgentsContentProps } from '../../types'
import { preventEventPropagation } from '../../utils/eventUtils'

// BedrockAgentフォーム用の内部型定義
interface BedrockAgentForm {
  agentId: string
  agentAliasId: string // UIではagentAliasIdとして表示
  description: string
}

/**
 * Bedrock Agents 設定コンポーネント
 */
export const BedrockAgentsContent: React.FC<BedrockAgentsContentProps> = ({
  agents = [],
  onChange
}) => {
  const { t } = useTranslation()
  const [newAgentId, setNewAgentId] = useState('')
  const [newAgentAliasId, setNewAgentAliasId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editMode, setEditMode] = useState<string | null>(null)
  const [editData, setEditData] = useState<BedrockAgentForm>({
    agentId: '',
    agentAliasId: '',
    description: ''
  })

  const handleAddBedrockAgent = () => {
    if (newAgentId.trim() && newAgentAliasId.trim() && newDescription.trim()) {
      onChange([
        ...agents,
        {
          agentId: newAgentId.trim(),
          aliasId: newAgentAliasId.trim(), // BedrockAgent型に合わせてaliasIdとして保存
          description: newDescription.trim()
        }
      ])
      setNewAgentId('')
      setNewAgentAliasId('')
      setNewDescription('')
    }
  }

  const handleRemoveBedrockAgent = (agentId: string) => {
    onChange(agents.filter((agent) => agent.agentId !== agentId))
  }

  const handleEditBedrockAgent = (agent: BedrockAgent) => {
    setEditMode(agent.agentId)
    // BedrockAgent型からBedrockAgentForm型に変換
    setEditData({
      agentId: agent.agentId,
      agentAliasId: agent.aliasId, // aliasId -> agentAliasId
      description: agent.description
    })
  }

  const handleSaveEdit = () => {
    if (editData.agentId.trim() && editData.agentAliasId.trim() && editData.description.trim()) {
      // 保存時にBedrockAgentForm -> BedrockAgent型に変換
      onChange(
        agents.map((agent) =>
          agent.agentId === editMode
            ? {
                agentId: editData.agentId.trim(),
                aliasId: editData.agentAliasId.trim(), // agentAliasId -> aliasId
                description: editData.description.trim()
              }
            : agent
        )
      )
      setEditMode(null)
      setEditData({
        agentId: '',
        agentAliasId: '',
        description: ''
      })
    }
  }

  const handleCancelEdit = () => {
    setEditMode(null)
    setEditData({
      agentId: '',
      agentAliasId: '',
      description: ''
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('Configure which Bedrock Agents this agent can invoke.')}
      </p>

      {/* Bedrock Agent 追加フォーム */}
      <div className="flex flex-col gap-2 mt-4">
        <h4 className="font-medium text-sm mb-2">{t('Add New Bedrock Agent')}</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Agent ID')}
          </label>
          <input
            type="text"
            value={newAgentId}
            onChange={(e) => setNewAgentId(e.target.value)}
            placeholder="e.g., 1234abcd"
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div className="mt-2">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Agent Alias ID')}
          </label>
          <input
            type="text"
            value={newAgentAliasId}
            onChange={(e) => setNewAgentAliasId(e.target.value)}
            placeholder="e.g., 5678efgh"
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>
        <div className="mt-2">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Description')}
          </label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="e.g., Customer support agent"
            rows={2}
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
          />
        </div>
        <button
          onClick={(e) => {
            preventEventPropagation(e)
            handleAddBedrockAgent()
          }}
          disabled={!newAgentId.trim() || !newAgentAliasId.trim() || !newDescription.trim()}
          className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2 w-fit"
        >
          {t('Add Bedrock Agent')}
        </button>
      </div>

      {/* 登録済み Bedrock Agent リスト */}
      <div className="space-y-3 mt-6">
        <h4 className="font-medium text-sm">{t('Available Bedrock Agents')}</h4>
        <div className="grid grid-cols-1 gap-2">
          {agents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('No Bedrock Agents registered yet')}
            </p>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.agentId}
                className="flex flex-col p-3 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
              >
                {editMode === agent.agentId ? (
                  // 編集モード
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('Agent ID')}
                      </label>
                      <input
                        type="text"
                        value={editData.agentId}
                        onChange={(e) => setEditData({ ...editData, agentId: e.target.value })}
                        className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('Agent Alias ID')}
                      </label>
                      <input
                        type="text"
                        value={editData.agentAliasId}
                        onChange={(e) => setEditData({ ...editData, agentAliasId: e.target.value })}
                        className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      />
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('Description')}
                      </label>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={2}
                        className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          preventEventPropagation(e)
                          handleCancelEdit()
                        }}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {t('Cancel')}
                      </button>
                      <button
                        onClick={(e) => {
                          preventEventPropagation(e)
                          handleSaveEdit()
                        }}
                        disabled={
                          !editData.agentId.trim() ||
                          !editData.agentAliasId.trim() ||
                          !editData.description.trim()
                        }
                        className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {t('Save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{agent.description}</span>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                          <div>
                            <span className="font-mono">Agent ID:</span> {agent.agentId}
                          </div>
                          <div>
                            <span className="font-mono">Alias ID:</span> {agent.aliasId}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            preventEventPropagation(e)
                            handleEditBedrockAgent(agent)
                          }}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          title={t('Edit')}
                          aria-label={t('Edit Bedrock Agent')}
                        >
                          <span className="sr-only">{t('Edit')}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            preventEventPropagation(e)
                            handleRemoveBedrockAgent(agent.agentId)
                          }}
                          className="text-red-500 hover:text-red-600 p-1"
                          title={t('Remove')}
                          aria-label={t('Remove Bedrock Agent')}
                        >
                          <span className="sr-only">{t('Remove')}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
