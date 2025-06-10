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
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for FetchWebsiteTool
 */
interface FetchWebsiteInput {
  type: 'fetchWebsite'
  url: string
  options?: FetchWebsiteOptions
}

/**
 * Result type for FetchWebsiteTool
 */
interface FetchWebsiteResult extends ToolResult {
  name: 'fetchWebsite'
  result: {
    url: string
    content: string
    statusCode?: number
    contentType?: string
    totalLines?: number
    cleaning?: boolean
  }
}

/**
 * Tool for fetching website content with line range support
 */
export class FetchWebsiteTool extends BaseTool<FetchWebsiteInput, FetchWebsiteResult> {
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
  static readonly systemPromptDescription =
    'Retrieve content from specific URLs.\nSupports content cleaning and line filtering.'

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
  protected async executeInternal(input: FetchWebsiteInput): Promise<FetchWebsiteResult> {
    const { url, options } = input
    const { cleaning, lines, ...requestOptions } = options || {}

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

      let rawContent =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)

      // Apply content cleaning if requested
      if (cleaning) {
        rawContent = this.extractMainContent(rawContent)
        this.logger.debug(`Content cleaned`, {
          originalLength: rawContent.length,
          cleanedLength: rawContent.length
        })
      }

      // Apply line range filtering
      const filteredContent = filterByLineRange(rawContent, lines)

      // Generate line range info for header
      const totalLines = rawContent.split('\n').length
      const lineInfo = getLineRangeInfo(totalLines, lines)
      const header = `Website Content: ${url}${lineInfo}\n${'='.repeat(url.length + lineInfo.length + 18)}\n`
      const finalContent = header + filteredContent

      this.logger.info(`Website content retrieved successfully`, {
        url,
        totalLines,
        hasLineRange: !!lines,
        contentLength: filteredContent.length
      })

      return {
        success: true,
        name: 'fetchWebsite',
        message: `Successfully fetched content from: ${url}`,
        result: {
          url,
          content: finalContent,
          statusCode: response.status,
          contentType: response.headers['content-type'],
          totalLines: lines ? undefined : totalLines,
          cleaning
        }
      }
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
