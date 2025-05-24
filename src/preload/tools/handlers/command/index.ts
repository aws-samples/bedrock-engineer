/**
 * Command tools exports
 */

export { ExecuteCommandTool } from './ExecuteCommandTool'

import type { ToolDependencies } from '../../base/types'
import { ExecuteCommandTool } from './ExecuteCommandTool'

/**
 * Factory function to create all command tools
 */
export function createCommandTools(dependencies: ToolDependencies) {
  return [{ tool: new ExecuteCommandTool(dependencies), category: 'command' as const }]
}
