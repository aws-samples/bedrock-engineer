/**
 * FetchWebsite tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, FetchWebsiteOptions } from '../../base/types'
import { ExecutionError, NetworkError } from '../../base/errors'
import { ChunkManager } from '../../common/ChunkManager'
import { ContentChunker } from '../../../lib/contentChunker'

/**
 * Input type for FetchWebsiteTool
 */
interface FetchWebsiteInput {
  type: 'fetchWebsite'
  url: string
  options?: FetchWebsiteOptions
}

/**
 * Tool for fetching website content
 */
export class FetchWebsiteTool extends BaseTool<FetchWebsiteInput, string> {
  readonly name = 'fetchWebsite'
  readonly description = 'Fetch and parse website content with optional chunking'

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
      if (input.options.chunkIndex !== undefined) {
        if (typeof input.options.chunkIndex !== 'number' || input.options.chunkIndex < 1) {
          errors.push('chunkIndex must be a positive number')
        }
      }

      if (input.options.chunkSize !== undefined) {
        if (typeof input.options.chunkSize !== 'number' || input.options.chunkSize < 1) {
          errors.push('chunkSize must be a positive number')
        }
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
    const { chunkIndex, cleaning, ...requestOptions } = options || {}

    this.logger.debug(`Fetching website: ${url}`, {
      options: JSON.stringify({
        method: requestOptions.method || 'GET',
        chunkIndex,
        cleaning
      })
    })

    try {
      // Check if we have cached chunks
      const cachedChunks = await this.getCachedChunks(url)

      if (cachedChunks && chunkIndex !== undefined) {
        return this.handleChunkRequest(cachedChunks, chunkIndex, url, cleaning)
      }

      // Fetch new content
      this.logger.info(`Fetching new content from: ${url}`)

      const response = await ipcRenderer.invoke('fetch-website', url, requestOptions)

      this.logger.debug(`Website fetch successful: ${url}`, {
        statusCode: response.status,
        contentLength:
          typeof response.data === 'string'
            ? response.data.length
            : JSON.stringify(response.data).length,
        contentType: response.headers['content-type']
      })

      const rawContent =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)

      this.logger.verbose(`Splitting content into chunks`, {
        cleaning: !!cleaning
      })

      // Create chunks
      const chunks = ContentChunker.splitContent(rawContent, { url }, { cleaning: cleaning })

      this.logger.debug(`Content split into ${chunks.length} chunks`)

      // Cache the chunks
      await this.chunkManager.getOrCreate('web', url, async () => chunks)

      // Handle chunk request
      if (chunkIndex !== undefined) {
        return this.handleChunkRequest(chunks, chunkIndex, url, cleaning)
      }

      // Return full content or summary
      if (chunks.length === 1) {
        this.logger.info(`Returning complete website content`, {
          url,
          singleChunk: true,
          contentLength: chunks[0].content.length
        })
        return `Content successfully retrieved:\n\n${chunks[0].content}`
      }

      // Return summary for multiple chunks
      this.logger.info(`Returning website content summary with ${chunks.length} chunks`, {
        url,
        chunkCount: chunks.length
      })

      return this.chunkManager.createChunkSummary(chunks)
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
   * Get cached chunks if available
   */
  private async getCachedChunks(url: string) {
    try {
      // Try to get from chunk manager's internal cache
      const chunks = await this.chunkManager.getOrCreate('web', url, async () => [])
      return chunks.length > 0 ? chunks : null
    } catch {
      return null
    }
  }

  /**
   * Handle chunk request
   */
  private handleChunkRequest(
    chunks: any[],
    chunkIndex: number,
    url: string,
    cleaning?: boolean
  ): string {
    const chunk = this.chunkManager.getChunk(chunks, chunkIndex)

    const content = cleaning ? ChunkManager.extractMainContent(chunk.content) : chunk.content

    this.logger.info(`Returning website content chunk ${chunk.index}/${chunk.total}`, {
      url,
      chunkIndex: chunk.index,
      contentLength: content.length,
      cleaning: !!cleaning
    })

    return ChunkManager.formatChunkOutput(chunk, 'Chunk')
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
