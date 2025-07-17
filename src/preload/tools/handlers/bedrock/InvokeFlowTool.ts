/**
 * InvokeFlow tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for InvokeFlowTool - supports both object and string inputs
 */
interface InvokeFlowInput {
  type: 'invokeFlow'
  flowIdentifier: string
  flowAliasIdentifier: string
  input:
    | {
        content: {
          document: any
        }
        nodeName?: string
        nodeOutputName?: string
      }
    | string // Allow string input for backward compatibility
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
  static readonly toolName = 'invokeFlow'
  static readonly toolDescription =
    'Invoke AWS Bedrock Flow to execute the specified flow. Flows can be used to automate workflows consisting of multiple steps.\n\nExecute AWS Bedrock Flows. Only use Bedrock Flows from allowed list: {{bedrockFlows}}'

  readonly name = InvokeFlowTool.toolName
  readonly description = InvokeFlowTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: InvokeFlowTool.toolName,
    description: InvokeFlowTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          flowIdentifier: {
            type: 'string',
            description: 'The identifier of the Flow to execute'
          },
          flowAliasIdentifier: {
            type: 'string',
            description: 'The alias identifier of the Flow'
          },
          input: {
            type: 'object',
            description: 'Input data for the Flow',
            properties: {
              content: {
                type: 'object',
                properties: {
                  document: {
                    description:
                      'Data to send to the Flow. Accepts strings, numbers, booleans, objects, and arrays.',
                    anyOf: [
                      { type: 'string' },
                      { type: 'number' },
                      { type: 'boolean' },
                      { type: 'object' },
                      { type: 'array' }
                    ]
                  }
                },
                required: ['document']
              }
            },
            required: ['content']
          }
        },
        required: ['flowIdentifier', 'flowAliasIdentifier', 'input']
      }
    }
  } as const

  /**
   * Parse input if it's a string
   */
  private parseInput(input: any): {
    content: {
      document: any
    }
    nodeName?: string
    nodeOutputName?: string
  } {
    // If input is already an object, return as-is
    if (typeof input === 'object' && input !== null) {
      return input
    }

    // If input is a string, try to parse it as JSON
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input)
        this.logger.debug('Successfully parsed string input to object', {
          originalType: typeof input,
          parsedType: typeof parsed
        })
        return parsed
      } catch (error) {
        this.logger.warn('Failed to parse string input as JSON, treating as document content', {
          error: error instanceof Error ? error.message : String(error)
        })
        // If parsing fails, treat the string as document content
        return {
          content: {
            document: input
          }
        }
      }
    }

    // Fallback: wrap in expected structure
    return {
      content: {
        document: input
      }
    }
  }

  /**
   * Validate input
   */
  protected validateInput(input: InvokeFlowInput): ValidationResult {
    const errors: string[] = []

    if (!input.flowIdentifier) {
      errors.push('Flow identifier is required. Use "flowIdentifier" parameter, not "flowId".')
    }

    if (input.flowIdentifier && typeof input.flowIdentifier !== 'string') {
      errors.push('Flow identifier must be a string')
    }

    if (!input.flowAliasIdentifier) {
      errors.push(
        'Flow alias identifier is required. Use "flowAliasIdentifier" parameter, not "flowAliasId".'
      )
    }

    if (input.flowAliasIdentifier && typeof input.flowAliasIdentifier !== 'string') {
      errors.push('Flow alias identifier must be a string')
    }

    if (input.input === undefined || input.input === null) {
      errors.push('Input is required. Use "input.content.document" structure, not "inputData".')
      return {
        isValid: false,
        errors
      }
    }

    // Try to parse the input
    let parsedInput: any
    try {
      parsedInput = this.parseInput(input.input)
    } catch (error) {
      errors.push("Failed to parse input. Ensure it's a valid object or JSON string.")
      return {
        isValid: false,
        errors
      }
    }

    // Validate parsed input structure
    if (!parsedInput.content || typeof parsedInput.content !== 'object') {
      errors.push('Input content must be an object. Use "input.content.document" structure.')
    }

    // nodeName and nodeOutputName are now optional - we'll provide defaults
    if (parsedInput.nodeName && typeof parsedInput.nodeName !== 'string') {
      errors.push('Input nodeName must be a string')
    }

    if (parsedInput.nodeOutputName && typeof parsedInput.nodeOutputName !== 'string') {
      errors.push('Input nodeOutputName must be a string')
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
    const { flowIdentifier, flowAliasIdentifier } = input

    // Validate that required parameters are not undefined before proceeding
    if (!flowIdentifier || !flowAliasIdentifier) {
      throw new Error(
        'Missing required parameters: flowIdentifier and flowAliasIdentifier are required'
      )
    }

    // Parse the input (handles both string and object inputs)
    const parsedInput = this.parseInput(input.input)

    // Apply default values based on the old implementation
    const processedInput = {
      ...parsedInput,
      nodeName: parsedInput.nodeName || 'FlowInputNode',
      nodeOutputName: parsedInput.nodeOutputName || 'document'
    }

    this.logger.debug('Invoking Bedrock Flow', {
      flowIdentifier,
      flowAliasIdentifier,
      nodeName: processedInput.nodeName,
      nodeOutputName: processedInput.nodeOutputName,
      inputType: typeof input.input,
      parsedInputType: typeof parsedInput
    })

    try {
      // Safe substring operation with null check
      const flowIdForLog =
        flowIdentifier && flowIdentifier.length > 8
          ? flowIdentifier.substring(0, 8) + '...'
          : flowIdentifier || 'unknown'

      this.logger.info('Calling Bedrock Flow API', {
        flowIdentifier: flowIdForLog,
        flowAliasIdentifier,
        nodeName: processedInput.nodeName
      })

      // Call the main process API using type-safe IPC - convert to expected inputs array format
      const response = await ipc('bedrock:invokeFlow', {
        flowIdentifier,
        flowAliasIdentifier,
        inputs: [processedInput] // Convert single input to inputs array as expected by API
      })

      this.logger.info('Flow invocation completed successfully', {
        outputCount: response.outputs?.length || 0,
        flowIdentifier: flowIdForLog
      })

      return {
        success: true,
        name: 'invokeFlow',
        message: `Flow invoked successfully with ${response.outputs?.length || 0} output(s)`,
        result: response
      }
    } catch (error: any) {
      // Safe substring operation with null check for error logging
      const flowIdForLog =
        flowIdentifier && flowIdentifier.length > 8
          ? flowIdentifier.substring(0, 8) + '...'
          : flowIdentifier || 'unknown'

      this.logger.error('Error invoking Bedrock Flow', {
        error: error instanceof Error ? error.message : String(error),
        flowIdentifier: flowIdForLog,
        flowAliasIdentifier
      })

      throw `Error invokeFlow: ${JSON.stringify({
        success: false,
        name: 'invokeFlow',
        error: 'Failed to invoke Bedrock Flow',
        message: error.message || String(error)
      })}`
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
    // Safe substring operation with null check
    const flowIdForLog =
      input.flowIdentifier && input.flowIdentifier.length > 8
        ? input.flowIdentifier.substring(0, 8) + '...'
        : input.flowIdentifier || 'unknown'

    let sanitizedInput: any
    try {
      const parsedInput = this.parseInput(input.input)
      sanitizedInput = {
        nodeName: parsedInput?.nodeName || 'FlowInputNode',
        nodeOutputName: parsedInput?.nodeOutputName || 'document',
        content: this.sanitizeFlowContent(parsedInput?.content)
      }
    } catch (error) {
      sanitizedInput = {
        inputType: typeof input.input,
        inputPreview:
          typeof input.input === 'string' ? this.truncateForLogging(input.input, 100) : '[OBJECT]'
      }
    }

    return {
      ...input,
      flowIdentifier: flowIdForLog,
      input: sanitizedInput
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
