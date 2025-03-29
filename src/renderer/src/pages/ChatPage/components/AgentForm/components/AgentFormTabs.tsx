import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiSettings, FiServer, FiTool } from 'react-icons/fi'
import { formEventUtils } from '../utils/formEventUtils'

// タブ識別子の型定義
type AgentFormTabId = 'basic' | 'mcp-servers' | 'tools'

/**
 * タブナビゲーションコンポーネント
 */
export const AgentFormTabs: React.FC<{
  activeTab: AgentFormTabId
  onTabChange: (tabId: AgentFormTabId) => void
  onToolsTabClick: (mcpServers?: any) => Promise<void>
}> = ({ activeTab, onTabChange, onToolsTabClick }) => {
  const { t } = useTranslation()

  // タブ切り替えハンドラー
  const handleToolsTabClick = async (e: React.MouseEvent) => {
    formEventUtils.preventPropagation(e)
    onTabChange('tools' as AgentFormTabId)
    await onToolsTabClick()
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <ul className="flex flex-wrap -mb-px" onClick={formEventUtils.preventPropagation}>
        <li className="mr-2">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 p-4 border-b-2 rounded-t-lg ${
              activeTab === 'basic'
                ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
            }`}
            onClick={formEventUtils.createSafeHandler(() => onTabChange('basic' as AgentFormTabId))}
          >
            <FiSettings className="w-4 h-4" />
            {t('Basic Settings')}
          </button>
        </li>
        <li className="mr-2">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 p-4 border-b-2 rounded-t-lg ${
              activeTab === 'mcp-servers'
                ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
            }`}
            onClick={formEventUtils.createSafeHandler(() =>
              onTabChange('mcp-servers' as AgentFormTabId)
            )}
          >
            <FiServer className="w-4 h-4" />
            {t('MCP Servers')}
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 p-4 border-b-2 rounded-t-lg ${
              activeTab === 'tools'
                ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
            }`}
            onClick={handleToolsTabClick}
          >
            <FiTool className="w-4 h-4" />
            {t('Tools')}
          </button>
        </li>
      </ul>
    </div>
  )
}
