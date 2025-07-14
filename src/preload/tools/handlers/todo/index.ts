/**
 * Todo tools exports
 */

import { ToolDependencies, ITool, ToolCategory } from '../../base/types'
import { TodoInitTool } from './TodoInitTool'
import { TodoUpdateTool } from './TodoUpdateTool'

export { TodoInitTool } from './TodoInitTool'
export { TodoUpdateTool } from './TodoUpdateTool'
export * from './types'

/**
 * Create todo tools
 */
export function createTodoTools(dependencies: ToolDependencies): Array<{
  tool: ITool
  category: ToolCategory
}> {
  return [
    {
      tool: new TodoInitTool(dependencies),
      category: 'thinking' as ToolCategory
    },
    {
      tool: new TodoUpdateTool(dependencies),
      category: 'thinking' as ToolCategory
    }
  ]
}
