/**
 * InvokeBedrockAgent tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for InvokeBedrockAgentTool
 */
interface InvokeBedrockAgentInput {
  type: 'invokeBedrockAgent'
  agentId: string
  agentAliasId: string
  sessionId?: string
  inputText: string
  enableTrace?: boolean
  endSession?: boolean
  sessionState?: {
    sessionAttributes?: Record<string, string>
    promptSessionAttributes?: Record<string, string>
  }
}

/**
 * Result type for InvokeBedrockAgentTool
 */
interface InvokeBedrockAgentResult extends ToolResult {
  name: 'invokeBedrockAgent'
  result: {
    completion: {
      text: string
    }
    sessionId: string
    trace?: any
  }
}

/**
 * Tool for invoking AWS Bedrock Agents
 */
export class InvokeBedrockAgentTool extends BaseTool<
  InvokeBedrockAgentInput,
  InvokeBedrockAgentResult
> {
  readonly name = 'invokeBedrockAgent'
  readonly description = 'Invoke an AWS Bedrock Agent to process requests'

  /**
   * Validate input
   */
  protected validateInput(input: InvokeBedrockAgentInput): ValidationResult {
    const errors: string[] = []

    if (!input.agentId) {
      errors.push('Agent ID is required')
    }

    if (typeof input.agentId !== 'string') {
      errors.push('Agent ID must be a string')
    }

    if (!input.agentAliasId) {
      errors.push('Agent alias ID is required')
    }

    if (typeof input.agentAliasId !== 'string') {
      errors.push('Agent alias ID must be a string')
    }

    if (!input.inputText) {
      errors.push('Input text is required')
    }

    if (typeof input.inputText !== 'string') {
      errors.push('Input text must be a string')
    }

    if (input.inputText && input.inputText.trim().length === 0) {
      errors.push('Input text cannot be empty')
    }

    if (input.sessionId !== undefined && typeof input.sessionId !== 'string') {
      errors.push('Session ID must be a string')
    }

    if (input.enableTrace !== undefined && typeof input.enableTrace !== 'boolean') {
      errors.push('Enable trace must be a boolean')
    }

    if (input.endSession !== undefined && typeof input.endSession !== 'boolean') {
      errors.push('End session must be a boolean')
    }

    if (input.sessionState) {
      if (
        input.sessionState.sessionAttributes &&
        typeof input.sessionState.sessionAttributes !== 'object'
      ) {
        errors.push('Session attributes must be an object')
      }
      if (
        input.sessionState.promptSessionAttributes &&
        typeof input.sessionState.promptSessionAttributes !== 'object'
      ) {
        errors.push('Prompt session attributes must be an object')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(
    input: InvokeBedrockAgentInput
  ): Promise<InvokeBedrockAgentResult> {
    const {
      agentId,
      agentAliasId,
      sessionId,
      inputText,
      enableTrace = false,
      endSession = false,
      sessionState
    } = input

    this.logger.debug('Invoking Bedrock Agent', {
      agentId,
      agentAliasId,
      hasSessionId: !!sessionId,
      inputTextLength: inputText.length,
      enableTrace,
      endSession
    })

    try {
      this.logger.info('Calling Bedrock Agent API', {
        agentId: agentId.substring(0, 8) + '...',
        agentAliasId
      })

      // Call the main process API
      const response = await ipcRenderer.invoke('bedrock:invokeAgent', {
        agentId,
        agentAliasId,
        sessionId,
        inputText,
        enableTrace,
        endSession,
        sessionState
      })

      this.logger.info('Agent invocation completed successfully', {
        sessionId: response.sessionId,
        responseLength: response.completion?.text?.length || 0,
        hasTrace: !!response.trace
      })

      return {
        success: true,
        name: 'invokeBedrockAgent',
        message: 'Agent invoked successfully',
        result: response
      }
    } catch (error) {
      this.logger.error('Error invoking Bedrock Agent', {
        error: error instanceof Error ? error.message : String(error),
        agentId: agentId.substring(0, 8) + '...',
        agentAliasId
      })

      throw new ExecutionError(
        `Error invoking Bedrock Agent: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        {
          agentId: agentId.substring(0, 8) + '...',
          agentAliasId,
          inputText: this.truncateForLogging(inputText, 100)
        }
      )
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize sensitive data for logging
   */
  protected sanitizeInputForLogging(input: InvokeBedrockAgentInput): any {
    return {
      ...input,
      agentId: input.agentId.substring(0, 8) + '...',
      inputText: this.truncateForLogging(input.inputText, 200),
      sessionState: input.sessionState
        ? {
            sessionAttributes: input.sessionState.sessionAttributes ? '[REDACTED]' : undefined,
            promptSessionAttributes: input.sessionState.promptSessionAttributes
              ? '[REDACTED]'
              : undefined
          }
        : undefined
    }
  }
}
