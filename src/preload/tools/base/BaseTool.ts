/**
 * Abstract base class for all tools
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ZodSchema } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { ToolInput, ToolResult, ToolName } from '../../../types/tools'
import { ITool, ToolDependencies, ToolLogger, ValidationResult } from './types'
import { wrapError, ValidationError } from './errors'
import { ConfigStore } from '../../store'
import { ContentChunker } from '../../lib/contentChunker'

/**
 * Utility function to convert Zod schema to JSON Schema body
 */
export const zodToJsonSchemaBody = (schema: ZodSchema) => {
  const key = 'mySchema'
  const jsonSchema = zodToJsonSchema(schema, key)
  return jsonSchema.definitions?.[key] as any
}

/**
 * Abstract base class that all tools must extend
 */
export abstract class BaseTool<TInput extends ToolInput = ToolInput, TResult = ToolResult | string>
  implements ITool<TInput, TResult>
{
  /**
   * Tool name - must be unique
   */
  abstract readonly name: ToolName

  /**
   * Tool description
   */
  abstract readonly description: string

  /**
   * AWS Bedrock tool specification - should be defined as static in each tool
   */
  static readonly toolSpec?: Tool['toolSpec']

  /**
   * Dependencies injected into the tool
   */
  protected readonly logger: ToolLogger
  protected readonly store: ConfigStore

  constructor(dependencies: ToolDependencies) {
    this.logger = dependencies.logger
    this.store = dependencies.store
  }

  /**
   * Execute the tool with the given input
   */
  async execute(input: TInput, context?: any): Promise<TResult> {
    const startTime = Date.now()

    this.logger.info(`Executing tool: ${this.name}`, {
      toolName: this.name,
      input: this.sanitizeInputForLogging(input)
    })

    try {
      // Validate input
      const validation = this.validateInput(input)
      if (!validation.isValid) {
        throw new ValidationError(
          `Invalid input: ${validation.errors.join(', ')}`,
          this.name,
          input
        )
      }

      // Execute the tool
      const result = await this.executeInternal(input, context)

      // Check if result should be chunked based on store settings
      const processedResult = this.processResultForModel(result)

      // Log success
      const duration = Date.now() - startTime
      this.logger.info(`Tool execution successful: ${this.name}`, {
        toolName: this.name,
        duration,
        resultType: typeof processedResult,
        wasChunked: processedResult !== result
      })

      return processedResult
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime
      this.logger.error(`Tool execution failed: ${this.name}`, {
        toolName: this.name,
        duration,
        error: error instanceof Error ? error.message : String(error)
      })

      // Wrap and throw error
      throw this.handleError(error)
    }
  }

  /**
   * Validate the input before execution
   * @returns ValidationResult indicating if input is valid
   */
  protected abstract validateInput(input: TInput): ValidationResult

  /**
   * Internal execution logic - must be implemented by subclasses
   */
  protected abstract executeInternal(input: TInput, context?: any): Promise<TResult>

  /**
   * Handle errors in a consistent way
   * Can be overridden by subclasses for custom error handling
   */
  protected handleError(error: unknown): Error {
    const toolError = wrapError(error, this.name)

    // Return the error response string if needed
    if (this.shouldReturnErrorAsString()) {
      return new Error(toolError.toResponse())
    }

    return toolError
  }

  /**
   * Sanitize input for logging to avoid logging sensitive data
   * Can be overridden by subclasses
   */
  protected sanitizeInputForLogging(input: TInput): any {
    // Default implementation - stringify the input
    try {
      return JSON.stringify(input)
    } catch {
      return '[Complex Object]'
    }
  }

  /**
   * Determine if errors should be returned as JSON strings
   * Can be overridden by subclasses
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Helper method to create a successful ToolResult
   */
  protected createSuccessResult(message: string, result?: any): ToolResult {
    return {
      success: true,
      name: this.name,
      message,
      result
    }
  }

  /**
   * Helper method to create a failed ToolResult
   */
  protected createErrorResult(error: string, details?: any): ToolResult {
    return {
      success: false,
      name: this.name,
      error,
      ...details
    }
  }

  /**
   * Helper method to format file paths for output
   */
  protected formatPath(path: string): string {
    return path.replace(/\\/g, '/')
  }

  /**
   * Helper method to truncate long strings for logging
   */
  protected truncateForLogging(str: string, maxLength: number = 100): string {
    if (str.length <= maxLength) {
      return str
    }
    return str.substring(0, maxLength) + '...'
  }

  /**
   * Helper method to get configuration from store
   */
  protected getConfig<T>(key: Parameters<ConfigStore['get']>[0], defaultValue?: T): T | undefined {
    const value = this.store.get(key)
    return value !== undefined ? (value as T) : defaultValue
  }

  /**
   * Helper method to check if a feature is enabled
   */
  protected isFeatureEnabled(featureKey: Parameters<ConfigStore['get']>[0]): boolean {
    return this.store.get(featureKey) === true
  }

  /**
   * Process result for token limitations based on store settings
   */
  protected processResultForModel(result: TResult): TResult {
    if (!this.shouldUseChunking()) {
      return result
    }

    // Serialize result to string for size checking
    let serialized: string
    const isOriginallyString = typeof result === 'string'

    try {
      serialized = isOriginallyString ? (result as string) : JSON.stringify(result, null, 2)
    } catch (error) {
      // If JSON.stringify fails, convert to string representation
      serialized = String(result)
      this.logger.warn(`Failed to serialize result for chunking: ${error}`)
    }

    const contentChunker = new ContentChunker(this.store)
    if (!contentChunker.isContentTooLarge(serialized)) {
      return result
    }

    const inferenceParams = this.store.get('inferenceParams')
    const maxTokens = inferenceParams?.maxTokens || 4096

    this.logger.info(`Result too large for configured maxTokens (${maxTokens}), chunking content`, {
      toolName: this.name,
      originalLength: serialized.length,
      estimatedTokens: ContentChunker.estimateToken(serialized),
      maxTokens,
      resultType: typeof result
    })

    // Create chunked content with first chunk and continuation info
    const chunks = contentChunker.splitContent(serialized)

    if (chunks.length === 0) {
      return result
    }

    const firstChunk = chunks[0]
    const continuationInfo =
      chunks.length > 1
        ? `\n\n[Content truncated due to token limit. This is chunk ${firstChunk.index} of ${firstChunk.total}. The content was split to fit within the configured ${firstChunk.metadata?.tokenLimit} token limit.]`
        : ''

    const truncatedContent = firstChunk.content + continuationInfo

    // Return in appropriate format based on original type
    if (isOriginallyString) {
      return truncatedContent as TResult
    } else {
      // For non-string results, return as truncated string representation
      return truncatedContent as TResult
    }
  }

  /**
   * Check if this tool should use chunking
   * Can be overridden by subclasses to disable chunking
   */
  protected shouldUseChunking(): boolean {
    return true
  }
}
