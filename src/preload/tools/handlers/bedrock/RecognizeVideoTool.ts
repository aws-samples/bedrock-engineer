/**
 * RecognizeVideo tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import * as fs from 'fs/promises'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for RecognizeVideoTool
 */
interface RecognizeVideoInput {
  type: 'recognizeVideo'
  videoPath: string
  prompt?: string
  modelId?: string
  s3BucketName?: string
  cleanupS3?: boolean
}

/**
 * Result type for RecognizeVideoTool
 */
interface RecognizeVideoResult extends ToolResult {
  name: 'recognizeVideo'
  result: {
    description: string
    s3Uri?: string
    processingTime: number
    modelUsed: string
    estimatedTokens?: number
  }
}

/**
 * Tool for recognizing and analyzing videos using Amazon Nova models
 */
export class RecognizeVideoTool extends BaseTool<RecognizeVideoInput, RecognizeVideoResult> {
  static readonly toolName = 'recognizeVideo'
  static readonly toolDescription =
    'Analyze and describe video content using Amazon Nova models (Micro, Lite, Pro, Premier). The tool uploads the video to S3, processes it with the selected Nova model, and returns a detailed description of the video content.'

  readonly name = RecognizeVideoTool.toolName
  readonly description = RecognizeVideoTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: RecognizeVideoTool.toolName,
    description: RecognizeVideoTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          videoPath: {
            type: 'string',
            description:
              'Path to the video file to analyze. Supports formats: MP4, MOV, MKV, WebM, FLV, MPEG, MPG, WMV, 3GP (max 1GB)'
          },
          prompt: {
            type: 'string',
            description:
              'Custom prompt to guide the video analysis (e.g., "この動画の内容を詳しく説明してください", "What actions are happening in this video?"). Default: "この動画の内容を詳しく説明してください。"'
          },
          modelId: {
            type: 'string',
            description:
              'Nova model to use for analysis. Options: amazon.nova-micro-v1:0, amazon.nova-lite-v1:0, amazon.nova-pro-v1:0, amazon.nova-premier-v1:0. Default: amazon.nova-lite-v1:0'
          },
          s3BucketName: {
            type: 'string',
            description:
              'S3 bucket name for video upload. If not specified, uses default configured bucket'
          },
          cleanupS3: {
            type: 'boolean',
            description: 'Whether to delete the video from S3 after processing. Default: true'
          }
        },
        required: ['videoPath']
      }
    }
  } as const

  /**
   * System prompt description
   */
  static readonly systemPromptDescription =
    'Analyze video content using Amazon Nova models.\\nSupports various video formats up to 1GB.\\nProvides detailed descriptions of video scenes and actions.'

  /**
   * Validate input
   */
  protected validateInput(input: RecognizeVideoInput): ValidationResult {
    const errors: string[] = []

    if (!input.videoPath) {
      errors.push('Video path is required')
    }

    if (input.videoPath && typeof input.videoPath !== 'string') {
      errors.push('Video path must be a string')
    }

    if (input.videoPath && input.videoPath.trim().length === 0) {
      errors.push('Video path cannot be empty')
    }

    if (input.prompt !== undefined && typeof input.prompt !== 'string') {
      errors.push('Prompt must be a string')
    }

    if (input.modelId !== undefined && typeof input.modelId !== 'string') {
      errors.push('Model ID must be a string')
    }

    if (input.s3BucketName !== undefined && typeof input.s3BucketName !== 'string') {
      errors.push('S3 bucket name must be a string')
    }

    if (input.cleanupS3 !== undefined && typeof input.cleanupS3 !== 'boolean') {
      errors.push('cleanupS3 must be a boolean')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: RecognizeVideoInput): Promise<RecognizeVideoResult> {
    const { videoPath, prompt, modelId, s3BucketName, cleanupS3 } = input

    this.logger.debug('Recognizing video', {
      videoPath: this.sanitizePath(videoPath),
      hasCustomPrompt: !!prompt,
      modelId,
      s3BucketName
    })

    try {
      // ファイル存在確認
      try {
        await fs.access(videoPath)
      } catch (error) {
        this.logger.error(`Video file not found: ${videoPath}`, { error })
        throw new Error(`Video file not found: ${videoPath}`)
      }

      // Get the configured model ID from store if not provided
      const recognizeVideoSetting = this.storeManager.get('recognizeVideoTool')
      const defaultModelId = recognizeVideoSetting?.modelId || 'amazon.nova-lite-v1:0'
      const defaultS3Bucket = recognizeVideoSetting?.s3BucketName

      // Call main process using type-safe IPC
      const result = await ipc('bedrock:recognizeVideo', {
        videoPath,
        prompt: prompt || 'この動画の内容を詳しく説明してください。',
        modelId: modelId || defaultModelId,
        s3BucketName: s3BucketName || defaultS3Bucket,
        cleanupS3: cleanupS3 !== undefined ? cleanupS3 : true
      })

      this.logger.info('Video recognition completed successfully', {
        videoPath: this.sanitizePath(videoPath),
        modelUsed: result.modelUsed,
        processingTime: result.processingTime,
        responseLength: result.description.length,
        estimatedTokens: result.estimatedTokens
      })

      return {
        name: 'recognizeVideo',
        success: true,
        message: `Video analyzed successfully using ${result.modelUsed}`,
        result: {
          description: result.description,
          s3Uri: result.s3Uri,
          processingTime: result.processingTime,
          modelUsed: result.modelUsed,
          estimatedTokens: result.estimatedTokens
        }
      }
    } catch (error) {
      this.logger.error('Failed to recognize video', {
        videoPath: this.sanitizePath(videoPath),
        error: error instanceof Error ? error.message : String(error)
      })

      throw `Error recognizing video: ${JSON.stringify({
        success: false,
        name: 'recognizeVideo',
        error: 'Failed to recognize video',
        message: error instanceof Error ? error.message : String(error)
      })}`
    }
  }

  /**
   * Sanitize file path for logging
   */
  private sanitizePath(path: string): string {
    // Extract just the filename for logging
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 1] || path
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize paths for logging
   */
  protected sanitizeInputForLogging(input: RecognizeVideoInput): any {
    return {
      ...input,
      videoPath: this.sanitizePath(input.videoPath),
      prompt: input.prompt ? this.truncateForLogging(input.prompt, 100) : undefined
    }
  }
}
