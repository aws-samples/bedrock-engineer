/**
 * System prompt builder utilities
 * Provides consistent system prompt and environment context formatting for both renderer and main processes
 */

import { ToolState } from '../../types/agent-chat'
import { isMcpTool } from '../../types/tools'
import { IToolDescriptionProvider } from './toolDescriptionProvider'

/**
 * Static class for building system prompts and environment contexts
 * Provides functional cohesion for all prompt-related generation functionality
 */
export class SystemPromptBuilder {
  /**
   * Generate tool usage rules based on enabled tools
   */
  private static async generateToolRules(
    enabledTools: ToolState[],
    descriptionProvider: IToolDescriptionProvider
  ): Promise<string> {
    if (
      !enabledTools ||
      enabledTools.length === 0 ||
      enabledTools.filter((tool) => tool.enabled).length === 0
    ) {
      return `**<tool usage rules>**No tools are currently enabled for this agent.**</tool usage rules>**`
    }

    // Filter active tools
    const activeTools = enabledTools.filter((tool) => tool.enabled)

    let rulesContent = '\n**<tool usage rules>**\n'
    rulesContent += 'Available tools and their usage:\n\n'

    // Separate tools into built-in and MCP categories
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

    // Add built-in tool descriptions individually
    for (const tool of builtInTools) {
      const toolName = tool.toolSpec?.name || 'unknown'
      const displayName = toolName
      const description = await descriptionProvider.getToolDescription(toolName)

      rulesContent += `**${displayName}**\n${description}\n\n`
    }

    // Add MCP tools as a grouped block
    if (mcpTools.length > 0) {
      const mcpToolNames = mcpTools.map((tool) => tool.toolSpec?.name || 'unknown')
      rulesContent += `**MCP Tools**\n`
      rulesContent += `Available MCP tools: ${mcpToolNames.join(', ')}\n`
      rulesContent += `External tools with specific functionality.\n`
      rulesContent += `Refer to tool documentation for usage.\n\n`
    }

    // Add general guidelines
    rulesContent += 'General guidelines:\n'
    rulesContent += '- Use tools one at a time and wait for results\n'
    rulesContent += '- Always use absolute paths starting from {{projectPath}}\n'
    rulesContent += '- Request permission for destructive operations\n'
    rulesContent += '- Handle errors gracefully with clear explanations\n\n'

    rulesContent += '**</tool usage rules>**'

    return rulesContent
  }

  /**
   * Generate basic environment context sections
   */
  private static generateBasicEnvironmentContext(): string {
    return `**<context>**

- working directory: {{projectPath}}
- date: {{date}}

**</context>**
`
  }

  /**
   * Generate TODO list instruction section
   */
  private static generateTodoListInstruction(): string {
    return `
**<todo list handling rule>**

If you expect the work will take a long time, create the following file to create a work plan and TODO list, and refer to and update it as you work. Be sure to write in detail so that you can start the same work again if the AI agent's session is interrupted.

{{projectPath}}/.bedrock-engineer/{{TASK_NAME}}_TODO.md

**</todo list handling rule>**`
  }

  /**
   * Generate project rule section
   */
  private static generateProjectRule(): string {
    return `
**<project rule>**

- If there are files under {{projectPath}}/.bedrock-engineer/rules, make sure to load them before working on them.
  This folder contains project-specific rules.

**</project rule>**
`
  }

  /**
   * Generate visual expression rules section
   */
  private static generateVisualExpressionRules(): string {
    return `
**<visual expression rule>**

If you are acting as a voice chat, please ignore this illustration rule.

- Create Mermaid.js diagrams for visual explanations (maximum 2 per response unless specified)
- If a complex diagram is required  please express it in draw.io xml format.
- Ask user permission before generating images with Stable Diffusion
- Display images using Markdown syntax: \`![image-name](url)\`
  - (example) \`![img]({{projectPath}}/generated_image.png)\`
  - (example) \`![img]({{projectPath}}/workspaces/workspace-20250529-session_1748509562336_4xe58p/generated_image.png)\`
  - Do not start with file://. Start with /.
- Use KaTeX format for mathematical formulas
- For web applications, source images from Pexels or user-specified sources

**</visual expression rule>**`
  }

  /**
   * Generate complete environment context with all sections
   */
  static async generateEnvironmentContext(
    enabledTools: ToolState[],
    descriptionProvider: IToolDescriptionProvider,
    contextSettings?: {
      todoListInstruction?: boolean
      projectRule?: boolean
      visualExpressionRules?: boolean
    }
  ): Promise<string> {
    // Default settings (all enabled)
    const defaultSettings = {
      todoListInstruction: true,
      projectRule: true,
      visualExpressionRules: true
    }

    const settings = contextSettings || defaultSettings

    let context = this.generateBasicEnvironmentContext()

    // Add optional context sections based on settings
    if (settings.projectRule) {
      context += this.generateProjectRule()
    }

    if (settings.visualExpressionRules) {
      context += this.generateVisualExpressionRules()
    }

    if (settings.todoListInstruction) {
      context += this.generateTodoListInstruction()
    }

    // Always add tool rules
    const toolRules = await this.generateToolRules(enabledTools, descriptionProvider)
    context += toolRules

    return context
  }
}
