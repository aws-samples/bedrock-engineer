import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'
import { ConnectionTestResult } from './types/mcpServer.types'
import { FiEdit, FiTrash2, FiZap } from 'react-icons/fi'
import { preventModalClose } from './utils/eventUtils'

interface ServerListItemProps {
  server: McpServerConfig
  onEdit: (serverName: string) => void
  onDelete: (serverName: string) => void
  testServerConnection: (serverName: string) => Promise<void>
  testingConnection: string | null
  connectionResult?: ConnectionTestResult
}

/**
 * 個別のサーバー項目を表示するコンポーネント
 */
export const ServerListItem: React.FC<ServerListItemProps> = ({
  server,
  onEdit,
  onDelete,
  testServerConnection,
  testingConnection,
  connectionResult
}) => {
  const { t } = useTranslation()

  return (
    <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={preventModalClose}>
      {/* サーバー情報表示 */}
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-medium text-sm flex items-center text-gray-900 dark:text-gray-100">
            {server.name}
            {testingConnection === server.name && (
              <div className="ml-2 w-3 h-3 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
            )}
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">{server.description}</p>
          <p className="text-xs font-mono text-gray-600 dark:text-gray-300 mt-1">
            <code className="text-gray-600 dark:text-gray-300">
              {server.command} {server.args.join(' ')}
            </code>
          </p>

          {/* 接続テスト結果表示 */}
          {connectionResult && (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                connectionResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <div
                className={`font-medium mb-1 flex items-center ${
                  connectionResult.success
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 mr-1 rounded-full ${
                    connectionResult.success ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                {connectionResult.success ? t('Connection Successful') : t('Connection Failed')}
                <span className="ml-2 font-normal text-gray-500">
                  {new Date(connectionResult.testedAt).toLocaleTimeString()}
                </span>
              </div>

              {connectionResult.success ? (
                // 成功時の詳細表示
                <div>
                  <div className="text-green-700 dark:text-green-400">
                    {connectionResult.details?.toolCount || 0} {t('tools available')}
                  </div>
                  {connectionResult.details?.startupTime !== undefined && (
                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                      {t('Startup time')}: {connectionResult.details?.startupTime}ms
                    </div>
                  )}
                </div>
              ) : (
                // 失敗時の詳細表示
                <div>
                  <div className="text-red-700 dark:text-red-400">
                    {connectionResult.details?.error}
                  </div>
                  {connectionResult.details?.errorDetails && (
                    <div className="mt-1 text-gray-700 dark:text-gray-300 p-1 bg-gray-100 dark:bg-gray-800 rounded">
                      <strong>{t('Solution')}:</strong> {connectionResult.details?.errorDetails}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2">
          {/* テストボタン */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              testServerConnection(server.name)
            }}
            disabled={testingConnection !== null}
            className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50"
            title={t('Test Connection')}
          >
            <FiZap size={18} />
          </button>

          {/* 編集ボタン */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(server.name)
            }}
            className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            title={t('Edit Server')}
          >
            <FiEdit size={18} />
          </button>

          {/* 削除ボタン */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(server.name)
            }}
            className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            title={t('Delete Server')}
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
