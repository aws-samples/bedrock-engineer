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
  agentMcpTools: ToolState[] = [],
  onChange: (tools: ToolState[]) => void,
  onCategoryChange?: (category: AgentCategory) => void,
  getDefaultToolsForCategory?: (category: string) => ToolState[]
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

  // カテゴリー選択のハンドラ
  const handleCategoryChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newCategory = event.target.value
      setSelectedCategory(newCategory)

      if (!getDefaultToolsForCategory) {
        console.warn('getDefaultToolsForCategory is not provided')
        return
      }

      // カテゴリーに基づいたデフォルトツール設定をロード
      const defaultTools = getDefaultToolsForCategory(newCategory)

      // 最新のMCPツールを取得（信頼できるソースから直接取得）
      // 常に有効化されたMCPツールとして設定
      const mcpToolsWithState = agentMcpTools.map((tool) => ({
        ...tool,
        enabled: true
      }))

      // 標準ツールとMCPツールを統合
      const mergedTools = [...defaultTools, ...mcpToolsWithState]

      // 更新後のツール一覧をコンソールに出力（デバッグ用）
      console.log(
        'Category changed:',
        newCategory,
        'Standard tools:',
        defaultTools.length,
        'MCP tools:',
        mcpToolsWithState.length,
        'Total:',
        mergedTools.length
      )

      setAgentTools(mergedTools)
      onChange(mergedTools)

      // 親コンポーネントのカテゴリ変更ハンドラがあれば呼び出す
      if (onCategoryChange && newCategory) {
        onCategoryChange(newCategory as AgentCategory)
      }
    },
    [getDefaultToolsForCategory, agentMcpTools, onChange, onCategoryChange]
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
    handleCategoryChange,
    toggleToolExpand,
    getEnabledTools,
    categorizedTools,
    checkToolEnabled,
    getToolsWithConfigurations
  }
}
