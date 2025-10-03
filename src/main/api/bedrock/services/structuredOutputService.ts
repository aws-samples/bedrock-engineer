import { InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime'
import { ToolGenerator } from '../utils/toolGenerator'
import { ConverseService } from './converseService'
import { ServiceContext } from '../types'
import { JSONSchema, StructuredOutputError } from '../types/structured-output'
import { createCategoryLogger } from '../../../../common/logger'

const logger = createCategoryLogger('api:structured-output')

/**
 * Service for generating structured outputs from LLMs using JSON schemas
 * This service abstracts away the toolUse implementation details
 */
export class StructuredOutputService {
  private converseService: ConverseService

  constructor(context: ServiceContext) {
    this.converseService = new ConverseService(context)
  }

  /**
   * Generate structured output based on a JSON schema
   * @param params - Request parameters including schema and prompts
   * @returns Structured output conforming to the provided schema
   */
  async getStructuredOutput<T = any>(params: {
    modelId: string
    systemPrompt: string
    userMessage: string
    outputSchema: JSONSchema
    toolOptions?: {
      name?: string
      description?: string
    }
    inferenceConfig?: InferenceConfiguration
  }): Promise<T> {
    logger.debug('Getting structured output', {
      modelId: params.modelId,
      toolName: params.toolOptions?.name || 'structured_output'
    })

    // Generate tool from schema
    const tool = ToolGenerator.generateFromSchema(params.outputSchema, params.toolOptions)

    const toolName = tool.toolSpec!.name

    try {
      // Call converse with the generated tool
      const result = await this.converseService.converse({
        modelId: params.modelId,
        system: [{ text: params.systemPrompt }],
        messages: [
          {
            role: 'user',
            content: [{ text: params.userMessage }]
          }
        ],
        toolConfig: {
          tools: [tool],
          toolChoice: {
            tool: { name: toolName }
          }
        },
        inferenceConfig: params.inferenceConfig
      })

      // Extract tool use from response
      const toolUse = result.output?.message?.content?.find((c) => c.toolUse?.name === toolName)

      if (!toolUse?.toolUse?.input) {
        logger.error('No structured output found in response', {
          modelId: params.modelId,
          toolName,
          contentLength: result.output?.message?.content?.length || 0
        })

        throw new StructuredOutputError(
          'No structured output found in response',
          'MISSING_OUTPUT',
          {
            modelId: params.modelId,
            toolName
          }
        )
      }

      logger.debug('Successfully extracted structured output', {
        modelId: params.modelId,
        toolName
      })

      return toolUse.toolUse.input as T
    } catch (error) {
      if (error instanceof StructuredOutputError) {
        throw error
      }

      logger.error('Error getting structured output', {
        modelId: params.modelId,
        toolName,
        error: error instanceof Error ? error.message : String(error)
      })

      throw new StructuredOutputError('Failed to get structured output', 'VALIDATION_ERROR', {
        modelId: params.modelId,
        toolName,
        originalError: error instanceof Error ? error.message : String(error)
      })
    }
  }
}
