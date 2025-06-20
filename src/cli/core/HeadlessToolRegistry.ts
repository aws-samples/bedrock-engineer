import { ToolInput, ToolResult } from '../../types/tools'
import { logger } from '../utils/logger'
import { CLIConfig } from '../types/config'

// Import tool classes that work in Node.js environment
import { CreateFolderTool } from '../../preload/tools/handlers/filesystem/CreateFolderTool'
import { WriteToFileTool } from '../../preload/tools/handlers/filesystem/WriteToFileTool'
import { ReadFilesTool } from '../../preload/tools/handlers/filesystem/ReadFilesTool'
import { ListFilesTool } from '../../preload/tools/handlers/filesystem/ListFilesTool'
import { MoveFileTool } from '../../preload/tools/handlers/filesystem/MoveFileTool'
import { CopyFileTool } from '../../preload/tools/handlers/filesystem/CopyFileTool'
import { TavilySearchTool } from '../../preload/tools/handlers/web/TavilySearchTool'
import { FetchWebsiteTool } from '../../preload/tools/handlers/web/FetchWebsiteTool'
import { GenerateImageTool } from '../../preload/tools/handlers/bedrock/GenerateImageTool'
import { RecognizeImageTool } from '../../preload/tools/handlers/bedrock/RecognizeImageTool'
import { RetrieveTool } from '../../preload/tools/handlers/bedrock/RetrieveTool'
import { InvokeBedrockAgentTool } from '../../preload/tools/handlers/bedrock/InvokeBedrockAgentTool'
import { InvokeFlowTool } from '../../preload/tools/handlers/bedrock/InvokeFlowTool'
import { ExecuteCommandTool } from '../../preload/tools/handlers/command/ExecuteCommandTool'
import { ThinkTool } from '../../preload/tools/handlers/thinking/ThinkTool'

export interface ToolDependencies {
  projectPath?: string
  config?: CLIConfig
  tavilyApiKey?: string
  awsConfig?: {
    region: string
    accessKeyId?: string
    secretAccessKey?: string
    sessionToken?: string
    profile?: string
  }
}

export class HeadlessToolRegistry {
  private tools: Map<string, any> = new Map()
  private dependencies: ToolDependencies

  constructor(dependencies: ToolDependencies) {
    this.dependencies = dependencies
    this.initializeTools()
  }

  private initializeTools(): void {
    try {
      // File system tools - these should work in Node.js
      this.registerTool('createFolder', new CreateFolderTool(this.createToolDependencies()))
      this.registerTool('writeToFile', new WriteToFileTool(this.createToolDependencies()))
      this.registerTool('readFiles', new ReadFilesTool(this.createToolDependencies()))
      this.registerTool('listFiles', new ListFilesTool(this.createToolDependencies()))
      this.registerTool('moveFile', new MoveFileTool(this.createToolDependencies()))
      this.registerTool('copyFile', new CopyFileTool(this.createToolDependencies()))

      // Web tools
      this.registerTool('tavilySearch', new TavilySearchTool(this.createToolDependencies()))
      this.registerTool('fetchWebsite', new FetchWebsiteTool(this.createToolDependencies()))

      // Bedrock tools - these need AWS configuration
      if (this.dependencies.awsConfig) {
        this.registerTool('generateImage', new GenerateImageTool(this.createToolDependencies()))
        this.registerTool('recognizeImage', new RecognizeImageTool(this.createToolDependencies()))
        this.registerTool('retrieve', new RetrieveTool(this.createToolDependencies()))
        this.registerTool('invokeBedrockAgent', new InvokeBedrockAgentTool(this.createToolDependencies()))
        this.registerTool('invokeFlow', new InvokeFlowTool(this.createToolDependencies()))
      }

      // Command tool - needs careful handling in CLI
      this.registerTool('executeCommand', new ExecuteCommandTool(this.createToolDependencies()))

      // Thinking tool
      this.registerTool('think', new ThinkTool(this.createToolDependencies()))

      logger.debug(`Initialized ${this.tools.size} tools`)
    } catch (error) {
      logger.error('Failed to initialize tools:', error)
    }
  }

  private createToolDependencies(): any {
    // Create dependencies object that tools expect
    // This needs to match the ToolDependencies interface from the original system
    return {
      projectPath: this.dependencies.projectPath || process.cwd(),
      config: this.dependencies.config,
      store: {
        get: (key: string) => {
          // Mock electron-store behavior for CLI
          switch (key) {
            case 'projectPath':
              return this.dependencies.projectPath || process.cwd()
            case 'tavilySearch':
              return { apikey: this.dependencies.tavilyApiKey }
            case 'awsRegion':
              return this.dependencies.awsConfig?.region
            case 'awsAccessKeyId':
              return this.dependencies.awsConfig?.accessKeyId
            case 'awsSecretAccessKey':
              return this.dependencies.awsConfig?.secretAccessKey
            case 'awsSessionToken':
              return this.dependencies.awsConfig?.sessionToken
            case 'awsProfile':
              return this.dependencies.awsConfig?.profile
            default:
              return undefined
          }
        },
        set: (key: string, value: any) => {
          // Mock store set - could update our config
          logger.debug(`Store set: ${key} = ${value}`)
        }
      },
      // Add other dependencies as needed
      logger: logger
    }
  }

  private registerTool(name: string, tool: any): void {
    this.tools.set(name, tool)
    logger.debug(`Registered tool: ${name}`)
  }

  async executeTool(input: ToolInput): Promise<string | ToolResult> {
    const toolName = input.type
    const tool = this.tools.get(toolName)

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    logger.debug(`Executing tool: ${toolName}`, input)

    try {
      const result = await tool.execute(input)
      logger.debug(`Tool executed successfully: ${toolName}`)
      return result
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, error)
      throw error
    }
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys())
  }

  hasTool(toolName: string): boolean {
    return this.tools.has(toolName)
  }

  updateDependencies(dependencies: Partial<ToolDependencies>): void {
    this.dependencies = { ...this.dependencies, ...dependencies }
    // Re-initialize tools with new dependencies
    this.tools.clear()
    this.initializeTools()
  }

  // Special handling for tools that might not work in CLI environment
  private isToolAvailable(toolName: string): boolean {
    switch (toolName) {
      case 'screenCapture':
      case 'cameraCapture':
        // These likely won't work in CLI environment
        return false
      case 'generateImage':
      case 'recognizeImage':
      case 'retrieve':
      case 'invokeBedrockAgent':
      case 'invokeFlow':
        // These need AWS configuration
        return !!this.dependencies.awsConfig
      case 'tavilySearch':
        // This needs API key
        return !!this.dependencies.tavilyApiKey
      default:
        return true
    }
  }

  getCompatibleTools(): string[] {
    return this.getAvailableTools().filter(tool => this.isToolAvailable(tool))
  }
}