import React, { useEffect } from 'react'
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
  agentCoreGateways = [],
  tempMcpTools = [],
  tempAgentCoreGatewayTools = [],
  isLoadingMcpTools = false,
  isLoadingAgentCoreTools: _isLoadingAgentCoreTools = false
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
    setAgentTools: _setAgentTools,
    handleToggleTool,
    toggleToolExpand,
    getEnabledTools,
    categorizedTools,
    getToolsWithConfigurations
  } = useToolsState(
    initialTools,
    initialCategory,
    mcpServers,
    agentCoreGateways,
    tempAgentCoreGatewayTools || [],
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

  // AgentCore Gatewayツール統合ロジック（MCPと同様のパターン）
  const prevGatewayMergedToolsRef = React.useRef<string>('')
  const gatewayIntegrationDoneRef = React.useRef<boolean>(false)

  useEffect(() => {
    if (tempAgentCoreGatewayTools && tempAgentCoreGatewayTools.length > 0 && onChange) {
      // 既存のAgentCore Gatewayツール名のSetを作成
      const gatewayToolNames = new Set(
        tempAgentCoreGatewayTools.map((tool) => tool.toolSpec?.name).filter(Boolean)
      )

      // 既存のAgentCore Gatewayツールを除外（ツール名で判定）
      const nonAgentCoreTools = agentTools.filter((tool) => {
        const toolName = tool.toolSpec?.name
        return !toolName || !gatewayToolNames.has(toolName)
      })

      // 新しいAgentCore Gatewayツールと既存ツールを統合
      const mergedTools = [...nonAgentCoreTools, ...tempAgentCoreGatewayTools]

      // 前回と今回の結果を比較するための文字列化
      const mergedToolsKey = JSON.stringify(
        mergedTools.map((t) => ({
          name: t.toolSpec?.name,
          enabled: t.enabled
        }))
      )

      // 前回と異なる場合または初回の場合のみ更新
      if (
        mergedToolsKey !== prevGatewayMergedToolsRef.current ||
        !gatewayIntegrationDoneRef.current
      ) {
        console.log(
          'Integrating AgentCore Gateway tools into agent tools:',
          tempAgentCoreGatewayTools.length
        )

        // 最新の結果を保存
        prevGatewayMergedToolsRef.current = mergedToolsKey
        gatewayIntegrationDoneRef.current = true

        // 非同期で更新（無限ループ防止）
        setTimeout(() => {
          onChange(mergedTools)
        }, 0)
      } else {
        console.log('Skipping redundant AgentCore Gateway tools integration (no changes detected)')
      }
    }
  }, [tempAgentCoreGatewayTools, onChange])

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
      className="flex flex-col h-full"
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

      {/* タブナビゲーション - 固定 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
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

      {/* タブコンテンツ - スクロール可能 */}
      <div className="flex-1 overflow-y-auto">
        {/* Available Tools タブ */}
        {activeTab === 'available-tools' && (
          <AvailableToolsTab
            categorizedTools={categorizedTools()}
            mcpServers={mcpServers}
            onToggleTool={handleToggleTool}
            onShowToolInfo={(toolName: string) => setToolInfoToShow(toolName)}
            isLoadingMcpTools={isLoadingMcpTools}
            isLoadingAgentCoreTools={_isLoadingAgentCoreTools}
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
              onAllowedCommandsChange ||
              (() => console.warn('onAllowedCommandsChange not provided'))
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
    </div>
  )
}
