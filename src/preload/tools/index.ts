/**
 * New entry point for the refactored tool system
 */

import { ToolInput, ToolResult } from '../../types/tools'
import type { ToolDependencies, ITool, ToolCategory } from './base/types'
import { createToolRegistry, ToolRegistry } from './registry'
import { store } from '../store'
import { createToolLogger } from './common/Logger'
import { createFilesystemTools } from './handlers/filesystem'
import { createWebTools } from './handlers/web'
import { createThinkingTools } from './handlers/thinking'
import { createCommandTools } from './handlers/command'
import { createMcpTools } from './handlers/mcp'
import { createAgentCoreGatewayTools } from './handlers/agentcore'
import { createBedrockTools } from './handlers/bedrock'
import { createCodeInterpreterTools } from './handlers/interpreter'
import { createSystemTools } from './handlers/system'
import { createTodoTools } from './handlers/todo'

// Global instances
let toolRegistry: ToolRegistry | null = null
let isInitialized = false

/**
 * Initialize the tool system
 */
export function initializeToolSystem(): void {
  if (isInitialized) {
    return
  }

  // Create dependencies
  const dependencies: ToolDependencies = {
    logger: createToolLogger('system'),
    store: store
  }

  // Create registry
  toolRegistry = createToolRegistry(dependencies)

  // Register all tools synchronously
  const allTools = [
    ...createFilesystemTools(dependencies),
    ...createWebTools(dependencies),
    ...createThinkingTools(dependencies),
    ...createCommandTools(dependencies),
    ...createMcpTools(dependencies),
    ...createAgentCoreGatewayTools(dependencies),
    ...createBedrockTools(dependencies),
    ...createCodeInterpreterTools(dependencies),
    ...createSystemTools(dependencies),
    ...createTodoTools(dependencies)
  ]

  allTools.forEach(({ tool, category }) => {
    toolRegistry!.register(tool, category)
  })

  isInitialized = true
}

/**
 * Execute a tool (new implementation)
 * This will eventually replace the old executeTool function
 */
export async function executeToolNew(
  input: ToolInput,
  context?: any
): Promise<string | ToolResult> {
  if (!toolRegistry) {
    throw new Error('Tool system not initialized. Call initializeToolSystem() first.')
  }

  return toolRegistry.execute(input, context)
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
  RateLimitError,
  NetworkError,
  wrapError,
  isToolError
} from './base/errors'
export type {
  ITool,
  ToolDependencies,
  ToolLogger,
  ToolCategory,
  ToolRegistration,
  ValidationResult,
  ReadFileOptions,
  ListDirectoryOptions,
  FetchWebsiteOptions,
  CommandConfig,
  ToolErrorMetadata
} from './base/types'
export { ToolErrorType } from './base/types'
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
    store: store
  }

  registrations.forEach(({ ToolClass, category }) => {
    const tool = new ToolClass(dependencies)
    toolRegistry!.register(tool, category)
  })
}

/**
 * Main entry point for executing tools
 */
export async function executeTool(input: ToolInput, context?: any): Promise<string | ToolResult> {
  // Initialize the system if not already done
  if (!isInitialized) {
    initializeToolSystem()
  }

  return executeToolNew(input, context)
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
