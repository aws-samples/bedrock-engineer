/**
 * GenerateImage tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for GenerateImageTool
 */
interface GenerateImageInput {
  type: 'generateImage'
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  cfgScale?: number
  seed?: number
  steps?: number
  style?: string
  numberOfImages?: number
}

/**
 * Result type for GenerateImageTool
 */
interface GenerateImageResult extends ToolResult {
  name: 'generateImage'
  result: {
    images: Array<{
      base64: string
      seed: number
      finishReason: string
    }>
  }
}

/**
 * Tool for generating images using AWS Bedrock
 */
export class GenerateImageTool extends BaseTool<GenerateImageInput, GenerateImageResult> {
  readonly name = 'generateImage'
  readonly description = 'Generate images using AWS Bedrock image generation models'

  /**
   * Validate input
   */
  protected validateInput(input: GenerateImageInput): ValidationResult {
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

    if (input.negativePrompt !== undefined && typeof input.negativePrompt !== 'string') {
      errors.push('Negative prompt must be a string')
    }

    if (input.width !== undefined) {
      if (typeof input.width !== 'number' || input.width < 1) {
        errors.push('Width must be a positive number')
      }
    }

    if (input.height !== undefined) {
      if (typeof input.height !== 'number' || input.height < 1) {
        errors.push('Height must be a positive number')
      }
    }

    if (input.cfgScale !== undefined) {
      if (typeof input.cfgScale !== 'number' || input.cfgScale < 0) {
        errors.push('CFG scale must be a non-negative number')
      }
    }

    if (input.seed !== undefined) {
      if (typeof input.seed !== 'number') {
        errors.push('Seed must be a number')
      }
    }

    if (input.steps !== undefined) {
      if (typeof input.steps !== 'number' || input.steps < 1) {
        errors.push('Steps must be a positive number')
      }
    }

    if (input.style !== undefined && typeof input.style !== 'string') {
      errors.push('Style must be a string')
    }

    if (input.numberOfImages !== undefined) {
      if (
        typeof input.numberOfImages !== 'number' ||
        input.numberOfImages < 1 ||
        input.numberOfImages > 5
      ) {
        errors.push('Number of images must be between 1 and 5')
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
  protected async executeInternal(input: GenerateImageInput): Promise<GenerateImageResult> {
    const {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      cfgScale = 7.0,
      seed,
      steps = 50,
      style = 'photographic',
      numberOfImages = 1
    } = input

    this.logger.debug('Generating image with Bedrock', {
      promptLength: prompt.length,
      width,
      height,
      numberOfImages
    })

    try {
      this.logger.info('Calling Bedrock image generation API', {
        style,
        dimensions: `${width}x${height}`,
        numberOfImages
      })

      // Call the main process API
      const response = await ipcRenderer.invoke('bedrock:generateImage', {
        prompt,
        negativePrompt,
        width,
        height,
        cfgScale,
        seed,
        steps,
        style,
        numberOfImages
      })

      this.logger.info('Image generation completed successfully', {
        imageCount: response.images?.length || 0
      })

      return {
        success: true,
        name: 'generateImage',
        message: `Generated ${response.images?.length || 0} image(s)`,
        result: response
      }
    } catch (error) {
      this.logger.error('Error generating image', {
        error: error instanceof Error ? error.message : String(error),
        prompt: this.truncateForLogging(prompt, 100)
      })

      throw new ExecutionError(
        `Error generating image: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { prompt: this.truncateForLogging(prompt, 100) }
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
  protected sanitizeInputForLogging(input: GenerateImageInput): any {
    return {
      ...input,
      prompt: this.truncateForLogging(input.prompt, 200),
      negativePrompt: input.negativePrompt
        ? this.truncateForLogging(input.negativePrompt, 100)
        : undefined
    }
  }
}
