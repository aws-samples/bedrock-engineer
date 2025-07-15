/**
 * Tool to update tasks in the todo list
 */

import { z } from 'zod'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import {
  TodoUpdateInput,
  TodoList,
  TodoItemUpdate,
  TodoUpdateResult,
  getTodoFilePath,
  getTodosDirectoryPath
} from './types'

/**
 * Input schema for todo updates
 */
const todoItemUpdateSchema = z.object({
  id: z.string().describe('The ID of the task to update'),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'cancelled'])
    .optional()
    .describe('The new status for the task'),
  description: z.string().optional().describe('Optional new description for the task')
})

const todoUpdateInputSchema = z.object({
  type: z.literal('todoUpdate'),
  updates: z
    .array(todoItemUpdateSchema)
    .nonempty()
    .describe('Array of task updates to process in batch')
})

/**
 * Tool to update todo list items
 */
export class TodoUpdateTool extends BaseTool<
  TodoUpdateInput,
  { name: string; success: boolean; result: TodoList; message?: string }
> {
  readonly name = 'todoUpdate'
  readonly description = 'Update tasks in the todo list (status, description)'

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: 'todoUpdate',
    description: `Update tasks in the todo list created by todoInit.

Use this to mark tasks as completed, in progress, or to modify task descriptions.
Provide an array of updates to process multiple tasks at once.

## Usage Examples

Update single task status:
{
  "type": "todoUpdate",
  "updates": [
    {
      "id": "task-1703123456789-abc123def",
      "status": "completed"
    }
  ]
}

Update multiple tasks:
{
  "type": "todoUpdate",
  "updates": [
    {
      "id": "task-1703123456789-abc123def",
      "status": "completed"
    },
    {
      "id": "task-1703123456790-def456ghi",
      "status": "in_progress"
    }
  ]
}

Update task description:
{
  "type": "todoUpdate",
  "updates": [
    {
      "id": "task-1703123456789-abc123def",
      "description": "Updated task description"
    }
  ]
}

## Status Values

- pending: Task awaiting initiation
- in_progress: Currently active (maintain ONE active task maximum)
- completed: Task successfully finished
- cancelled: Task no longer required

## Best Practices

1. Mark tasks complete IMMEDIATELY upon finishing
2. Maintain only ONE task in_progress simultaneously
3. Complete current tasks before starting new ones
4. Cancel tasks that become obsolete

If your update request is invalid, an error will be returned with the current todo list state.`,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['todoUpdate'],
            description: 'Tool type identifier'
          },
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'The ID of the task to update'
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                  description: 'The new status for the task'
                },
                description: {
                  type: 'string',
                  description: 'Optional new description for the task'
                }
              },
              required: ['id'],
              additionalProperties: false
            },
            minItems: 1,
            description: 'Array of task updates to process in batch'
          }
        },
        required: ['type', 'updates'],
        additionalProperties: false
      }
    }
  }

  /**
   * System prompt description
   */
  static readonly systemPromptDescription = `Tool for updating todo list tasks. Use to change task status (pending/in_progress/completed/cancelled) or descriptions. Supports batch updates for multiple tasks.`

  /**
   * Validate input parameters
   */
  protected validateInput(input: TodoUpdateInput): ValidationResult {
    try {
      todoUpdateInputSchema.parse(input)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        }
      }
      return {
        isValid: false,
        errors: ['Invalid input format']
      }
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(
    input: TodoUpdateInput,
    _context?: any
  ): Promise<{ name: string; success: boolean; result: TodoList; message?: string }> {
    const { updates } = input

    this.logger.info('Updating todo tasks', {
      updateCount: updates.length,
      updates: updates.map((update) => ({
        id: update.id,
        status: update.status,
        hasDescription: !!update.description
      }))
    })

    try {
      // Get project path
      const projectPath = this.store.get('projectPath') ?? require('os').homedir()

      // Get current todo list from file
      const currentTodoList = await this.getCurrentTodoList(projectPath)
      if (!currentTodoList) {
        throw new Error('No todo list found. Please initialize a todo list first using todoInit.')
      }

      // Update the todo items
      const result = this.updateTodoItems(currentTodoList, updates)

      if (!result.success) {
        throw new Error(`Update failed: ${result.error}`)
      }

      // Save updated list to file
      await this.saveTodoListToFile(result.updatedList!, projectPath, result.updatedList!.sessionId)

      this.logger.info('Todo tasks updated successfully', {
        updateCount: updates.length,
        listId: result.updatedList!.id,
        sessionId: result.updatedList!.sessionId,
        projectPath
      })

      // Return structured result with updated TodoList
      return {
        name: this.name,
        success: true,
        result: result.updatedList!,
        message: `Updated ${updates.length} task${updates.length > 1 ? 's' : ''} successfully`
      }
    } catch (error) {
      this.logger.error('Failed to update todo tasks', {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(
        `Failed to update todo tasks: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Get the current todo list from the most recent file
   */
  private async getCurrentTodoList(projectPath: string): Promise<TodoList | null> {
    const fs = require('fs').promises
    const path = require('path')

    try {
      const todosDir = getTodosDirectoryPath(projectPath)

      // Check if todos directory exists
      try {
        await fs.access(todosDir)
      } catch {
        return null // Directory doesn't exist, no todos
      }

      // Get all todo files
      const files = await fs.readdir(todosDir)
      const todoFiles = files.filter(
        (file) => file.startsWith('session_') && file.endsWith('_todos.json')
      )

      if (todoFiles.length === 0) {
        return null
      }

      // Find the most recently modified file
      let mostRecentFile = ''
      let mostRecentTime = 0

      for (const file of todoFiles) {
        const filePath = path.join(todosDir, file)
        const stats = await fs.stat(filePath)
        if (stats.mtime.getTime() > mostRecentTime) {
          mostRecentTime = stats.mtime.getTime()
          mostRecentFile = filePath
        }
      }

      // Read and parse the most recent todo file
      const fileContent = await fs.readFile(mostRecentFile, 'utf8')
      const todoList: TodoList = JSON.parse(fileContent)

      return todoList
    } catch (error) {
      this.logger.error('Failed to read current todo list', {
        error: error instanceof Error ? error.message : String(error),
        projectPath
      })
      return null
    }
  }

  /**
   * Save todo list to file
   */
  private async saveTodoListToFile(
    todoList: TodoList,
    projectPath: string,
    sessionId: string
  ): Promise<void> {
    const fs = require('fs').promises
    const filePath = getTodoFilePath(projectPath, sessionId)

    try {
      await fs.writeFile(filePath, JSON.stringify(todoList, null, 2), 'utf8')
    } catch (error) {
      this.logger.error('Failed to save todo list to file', {
        error: error instanceof Error ? error.message : String(error),
        filePath
      })
      throw error
    }
  }

  /**
   * Update todo items
   */
  private updateTodoItems(todoList: TodoList, updates: TodoItemUpdate[]): TodoUpdateResult {
    try {
      const updatedItems = [...todoList.items]
      const now = new Date().toISOString()

      // Validate all updates first
      for (const update of updates) {
        const itemIndex = updatedItems.findIndex((item) => item.id === update.id)
        if (itemIndex === -1) {
          return {
            success: false,
            error: `Task with ID "${update.id}" not found`,
            currentList: todoList
          }
        }
      }

      // Apply updates
      for (const update of updates) {
        const itemIndex = updatedItems.findIndex((item) => item.id === update.id)
        const item = updatedItems[itemIndex]

        // Update status if provided
        if (update.status) {
          item.status = update.status
        }

        // Update description if provided
        if (update.description) {
          item.description = update.description.trim()
        }

        // Update timestamp
        item.updatedAt = now
      }

      const updatedList: TodoList = {
        ...todoList,
        items: updatedItems,
        updatedAt: now
      }

      return {
        success: true,
        updatedList
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        currentList: todoList
      }
    }
  }

  /**
   * Sanitize input for logging
   */
  protected sanitizeInputForLogging(input: TodoUpdateInput): any {
    return {
      type: input.type,
      updateCount: input.updates.length,
      updates: input.updates.map((update) => ({
        id: update.id,
        status: update.status,
        hasDescription: !!update.description,
        descriptionLength: update.description?.length || 0
      }))
    }
  }
}
