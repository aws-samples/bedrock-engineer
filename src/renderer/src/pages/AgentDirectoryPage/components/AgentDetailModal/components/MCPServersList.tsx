import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'

interface MCPServersListProps {
  servers: McpServerConfig[]
}

export const MCPServersList: React.FC<MCPServersListProps> = ({ servers }) => {
  const { t } = useTranslation()

  if (!servers || servers.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2 dark:text-white">{t('mcpServersLabel')}</h3>
      <div className="space-y-3">
        {servers.map((server, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h4 className="font-medium text-sm dark:text-white mb-2">{server.name}</h4>
            {server.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{server.description}</p>
            )}
            <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono dark:text-gray-200">
              {server.connectionType === 'url' || server.url ? (
                <>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">URL:</span> {server.url}
                  </div>
                  {server.headers && Object.keys(server.headers).length > 0 && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-400">Headers:</span>{' '}
                      {Object.keys(server.headers).join(', ')}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span className="text-blue-600 dark:text-blue-400">Command:</span>{' '}
                    {server.command}
                  </div>
                  {server.args && server.args.length > 0 && (
                    <div>
                      <span className="text-blue-600 dark:text-blue-400">Args:</span>{' '}
                      {server.args.join(' ')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
