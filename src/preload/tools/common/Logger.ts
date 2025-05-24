/**
 * Logger wrapper for tools
 */

import { ToolLogger } from '../base/types'
import { createPreloadCategoryLogger } from '../../logger'

/**
 * Creates a logger instance for a specific tool
 */
export class Logger implements ToolLogger {
  private logger: ReturnType<typeof createPreloadCategoryLogger>
  private toolName: string

  constructor(toolName: string) {
    this.toolName = toolName
    this.logger = createPreloadCategoryLogger(`tools:${toolName}`)
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(this.formatMessage(message), this.formatMeta(meta))
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(this.formatMessage(message), this.formatMeta(meta))
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(this.formatMessage(message), this.formatMeta(meta))
  }

  /**
   * Log error message
   */
  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(this.formatMessage(message), this.formatMeta(meta))
  }

  /**
   * Log verbose message
   */
  verbose(message: string, meta?: Record<string, any>): void {
    this.logger.verbose(this.formatMessage(message), this.formatMeta(meta))
  }

  /**
   * Format message with tool name prefix
   */
  private formatMessage(message: string): string {
    return `[${this.toolName}] ${message}`
  }

  /**
   * Format metadata
   */
  private formatMeta(meta?: Record<string, any>): Record<string, any> {
    if (!meta) {
      return { tool: this.toolName }
    }

    return {
      tool: this.toolName,
      ...meta
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    return new Logger(`${this.toolName}:${context}`)
  }

  /**
   * Log execution start
   */
  logExecutionStart(input: any): void {
    this.info('Execution started', {
      input: this.sanitizeForLogging(input)
    })
  }

  /**
   * Log execution success
   */
  logExecutionSuccess(duration: number, result?: any): void {
    this.info('Execution completed successfully', {
      duration,
      resultType: result ? typeof result : 'void',
      resultSize: this.getResultSize(result)
    })
  }

  /**
   * Log execution failure
   */
  logExecutionFailure(duration: number, error: any): void {
    this.error('Execution failed', {
      duration,
      error: error instanceof Error ? error.message : String(error),
      errorType: error?.constructor?.name || typeof error
    })
  }

  /**
   * Sanitize sensitive data for logging
   */
  private sanitizeForLogging(data: any): any {
    if (!data) return data

    // Handle strings
    if (typeof data === 'string') {
      // Truncate long strings
      return data.length > 1000 ? data.substring(0, 1000) + '...' : data
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForLogging(item))
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized: Record<string, any> = {}

      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive keys
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]'
        } else if (key === 'content' && typeof value === 'string' && value.length > 200) {
          // Truncate long content
          sanitized[key] = value.substring(0, 200) + '...'
        } else {
          sanitized[key] = this.sanitizeForLogging(value)
        }
      }

      return sanitized
    }

    return data
  }

  /**
   * Check if a key contains sensitive information
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /apikey/i,
      /api_key/i,
      /credential/i,
      /auth/i,
      /private/i
    ]

    return sensitivePatterns.some((pattern) => pattern.test(key))
  }

  /**
   * Get the size of a result for logging
   */
  private getResultSize(result: any): string | undefined {
    if (!result) return undefined

    if (typeof result === 'string') {
      return `${result.length} chars`
    }

    if (Array.isArray(result)) {
      return `${result.length} items`
    }

    if (typeof result === 'object') {
      const keys = Object.keys(result)
      return `${keys.length} keys`
    }

    return undefined
  }

  /**
   * Create a performance timer
   */
  startTimer(): () => number {
    const startTime = Date.now()
    return () => Date.now() - startTime
  }

  /**
   * Log with structured data
   */
  structured(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data: Record<string, any>
  ): void {
    const structuredData = {
      timestamp: new Date().toISOString(),
      level,
      tool: this.toolName,
      message,
      ...data
    }

    switch (level) {
      case 'debug':
        this.debug(message, structuredData)
        break
      case 'info':
        this.info(message, structuredData)
        break
      case 'warn':
        this.warn(message, structuredData)
        break
      case 'error':
        this.error(message, structuredData)
        break
    }
  }
}

/**
 * Create a logger for a specific tool
 */
export function createToolLogger(toolName: string): Logger {
  return new Logger(toolName)
}

/**
 * Global logger for general tool system messages
 */
export const toolSystemLogger = new Logger('system')
