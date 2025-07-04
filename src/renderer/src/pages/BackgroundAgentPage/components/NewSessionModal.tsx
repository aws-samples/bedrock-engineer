import React, { useState } from 'react'
import { FiX } from 'react-icons/fi'
import { ModelSelector } from '../../ChatPage/components/ModelSelector'
import { Agent } from '@/types/agent-chat'
import { TbRobot } from 'react-icons/tb'
import { AGENT_ICONS } from '@renderer/components/icons/AgentIcons'
import useSetting from '@renderer/hooks/useSetting'

interface NewSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateSession: (config: { modelId: string; agentId: string; systemPrompt: string }) => void
  agents: readonly Agent[]
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  onCreateSession,
  agents
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const { currentLLM } = useSetting()

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // エージェントが選択されていない場合はエラー
    if (!selectedAgentId) {
      alert('エージェントを選択してください。')
      return
    }

    // 現在選択されているモデルIDを取得
    const modelId = currentLLM?.modelId || 'anthropic.claude-3-haiku-20240307-v1:0'

    // エージェントのシステムプロンプトを使用
    const systemPrompt = selectedAgent?.system || 'You are a helpful assistant.'

    onCreateSession({
      modelId,
      agentId: selectedAgentId,
      systemPrompt
    })

    // リセット
    setSelectedAgentId(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            新規セッション作成
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* モデル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              モデル選択
            </label>
            <ModelSelector openable={true} />
          </div>

          {/* エージェント選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              エージェント選択
            </label>
            <div className="relative">
              <select
                value={selectedAgentId || ''}
                onChange={(e) => setSelectedAgentId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none"
              >
                <option value="">エージェントなし</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 選択されたエージェントの詳細表示 */}
            {selectedAgent && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  {selectedAgent.icon ? (
                    React.cloneElement(
                      (AGENT_ICONS.find((opt) => opt.value === selectedAgent.icon)
                        ?.icon as React.ReactElement) ?? AGENT_ICONS[0].icon,
                      {
                        className: 'w-4 h-4',
                        style: selectedAgent.iconColor
                          ? { color: selectedAgent.iconColor }
                          : undefined
                      }
                    )
                  ) : (
                    <TbRobot className="w-4 h-4" />
                  )}
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {selectedAgent.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedAgent.description}
                </p>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
