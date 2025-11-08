import React from 'react'
import { useTranslation } from 'react-i18next'
import { isMcpTool, getOriginalMcpToolName } from '@/types/tools'
import { ToolItem } from './ToolItem'
import { ToolCategorySectionProps } from '../../types'

/**
 * ツールカテゴリセクションコンポーネント
 */
// スケルトンカードコンポーネント
const ToolSkeletonCard: React.FC = () => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center mb-3">
      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg mr-3" />
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
  </div>
)

export const ToolCategorySection: React.FC<ToolCategorySectionProps> = ({
  category,
  mcpServers = [],
  onToggleTool,
  onShowToolInfo,
  isLoadingMcpTools = false,
  isLoadingAgentCoreTools = false
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
            // MCPツール取得中のスケルトン表示（バナーなし）
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
              {[...Array(3)].map((_, i) => (
                <ToolSkeletonCard key={`mcp-skeleton-${i}`} />
              ))}
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
          ) : null}
        </>
      )}

      {/* AgentCore Gatewayカテゴリの状態に応じたメッセージ表示 */}
      {category.id === 'agentcore' && (
        <>
          {isLoadingAgentCoreTools ? (
            // AgentCore Gatewayツール取得中のスケルトン表示（バナーなし）
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
              {[...Array(3)].map((_, i) => (
                <ToolSkeletonCard key={`agentcore-skeleton-${i}`} />
              ))}
            </div>
          ) : category.hasAgentCoreGateways === false ? (
            // Gatewayが設定されていない場合の警告表示
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
                  'No AgentCore Gateways configured for this agent. Configure gateways in the AgentCore Gateway tab to use gateway tools.'
                )}
              </p>
            </div>
          ) : category.toolsData.length === 0 ? (
            // Gatewayがあってもツールがなければ情報表示
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
                  'AgentCore Gateways are configured, but no tools are loaded. Click "Load Tools" button in the AgentCore Gateway tab.'
                )}
              </p>
            </div>
          ) : null}
        </>
      )}

      {/* ツールリスト */}
      {category.toolsData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
          {category.toolsData.map((tool) => {
            const toolName = tool.toolSpec?.name
            if (!toolName) return null

            const isToolMcp = isMcpTool(toolName)
            // AgentCoreカテゴリ内のツールは全てAgentCore Gatewayツール
            const isToolAgentCore = category.id === 'agentcore'
            const serverInfo = isToolMcp ? getServerInfoForTool(toolName) : undefined

            return (
              <ToolItem
                key={toolName}
                tool={tool}
                isMcp={isToolMcp}
                isAgentCore={isToolAgentCore}
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
