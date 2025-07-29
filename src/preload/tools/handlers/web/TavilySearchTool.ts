/**
 * TavilySearch tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError, NetworkError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'
import { ipc } from '../../../ipc-client'

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
  static readonly toolName = 'tavilySearch'
  static readonly toolDescription =
    'Perform a web search using Tavily API to get up-to-date information or additional context. Use this when you need current information or feel a search could provide a better answer.\n\nSearch the web for current information. Always cite sources and provide URLs.'

  readonly name = TavilySearchTool.toolName
  readonly description = TavilySearchTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: TavilySearchTool.toolName,
    description: TavilySearchTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          option: {
            type: 'object',
            description: 'Optional configurations for the search',
            properties: {
              include_raw_content: {
                type: 'boolean',
                description:
                  'Whether to include raw content in the search results. DEFAULT is false'
              }
            }
          }
        },
        required: ['query']
      }
    }
  } as const

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
    const tavilyConfig = this.store.get('tavilySearch') as { apikey?: string } | undefined
    const apiKey = tavilyConfig?.apikey

    this.logger.debug('Tavily API key configuration check', {
      hasTavilyConfig: !!tavilyConfig,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : undefined
    })

    if (!apiKey) {
      this.logger.error('Tavily API key not configured', {
        tavilyConfig,
        query
      })
      throw new ExecutionError('Tavily API key not configured', this.name, undefined, { query })
    }

    try {
      this.logger.verbose('Sending request to Tavily API')

      // Get current agent's Tavily search configuration
      const selectedAgentId = this.store.get('selectedAgentId') as string
      const customAgents = this.store.get('customAgents') || []
      const currentAgent = customAgents.find((agent: any) => agent.id === selectedAgentId)
      const domainConfig = currentAgent?.tavilySearchConfig || {
        includeDomains: [],
        excludeDomains: []
      }

      // Use IPC to make the request through main process (which has proxy support)
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          query,
          search_depth: 'advanced',
          include_answer: true,
          include_images: true,
          include_raw_content: option?.include_raw_content ?? false,
          max_results: 5,
          include_domains: domainConfig.includeDomains,
          exclude_domains: domainConfig.excludeDomains
        })
      }

      const response = await ipc('fetch-website', ['https://api.tavily.com/search', fetchOptions])

      this.logger.verbose('Received response from Tavily API')

      const body = response.data

      if (response.status !== 200) {
        this.logger.error('Tavily API error', {
          statusCode: response.status,
          query,
          errorResponse: body
        })

        throw new NetworkError(
          `Tavily API error: ${response.status}`,
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
