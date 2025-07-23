/**
 * FetchWebsite tool implementation with line range support
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, FetchWebsiteOptions } from '../../base/types'
import { ExecutionError, NetworkError } from '../../base/errors'
import {
  filterByLineRange,
  getLineRangeInfo,
  validateLineRange
} from '../../../lib/line-range-utils'

/**
 * Input type for FetchWebsiteTool
 */
interface FetchWebsiteInput {
  type: 'fetchWebsite'
  url: string
  options?: FetchWebsiteOptions
}

/**
 * Tool for fetching website content with line range support
 */
export class FetchWebsiteTool extends BaseTool<FetchWebsiteInput, string> {
  static readonly toolName = 'fetchWebsite'
  static readonly toolDescription = `Fetch content from a specified URL with line range filtering support. If the cleaning option is true, extracts plain text content from HTML by removing markup and unnecessary elements. Default is false.`

  readonly name = FetchWebsiteTool.toolName
  readonly description = FetchWebsiteTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: FetchWebsiteTool.toolName,
    description: FetchWebsiteTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to fetch content from'
          },
          options: {
            type: 'object',
            description: 'Optional request configurations',
            properties: {
              method: {
                type: 'string',
                description: 'HTTP method (GET, POST, etc.)',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
              },
              headers: {
                type: 'object',
                description: 'Request headers',
                additionalProperties: {
                  type: 'string'
                }
              },
              body: {
                type: 'string',
                description: 'Request body (for POST, PUT, etc.)'
              },
              cleaning: {
                type: 'boolean',
                description:
                  'Optional. If true, extracts plain text content from HTML by removing markup and unnecessary elements. Default is false.'
              },
              lines: {
                type: 'object',
                description: 'Line range to display from the fetched content',
                properties: {
                  from: {
                    type: 'number',
                    description: 'Starting line number (1-based, inclusive)'
                  },
                  to: {
                    type: 'number',
                    description: 'Ending line number (1-based, inclusive)'
                  }
                }
              },
              saveToFile: {
                type: 'object',
                description: 'Save the fetched content to a file',
                properties: {
                  filename: {
                    type: 'string',
                    description: 'Custom filename (optional, auto-generated if not provided)'
                  },
                  directory: {
                    type: 'string',
                    description:
                      'Directory to save the file (optional, uses project downloads directory if not provided)'
                  },
                  format: {
                    type: 'string',
                    description: 'Format to save the content',
                    enum: ['original', 'cleaned', 'both']
                  }
                }
              }
            }
          }
        },
        required: ['url']
      }
    }
  } as const

  /**
   * System prompt description
   */
  /**
   * Validate input
   */
  protected validateInput(input: FetchWebsiteInput): ValidationResult {
    const errors: string[] = []

    if (!input.url) {
      errors.push('URL is required')
    }

    if (typeof input.url !== 'string') {
      errors.push('URL must be a string')
    }

    if (input.url && !this.isValidUrl(input.url)) {
      errors.push('Invalid URL format')
    }

    if (input.options) {
      // Line range validation
      if (input.options.lines) {
        const lineRangeErrors = validateLineRange(input.options.lines)
        errors.push(...lineRangeErrors)
      }

      if (input.options.cleaning !== undefined && typeof input.options.cleaning !== 'boolean') {
        errors.push('cleaning must be a boolean')
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
  protected async executeInternal(input: FetchWebsiteInput): Promise<string> {
    const { url, options } = input
    const { cleaning, lines, saveToFile, ...requestOptions } = options || {}

    this.logger.debug(`Fetching website: ${url}`, {
      options: JSON.stringify({
        method: requestOptions.method || 'GET',
        cleaning,
        hasLineRange: !!lines
      })
    })

    try {
      // Fetch content using type-safe IPC
      this.logger.info(`Fetching content from: ${url}`)

      const response = await ipc('fetch-website', [url, requestOptions])

      this.logger.debug(`Website fetch successful: ${url}`, {
        statusCode: response.status,
        contentLength:
          typeof response.data === 'string'
            ? response.data.length
            : JSON.stringify(response.data).length,
        contentType: response.headers['content-type']
      })

      const originalContent =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
      let processedContent = originalContent

      // Apply content cleaning if requested
      let cleanedContent: string | undefined
      if (cleaning) {
        cleanedContent = this.extractMainContent(originalContent)
        processedContent = cleanedContent
        this.logger.debug(`Content cleaned`, {
          originalLength: originalContent.length,
          cleanedLength: cleanedContent.length
        })
      }

      // Apply automatic truncation if content exceeds token limit
      if (this.shouldTruncateContent(processedContent)) {
        const originalLength = processedContent.length
        processedContent = this.truncateContentMiddleOut(processedContent)
        this.logger.warn(`Content truncated due to token limit`, {
          originalLength,
          truncatedLength: processedContent.length,
          maxTokensLimit: this.getMaxTokensLimit(),
          strategy: 'middle-out'
        })
      }

      // Handle file saving if requested
      const saveResults: string[] = []
      if (saveToFile) {
        try {
          const savePromises: Promise<any>[] = []

          if (
            saveToFile.format === 'original' ||
            saveToFile.format === 'both' ||
            !saveToFile.format
          ) {
            savePromises.push(
              ipc('save-website-content', {
                content: originalContent,
                url,
                filename: saveToFile.filename,
                directory: saveToFile.directory,
                format: 'html'
              })
            )
          }

          if (saveToFile.format === 'cleaned' || saveToFile.format === 'both') {
            const contentToSave = cleanedContent || this.extractMainContent(originalContent)
            savePromises.push(
              ipc('save-website-content', {
                content: contentToSave,
                url,
                filename: saveToFile.filename ? `${saveToFile.filename}_cleaned` : undefined,
                directory: saveToFile.directory,
                format: 'txt'
              })
            )
          }

          const results = await Promise.all(savePromises)

          for (const result of results) {
            if (result.success) {
              saveResults.push(`✓ File saved successfully: ${result.filePath}`)
              this.logger.info('File saved successfully', { filePath: result.filePath })
            } else {
              saveResults.push(`✗ Failed to save file: ${result.error}`)
              this.logger.error('File save failed', { error: result.error })
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          saveResults.push(`✗ File save error: ${errorMessage}`)
          this.logger.error('File save error', { error: errorMessage })
        }
      }

      // Apply line range filtering
      const filteredContent = filterByLineRange(processedContent, lines)

      // Generate line range info for header
      const totalLines = processedContent.split('\n').length
      const lineInfo = getLineRangeInfo(totalLines, lines)
      let header = `Website Content: ${url}${lineInfo}\n${'='.repeat(url.length + lineInfo.length + 18)}\n`

      // Add save results to header if any
      if (saveResults.length > 0) {
        header += `\nSave Results:\n${saveResults.join('\n')}\n\n`
      }

      this.logger.info(`Website content retrieved successfully`, {
        url,
        totalLines,
        hasLineRange: !!lines,
        contentLength: filteredContent.length,
        filesSaved: saveResults.length
      })

      return header + filteredContent
    } catch (error) {
      this.logger.error(`Error fetching website: ${url}`, {
        error: error instanceof Error ? error.message : String(error),
        options: JSON.stringify(options)
      })

      if (error instanceof Error && error.message.includes('net::')) {
        throw new NetworkError(`Network error fetching website: ${error.message}`, this.name, url)
      }

      throw new ExecutionError(
        `Error fetching website: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { url }
      )
    }
  }

  /**
   * Extract main content from HTML (basic implementation)
   */
  private extractMainContent(html: string): string {
    // Remove script and style tags
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim()

    return content
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the maximum token limit from current LLM settings
   */
  private getMaxTokensLimit(): number {
    const llm = this.store.get('llm')

    // Use LLM-specific limit if available, otherwise use default
    const defaultLimit = 50000 // Default fallback

    if (llm?.maxTokensLimit) {
      return llm.maxTokensLimit
    }

    return defaultLimit
  }

  /**
   * Check if content should be truncated based on token limit
   */
  private shouldTruncateContent(content: string): boolean {
    const maxTokensLimit = this.getMaxTokensLimit()

    // Estimate tokens: roughly 1 character = 0.75 tokens for mixed content
    // Being conservative and using 0.8 as approximation
    const estimatedTokens = Math.ceil(content.length * 0.8)

    return estimatedTokens > maxTokensLimit
  }

  /**
   * Truncate content using middle-out strategy
   * Keeps the beginning (40%) and end (40%) of content, omitting middle (20%)
   */
  private truncateContentMiddleOut(content: string): string {
    const maxTokensLimit = this.getMaxTokensLimit()

    // Convert token limit back to approximate character limit
    const maxLength = Math.floor(maxTokensLimit / 0.8)

    if (content.length <= maxLength) {
      return content
    }

    // Split ratio: 40% front, 40% back
    const frontRatio = 0.4
    const backRatio = 0.4

    const frontLength = Math.floor(maxLength * frontRatio)
    const backLength = Math.floor(maxLength * backRatio)

    // Try to break at word/line boundaries for better readability
    const frontContent = this.smartTruncate(content, 0, frontLength, 'end')
    const backContent = this.smartTruncate(
      content,
      content.length - backLength,
      content.length,
      'start'
    )

    const omittedLength = content.length - frontLength - backLength
    const truncationMessage = `\n\n[Content truncated... (${omittedLength.toLocaleString()} characters omitted)]\n\n`

    return frontContent + truncationMessage + backContent
  }

  /**
   * Smart truncation that tries to break at word/line boundaries
   */
  private smartTruncate(
    content: string,
    start: number,
    end: number,
    breakDirection: 'start' | 'end'
  ): string {
    const rawSlice = content.slice(start, end)

    if (breakDirection === 'end') {
      // For front content, try to end at a complete word or line
      const lastNewline = rawSlice.lastIndexOf('\n')
      const lastSpace = rawSlice.lastIndexOf(' ')

      if (lastNewline > rawSlice.length * 0.8) {
        return rawSlice.slice(0, lastNewline)
      } else if (lastSpace > rawSlice.length * 0.8) {
        return rawSlice.slice(0, lastSpace)
      }
    } else {
      // For back content, try to start at a complete word or line
      const firstNewline = rawSlice.indexOf('\n')
      const firstSpace = rawSlice.indexOf(' ')

      if (firstNewline >= 0 && firstNewline < rawSlice.length * 0.2) {
        return rawSlice.slice(firstNewline + 1)
      } else if (firstSpace >= 0 && firstSpace < rawSlice.length * 0.2) {
        return rawSlice.slice(firstSpace + 1)
      }
    }

    return rawSlice
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize URL parameters from logs
   */
  protected sanitizeInputForLogging(input: FetchWebsiteInput): any {
    try {
      const urlObj = new URL(input.url)
      // Remove sensitive query parameters
      const sanitizedUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`

      return {
        ...input,
        url: sanitizedUrl,
        options: {
          ...input.options,
          // Remove potentially sensitive headers
          headers: input.options?.headers ? '[REDACTED]' : undefined
        }
      }
    } catch {
      return {
        ...input,
        url: '[INVALID URL]'
      }
    }
  }
}
