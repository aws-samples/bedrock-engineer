/**
 * Web tools exports
 */

export { TavilySearchTool } from './TavilySearchTool'
export { FetchWebsiteTool } from './FetchWebsiteTool'

import type { ToolDependencies } from '../../base/types'
import { TavilySearchTool } from './TavilySearchTool'
import { FetchWebsiteTool } from './FetchWebsiteTool'

/**
 * Factory function to create all web tools
 */
export function createWebTools(dependencies: ToolDependencies) {
  return [
    { tool: new TavilySearchTool(dependencies), category: 'web' as const },
    { tool: new FetchWebsiteTool(dependencies), category: 'web' as const }
  ]
}
