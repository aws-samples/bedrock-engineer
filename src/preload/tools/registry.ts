/**
 * Tool registry for managing and executing tools
 */

import { ToolInput, ToolResult, isMcpTool, getOriginalMcpToolName } from '../../types/tools'
import { ITool, ToolCategory, ToolRegistration, ToolDependencies } from './base/types'
import { ToolNotFoundError, isToolError } from './base/errors'
import { toolSystemLogger } from './common/Logger'

/**
 * Registry for managing tools
 */
export class ToolRegistry {
  private tools: Map<string, ToolRegistration> = new Map()
  private categories: Map<ToolCategory, Set<string>> = new Map()
  private dependencies: ToolDependencies

  constructor(dependencies: ToolDependencies) {
    this.dependencies = dependencies
    this.initializeCategories()
  }

  /**
   * Initialize category sets
   */
  private initializeCategories(): void {
    const categories: ToolCategory[] = [
      'filesystem',
      'bedrock',
      'web',
      'command',
      'thinking',
      'mcp'
    ]
    categories.forEach((category) => {
      this.categories.set(category, new Set())
    })
  }

  /**
   * Register a tool
   */
  register(tool: ITool, category: ToolCategory): void {
    const registration: ToolRegistration = { tool, category }

    // Register in main registry
    this.tools.set(tool.name, registration)

    // Register in category
    const categorySet = this.categories.get(category)
    if (categorySet) {
      categorySet.add(tool.name)
    }

    toolSystemLogger.info(`Registered tool: ${tool.name}`, {
      category,
      description: tool.description
    })
  }

  /**
   * Register multiple tools at once
   */
  registerMany(registrations: Array<{ tool: ITool; category: ToolCategory }>): void {
    registrations.forEach(({ tool, category }) => {
      this.register(tool, category)
    })
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    const registration = this.tools.get(toolName)
    if (!registration) {
      return false
    }

    // Remove from main registry
    this.tools.delete(toolName)

    // Remove from category
    const categorySet = this.categories.get(registration.category)
    if (categorySet) {
      categorySet.delete(toolName)
    }

    toolSystemLogger.info(`Unregistered tool: ${toolName}`)
    return true
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): ITool | undefined {
    const registration = this.tools.get(name)
    return registration?.tool
  }

  /**
   * Get all tools in a category
   */
  getToolsByCategory(category: ToolCategory): ITool[] {
    const toolNames = this.categories.get(category)
    if (!toolNames) {
      return []
    }

    return Array.from(toolNames)
      .map((name) => this.getTool(name))
      .filter((tool): tool is ITool => tool !== undefined)
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Array<{ name: string; category: ToolCategory; description: string }> {
    return Array.from(this.tools.entries()).map(([name, registration]) => ({
      name,
      category: registration.category,
      description: registration.tool.description
    }))
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Execute a tool
   */
  async execute(input: ToolInput): Promise<string | ToolResult> {
    const toolName = this.resolveToolName(input.type)

    toolSystemLogger.info(`Executing tool: ${toolName}`, {
      originalType: input.type,
      isMcp: isMcpTool(input.type)
    })

    try {
      // Special handling for MCP tools
      if (isMcpTool(input.type)) {
        const mcpTool = this.getTool('mcp')
        if (!mcpTool) {
          throw new ToolNotFoundError('MCP adapter not registered')
        }

        // Pass the original MCP tool name in the input
        const mcpInput = {
          ...input,
          mcpToolName: getOriginalMcpToolName(input.type)
        }

        return await mcpTool.execute(mcpInput)
      }

      // Regular tool execution
      const tool = this.getTool(toolName)
      if (!tool) {
        throw new ToolNotFoundError(toolName)
      }

      return await tool.execute(input)
    } catch (error) {
      // Log the error
      toolSystemLogger.error(`Tool execution failed: ${toolName}`, {
        error: error instanceof Error ? error.message : String(error),
        errorType: error?.constructor?.name
      })

      // Re-throw tool errors as-is
      if (isToolError(error)) {
        throw error
      }

      // Re-throw Error instances
      if (error instanceof Error) {
        throw error
      }

      // Throw unknown errors as strings
      throw String(error)
    }
  }

  /**
   * Resolve tool name from input type
   */
  private resolveToolName(type: string): string {
    // Check if it's an MCP tool
    if (isMcpTool(type)) {
      return 'mcp'
    }

    return type
  }

  /**
   * Get tool statistics
   */
  getStatistics(): {
    totalTools: number
    toolsByCategory: Record<ToolCategory, number>
  } {
    const toolsByCategory: Record<string, number> = {}

    this.categories.forEach((tools, category) => {
      toolsByCategory[category] = tools.size
    })

    return {
      totalTools: this.tools.size,
      toolsByCategory: toolsByCategory as Record<ToolCategory, number>
    }
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear()
    this.categories.forEach((set) => set.clear())
    toolSystemLogger.info('Cleared all registered tools')
  }

  /**
   * Create a tool instance with dependencies
   */
  createToolInstance<T extends ITool>(ToolClass: new (dependencies: ToolDependencies) => T): T {
    return new ToolClass(this.dependencies)
  }

  /**
   * Batch register tools with a factory function
   */
  registerWithFactory<T extends ITool>(
    factory: (dependencies: ToolDependencies) => Array<{ tool: T; category: ToolCategory }>
  ): void {
    const registrations = factory(this.dependencies)
    registrations.forEach(({ tool, category }) => {
      this.register(tool, category)
    })
  }

  /**
   * Get tool names by pattern
   */
  findTools(pattern: string | RegExp): string[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern

    return Array.from(this.tools.keys()).filter((name) => regex.test(name))
  }

  /**
   * Export registry state for debugging
   */
  exportState(): {
    tools: Array<{ name: string; category: ToolCategory; description: string }>
    categories: Record<ToolCategory, string[]>
  } {
    const tools = this.getAllTools()
    const categories: Record<string, string[]> = {}

    this.categories.forEach((toolSet, category) => {
      categories[category] = Array.from(toolSet)
    })

    return {
      tools,
      categories: categories as Record<ToolCategory, string[]>
    }
  }
}

/**
 * Create a new tool registry instance
 */
export function createToolRegistry(dependencies: ToolDependencies): ToolRegistry {
  return new ToolRegistry(dependencies)
}
