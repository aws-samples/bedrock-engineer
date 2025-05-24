/**
 * Retrieve tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for RetrieveTool
 */
interface RetrieveInput {
  type: 'retrieve'
  query: string
  knowledgeBaseId: string
  retrievalConfiguration?: {
    vectorSearchConfiguration: {
      numberOfResults?: number
      overrideSearchType?: 'HYBRID' | 'SEMANTIC'
      filter?: {
        equals?: {
          key: string
          value: any
        }
      }
    }
  }
}

/**
 * Retrieved result structure
 */
interface RetrievedResult {
  content: {
    text: string
  }
  location?: {
    type: string
    s3Location?: {
      uri: string
    }
  }
  score?: number
  metadata?: Record<string, any>
}

/**
 * Result type for RetrieveTool
 */
interface RetrieveResult extends ToolResult {
  name: 'retrieve'
  result: {
    retrievalResults: RetrievedResult[]
  }
}

/**
 * Tool for retrieving information from AWS Bedrock Knowledge Base
 */
export class RetrieveTool extends BaseTool<RetrieveInput, RetrieveResult> {
  readonly name = 'retrieve'
  readonly description = 'Retrieve relevant information from AWS Bedrock Knowledge Base'

  /**
   * Validate input
   */
  protected validateInput(input: RetrieveInput): ValidationResult {
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

    if (!input.knowledgeBaseId) {
      errors.push('Knowledge base ID is required')
    }

    if (typeof input.knowledgeBaseId !== 'string') {
      errors.push('Knowledge base ID must be a string')
    }

    if (input.retrievalConfiguration) {
      const config = input.retrievalConfiguration.vectorSearchConfiguration

      if (config.numberOfResults !== undefined) {
        if (typeof config.numberOfResults !== 'number' || config.numberOfResults < 1) {
          errors.push('Number of results must be a positive number')
        }
      }

      if (config.overrideSearchType !== undefined) {
        if (!['HYBRID', 'SEMANTIC'].includes(config.overrideSearchType)) {
          errors.push('Override search type must be either HYBRID or SEMANTIC')
        }
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
  protected async executeInternal(input: RetrieveInput): Promise<RetrieveResult> {
    const { query, knowledgeBaseId, retrievalConfiguration } = input

    this.logger.debug('Retrieving from Bedrock Knowledge Base', {
      queryLength: query.length,
      knowledgeBaseId,
      numberOfResults: retrievalConfiguration?.vectorSearchConfiguration?.numberOfResults
    })

    try {
      this.logger.info('Calling Bedrock retrieve API', {
        knowledgeBaseId,
        searchType: retrievalConfiguration?.vectorSearchConfiguration?.overrideSearchType
      })

      // Call the main process API
      const response = await ipcRenderer.invoke('bedrock:retrieve', {
        query,
        knowledgeBaseId,
        retrievalConfiguration
      })

      this.logger.info('Retrieval completed successfully', {
        resultCount: response.retrievalResults?.length || 0,
        knowledgeBaseId
      })

      return {
        success: true,
        name: 'retrieve',
        message: `Retrieved ${response.retrievalResults?.length || 0} result(s) from knowledge base`,
        result: response
      }
    } catch (error) {
      this.logger.error('Error retrieving from knowledge base', {
        error: error instanceof Error ? error.message : String(error),
        knowledgeBaseId,
        query: this.truncateForLogging(query, 100)
      })

      throw new ExecutionError(
        `Error retrieving from knowledge base: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { knowledgeBaseId, query: this.truncateForLogging(query, 100) }
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
   * Override to sanitize query for logging
   */
  protected sanitizeInputForLogging(input: RetrieveInput): any {
    return {
      ...input,
      query: this.truncateForLogging(input.query, 200),
      knowledgeBaseId: input.knowledgeBaseId.substring(0, 8) + '...' // Show only first 8 chars
    }
  }
}
