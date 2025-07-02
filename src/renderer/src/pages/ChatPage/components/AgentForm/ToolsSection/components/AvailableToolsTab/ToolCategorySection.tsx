import React from 'react'
import { useTranslation } from 'react-i18next'
import { isMcpTool, getOriginalMcpToolName } from '@/types/tools'
import { ToolItem } from './ToolItem'
import { ToolCategorySectionProps } from '../../types'

/**
 * ツールカテゴリセクションコンポーネント
 */
export const ToolCategorySection: React.FC<ToolCategorySectionProps> = ({
  category,
  mcpServers = [],
  onToggleTool,
  onShowToolInfo,
  isLoadingMcpTools = false
}) => {
  const { t } = useTranslation()

  // MCPツール用のサーバー情報を取得
  const getServerInfoForTool = (toolName: string): string => {
    if (!isMcpTool(toolName) || !mcpServers || mcpServers.length === 0) return ''

    const serverName = getOriginalMcpToolName(toolName)?.split('.')[0]
    const server = mcpServers.find((s) => s.name === serverName)

    return server
      ? `${t('From')}: ${server.name} (${server.description || 'MCP Server'})`
      : `${t('From')}: ${serverName || 'Unknown server'}`
  }

  return (
    <div key={category.id} className="mb-4">
      {/* カテゴリヘッダー */}
      <div className="p-3 bg-gray-100 dark:bg-gray-800/50 font-medium sticky top-0 z-10 rounded-t-md border border-gray-200 dark:border-gray-700/50">
        <div className="text-sm text-gray-800 dark:text-gray-200">
          {t(`Tool Categories.${category.name}`)}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {t(`Tool Categories.${category.name} Description`)}
        </div>
      </div>

      {/* MCPカテゴリの状態に応じたメッセージ表示 */}
      {category.id === 'mcp' && (
        <>
          {isLoadingMcpTools ? (
            // MCPツール取得中のローディング表示
            <div className="p-3 mt-2 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center">
                <div className="w-5 h-5 mr-2 border-t-2 border-r-2 border-gray-500 rounded-full animate-spin"></div>
                <span className="font-medium">{t('MCPサーバーからツールを取得中...')}</span>
              </div>
            </div>
          ) : category.hasMcpServers === false ? (
            // サーバーが設定されていない場合の警告表示
            <div className="p-3 mt-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-md">
              <div className="flex items-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-medium">{t('Warning')}</span>
              </div>
              <p className="text-sm ml-7">
                {t(
                  'No MCP servers configured for this agent. Configure MCP servers in the MCP Servers tab to use MCP tools.'
                )}
              </p>
            </div>
          ) : category.toolsData.length === 0 ? (
            // サーバーがあってもツールがなければ情報表示
            <div className="p-3 mt-2 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700/50">
              <div className="flex items-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{t('Information')}</span>
              </div>
              <p className="text-sm ml-7">
                {t(
                  'MCP servers are configured, but no tools are available. Make sure MCP servers are running and providing tools.'
                )}
              </p>
              <div className="mt-2 ml-7 text-xs">
                <p className="font-medium mb-1">{t('Configured MCP Servers')}:</p>
                <ul className="list-disc pl-4">
                  {mcpServers.map((server, idx) => (
                    <li key={idx}>
                      <span className="font-mono">{server.name}</span>
                      {server.description && <span className="ml-1">({server.description})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            category.toolsData.length > 0 && (
              // サーバーとツールが両方ある場合は情報バナー表示
              <div className="p-3 mt-2 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 rounded-md">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {t('MCP tools available from configured servers')} ({category.toolsData.length})
                  </span>
                </div>
                <div className="mt-2 ml-7 text-sm flex items-center">
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300 font-medium mr-2">
                    {t('Note')}
                  </span>
                  <span>{t('MCP tools are always enabled and cannot be disabled')}</span>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* ツールリスト */}
      {category.toolsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
          {category.toolsData.map((tool) => {
            const toolName = tool.toolSpec?.name
            if (!toolName) return null

            const isToolMcp = isMcpTool(toolName)
            const serverInfo = isToolMcp ? getServerInfoForTool(toolName) : undefined

            return (
              <ToolItem
                key={toolName}
                tool={tool}
                isMcp={isToolMcp}
                serverInfo={serverInfo}
                onToggle={onToggleTool}
                onShowInfo={onShowToolInfo}
              />
            )
          })}
        </div>
      ) : (
        <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
          {t('No tools in this category')}
        </div>
      )}
    </div>
  )
}
