/**
 * Filesystem tools exports
 */

export { CreateFolderTool } from './CreateFolderTool'
export { WriteToFileTool } from './WriteToFileTool'
export { ReadFilesTool } from './ReadFilesTool'
export { ApplyDiffEditTool } from './ApplyDiffEditTool'
export { ListFilesTool } from './ListFilesTool'
export { MoveFileTool } from './MoveFileTool'
export { CopyFileTool } from './CopyFileTool'

import type { ToolDependencies } from '../../base/types'
import { CreateFolderTool } from './CreateFolderTool'
import { WriteToFileTool } from './WriteToFileTool'
import { ReadFilesTool } from './ReadFilesTool'
import { ApplyDiffEditTool } from './ApplyDiffEditTool'
import { ListFilesTool } from './ListFilesTool'
import { MoveFileTool } from './MoveFileTool'
import { CopyFileTool } from './CopyFileTool'

/**
 * Factory function to create all filesystem tools
 */
export function createFilesystemTools(dependencies: ToolDependencies) {
  return [
    { tool: new CreateFolderTool(dependencies), category: 'filesystem' as const },
    { tool: new WriteToFileTool(dependencies), category: 'filesystem' as const },
    { tool: new ReadFilesTool(dependencies), category: 'filesystem' as const },
    { tool: new ApplyDiffEditTool(dependencies), category: 'filesystem' as const },
    { tool: new ListFilesTool(dependencies), category: 'filesystem' as const },
    { tool: new MoveFileTool(dependencies), category: 'filesystem' as const },
    { tool: new CopyFileTool(dependencies), category: 'filesystem' as const }
  ]
}
