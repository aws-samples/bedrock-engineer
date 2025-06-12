/**
 * System tools exports
 */

export { ScreenCaptureTool } from './ScreenCaptureTool'
export { CameraCaptureTool } from './CameraCaptureTool'

import type { ToolDependencies } from '../../base/types'
import { ScreenCaptureTool } from './ScreenCaptureTool'
import { CameraCaptureTool } from './CameraCaptureTool'

/**
 * Factory function to create all system tools
 */
export function createSystemTools(dependencies: ToolDependencies) {
  return [
    { tool: new ScreenCaptureTool(dependencies), category: 'system' as const },
    { tool: new CameraCaptureTool(dependencies), category: 'system' as const }
  ]
}
