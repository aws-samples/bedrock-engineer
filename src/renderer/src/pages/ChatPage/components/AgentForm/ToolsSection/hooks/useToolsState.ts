import { useState, useEffect, useCallback } from 'react'
import { ToolState, AgentCategory, McpServerConfig } from '@/types/agent-chat'
import { isMcpTool } from '@/types/tools'
import { isToolEnabled, categorizeTools } from '../utils/toolFilters'
import { CategorizedToolData } from '../types'

/**
 * ToolsSection コンポーネントの主要な状態管理を担当するカスタムフック
 */
export function useToolsState(
  initialTools: ToolState[],
  initialCategory: AgentCategory = 'general',
  mcpServers: McpServerConfig[] = [],
  _agentMcpTools: ToolState[] = [],
  onChange: (tools: ToolState[]) => void,
  _onCategoryChange?: (category: AgentCategory) => void,
  _getDefaultToolsForCategory?: (category: string) => ToolState[]
) {
  // 基本状態
  const [agentTools, setAgentTools] = useState<ToolState[]>(initialTools || [])
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [activeTab, setActiveTab] = useState<string>('available-tools')
  const [toolInfoToShow, setToolInfoToShow] = useState<string | null>(null)

  // ツール設定の展開状態
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})

  // initialTools が変更されたら同期
  useEffect(() => {
    if (initialTools?.length > 0) {
      setAgentTools(initialTools)
    }
  }, [initialTools])

  // ツール設定変更ハンドラ
  const handleToggleTool = useCallback(
    (toolName: string) => {
      // MCP ツールの場合は常に有効なので変更しない
      if (isMcpTool(toolName)) {
        return
      }

      // TODO仮想ツールの特別処理
      if (toolName === 'todo') {
        const standardToolSpecs = window.api?.tools?.getToolSpecs() || []

        // 現在の状態をチェック（両方とも有効な場合はtrue）
        const todoInitTool = agentTools.find((tool) => tool.toolSpec?.name === 'todoInit')
        const todoUpdateTool = agentTools.find((tool) => tool.toolSpec?.name === 'todoUpdate')
        const isCurrentlyEnabled = todoInitTool?.enabled && todoUpdateTool?.enabled
        const newEnabled = !isCurrentlyEnabled

        const updatedTools = [...agentTools]
        const TODO_TOOLS_GROUP = ['todoInit', 'todoUpdate']

        TODO_TOOLS_GROUP.forEach((todoToolName) => {
          const existingToolIndex = updatedTools.findIndex(
            (tool) => tool.toolSpec?.name === todoToolName
          )

          if (existingToolIndex !== -1) {
            // 既存のツールを更新
            updatedTools[existingToolIndex] = {
              ...updatedTools[existingToolIndex],
              enabled: newEnabled
            }
          } else {
            // 新しいツールを追加
            const toolSpec = standardToolSpecs.find((spec) => spec.toolSpec?.name === todoToolName)
            if (toolSpec?.toolSpec) {
              updatedTools.push({
                toolSpec: toolSpec.toolSpec,
                enabled: newEnabled
              })
            }
          }
        })

        setAgentTools(updatedTools)
        onChange(updatedTools)
        return
      }

      // 通常のツール処理
      const updatedTools = agentTools.map((tool) => {
        if (tool.toolSpec?.name === toolName) {
          return { ...tool, enabled: !tool.enabled }
        }
        return tool
      })
      setAgentTools(updatedTools)
      onChange(updatedTools)
    },
    [agentTools, onChange]
  )

  // 各カテゴリのツールを取得する
  const categorizedTools = useCallback((): CategorizedToolData[] => {
    return categorizeTools(agentTools, mcpServers)
  }, [agentTools, mcpServers])

  // ツールの展開状態を切り替える
  const toggleToolExpand = useCallback((toolName: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolName]: !prev[toolName]
    }))
  }, [])

  // 有効なツールのみを取得
  const getEnabledTools = useCallback(() => {
    return agentTools.filter((tool) => tool.enabled && tool.toolSpec?.name)
  }, [agentTools])

  // 特定のツール名が有効化されているか確認する関数
  const checkToolEnabled = useCallback(
    (toolName: string) => isToolEnabled(agentTools, toolName),
    [agentTools]
  )

  // ツール設定が必要なツールのリスト
  const getToolsWithConfigurations = useCallback(
    (t: (key: string) => string) => {
      return {
        retrieve: {
          title: t('Knowledge Base Settings'),
          isEnabled: checkToolEnabled('retrieve'),
          description: t('Configure knowledge bases for the retrieve tool')
        },
        executeCommand: {
          title: t('Command Settings'),
          isEnabled: checkToolEnabled('executeCommand'),
          description: t('Configure allowed commands for the executeCommand tool')
        },
        invokeBedrockAgent: {
          title: t('Bedrock Agent Settings'),
          isEnabled: checkToolEnabled('invokeBedrockAgent'),
          description: t('Configure Bedrock Agents for the invokeBedrockAgent tool')
        },
        invokeFlow: {
          title: t('Flow Settings'),
          isEnabled: checkToolEnabled('invokeFlow'),
          description: t('Configure Bedrock Flows for the invokeFlow tool')
        }
      }
    },
    [checkToolEnabled]
  )

  return {
    // 状態
    agentTools,
    selectedCategory,
    activeTab,
    toolInfoToShow,
    expandedTools,

    // 状態更新関数
    setAgentTools,
    setSelectedCategory,
    setActiveTab,
    setToolInfoToShow,
    setExpandedTools,

    // ハンドラーと計算値
    handleToggleTool,
    toggleToolExpand,
    getEnabledTools,
    categorizedTools,
    checkToolEnabled,
    getToolsWithConfigurations
  }
}
