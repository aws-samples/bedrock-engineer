/**
 * GenerateVideo tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for GenerateVideoTool
 */
interface GenerateVideoInput {
  type: 'generateVideo'
  prompt: string
  durationSeconds: number
  outputPath?: string
  seed?: number
  inputImages?: string[]
  prompts?: string[]
}

/**
 * Result type for GenerateVideoTool
 */
interface GenerateVideoResult extends ToolResult {
  name: 'generateVideo'
  result: {
    invocationArn: string
    status: string
    prompt: string
    durationSeconds: number
    seed?: number
    estimatedCompletionTime?: string
  }
}

/**
 * Tool for generating video using Amazon Nova Reel (non-blocking)
 */
export class GenerateVideoTool extends BaseTool<GenerateVideoInput, GenerateVideoResult> {
  static readonly toolName = 'generateVideo'
  static readonly toolDescription =
    'Generate video using Amazon Nova Reel. Creates realistic, studio-quality videos from text prompts or images. Supports Text-to-Video (6 seconds) and Multi-Shot generation (12-120 seconds). For image input: single image for TEXT_VIDEO mode, multiple images for MULTI_SHOT_MANUAL mode. Returns immediately with job ARN for status tracking.'

  readonly name = GenerateVideoTool.toolName
  readonly description = GenerateVideoTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: GenerateVideoTool.toolName,
    description: GenerateVideoTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Text description of the video (1-4000 characters)',
            minLength: 1,
            maxLength: 512
          },
          durationSeconds: {
            type: 'number',
            description:
              'Duration: 6 seconds (TEXT_VIDEO) or 12-120 seconds in multiples of 6 (MULTI_SHOT_AUTOMATED)',
            enum: [
              6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120
            ]
          },
          outputPath: {
            type: 'string',
            description: 'Optional. Local path to save video. Uses project path if not specified.'
          },
          seed: {
            type: 'number',
            description: 'Optional. Seed for deterministic generation (0-2147483646)',
            minimum: 0,
            maximum: 2147483646
          },
          inputImages: {
            type: 'array',
            items: {
              type: 'string'
            },
            description:
              'Optional. Array of input image file paths (must be 1280x720 resolution, PNG or JPEG format). For TEXT_VIDEO: single image only. For MULTI_SHOT: multiple images supported as shot starting frames.'
          },
          prompts: {
            type: 'array',
            items: {
              type: 'string'
            },
            description:
              'Optional. Array of prompts for each shot when using multiple images. Must match the number of inputImages if provided.'
          }
        },
        required: ['prompt', 'durationSeconds']
      }
    }
  } as const

  /**
   * System prompt description
   */
  /**
   * Validate input
   */
  protected validateInput(input: GenerateVideoInput): ValidationResult {
    const errors: string[] = []

    if (!input.prompt) {
      errors.push('Prompt is required')
    }

    if (typeof input.prompt !== 'string') {
      errors.push('Prompt must be a string')
    }

    if (input.prompt && input.prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty')
    }

    if (input.prompt && input.prompt.length > 4000) {
      errors.push('Prompt must be 4000 characters or less')
    }

    if (typeof input.durationSeconds !== 'number') {
      errors.push('Duration seconds must be a number')
    }

    if (input.durationSeconds) {
      const validDurations = [
        6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120
      ]
      if (!validDurations.includes(input.durationSeconds)) {
        errors.push(
          'Duration must be 6 seconds (TEXT_VIDEO) or a multiple of 6 between 12-120 seconds (MULTI_SHOT_AUTOMATED)'
        )
      }
    }

    if (input.outputPath !== undefined && typeof input.outputPath !== 'string') {
      errors.push('Output path must be a string')
    }

    if (input.seed !== undefined) {
      if (typeof input.seed !== 'number') {
        errors.push('Seed must be a number')
      } else if (input.seed < 0 || input.seed > 2147483646) {
        errors.push('Seed must be between 0 and 2147483646')
      }
    }

    // Validate inputImages
    if (input.inputImages !== undefined) {
      if (!Array.isArray(input.inputImages)) {
        errors.push('inputImages must be an array')
      } else {
        if (input.inputImages.length === 0) {
          errors.push('inputImages array cannot be empty when provided')
        }

        // For TEXT_VIDEO (6 seconds), only allow single image
        if (input.durationSeconds === 6 && input.inputImages.length > 1) {
          errors.push('TEXT_VIDEO mode (6 seconds) supports only a single input image')
        }

        // Validate each image path
        input.inputImages.forEach((imagePath, index) => {
          if (typeof imagePath !== 'string') {
            errors.push(`inputImages[${index}] must be a string`)
          } else if (imagePath.trim().length === 0) {
            errors.push(`inputImages[${index}] cannot be empty`)
          } else {
            // Check file extension
            const ext = imagePath.toLowerCase().split('.').pop()
            if (!ext || !['png', 'jpg', 'jpeg'].includes(ext)) {
              errors.push(`inputImages[${index}] must be PNG or JPEG format (${imagePath})`)
            }
          }
        })
      }
    }

    // Validate prompts
    if (input.prompts !== undefined) {
      if (!Array.isArray(input.prompts)) {
        errors.push('prompts must be an array')
      } else {
        // Validate each prompt
        input.prompts.forEach((prompt, index) => {
          if (typeof prompt !== 'string') {
            errors.push(`prompts[${index}] must be a string`)
          } else if (prompt.trim().length === 0) {
            errors.push(`prompts[${index}] cannot be empty`)
          } else if (prompt.length > 4000) {
            errors.push(`prompts[${index}] must be 4000 characters or less`)
          }
        })

        // If both inputImages and prompts are provided, they must have the same length
        if (input.inputImages && input.inputImages.length !== input.prompts.length) {
          errors.push(
            `prompts array length (${input.prompts.length}) must match inputImages array length (${input.inputImages.length})`
          )
        }
      }
    }

    // If prompts is provided without inputImages, that's an error
    if (input.prompts && !input.inputImages) {
      errors.push('prompts array can only be used together with inputImages')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: GenerateVideoInput): Promise<GenerateVideoResult> {
    const { prompt, durationSeconds, outputPath, seed, inputImages, prompts } = input

    // Check S3 URI configuration
    const generateVideoConfig = this.storeManager.get<{ s3Uri?: string }>('generateVideoTool')
    const s3Uri = generateVideoConfig?.s3Uri

    if (!s3Uri) {
      throw new ExecutionError(
        'S3 URI is not configured. Please configure S3 URI in tool settings before generating videos.',
        this.name,
        undefined,
        {
          hint: 'Go to Tool Settings and configure generateVideo S3 URI (e.g., s3://your-bucket/videos/)'
        }
      )
    }

    if (!s3Uri.startsWith('s3://')) {
      throw new ExecutionError(
        'Invalid S3 URI format. S3 URI must start with s3://',
        this.name,
        undefined,
        { s3Uri }
      )
    }

    this.logger.debug('Starting video generation with Nova Reel', {
      promptLength: prompt.length,
      durationSeconds,
      outputPath,
      s3Uri,
      seed,
      hasInputImages: !!inputImages,
      imageCount: inputImages?.length || 0,
      hasPrompts: !!prompts,
      promptCount: prompts?.length || 0
    })

    try {
      const estimatedMinutes = Math.round(durationSeconds * 1.5)
      this.logger.info('Starting Nova Reel video generation', {
        durationSeconds,
        estimatedTime: `${estimatedMinutes} minutes`,
        s3Uri,
        mode: inputImages
          ? durationSeconds === 6
            ? 'TEXT_VIDEO with image'
            : 'MULTI_SHOT_MANUAL'
          : 'TEXT_VIDEO or MULTI_SHOT_AUTOMATED'
      })

      // Call the main process API to start video generation (non-blocking)
      const response = await ipc('bedrock:startVideoGeneration', {
        prompt,
        durationSeconds,
        outputPath,
        seed,
        s3Uri,
        inputImages,
        prompts
      })

      if (!response.invocationArn) {
        throw new Error('Failed to start video generation: No invocation ARN returned')
      }

      this.logger.info('Video generation started successfully', {
        invocationArn: response.invocationArn,
        estimatedCompletionTime: `${estimatedMinutes} minutes`
      })

      const successMessage = `Video generation started successfully. Use checkVideoStatus with ARN: ${response.invocationArn} to track progress.`

      return {
        success: true,
        name: 'generateVideo',
        message: successMessage,
        result: {
          invocationArn: response.invocationArn,
          status: 'InProgress',
          prompt,
          durationSeconds,
          seed,
          estimatedCompletionTime: `${estimatedMinutes} minutes`
        }
      }
    } catch (error) {
      this.logger.error('Error starting video generation', {
        error: error instanceof Error ? error.message : String(error),
        prompt: this.truncateForLogging(prompt, 100),
        durationSeconds,
        s3Uri,
        hasInputImages: !!inputImages,
        imageCount: inputImages?.length || 0
      })

      throw new ExecutionError(
        `Error starting video generation: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        {
          prompt: this.truncateForLogging(prompt, 100),
          durationSeconds,
          s3Uri,
          outputPath,
          hasInputImages: !!inputImages,
          imageCount: inputImages?.length || 0
        }
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
   * Override to sanitize prompt for logging
   */
  protected sanitizeInputForLogging(input: GenerateVideoInput): any {
    const config = this.storeManager.get<{ s3Uri?: string }>('generateVideoTool')

    return {
      ...input,
      prompt: this.truncateForLogging(input.prompt, 200),
      s3Uri: config?.s3Uri ? '***configured***' : '***not configured***'
    }
  }
}
