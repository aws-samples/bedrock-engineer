/**
 * TavilySearch tool implementation
 */

import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError, NetworkError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for TavilySearchTool
 */
interface TavilySearchInput {
  type: 'tavilySearch'
  query: string
  option?: {
    include_raw_content: boolean
  }
}

/**
 * Tavily search response structure
 */
interface TavilySearchResponse {
  title: string
  url: string
  content: string
  score: number
  raw_content: string
}

/**
 * Result type for TavilySearchTool
 */
interface TavilySearchResult extends ToolResult {
  name: 'tavilySearch'
  result: {
    query: string
    follow_up_questions: null | string[]
    answer: string
    images: string[]
    results: TavilySearchResponse[]
    response_time: number
  }
}

/**
 * Tool for searching using Tavily API
 */
export class TavilySearchTool extends BaseTool<TavilySearchInput, TavilySearchResult> {
  readonly name = 'tavilySearch'
  readonly description = 'Search the web using Tavily search API'

  /**
   * Validate input
   */
  protected validateInput(input: TavilySearchInput): ValidationResult {
    const errors: string[] = []

    if (!input.query) {
      errors.push('Query is required')
    }

    if (typeof input.query !== 'string') {
      errors.push('Query must be a string')
    }

    if (input.query && input.query.trim().length === 0) {
      errors.push('Query cannot be empty')
    }

    if (input.option && typeof input.option.include_raw_content !== 'boolean') {
      errors.push('include_raw_content must be a boolean')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: TavilySearchInput): Promise<TavilySearchResult> {
    const { query, option } = input

    this.logger.debug(`Executing Tavily search with query: ${query}`)

    // Get API key from store
    const tavilyConfig = this.storeManager.get('tavilySearch') as { apikey?: string } | undefined
    const apiKey = tavilyConfig?.apikey

    if (!apiKey) {
      throw new ExecutionError('Tavily API key not configured', this.name, undefined, { query })
    }

    try {
      this.logger.verbose('Sending request to Tavily API')

      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'advanced',
          include_answer: true,
          include_images: true,
          include_raw_content: option?.include_raw_content ?? false,
          max_results: 5,
          include_domains: [],
          exclude_domains: []
        })
      })

      this.logger.verbose('Received response from Tavily API')

      const body = await response.json()

      if (!response.ok) {
        this.logger.error('Tavily API error', {
          statusCode: response.status,
          query,
          errorResponse: body
        })

        throw new NetworkError(
          `Tavily API error: ${response.status} ${response.statusText}`,
          this.name,
          'https://api.tavily.com/search',
          response.status
        )
      }

      this.logger.info('Tavily search completed successfully', {
        query,
        resultCount: body.results?.length || 0,
        searchId: body.search_id,
        tokensUsed: body.tokens_used
      })

      return {
        success: true,
        name: 'tavilySearch',
        message: `Searched using Tavily. Query: ${query}`,
        result: body
      }
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error
      }

      this.logger.error('Error performing Tavily search', {
        error: error instanceof Error ? error.message : String(error),
        query
      })

      throw new ExecutionError(
        `Error searching: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { query }
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
   * Override to sanitize API key from logs
   */
  protected sanitizeInputForLogging(input: TavilySearchInput): any {
    return {
      ...input,
      query: this.truncateForLogging(input.query, 100)
    }
  }
}
