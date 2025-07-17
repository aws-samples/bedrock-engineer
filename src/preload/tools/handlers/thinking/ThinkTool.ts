/**
 * Think tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for ThinkTool
 */
interface ThinkInput {
  type: 'think'
  thought: string
}

/**
 * Result type for ThinkTool
 */
interface ThinkResult extends ToolResult {
  name: 'think'
  result: {
    reasoning: string
  }
}

/**
 * Tool for detailed thinking and problem analysis
 */
export class ThinkTool extends BaseTool<ThinkInput, ThinkResult> {
  static readonly toolName = 'think'
  static readonly toolDescription =
    'Use the tool to think about something. It will not obtain new information or make any changes to the repository, but just log the thought. Use it when complex reasoning or brainstorming is needed. For example, if you explore the repo and discover the source of a bug, call this tool to brainstorm several unique ways of fixing the bug, and assess which change(s) are likely to be simplest and most effective. Alternatively, if you receive some test results, call this tool to brainstorm ways to fix the failing tests.\n\nProcess complex reasoning and brainstorming. Use for analysis before making changes.\n\nBefore taking any action or responding to the user after receiving tool results, use the think tool as a scratchpad to:\n- List the specific rules that apply to the current request\n- Check if all required information is collected\n- Verify that the planned action complies with all policies\n- Iterate over tool results for correctness'

  readonly name = ThinkTool.toolName
  readonly description = ThinkTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: ThinkTool.toolName,
    description: ThinkTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          thought: {
            type: 'string',
            description: 'Your thoughts.'
          }
        },
        required: ['thought']
      }
    }
  } as const

  /**
   * Validate input
   */
  protected validateInput(input: ThinkInput): ValidationResult {
    const errors: string[] = []

    if (!input.thought) {
      errors.push('Thought is required')
    }

    if (typeof input.thought !== 'string') {
      errors.push('Thought must be a string')
    }

    if (input.thought && input.thought.trim().length === 0) {
      errors.push('Thought cannot be empty')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ThinkInput): Promise<ThinkResult> {
    const { thought } = input

    this.logger.debug('Using think tool', {
      queryLength: thought.length
    })

    try {
      this.logger.info('Thinking about:', {
        query: this.truncateForLogging(thought, 100)
      })

      // This tool doesn't perform any special processing
      // It simply returns the thought as the reasoning
      // The actual thinking happens in the AI model itself
      // This tool serves as a signal to the model to engage in extended reasoning

      return {
        success: true,
        name: 'think',
        message: 'Thinking process completed',
        result: {
          reasoning: thought
        }
      }
    } catch (error) {
      this.logger.error('Error in think tool', {
        error: error instanceof Error ? error.message : String(error),
        thought: this.truncateForLogging(thought, 100)
      })

      throw new Error(
        `Error in think tool: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Override to NOT return error as string
   * This tool should throw actual errors
   */
  protected shouldReturnErrorAsString(): boolean {
    return false
  }

  /**
   * Override to sanitize thought content for logging
   */
  protected sanitizeInputForLogging(input: ThinkInput): any {
    return {
      ...input,
      thought: this.truncateForLogging(input.thought, 200)
    }
  }
}
