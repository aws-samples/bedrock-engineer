/**
 * Thinking tools exports
 */

export { ThinkTool } from './ThinkTool'

import type { ToolDependencies } from '../../base/types'
import { ThinkTool } from './ThinkTool'

/**
 * Factory function to create all thinking tools
 */
export function createThinkingTools(dependencies: ToolDependencies) {
  return [{ tool: new ThinkTool(dependencies), category: 'thinking' as const }]
}
