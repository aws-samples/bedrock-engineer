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
    'Use the tool to think about something. It will not obtain new information or make any changes to the repository, but just log the thought. Use it when complex reasoning or brainstorming is needed. For example, if you explore the repo and discover the source of a bug, call this tool to brainstorm several unique ways of fixing the bug, and assess which change(s) are likely to be simplest and most effective. Alternatively, if you receive some test results, call this tool to brainstorm ways to fix the failing tests.'

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
   * System prompt description
   */
  static readonly systemPromptDescription = `Process complex reasoning and brainstorming.
Use for analysis before making changes.

Before taking any action or responding to the user after receiving tool results, use the think tool as a scratchpad to:
- List the specific rules that apply to the current request
- Check if all required information is collected
- Verify that the planned action complies with all policies
- Iterate over tool results for correctness

Here are some examples of what to iterate over inside the think tool:
<think_tool_example_1>
User wants to cancel flight ABC123
- Need to verify: user ID, reservation ID, reason
- Check cancellation rules:
  * Is it within 24h of booking?
  * If not, check ticket class and insurance
- Verify no segments flown or are in the past
- Plan: collect missing info, verify rules, get confirmation
</think_tool_example_1>

<think_tool_example_2>
User wants to book 3 tickets to NYC with 2 checked bags each
- Need user ID to check:
  * Membership tier for baggage allowance
  * Which payments methods exist in profile
- Baggage calculation:
  * Economy class × 3 passengers
  * If regular member: 1 free bag each → 3 extra bags = $150
  * If silver member: 2 free bags each → 0 extra bags = $0
  * If gold member: 3 free bags each → 0 extra bags = $0
- Payment rules to verify:
  * Max 1 travel certificate, 1 credit card, 3 gift cards
  * All payment methods must be in profile
  * Travel certificate remainder goes to waste
- Plan:
1. Get user ID
2. Verify membership level for bag fees
3. Check which payment methods in profile and if their combination is allowed
4. Calculate total: ticket price + any bag fees
5. Get explicit confirmation for booking
</think_tool_example_2>
    `

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
