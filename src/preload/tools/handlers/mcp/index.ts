/**
 * MCP tools exports
 */

export { McpToolAdapter } from './McpToolAdapter'

import type { ToolDependencies } from '../../base/types'
import { McpToolAdapter } from './McpToolAdapter'

/**
 * Factory function to create all MCP tools
 */
export function createMcpTools(dependencies: ToolDependencies) {
  return [{ tool: new McpToolAdapter(dependencies), category: 'mcp' as const }]
}
