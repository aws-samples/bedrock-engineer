/**
 * Tool to update tasks in the todo list
 */

import { z } from 'zod'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool, zodToJsonSchemaBody } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { TodoUpdateInput } from './types'
import { api } from '../../../api'

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
  { name: string; success: boolean; result: any; message?: string }
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
      json: zodToJsonSchemaBody(todoUpdateInputSchema)
    }
  }

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
    context?: any
  ): Promise<{ name: string; success: boolean; result: any; message?: string }> {
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
      // Get session ID from context or use most recent
      const sessionId = context?.sessionId || 'most_recent'

      // Call the main process via API client
      const result = await api.todo.updateTodoList({
        sessionId,
        updates
      })

      if (result.success) {
        this.logger.info('Todo tasks updated successfully', {
          updateCount: updates.length,
          sessionId
        })

        return {
          name: this.name,
          success: true,
          result: result.updatedList,
          message: `Updated ${updates.length} task${updates.length > 1 ? 's' : ''} successfully`
        }
      } else {
        throw new Error(result.error || 'Failed to update todo tasks')
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
