/**
 * ScreenCapture tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'
import { ipc } from '../../../ipc-client'

/**
 * Input type for ScreenCaptureTool
 */
import { ScreenCaptureInput } from '../../../../types/tools'

/**
 * Result type for ScreenCaptureTool
 */
interface ScreenCaptureResult extends ToolResult {
  name: 'screenCapture'
  result: {
    filePath: string
    metadata: {
      width: number
      height: number
      format: string
      fileSize: number
      timestamp: string
    }
    recognition?: {
      content: string
      modelId: string
      prompt?: string
    }
  }
}

/**
 * Tool for capturing the current screen
 */
export class ScreenCaptureTool extends BaseTool<ScreenCaptureInput, ScreenCaptureResult> {
  static readonly toolName = 'screenCapture'
  static readonly toolDescription =
    'Capture the current screen and save as an image file. Optionally analyze the captured image with AI to extract text content, identify UI elements, and provide detailed visual descriptions for debugging and documentation purposes.\n\nCapture screen for AI analysis. Useful for debugging, UI analysis, and creating documentation. Available windows for screen capture:{{allowedWindows}}'

  readonly name = ScreenCaptureTool.toolName
  readonly description = ScreenCaptureTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: ScreenCaptureTool.toolName,
    description: ScreenCaptureTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          recognizePrompt: {
            type: 'string',
            description:
              'Optional prompt for image recognition analysis. If provided, the captured image will be automatically analyzed with AI using the configured model.'
          },
          windowTarget: {
            type: 'string',
            description:
              'Optional target window by name or application (partial match supported). Examples: "Chrome", "Terminal", "Visual Studio Code"'
          }
        }
      }
    }
  } as const

  /**
   * Validate input parameters
   */
  protected validateInput(_input: ScreenCaptureInput): ValidationResult {
    // No validation needed for the simplified parameters
    return {
      isValid: true,
      errors: []
    }
  }

  /**
   * Execute the screen capture
   */
  protected async executeInternal(input: ScreenCaptureInput): Promise<ScreenCaptureResult> {
    const hasRecognizePrompt = !!input.recognizePrompt

    this.logger.info('Starting screen capture', {
      format: 'png',
      willAnalyze: hasRecognizePrompt
    })

    try {
      // Check permissions first
      const permissionCheck = await ipc('screen:check-permissions', undefined)
      if (!permissionCheck.hasPermission) {
        throw new Error(`Screen capture permission required: ${permissionCheck.message}`)
      }

      // Execute screen capture (always PNG format)
      const captureResult = await ipc('screen:capture', {
        format: 'png',
        windowTarget: input.windowTarget
      })

      if (!captureResult.success) {
        throw new Error('Screen capture failed')
      }

      this.logger.info('Screen capture completed successfully', {
        filePath: this.sanitizePath(captureResult.filePath),
        width: captureResult.metadata.width,
        height: captureResult.metadata.height,
        format: captureResult.metadata.format,
        fileSize: captureResult.metadata.fileSize
      })

      // Prepare the base result
      const result: ScreenCaptureResult = {
        success: true,
        name: 'screenCapture',
        message: `Screen captured successfully: ${captureResult.metadata.width}x${captureResult.metadata.height} (${captureResult.metadata.format})`,
        result: {
          filePath: captureResult.filePath,
          metadata: captureResult.metadata
        }
      }

      // Perform image recognition if prompt is provided
      if (hasRecognizePrompt) {
        this.logger.info('Starting image recognition', {
          prompt: input.recognizePrompt
        })

        try {
          // Get the configured model ID from store (using recognizeImageTool setting)
          const recognizeImageSetting = this.storeManager.get('recognizeImageTool')
          const modelId =
            recognizeImageSetting?.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0'

          const recognitionResult = await ipc('bedrock:recognizeImage', {
            imagePaths: [captureResult.filePath],
            prompt: input.recognizePrompt,
            modelId
          })

          if (recognitionResult && typeof recognitionResult === 'string') {
            result.result.recognition = {
              content: recognitionResult,
              modelId: modelId || 'default',
              prompt: input.recognizePrompt
            }

            // Update the message to include recognition info
            result.message += ` Image recognition completed: ${recognitionResult.substring(0, 100)}${recognitionResult.length > 100 ? '...' : ''}`

            this.logger.info('Image recognition completed successfully', {
              contentLength: recognitionResult.length,
              modelId: modelId || 'default'
            })
          }
        } catch (recognitionError) {
          this.logger.warn('Image recognition failed, but screen capture succeeded', {
            error:
              recognitionError instanceof Error
                ? recognitionError.message
                : String(recognitionError)
          })

          // Add warning to message but don't fail the entire operation
          result.message += ' (Note: Image recognition failed)'
        }
      }

      return result
    } catch (error) {
      this.logger.error('Screen capture failed', {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(
        JSON.stringify({
          success: false,
          name: 'screenCapture',
          error: 'Screen capture failed',
          message: error instanceof Error ? error.message : String(error)
        })
      )
    }
  }

  /**
   * Sanitize file path for logging (remove sensitive path information)
   */
  private sanitizePath(path: string): string {
    const parts = path.split(/[/\\]/)
    return parts[parts.length - 1] || path
  }

  /**
   * Override to return error as JSON string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize input for logging
   */
  protected sanitizeInputForLogging(input: ScreenCaptureInput): any {
    return {
      type: input.type,
      hasRecognizePrompt: !!input.recognizePrompt
    }
  }
}
