import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'
import useSetting from '@renderer/hooks/useSetting'
import { isMcpTool } from '@/types/tools'
import { ToolInfoModal } from './components/ToolInfoModal'
import { AvailableToolsTab } from './components/AvailableToolsTab'
import { ToolDetailsTab } from './components/DetailsTab'
import { useToolsState } from './hooks/useToolsState'
import { useMcpToolsIntegration } from './hooks/useMcpToolsIntegration'
import { useToolsFormatter } from './hooks/useToolsFormatter'
import { ToolsSectionProps } from './types'
import { preventEventPropagation } from './utils/eventUtils'

/**
 * ToolsSection メインコンテナコンポーネント
 */
export const ToolsSection: React.FC<ToolsSectionProps> = ({
  tools: initialTools,
  onChange,
  agentCategory: initialCategory = 'general',
  onCategoryChange,
  knowledgeBases = [],
  onKnowledgeBasesChange,
  allowedCommands = [],
  onAllowedCommandsChange,
  bedrockAgents = [],
  onBedrockAgentsChange,
  flows = [],
  onFlowsChange,
  mcpServers = [],
  tempMcpTools = [],
  isLoadingMcpTools = false
}) => {
  const { t } = useTranslation()
  const { getDefaultToolsForCategory } = useSetting()
  const { getAgentMcpTools, selectedAgentId } = useSettings()

  // フォーマット関数
  const { getToolDescription, getMcpServerInfo } = useToolsFormatter(mcpServers)

  // メイン状態管理
  const {
    agentTools,
    activeTab,
    toolInfoToShow,
    expandedTools,
    setActiveTab,
    setToolInfoToShow,
    handleToggleTool,
    toggleToolExpand,
    getEnabledTools,
    categorizedTools,
    getToolsWithConfigurations
  } = useToolsState(
    initialTools,
    initialCategory,
    mcpServers,
    [],
    onChange,
    onCategoryChange,
    getDefaultToolsForCategory
  )

  // MCPツール統合ロジック
  useMcpToolsIntegration(
    agentTools,
    mcpServers,
    tempMcpTools,
    selectedAgentId,
    getAgentMcpTools,
    onChange
  )

  // ツール詳細設定に必要な設定
  const enabledTools = getEnabledTools()
  const needSettingToolsLength = enabledTools.filter((tool) => {
    return (
      tool.toolSpec?.name === 'retrieve' ||
      tool.toolSpec?.name === 'invokeBedrockAgent' ||
      tool.toolSpec?.name === 'executeCommand' ||
      tool.toolSpec?.name === 'invokeFlow'
    )
  }).length
  const toolsWithConfigurations = getToolsWithConfigurations(t)

  return (
    <div
      className="space-y-4"
      onClick={preventEventPropagation}
      onMouseUp={(e) => {
        // ブラウザによってはmouseupイベントもハンドリングする必要がある
        e.stopPropagation()
      }}
    >
      {/* ツール情報モーダル */}
      {toolInfoToShow && (
        <ToolInfoModal
          toolName={toolInfoToShow}
          toolDescription={getToolDescription(toolInfoToShow)}
          mcpServerInfo={getMcpServerInfo(toolInfoToShow)}
          isMcp={toolInfoToShow ? isMcpTool(toolInfoToShow) : false}
          onClose={() => setToolInfoToShow(null)}
        />
      )}

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'available-tools'
                  ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={(e) => {
                preventEventPropagation(e)
                setActiveTab('available-tools')
              }}
            >
              {t('Available Tools')}
            </button>
          </li>
          <li>
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                activeTab === 'tool-detail-settings'
                  ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={(e) => {
                preventEventPropagation(e)
                setActiveTab('tool-detail-settings')
              }}
            >
              {t('Tool Detail Settings')}
              {needSettingToolsLength > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 ml-2 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">
                  {needSettingToolsLength}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Available Tools タブ */}
      {activeTab === 'available-tools' && (
        <AvailableToolsTab
          categorizedTools={categorizedTools()}
          mcpServers={mcpServers}
          onToggleTool={handleToggleTool}
          onShowToolInfo={(toolName: string) => setToolInfoToShow(toolName)}
          isLoadingMcpTools={isLoadingMcpTools}
        />
      )}

      {/* Tool Detail Settings タブ */}
      {activeTab === 'tool-detail-settings' && (
        <ToolDetailsTab
          enabledTools={enabledTools}
          expandedTools={expandedTools}
          toggleToolExpand={toggleToolExpand}
          toolsWithConfigurations={toolsWithConfigurations}
          knowledgeBases={knowledgeBases}
          onKnowledgeBasesChange={
            onKnowledgeBasesChange || (() => console.warn('onKnowledgeBasesChange not provided'))
          }
          allowedCommands={allowedCommands}
          onAllowedCommandsChange={
            onAllowedCommandsChange || (() => console.warn('onAllowedCommandsChange not provided'))
          }
          bedrockAgents={bedrockAgents}
          onBedrockAgentsChange={
            onBedrockAgentsChange || (() => console.warn('onBedrockAgentsChange not provided'))
          }
          flows={flows}
          onFlowsChange={onFlowsChange || (() => console.warn('onFlowsChange not provided'))}
        />
      )}
    </div>
  )
}
