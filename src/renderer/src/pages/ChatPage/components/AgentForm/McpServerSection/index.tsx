import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'
import { McpServerList } from './McpServerList'
import { McpServerForm } from './McpServerForm'
import { useMcpServerState } from './hooks/useMcpServerState'
import { preventModalClose } from './utils/eventUtils'
import { generateEditJson } from './utils/mcpServerUtils'

interface McpServerSectionProps {
  mcpServers: McpServerConfig[]
  onChange: (mcpServers: McpServerConfig[]) => void
}

/**
 * MCPサーバー設定セクションのメインコンポーネント
 */
export const McpServerSection: React.FC<McpServerSectionProps> = ({ mcpServers, onChange }) => {
  const { t } = useTranslation()

  // カスタムフックを使用して状態を管理
  const {
    // フォーム関連
    jsonInput,
    setJsonInput,
    jsonError,
    setJsonError,
    editMode,
    setEditMode,

    // 接続テスト関連
    testingConnection,
    testingAll,
    connectionResults,
    testServerConnection,
    testAllConnections,
    clearConnectionResults,

    // その他
    autoTestOnAdd,
    handleDelete
  } = useMcpServerState(mcpServers, onChange)

  // 編集モードに切り替え
  const handleEdit = (serverName: string) => {
    const serverToEdit = mcpServers.find((server) => server.name === serverName)
    if (serverToEdit) {
      setJsonInput(generateEditJson(serverToEdit))
      setEditMode(serverName)
    }
  }

  return (
    <div className="space-y-4" onClick={preventModalClose}>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        {t('MCP Server Settings')}
      </h3>

      <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-md mb-4 border border-gray-200 dark:border-gray-700/50">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('Configure MCP servers for this agent to use MCP tools.')}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {t(
            'Register MCP servers first, then you can enable MCP tools in the Available Tools tab.'
          )}
        </p>
      </div>

      {/* サーバーリスト */}
      <McpServerList
        mcpServers={mcpServers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        testingConnection={testingConnection}
        testingAll={testingAll}
        connectionResults={connectionResults}
        testServerConnection={testServerConnection}
        testAllConnections={testAllConnections}
        clearConnectionResults={clearConnectionResults}
      />

      {/* サーバー追加/編集フォーム */}
      <McpServerForm
        mcpServers={mcpServers}
        onChange={onChange}
        jsonInput={jsonInput}
        setJsonInput={setJsonInput}
        jsonError={jsonError}
        setJsonError={setJsonError}
        editMode={editMode}
        setEditMode={setEditMode}
        autoTestOnAdd={autoTestOnAdd}
        testServerConnection={testServerConnection}
      />
    </div>
  )
}
