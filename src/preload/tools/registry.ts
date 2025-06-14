/**
 * Tool registry for managing and executing tools
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ToolInput, ToolResult, isMcpTool, getOriginalMcpToolName } from '../../types/tools'
import { ITool, ToolCategory, ToolRegistration, ToolDependencies } from './base/types'
import { ToolNotFoundError, isToolError } from './base/errors'
import { toolSystemLogger } from './common/Logger'
import { CreateFolderTool } from './handlers/filesystem/CreateFolderTool'
import { WriteToFileTool } from './handlers/filesystem/WriteToFileTool'
import { ReadFilesTool } from './handlers/filesystem/ReadFilesTool'
import { ListFilesTool } from './handlers/filesystem/ListFilesTool'
import { ApplyDiffEditTool } from './handlers/filesystem/ApplyDiffEditTool'
import { MoveFileTool } from './handlers/filesystem/MoveFileTool'
import { CopyFileTool } from './handlers/filesystem/CopyFileTool'
import { TavilySearchTool } from './handlers/web/TavilySearchTool'
import { FetchWebsiteTool } from './handlers/web/FetchWebsiteTool'
import { GenerateImageTool } from './handlers/bedrock/GenerateImageTool'
import { GenerateVideoTool } from './handlers/bedrock/GenerateVideoTool'
import { CheckVideoStatusTool } from './handlers/bedrock/CheckVideoStatusTool'
import { DownloadVideoTool } from './handlers/bedrock/DownloadVideoTool'
import { RecognizeImageTool } from './handlers/bedrock/RecognizeImageTool'
import { RetrieveTool } from './handlers/bedrock/RetrieveTool'
import { InvokeBedrockAgentTool } from './handlers/bedrock/InvokeBedrockAgentTool'
import { InvokeFlowTool } from './handlers/bedrock/InvokeFlowTool'
import { ExecuteCommandTool } from './handlers/command/ExecuteCommandTool'
import { ThinkTool } from './handlers/thinking/ThinkTool'
import { CodeInterpreterTool } from './handlers/interpreter/CodeInterpreterTool'
import { ScreenCaptureTool } from './handlers/system/ScreenCaptureTool'
import { CameraCaptureTool } from './handlers/system/CameraCaptureTool'

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
      'mcp',
      'interpreter',
      'system'
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

/**
 * Static utility methods for tool metadata collection
 */
export class ToolMetadataCollector {
  /**
   * Collect tool specifications from tool classes
   */
  static getToolSpecs(): Tool[] {
    const specs: Tool[] = []

    // Add CreateFolderTool specification
    if (CreateFolderTool.toolSpec) {
      specs.push({ toolSpec: CreateFolderTool.toolSpec })
    }

    // Add WriteToFileTool specification
    if (WriteToFileTool.toolSpec) {
      specs.push({ toolSpec: WriteToFileTool.toolSpec })
    }

    // Add ReadFilesTool specification
    if (ReadFilesTool.toolSpec) {
      specs.push({ toolSpec: ReadFilesTool.toolSpec })
    }

    // Add ListFilesTool specification
    if (ListFilesTool.toolSpec) {
      specs.push({ toolSpec: ListFilesTool.toolSpec })
    }

    // Add ApplyDiffEditTool specification
    if (ApplyDiffEditTool.toolSpec) {
      specs.push({ toolSpec: ApplyDiffEditTool.toolSpec })
    }

    // Add MoveFileTool specification
    if (MoveFileTool.toolSpec) {
      specs.push({ toolSpec: MoveFileTool.toolSpec })
    }

    // Add CopyFileTool specification
    if (CopyFileTool.toolSpec) {
      specs.push({ toolSpec: CopyFileTool.toolSpec })
    }

    // Phase 2: Web Tools
    if (TavilySearchTool.toolSpec) {
      specs.push({ toolSpec: TavilySearchTool.toolSpec })
    }

    if (FetchWebsiteTool.toolSpec) {
      specs.push({ toolSpec: FetchWebsiteTool.toolSpec })
    }

    // Phase 3: Bedrock Tools
    if (GenerateImageTool.toolSpec) {
      specs.push({ toolSpec: GenerateImageTool.toolSpec })
    }

    if (GenerateVideoTool.toolSpec) {
      specs.push({ toolSpec: GenerateVideoTool.toolSpec })
    }

    if (CheckVideoStatusTool.toolSpec) {
      specs.push({ toolSpec: CheckVideoStatusTool.toolSpec })
    }

    if (DownloadVideoTool.toolSpec) {
      specs.push({ toolSpec: DownloadVideoTool.toolSpec })
    }

    if (RecognizeImageTool.toolSpec) {
      specs.push({ toolSpec: RecognizeImageTool.toolSpec })
    }

    if (RetrieveTool.toolSpec) {
      specs.push({ toolSpec: RetrieveTool.toolSpec })
    }

    if (InvokeBedrockAgentTool.toolSpec) {
      specs.push({ toolSpec: InvokeBedrockAgentTool.toolSpec })
    }

    if (InvokeFlowTool.toolSpec) {
      specs.push({ toolSpec: InvokeFlowTool.toolSpec })
    }

    // Phase 4: Command & Thinking Tools
    if (ExecuteCommandTool.toolSpec) {
      specs.push({ toolSpec: ExecuteCommandTool.toolSpec })
    }

    if (ThinkTool.toolSpec) {
      specs.push({ toolSpec: ThinkTool.toolSpec })
    }

    // Phase 5: Interpreter Tools
    if (CodeInterpreterTool.toolSpec) {
      specs.push({ toolSpec: CodeInterpreterTool.toolSpec })
    }

    // Phase 6: System Tools
    if (ScreenCaptureTool.toolSpec) {
      specs.push({ toolSpec: ScreenCaptureTool.toolSpec })
    }

    if (CameraCaptureTool.toolSpec) {
      specs.push({ toolSpec: CameraCaptureTool.toolSpec })
    }

    return specs
  }

  /**
   * Collect system prompt descriptions from tool classes
   */
  static getSystemPromptDescriptions(): Record<string, string> {
    const descriptions: Record<string, string> = {}

    // Add CreateFolderTool description
    if (CreateFolderTool.systemPromptDescription) {
      descriptions.createFolder = CreateFolderTool.systemPromptDescription
    }

    // Add WriteToFileTool description
    if (WriteToFileTool.systemPromptDescription) {
      descriptions.writeToFile = WriteToFileTool.systemPromptDescription
    }

    // Add ReadFilesTool description
    if (ReadFilesTool.systemPromptDescription) {
      descriptions.readFiles = ReadFilesTool.systemPromptDescription
    }

    // Add ListFilesTool description
    if (ListFilesTool.systemPromptDescription) {
      descriptions.listFiles = ListFilesTool.systemPromptDescription
    }

    // Add ApplyDiffEditTool description
    if (ApplyDiffEditTool.systemPromptDescription) {
      descriptions.applyDiffEdit = ApplyDiffEditTool.systemPromptDescription
    }

    // Add MoveFileTool description
    if (MoveFileTool.systemPromptDescription) {
      descriptions.moveFile = MoveFileTool.systemPromptDescription
    }

    // Add CopyFileTool description
    if (CopyFileTool.systemPromptDescription) {
      descriptions.copyFile = CopyFileTool.systemPromptDescription
    }

    // Phase 2: Web Tools
    if (TavilySearchTool.systemPromptDescription) {
      descriptions.tavilySearch = TavilySearchTool.systemPromptDescription
    }

    if (FetchWebsiteTool.systemPromptDescription) {
      descriptions.fetchWebsite = FetchWebsiteTool.systemPromptDescription
    }

    // Phase 3: Bedrock Tools
    if (GenerateImageTool.systemPromptDescription) {
      descriptions.generateImage = GenerateImageTool.systemPromptDescription
    }

    if (GenerateVideoTool.systemPromptDescription) {
      descriptions.generateVideo = GenerateVideoTool.systemPromptDescription
    }

    if (CheckVideoStatusTool.systemPromptDescription) {
      descriptions.checkVideoStatus = CheckVideoStatusTool.systemPromptDescription
    }

    if (DownloadVideoTool.systemPromptDescription) {
      descriptions.downloadVideo = DownloadVideoTool.systemPromptDescription
    }

    if (RecognizeImageTool.systemPromptDescription) {
      descriptions.recognizeImage = RecognizeImageTool.systemPromptDescription
    }

    if (RetrieveTool.systemPromptDescription) {
      descriptions.retrieve = RetrieveTool.systemPromptDescription
    }

    if (InvokeBedrockAgentTool.systemPromptDescription) {
      descriptions.invokeBedrockAgent = InvokeBedrockAgentTool.systemPromptDescription
    }

    if (InvokeFlowTool.systemPromptDescription) {
      descriptions.invokeFlow = InvokeFlowTool.systemPromptDescription
    }

    // Phase 4: Command & Thinking Tools
    if (ExecuteCommandTool.systemPromptDescription) {
      descriptions.executeCommand = ExecuteCommandTool.systemPromptDescription
    }

    if (ThinkTool.systemPromptDescription) {
      descriptions.think = ThinkTool.systemPromptDescription
    }

    // Phase 5: Interpreter Tools
    if (CodeInterpreterTool.systemPromptDescription) {
      descriptions.codeInterpreter = CodeInterpreterTool.systemPromptDescription
    }

    // Phase 6: System Tools
    if (ScreenCaptureTool.systemPromptDescription) {
      descriptions.screenCapture = ScreenCaptureTool.systemPromptDescription
    }

    if (CameraCaptureTool.systemPromptDescription) {
      descriptions.cameraCapture = CameraCaptureTool.systemPromptDescription
    }

    return descriptions
  }

  /**
   * Get all available tool metadata
   */
  static getAllToolMetadata(): {
    toolSpecs: Tool[]
    systemPromptDescriptions: Record<string, string>
  } {
    return {
      toolSpecs: this.getToolSpecs(),
      systemPromptDescriptions: this.getSystemPromptDescriptions()
    }
  }
}
