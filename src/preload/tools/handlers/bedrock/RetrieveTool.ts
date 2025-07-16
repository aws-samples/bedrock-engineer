/**
 * Retrieve tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
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
 * Result type for RetrieveTool - matches legacy implementation
 */
interface RetrieveResult extends ToolResult {
  name: 'retrieve'
  result: any // Use any to match legacy implementation flexibility
}

/**
 * Tool for retrieving information from AWS Bedrock Knowledge Base
 */
export class RetrieveTool extends BaseTool<RetrieveInput, RetrieveResult> {
  static readonly toolName = 'retrieve'
  static readonly toolDescription =
    'Retrieve information from a knowledge base using Amazon Bedrock Knowledge Base. Use this when you need to get information from a knowledge base.\n\nQuery knowledge bases for information. Use for domain-specific data retrieval. Only use Bedrock Knowledgebase from allowed list: {{knowledgeBases}}'

  readonly name = RetrieveTool.toolName
  readonly description = RetrieveTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: RetrieveTool.toolName,
    description: RetrieveTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          knowledgeBaseId: {
            type: 'string',
            description: 'The ID of the knowledge base to retrieve from'
          },
          query: {
            type: 'string',
            description: 'The query to search for in the knowledge base'
          }
        },
        required: ['knowledgeBaseId', 'query']
      }
    }
  } as const

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

    this.logger.debug('Retrieving from Knowledge Base', {
      knowledgeBaseId,
      query
    })

    try {
      this.logger.info('Calling Bedrock Knowledge Base', {
        knowledgeBaseId,
        queryLength: query.length
      })

      // Call the main process API using type-safe IPC
      const result = await ipc('bedrock:retrieve', {
        query,
        knowledgeBaseId,
        retrievalConfiguration
      })

      this.logger.info('Knowledge Base retrieval successful', {
        knowledgeBaseId,
        retrievalResultsCount: result.retrievalResults?.length || 0
      })

      if (result.retrievalResults?.length) {
        this.logger.debug('Retrieval results summary', {
          topResult: {
            sourceUri: result.retrievalResults[0].location?.type
              ? result.retrievalResults[0].location?.s3Location?.uri || 'unknown'
              : 'unknown',
            score: result.retrievalResults[0].score
          },
          resultsCount: result.retrievalResults.length
        })
      } else {
        this.logger.warn('Knowledge Base returned no results', {
          knowledgeBaseId,
          query
        })
      }

      return {
        success: true,
        name: 'retrieve',
        message: `Retrieved information from knowledge base ${knowledgeBaseId}`,
        result
      }
    } catch (error: any) {
      this.logger.error('Error retrieving from Knowledge Base', {
        knowledgeBaseId,
        query,
        error: error.message,
        errorName: error.name
      })

      throw `Error retrieve: ${JSON.stringify({
        success: false,
        name: 'retrieve',
        error: 'Failed to retrieve information from knowledge base',
        message: error.message
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
