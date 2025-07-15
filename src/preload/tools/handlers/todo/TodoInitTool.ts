/**
 * Tool to initialize or replace a todo list
 */

import { z } from 'zod'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import {
  TodoInitInput,
  TodoList,
  TodoItem,
  generateTodoId,
  getTodoFilePath,
  getTodosDirectoryPath,
  getGitignoreFilePath
} from './types'

/**
 * Input schema for todo initialization
 */
const todoInitInputSchema = z.object({
  type: z.literal('todoInit'),
  items: z
    .array(z.string())
    .min(1)
    .describe(
      'Array of task descriptions to initialize the list with. All tasks are initially marked as pending.'
    )
})

/**
 * Tool to initialize or replace a todo list
 */
export class TodoInitTool extends BaseTool<
  TodoInitInput,
  { name: string; success: boolean; result: TodoList; message?: string }
> {
  readonly name = 'todoInit'
  readonly description = 'Initialize or replace a todo list for systematic workflow management'

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: 'todoInit',
    description: `Establish a fresh todo list or overwrite the current one.

This utility enables systematic workflow management during development sessions, facilitating progress monitoring and task coordination while providing transparency to users regarding work completion status.

## Optimal Usage Scenarios

Deploy this functionality strategically under these conditions:

1. Intricate workflows requiring multiple phases - Apply when operations demand 3+ sequential actions or procedures
2. Sophisticated assignments needing orchestration - Utilize for endeavors requiring methodical coordination or compound operations
3. Direct user specification for task tracking - Activate when users explicitly request task list functionality
4. Multiple assignment batches - Engage when users present enumerated or delimited work items
5. Upon instruction receipt - Promptly document user specifications as actionable items. Modify todo list as new details emerge.
6. Following task completion - Update status and incorporate subsequent follow-up activities
7. During task initiation - Transition items to active status. Maintain singular active task focus. Finalize current work before advancing to new items.

## Inappropriate Usage Contexts

Avoid this utility when:
1. Only one straightforward operation exists
2. Work is elementary and tracking offers no structural advantage
3. Completion requires fewer than 3 basic steps
4. Interaction is purely discussion-based or informational

IMPORTANT: Refrain from using this tool for single elementary tasks. Direct execution is more efficient in such cases.

## Task Status Management and Workflow

1. **Status Categories**: Utilize these states for progress tracking:
   - pending: Task awaiting initiation
   - in_progress: Currently active (maintain ONE active task maximum)
   - completed: Task successfully finished
   - cancelled: Task no longer required

2. **Workflow Management**:
   - Update task status continuously during work
   - Mark tasks complete IMMEDIATELY upon finishing (avoid batching completions)
   - Maintain only ONE task in_progress simultaneously
   - Complete current tasks before initiating new ones
   - Cancel tasks that become obsolete

3. **Task Organization**:
   - Generate specific, actionable items
   - Decompose complex tasks into smaller, manageable components
   - Employ clear, descriptive task naming

When uncertain, deploy this tool. Proactive task management demonstrates diligence and ensures comprehensive requirement fulfillment.`,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['todoInit'],
            description: 'Tool type identifier'
          },
          items: {
            type: 'array',
            items: {
              type: 'string'
            },
            minItems: 1,
            description:
              'Array of task descriptions to initialize the list with. All tasks are initially marked as pending.'
          }
        },
        required: ['type', 'items'],
        additionalProperties: false
      }
    }
  }

  /**
   * System prompt description
   */
  static readonly systemPromptDescription = `Tool for initializing or replacing todo lists. Use for complex workflows requiring multiple sequential steps or when users explicitly request task tracking. Avoid for single simple tasks.`

  /**
   * Validate input parameters
   */
  protected validateInput(input: TodoInitInput): ValidationResult {
    try {
      todoInitInputSchema.parse(input)
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
    input: TodoInitInput,
    context?: any
  ): Promise<{ name: string; success: boolean; result: TodoList; message?: string }> {
    const { items } = input

    this.logger.info('Initializing todo list', {
      itemCount: items.length,
      items: items.map((item) => this.truncateForLogging(item, 50))
    })

    try {
      // Get project path and session ID from context or generate one
      const projectPath = this.store.get('projectPath') ?? require('os').homedir()
      const sessionId = context?.sessionId || this.generateSessionId()

      // Create new todo list
      const now = new Date().toISOString()
      const todoList: TodoList = {
        id: `todolist-${Date.now()}`,
        items: items.map(
          (description): TodoItem => ({
            id: generateTodoId(),
            description: description.trim(),
            status: 'pending',
            createdAt: now,
            updatedAt: now
          })
        ),
        createdAt: now,
        updatedAt: now,
        sessionId,
        projectPath
      }

      // Ensure directory structure exists
      await this.ensureTodoDirectoryExists(projectPath)

      // Save to file
      await this.saveTodoListToFile(todoList, projectPath, sessionId)

      this.logger.info('Todo list initialized successfully', {
        listId: todoList.id,
        itemCount: todoList.items.length,
        sessionId,
        projectPath
      })

      // Return structured result with TodoList
      return {
        name: this.name,
        success: true,
        result: todoList,
        message: `Todo list initialized with ${todoList.items.length} tasks`
      }
    } catch (error) {
      this.logger.error('Failed to initialize todo list', {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(
        `Failed to initialize todo list: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Generate a session ID for the current context
   * Use a format that's compatible with chat session IDs
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    return `session_${timestamp}`
  }

  /**
   * Ensure the todos directory structure exists
   */
  private async ensureTodoDirectoryExists(projectPath: string): Promise<void> {
    const fs = require('fs').promises
    const path = require('path')

    try {
      // Create .bedrock-engineer directory
      const bedrockEngineerDir = path.join(projectPath, '.bedrock-engineer')
      await fs.mkdir(bedrockEngineerDir, { recursive: true })

      // Create todos directory
      const todosDir = getTodosDirectoryPath(projectPath)
      await fs.mkdir(todosDir, { recursive: true })

      // Create .gitignore file to exclude todos from version control
      const gitignoreFile = getGitignoreFilePath(projectPath)
      const gitignoreContent = '*.json\n'

      try {
        await fs.access(gitignoreFile)
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(gitignoreFile, gitignoreContent, 'utf8')
      }
    } catch (error) {
      this.logger.error('Failed to create todos directory structure', {
        error: error instanceof Error ? error.message : String(error),
        projectPath
      })
      throw error
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
   * Sanitize input for logging
   */
  protected sanitizeInputForLogging(input: TodoInitInput): any {
    return {
      type: input.type,
      itemCount: input.items.length,
      items: input.items.map((item) => this.truncateForLogging(item, 50))
    }
  }
}
