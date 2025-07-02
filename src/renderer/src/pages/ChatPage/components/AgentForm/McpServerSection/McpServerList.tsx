import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'
import { FiZap } from 'react-icons/fi'
import { ServerListItem } from './ServerListItem'
import { ConnectionTestResults } from './ConnectionTestResults'
import { preventModalClose } from './utils/eventUtils'

interface McpServerListProps {
  mcpServers: McpServerConfig[]
  onEdit: (serverName: string) => void
  onDelete: (serverName: string) => void
  testingConnection: string | null
  testingAll: boolean
  connectionResults: Record<string, any>
  testServerConnection: (serverName: string) => Promise<void>
  testAllConnections: () => Promise<void>
  clearConnectionResults: () => void
}

/**
 * MCPサーバーリストを表示するコンポーネント
 */
export const McpServerList: React.FC<McpServerListProps> = ({
  mcpServers,
  onEdit,
  onDelete,
  testingConnection,
  testingAll,
  connectionResults,
  testServerConnection,
  testAllConnections,
  clearConnectionResults
}) => {
  const { t } = useTranslation()

  if (mcpServers.length === 0) {
    return (
      <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        <p className="text-gray-500 dark:text-gray-400">{t('No MCP servers configured yet')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {t('Registered MCP Servers')}
        </h4>

        {/* 全サーバーテストボタン */}
        {mcpServers.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              testAllConnections()
            }}
            disabled={testingAll || testingConnection !== null}
            className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 flex items-center gap-1 disabled:opacity-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40"
          >
            {testingAll ? (
              <div className="w-3 h-3 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-1"></div>
            ) : (
              <FiZap className="w-3 h-3 mr-1" />
            )}
            {testingAll ? t('Testing...') : t('Test All Servers')}
          </button>
        )}
      </div>

      {/* テスト結果の概要表示 */}
      <ConnectionTestResults
        connectionResults={connectionResults}
        mcpServers={mcpServers}
        onClearResults={clearConnectionResults}
      />

      {/* サーバーリスト */}
      <div
        className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700"
        onClick={preventModalClose}
      >
        {mcpServers.map((server) => (
          <ServerListItem
            key={server.name}
            server={server}
            onEdit={onEdit}
            onDelete={onDelete}
            testServerConnection={testServerConnection}
            testingConnection={testingConnection}
            connectionResult={connectionResults[server.name]}
          />
        ))}
      </div>
    </div>
  )
}
