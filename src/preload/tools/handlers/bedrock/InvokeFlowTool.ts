/**
 * InvokeFlow tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for InvokeFlowTool
 */
interface InvokeFlowInput {
  type: 'invokeFlow'
  flowIdentifier: string
  flowAliasIdentifier: string
  inputs: Array<{
    content: {
      document?: any
    }
    nodeName: string
    nodeOutputName: string
  }>
}

/**
 * Result type for InvokeFlowTool
 */
interface InvokeFlowResult extends ToolResult {
  name: 'invokeFlow'
  result: {
    outputs: Array<{
      content: {
        document?: any
      }
      nodeName: string
      nodeOutputName: string
    }>
  }
}

/**
 * Tool for invoking AWS Bedrock Prompt Flows
 */
export class InvokeFlowTool extends BaseTool<InvokeFlowInput, InvokeFlowResult> {
  readonly name = 'invokeFlow'
  readonly description = 'Invoke an AWS Bedrock Prompt Flow to process data'

  /**
   * Validate input
   */
  protected validateInput(input: InvokeFlowInput): ValidationResult {
    const errors: string[] = []

    if (!input.flowIdentifier) {
      errors.push('Flow identifier is required')
    }

    if (typeof input.flowIdentifier !== 'string') {
      errors.push('Flow identifier must be a string')
    }

    if (!input.flowAliasIdentifier) {
      errors.push('Flow alias identifier is required')
    }

    if (typeof input.flowAliasIdentifier !== 'string') {
      errors.push('Flow alias identifier must be a string')
    }

    if (!input.inputs) {
      errors.push('Inputs array is required')
    }

    if (!Array.isArray(input.inputs)) {
      errors.push('Inputs must be an array')
    } else if (input.inputs.length === 0) {
      errors.push('At least one input is required')
    } else {
      input.inputs.forEach((inputItem, index) => {
        if (!inputItem.nodeName) {
          errors.push(`Input at index ${index}: nodeName is required`)
        }
        if (typeof inputItem.nodeName !== 'string') {
          errors.push(`Input at index ${index}: nodeName must be a string`)
        }
        if (!inputItem.nodeOutputName) {
          errors.push(`Input at index ${index}: nodeOutputName is required`)
        }
        if (typeof inputItem.nodeOutputName !== 'string') {
          errors.push(`Input at index ${index}: nodeOutputName must be a string`)
        }
        if (!inputItem.content || typeof inputItem.content !== 'object') {
          errors.push(`Input at index ${index}: content must be an object`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: InvokeFlowInput): Promise<InvokeFlowResult> {
    const { flowIdentifier, flowAliasIdentifier, inputs } = input

    this.logger.debug('Invoking Bedrock Flow', {
      flowIdentifier,
      flowAliasIdentifier,
      inputCount: inputs.length
    })

    try {
      this.logger.info('Calling Bedrock Flow API', {
        flowIdentifier: flowIdentifier.substring(0, 8) + '...',
        flowAliasIdentifier,
        nodes: inputs.map((i) => i.nodeName)
      })

      // Call the main process API
      const response = await ipcRenderer.invoke('bedrock:invokeFlow', {
        flowIdentifier,
        flowAliasIdentifier,
        inputs
      })

      this.logger.info('Flow invocation completed successfully', {
        outputCount: response.outputs?.length || 0,
        flowIdentifier: flowIdentifier.substring(0, 8) + '...'
      })

      return {
        success: true,
        name: 'invokeFlow',
        message: `Flow invoked successfully with ${response.outputs?.length || 0} output(s)`,
        result: response
      }
    } catch (error) {
      this.logger.error('Error invoking Bedrock Flow', {
        error: error instanceof Error ? error.message : String(error),
        flowIdentifier: flowIdentifier.substring(0, 8) + '...',
        flowAliasIdentifier
      })

      throw new ExecutionError(
        `Error invoking Bedrock Flow: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        {
          flowIdentifier: flowIdentifier.substring(0, 8) + '...',
          flowAliasIdentifier,
          inputCount: inputs.length
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
  protected sanitizeInputForLogging(input: InvokeFlowInput): any {
    return {
      ...input,
      flowIdentifier: input.flowIdentifier.substring(0, 8) + '...',
      inputs: input.inputs.map((inputItem) => ({
        nodeName: inputItem.nodeName,
        nodeOutputName: inputItem.nodeOutputName,
        content: this.sanitizeFlowContent(inputItem.content)
      }))
    }
  }

  /**
   * Sanitize flow content for logging
   */
  private sanitizeFlowContent(content: any): any {
    if (!content || typeof content !== 'object') {
      return content
    }

    const sanitized: any = {}

    for (const [key, value] of Object.entries(content)) {
      if (key === 'document' && value) {
        // Truncate document content
        if (typeof value === 'string') {
          sanitized[key] = this.truncateForLogging(value, 100)
        } else if (typeof value === 'object') {
          sanitized[key] = '[DOCUMENT OBJECT]'
        } else {
          sanitized[key] = value
        }
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}
