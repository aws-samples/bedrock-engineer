import { ToolState } from '@/types/agent-chat'
import { isMcpTool } from '@/types/tools'
import { McpServerConfig } from '@/types/agent-chat'
import { CategorizedToolData } from '../types'
import { TOOL_CATEGORIES } from './toolCategories'

/**
 * 特定のツール名が有効化されているか確認する関数
 */
export const isToolEnabled = (tools: ToolState[], toolName: string): boolean => {
  return tools.some((tool) => tool.toolSpec?.name === toolName && tool.enabled)
}

/**
 * ツール一覧からMCPツールのみを抽出する
 */
export const extractMcpTools = (tools: ToolState[]): ToolState[] => {
  return tools.filter((tool) => {
    const toolName = tool.toolSpec?.name
    return toolName ? isMcpTool(toolName) : false
  })
}

/**
 * ツール一覧からMCPツール以外のツールを抽出する
 */
export const extractNonMcpTools = (tools: ToolState[]): ToolState[] => {
  return tools.filter((tool) => {
    const toolName = tool.toolSpec?.name
    return !toolName || !isMcpTool(toolName)
  })
}

/**
 * ツールをカテゴリごとに分類する
 */
export const categorizeTools = (
  tools: ToolState[],
  mcpServers?: McpServerConfig[]
): CategorizedToolData[] => {
  // MCPサーバー設定の有無を確認
  const hasMcpServers = mcpServers && mcpServers.length > 0

  // MCPサーバーがない場合は、MCPカテゴリを結果から除外するフィルタを適用
  const filteredCategories = TOOL_CATEGORIES.filter((category) => {
    // MCPカテゴリの場合、サーバーがない場合は除外
    if (category.id === 'mcp') {
      return hasMcpServers
    }
    // 他のカテゴリは常に含める
    return true
  })

  // MCPツールを抽出
  const mcpTools = extractMcpTools(tools)

  return filteredCategories.map((category) => {
    // MCP カテゴリの場合は特別処理
    if (category.id === 'mcp') {
      return {
        ...category,
        toolsData: mcpTools,
        hasMcpServers, // MCPサーバーがあるかどうかのフラグ
        mcpServersInfo: mcpServers // サーバー情報も含める
      }
    }

    // 通常のツールカテゴリの場合
    // MCPツールは除外するが、他のすべての標準ツールはカテゴリに含める
    const toolsInCategory =
      tools?.filter((tool) => {
        const toolName = tool.toolSpec?.name
        if (!toolName) return false
        // MCPツールは除外し、カテゴリに含まれるツールを表示
        return category.tools.includes(toolName) && !isMcpTool(toolName)
      }) || []

    return {
      ...category,
      toolsData: toolsInCategory
    }
  })
}
