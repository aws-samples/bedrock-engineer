/**
 * RecognizeImage tool implementation
 */

import { ipcRenderer } from 'electron'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for RecognizeImageTool
 */
interface RecognizeImageInput {
  type: 'recognizeImage'
  imagePath: string
  prompt?: string
}

/**
 * Result type for RecognizeImageTool
 */
interface RecognizeImageResult extends ToolResult {
  name: 'recognizeImage'
  result: {
    text: string
  }
}

/**
 * Tool for recognizing and analyzing images using AWS Bedrock
 */
export class RecognizeImageTool extends BaseTool<RecognizeImageInput, RecognizeImageResult> {
  readonly name = 'recognizeImage'
  readonly description = 'Analyze and describe images using AWS Bedrock vision models'

  /**
   * Validate input
   */
  protected validateInput(input: RecognizeImageInput): ValidationResult {
    const errors: string[] = []

    if (!input.imagePath) {
      errors.push('Image path is required')
    }

    if (typeof input.imagePath !== 'string') {
      errors.push('Image path must be a string')
    }

    if (input.imagePath && input.imagePath.trim().length === 0) {
      errors.push('Image path cannot be empty')
    }

    if (input.prompt !== undefined && typeof input.prompt !== 'string') {
      errors.push('Prompt must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: RecognizeImageInput): Promise<RecognizeImageResult> {
    const { imagePath, prompt } = input

    this.logger.debug('Recognizing image with Bedrock', {
      imagePath,
      hasPrompt: !!prompt
    })

    try {
      this.logger.info('Calling Bedrock image recognition API', {
        imagePath: this.sanitizePath(imagePath)
      })

      // Call the main process API
      const response = await ipcRenderer.invoke('bedrock:recognizeImage', {
        imagePath,
        prompt
      })

      this.logger.info('Image recognition completed successfully', {
        responseLength: response.text?.length || 0
      })

      return {
        success: true,
        name: 'recognizeImage',
        message: 'Image recognized successfully',
        result: response
      }
    } catch (error) {
      this.logger.error('Error recognizing image', {
        error: error instanceof Error ? error.message : String(error),
        imagePath: this.sanitizePath(imagePath)
      })

      throw new ExecutionError(
        `Error recognizing image: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { imagePath: this.sanitizePath(imagePath) }
      )
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
  protected sanitizeInputForLogging(input: RecognizeImageInput): any {
    return {
      ...input,
      imagePath: this.sanitizePath(input.imagePath),
      prompt: input.prompt ? this.truncateForLogging(input.prompt, 100) : undefined
    }
  }
}
