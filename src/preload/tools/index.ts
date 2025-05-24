/**
 * New entry point for the refactored tool system
 */

import { ToolInput, ToolResult } from '../../types/tools'
import type { ToolDependencies, ITool, ToolCategory } from './base/types'
import { createToolRegistry, ToolRegistry } from './registry'
import { ChunkManager } from './common/ChunkManager'
import { StoreManager } from './common/StoreManager'
import { createToolLogger } from './common/Logger'

// Global instances
let toolRegistry: ToolRegistry | null = null
let isInitialized = false

/**
 * Initialize the tool system
 */
export async function initializeToolSystem(): Promise<void> {
  if (isInitialized) {
    return
  }

  // Create dependencies
  const dependencies: ToolDependencies = {
    logger: createToolLogger('system'),
    storeManager: new StoreManager(),
    chunkManager: new ChunkManager()
  }

  // Create registry
  toolRegistry = createToolRegistry(dependencies)

  // Register filesystem tools
  const { createFilesystemTools } = await import('./handlers/filesystem')
  const filesystemTools = createFilesystemTools(dependencies)
  filesystemTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  // Register web tools
  const { createWebTools } = await import('./handlers/web')
  const webTools = createWebTools(dependencies)
  webTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  // Register thinking tools
  const { createThinkingTools } = await import('./handlers/thinking')
  const thinkingTools = createThinkingTools(dependencies)
  thinkingTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  // Register command tools
  const { createCommandTools } = await import('./handlers/command')
  const commandTools = createCommandTools(dependencies)
  commandTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  // Register MCP tools
  const { createMcpTools } = await import('./handlers/mcp')
  const mcpTools = createMcpTools(dependencies)
  mcpTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  // Register Bedrock tools
  const { createBedrockTools } = await import('./handlers/bedrock')
  const bedrockTools = createBedrockTools(dependencies)
  bedrockTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  isInitialized = true
}

/**
 * Execute a tool (new implementation)
 * This will eventually replace the old executeTool function
 */
export async function executeToolNew(input: ToolInput): Promise<string | ToolResult> {
  if (!toolRegistry) {
    throw new Error('Tool system not initialized. Call initializeToolSystem() first.')
  }

  return toolRegistry.execute(input)
}

/**
 * Get the tool registry instance
 */
export function getToolRegistry(): ToolRegistry {
  if (!toolRegistry) {
    throw new Error('Tool system not initialized. Call initializeToolSystem() first.')
  }

  return toolRegistry
}

/**
 * Re-export commonly used types and utilities
 */
export { ToolRegistry, createToolRegistry } from './registry'
export { BaseTool } from './base/BaseTool'
export {
  ToolError,
  ValidationError,
  ExecutionError,
  ToolNotFoundError,
  PermissionDeniedError,
  ChunkIndexOutOfRangeError,
  RateLimitError,
  NetworkError,
  wrapError,
  isToolError
} from './base/errors'
export type {
  ITool,
  ToolDependencies,
  ToolLogger,
  StoreManager as IStoreManager,
  ChunkManager as IChunkManager,
  ContentChunk,
  ToolCategory,
  ToolRegistration,
  ValidationResult,
  ChunkOptions,
  ReadFileOptions,
  ListDirectoryOptions,
  FetchWebsiteOptions,
  CommandConfig,
  ToolErrorMetadata
} from './base/types'
export { ToolErrorType } from './base/types'
export { ChunkManager, DEFAULT_MAX_CHUNK_SIZE } from './common/ChunkManager'
export { StoreManager, storeManager } from './common/StoreManager'
export { Logger, createToolLogger, toolSystemLogger } from './common/Logger'

/**
 * Helper function to register tools in batches
 * This will be used during the migration phase
 */
export function registerTools(
  registrations: Array<{
    ToolClass: new (dependencies: ToolDependencies) => ITool
    category: ToolCategory
  }>
): void {
  if (!toolRegistry) {
    throw new Error('Tool system not initialized. Call initializeToolSystem() first.')
  }

  const dependencies: ToolDependencies = {
    logger: createToolLogger('system'),
    storeManager: new StoreManager(),
    chunkManager: new ChunkManager()
  }

  registrations.forEach(({ ToolClass, category }) => {
    const tool = new ToolClass(dependencies)
    toolRegistry!.register(tool, category)
  })
}

/**
 * Main entry point for executing tools
 */
export async function executeTool(input: ToolInput): Promise<string | ToolResult> {
  // Initialize the system if not already done
  if (!isInitialized) {
    await initializeToolSystem()
  }

  return executeToolNew(input)
}

/**
 * Get system statistics
 */
export function getToolSystemStats(): {
  initialized: boolean
  registeredTools: number
  toolsByCategory: Record<string, number>
} {
  if (!toolRegistry) {
    return {
      initialized: false,
      registeredTools: 0,
      toolsByCategory: {}
    }
  }

  const stats = toolRegistry.getStatistics()
  return {
    initialized: isInitialized,
    registeredTools: stats.totalTools,
    toolsByCategory: stats.toolsByCategory
  }
}

/**
 * Reset the tool system (mainly for testing)
 */
export function resetToolSystem(): void {
  if (toolRegistry) {
    toolRegistry.clear()
  }
  toolRegistry = null
  isInitialized = false
}
