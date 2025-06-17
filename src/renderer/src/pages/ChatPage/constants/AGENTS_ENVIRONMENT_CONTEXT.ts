import { ToolState, EnvironmentContextSettings } from '@/types/agent-chat'
import { isMcpTool } from '@/types/tools'

export const BASIC_ENVIRONMENT_CONTEXT = `**<context>**

- working directory: {{projectPath}}
- date: {{date}}

**</context>**
`

const TODO_LIST_INSTRUCTION = `
**<todo list handling rule>**

If you expect the work will take a long time, create the following file to create a work plan and TODO list, and refer to and update it as you work. Be sure to write in detail so that you can start the same work again if the AI agent's session is interrupted.

{{projectPath}}/.bedrock-engineer/{{TASK_NAME}}_TODO.md

**</todo list handling rule>**`

const PROJECT_RULE = `
**<project rule>**

- If there are files under {{projectPath}}/.bedrock-engineer/rules, make sure to load them before working on them.
  This folder contains project-specific rules.

**</project rule>**
`

const VISUAL_EXPRESSION_RULES = `
**<visual expression rule>**

If you are acting as a voice chat, please ignore this illustration rule.

- Create Mermaid.js diagrams for visual explanations (maximum 2 per response unless specified)
- Ask user permission before generating images with Stable Diffusion
- Display images using Markdown syntax: \`![image-name](url)\`
  - (example) \`![img]({{projectPath}}/generated_image.png)\`
  - (example) \`![img]({{projectPath}}/workspaces/workspace-20250529-session_1748509562336_4xe58p/generated_image.png)\`
  - Do not start with file://. Start with /.
- Use KaTeX format for mathematical formulas
- For web applications, source images from Pexels or user-specified sources

**</visual expression rule>**`

/**
 * Get tool usage description by name using preload API
 */
const getToolUsageDescription = (toolName: string): string => {
  // Access preload API through window.api
  if (typeof window !== 'undefined' && window.api?.tools?.getToolUsageDescription) {
    return window.api.tools.getToolUsageDescription(toolName)
  }

  // Fallback if API is not available
  return 'External tool with specific functionality.\nRefer to tool documentation for usage.'
}

/**
 * エージェントのツール設定に基づいて動的なツールルールを生成する関数
 */
const TOOL_RULES = (enabledTools: ToolState[]): string => {
  if (
    !enabledTools ||
    enabledTools.length === 0 ||
    enabledTools.filter((tool) => tool.enabled).length === 0
  ) {
    return `
**<tool usage rules>**
No tools are currently enabled for this agent.
**</tool usage rules>**`
  }

  // 有効なツールのみをフィルタ
  const activeTools = enabledTools.filter((tool) => tool.enabled)

  let rulesContent = '\n**<tool usage rules>**\n'
  rulesContent += 'Available tools and their usage:\n\n'

  // ツールをMCPツールと組み込みツールに分離
  const builtInTools: ToolState[] = []
  const mcpTools: ToolState[] = []

  activeTools.forEach((tool) => {
    const toolName = tool.toolSpec?.name || 'unknown'
    if (isMcpTool(toolName)) {
      mcpTools.push(tool)
    } else {
      builtInTools.push(tool)
    }
  })

  // 組み込みツールの説明を個別に生成
  builtInTools.forEach((tool) => {
    const toolName = tool.toolSpec?.name || 'unknown'
    const displayName = toolName
    const description = getToolUsageDescription(toolName)

    rulesContent += `**${displayName}**\n${description}\n\n`
  })

  // MCPツールをまとめて1つのブロックで表示
  if (mcpTools.length > 0) {
    const mcpToolNames = mcpTools.map((tool) => tool.toolSpec?.name || 'unknown')
    rulesContent += `**MCP Tools**\n`
    rulesContent += `Available MCP tools: ${mcpToolNames.join(', ')}\n`
    rulesContent += `External tools with specific functionality.\n`
    rulesContent += `Refer to tool documentation for usage.\n\n`
  }

  rulesContent += 'General guidelines:\n'
  rulesContent += '- Use tools one at a time and wait for results\n'
  rulesContent += '- Always use absolute paths starting from {{projectPath}}\n'
  rulesContent += '- Request permission for destructive operations\n'
  rulesContent += '- Handle errors gracefully with clear explanations\n\n'

  rulesContent += '**</tool usage rules>**'

  return rulesContent
}

/**
 * 環境コンテキストを生成する関数
 * ツールの配列ではなくToolStateの配列を受け取るように変更
 * エージェント固有の環境コンテキスト設定に基づいて条件分岐
 */
export const getEnvironmentContext = (
  enabledTools: ToolState[] = [],
  contextSettings?: EnvironmentContextSettings
) => {
  // デフォルト設定（すべて有効）
  const defaultSettings: EnvironmentContextSettings = {
    todoListInstruction: true,
    projectRule: true,
    visualExpressionRules: true
  }

  // 設定が指定されていない場合はデフォルト設定を使用
  const settings = contextSettings || defaultSettings

  let context = BASIC_ENVIRONMENT_CONTEXT

  // 各コンテキストを設定に基づいて追加
  if (settings.projectRule) {
    context += `\n${PROJECT_RULE}`
  }

  if (settings.visualExpressionRules) {
    context += `\n${VISUAL_EXPRESSION_RULES}`
  }

  if (settings.todoListInstruction) {
    context += `\n${TODO_LIST_INSTRUCTION}`
  }

  // ツールルールは常に追加
  context += `\n${TOOL_RULES(enabledTools)}`

  return context
}
