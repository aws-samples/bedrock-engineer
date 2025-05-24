/**
 * Abstract base class for all tools
 */

import { ToolInput, ToolResult } from '../../../types/tools'
import {
  ITool,
  ToolDependencies,
  ToolLogger,
  StoreManager,
  ChunkManager,
  ValidationResult
} from './types'
import { wrapError, ValidationError } from './errors'

/**
 * Abstract base class that all tools must extend
 */
export abstract class BaseTool<TInput extends ToolInput = ToolInput, TResult = ToolResult | string>
  implements ITool<TInput, TResult>
{
  /**
   * Tool name - must be unique
   */
  abstract readonly name: string

  /**
   * Tool description
   */
  abstract readonly description: string

  /**
   * Dependencies injected into the tool
   */
  protected readonly logger: ToolLogger
  protected readonly storeManager: StoreManager
  protected readonly chunkManager: ChunkManager

  constructor(dependencies: ToolDependencies) {
    this.logger = dependencies.logger
    this.storeManager = dependencies.storeManager
    this.chunkManager = dependencies.chunkManager
  }

  /**
   * Execute the tool with the given input
   */
  async execute(input: TInput): Promise<TResult> {
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
      const result = await this.executeInternal(input)

      // Log success
      const duration = Date.now() - startTime
      this.logger.info(`Tool execution successful: ${this.name}`, {
        toolName: this.name,
        duration,
        resultType: typeof result
      })

      return result
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
  protected abstract executeInternal(input: TInput): Promise<TResult>

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
  protected getConfig<T>(key: string, defaultValue?: T): T | undefined {
    return this.storeManager.get(key) ?? defaultValue
  }

  /**
   * Helper method to check if a feature is enabled
   */
  protected isFeatureEnabled(featureKey: string): boolean {
    return this.storeManager.get(featureKey) === true
  }
}
