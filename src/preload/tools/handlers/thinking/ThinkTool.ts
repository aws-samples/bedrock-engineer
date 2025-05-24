/**
 * Think tool implementation
 */

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
  readonly name = 'think'
  readonly description = 'Think through a problem in detail and return the reasoning process'

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
