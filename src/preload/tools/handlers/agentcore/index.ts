/**
 * AgentCore Gateway tools exports
 */

export { AgentCoreGatewayToolAdapter } from './AgentCoreGatewayToolAdapter'

import type { ToolDependencies } from '../../base/types'
import { AgentCoreGatewayToolAdapter } from './AgentCoreGatewayToolAdapter'

/**
 * Factory function to create all AgentCore Gateway tools
 */
export function createAgentCoreGatewayTools(dependencies: ToolDependencies) {
  return [{ tool: new AgentCoreGatewayToolAdapter(dependencies), category: 'mcp' as const }]
}
