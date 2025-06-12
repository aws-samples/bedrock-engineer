/**
 * CameraCapture tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'
import { ipc } from '../../../ipc-client'

/**
 * Input type for CameraCaptureTool
 */
import { CameraCaptureInput } from '../../../../types/tools'

/**
 * Result type for CameraCaptureTool
 */
interface CameraCaptureResult extends ToolResult {
  name: 'cameraCapture'
  result: {
    filePath: string
    metadata: {
      width: number
      height: number
      format: string
      fileSize: number
      timestamp: string
      deviceId?: string
    }
    recognition?: {
      content: string
      modelId: string
      prompt?: string
    }
  }
}

/**
 * Tool for capturing from system camera
 */
export class CameraCaptureTool extends BaseTool<CameraCaptureInput, CameraCaptureResult> {
  static readonly toolName = 'cameraCapture'
  static readonly toolDescription =
    'Capture an image from the computer camera and save as an image file. Optionally analyze the captured image with AI to extract text content, identify objects, and provide detailed visual descriptions.'

  readonly name = CameraCaptureTool.toolName
  readonly description = CameraCaptureTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: CameraCaptureTool.toolName,
    description: CameraCaptureTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          deviceId: {
            type: 'string',
            description: 'Optional device ID to specify which camera to use. If not provided, the default camera will be used.'
          },
          width: {
            type: 'number',
            description: 'Optional desired width for the captured image in pixels.'
          },
          height: {
            type: 'number',
            description: 'Optional desired height for the captured image in pixels.'
          },
          recognizePrompt: {
            type: 'string',
            description:
              'Optional prompt for image recognition analysis. If provided, the captured image will be automatically analyzed with AI using the configured model.'
          }
        }
      }
    }
  } as const

  /**
   * System prompt description
   */
  static readonly systemPromptDescription =
    'Capture image from camera for AI analysis.\\nUseful for object identification, document scanning, QR/barcode reading, facial recognition, and visual analysis.\\nSupports multiple camera devices and AI-powered image recognition.'

  /**
   * Validate input parameters
   */
  protected validateInput(_input: CameraCaptureInput): ValidationResult {
    // Simple validation only
    return {
      isValid: true,
      errors: []
    }
  }

  /**
   * Execute the camera capture
   */
  protected async executeInternal(input: CameraCaptureInput): Promise<CameraCaptureResult> {
    const hasRecognizePrompt = !!input.recognizePrompt

    // プライバシー警告ログ
    this.logger.info('[PRIVACY] Camera capture initiated', {
      timestamp: new Date().toISOString(),
      hasDeviceId: !!input.deviceId,
      width: input.width,
      height: input.height,
      willAnalyze: hasRecognizePrompt
    })
    
    this.logger.info('Starting camera capture', {
      hasDeviceId: !!input.deviceId,
      width: input.width,
      height: input.height,
      willAnalyze: hasRecognizePrompt
    })

    try {
      // Check permissions first
      const permissionCheck = await ipc('camera:check-permissions', undefined)
      if (!permissionCheck.hasPermission) {
        throw new Error(`Camera access permission required: ${permissionCheck.message}. 
カメラへのアクセス許可が必要です。プライバシーとセキュリティのため、カメラは明示的な許可がある場合にのみアクセスされます。
ブラウザやシステム設定でカメラの許可を確認してください。`)
      }

      // Execute camera capture
      const captureResult = await ipc('camera:capture', {
        deviceId: input.deviceId,
        width: input.width,
        height: input.height,
        format: 'png'
      })

      if (!captureResult.success) {
        throw new Error('Camera capture failed')
      }

      this.logger.info('Camera capture completed successfully', {
        filePath: this.sanitizePath(captureResult.filePath),
        width: captureResult.metadata.width,
        height: captureResult.metadata.height,
        format: captureResult.metadata.format,
        fileSize: captureResult.metadata.fileSize
      })

      // Prepare the base result
      const result: CameraCaptureResult = {
        success: true,
        name: 'cameraCapture',
        message: `Camera capture successful: ${captureResult.metadata.width}x${captureResult.metadata.height} (${captureResult.metadata.format})`,
        result: {
          filePath: captureResult.filePath,
          metadata: captureResult.metadata
        }
      }

      // Perform image recognition if prompt is provided
      if (hasRecognizePrompt) {
        this.logger.info('Starting image recognition on camera capture', {
          prompt: input.recognizePrompt
        })

        try {
          // Get the configured model ID from store (using recognizeImageTool setting)
          const recognizeImageSetting = this.storeManager.get('recognizeImageTool')
          const modelId =
            recognizeImageSetting?.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
          
          // カメラキャプチャに最適化した分析プロンプトの拡張
          let enhancedPrompt = input.recognizePrompt || ''
          
          // ユーザープロンプトが詳細でない場合は補助的なプロンプトを追加
          if (enhancedPrompt.length < 50) {
            enhancedPrompt = `${enhancedPrompt}\n\n以下の観点で詳しく分析してください：
1. カメラで撮影された人物、物体、風景などの詳細な説明
2. 画像内のテキスト情報（文字、看板、ラベルなど）の読み取りと翻訳
3. 撮影環境（屋内/屋外、照明条件など）の情報
4. 画像の焦点や被写体の特定
5. 必要に応じて、画像内の重要な要素やイベントの識別

できるだけ詳細かつ正確に説明してください。カメラで撮影された画像として分析してください。
`.trim()
          }

          const recognitionResult = await ipc('bedrock:recognizeImage', {
            imagePaths: [captureResult.filePath],
            prompt: enhancedPrompt,
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

            this.logger.info('Image recognition completed successfully for camera capture', {
              contentLength: recognitionResult.length,
              modelId: modelId || 'default'
            })
          }
        } catch (recognitionError) {
          this.logger.warn('Image recognition failed, but camera capture succeeded', {
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
      this.logger.error('Camera capture failed', {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(
        JSON.stringify({
          success: false,
          name: 'cameraCapture',
          error: 'Camera capture failed',
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
  protected sanitizeInputForLogging(input: CameraCaptureInput): any {
    return {
      type: input.type,
      hasRecognizePrompt: !!input.recognizePrompt,
      hasDeviceId: !!input.deviceId
    }
  }
}