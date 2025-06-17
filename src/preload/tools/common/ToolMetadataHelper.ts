/**
 * Tool metadata helper utilities
 * Centralized tool metadata management for preload process
 */

import { ToolMetadataCollector } from '../registry'
import { getMcpToolSpecs } from '../../mcp'
import { McpServerConfig } from '../../../types/agent-chat'

/**
 * Cache for system prompt descriptions to avoid repeated API calls
 */
let systemPromptDescriptionsCache: Record<string, string> | null = null

/**
 * Get system prompt descriptions from ToolMetadataCollector (with caching)
 */
export function getSystemPromptDescriptions(): Record<string, string> {
  if (systemPromptDescriptionsCache === null) {
    systemPromptDescriptionsCache = ToolMetadataCollector.getSystemPromptDescriptions()
  }
  return systemPromptDescriptionsCache
}

/**
 * Get MCP tool system prompt descriptions with dynamic generation
 */
export async function getMcpSystemPromptDescriptions(
  mcpServers: McpServerConfig[] = []
): Promise<Record<string, string>> {
  const descriptions: Record<string, string> = {}

  try {
    // MCPツール仕様を取得
    const mcpToolSpecs = await getMcpToolSpecs(mcpServers)

    // 各MCPツールに対してシステムプロンプト記述を生成
    for (const toolSpec of mcpToolSpecs) {
      if (toolSpec.toolSpec?.name) {
        const toolName = toolSpec.toolSpec.name
        const description = toolSpec.toolSpec.description || 'MCP tool with specific functionality.'

        // mcp_プレフィックス付きのツール名で記述を生成
        descriptions[toolName] =
          `${description}\\nMCP tool provided by external server.\\nRefer to tool documentation for specific usage.`
      }
    }
  } catch (error) {
    console.warn('Failed to get MCP tool descriptions:', error)
  }

  return descriptions
}

/**
 * Get all system prompt descriptions including MCP tools
 */
export async function getAllSystemPromptDescriptions(
  mcpServers: McpServerConfig[] = []
): Promise<Record<string, string>> {
  const builtInDescriptions = getSystemPromptDescriptions()
  const mcpDescriptions = await getMcpSystemPromptDescriptions(mcpServers)

  return {
    ...builtInDescriptions,
    ...mcpDescriptions
  }
}

/**
 * Get tool usage description by name
 * Uses dynamic system prompt descriptions from ToolMetadataCollector
 */
export function getToolUsageDescription(toolName: string): string {
  const descriptions = getSystemPromptDescriptions()
  return (
    descriptions[toolName] ||
    'External tool with specific functionality.\nRefer to tool documentation for usage.'
  )
}

/**
 * Get tool usage description by name including MCP tools
 */
export async function getToolUsageDescriptionWithMcp(
  toolName: string,
  mcpServers: McpServerConfig[] = []
): Promise<string> {
  const allDescriptions = await getAllSystemPromptDescriptions(mcpServers)
  return (
    allDescriptions[toolName] ||
    'External tool with specific functionality.\\nRefer to tool documentation for usage.'
  )
}

/**
 * Reset cache - useful for testing or when tool metadata changes
 */
export function resetToolMetadataCache(): void {
  systemPromptDescriptionsCache = null
}

/**
 * Get all available tool names
 */
export function getAvailableToolNames(): string[] {
  const descriptions = getSystemPromptDescriptions()
  return Object.keys(descriptions)
}
