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
 * TODOツールの仮想ツール状態を作成する
 */
export const createVirtualTodoTool = (tools: ToolState[]): ToolState => {
  // todoInit と todoUpdate の状態をチェック
  const todoInitTool = tools.find((tool) => tool.toolSpec?.name === 'todoInit')
  const todoUpdateTool = tools.find((tool) => tool.toolSpec?.name === 'todoUpdate')

  // 両方とも有効な場合のみ todo ツールを有効とする
  const isEnabled = todoInitTool?.enabled && todoUpdateTool?.enabled

  return {
    toolSpec: {
      name: 'todo',
      description: 'Task management and workflow tracking',
      inputSchema: undefined // 仮想ツールなので未定義
    },
    enabled: isEnabled || false
  }
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
    const toolsInCategory: ToolState[] = []

    category.tools.forEach((toolName) => {
      // TODO仮想ツールの特別処理
      if (toolName === 'todo') {
        const virtualTodoTool = createVirtualTodoTool(tools)
        toolsInCategory.push(virtualTodoTool)
        return
      }

      // 通常のツール処理
      const tool = tools?.find((t) => t.toolSpec?.name === toolName && !isMcpTool(toolName))
      if (tool) {
        toolsInCategory.push(tool)
      } else {
        // ツールが見つからない場合は、デフォルトの無効状態で追加
        // これによりカテゴリに定義されたすべてのツールが表示される
        const standardToolSpecs = window.api?.tools?.getToolSpecs() || []
        const toolSpec = standardToolSpecs.find((spec) => spec.toolSpec?.name === toolName)
        if (toolSpec?.toolSpec) {
          toolsInCategory.push({
            toolSpec: toolSpec.toolSpec,
            enabled: false
          })
        }
      }
    })

    return {
      ...category,
      toolsData: toolsInCategory
    }
  })
}
