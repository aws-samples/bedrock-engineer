/**
 * CameraCapture tool implementation with HTML5 getUserMedia API
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'
import { ipc } from '../../../ipc-client'
import { api } from '../../../api'

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
      deviceId: string
      deviceName: string
    }
    recognition?: {
      content: string
      modelId: string
      prompt?: string
    }
  }
}

/**
 * Camera stream manager for HTML5 getUserMedia API
 */
class CameraStreamManager {
  private currentStream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null

  /**
   * Initialize camera stream with specified constraints
   */
  async initializeCamera(
    deviceId?: string,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{
    stream: MediaStream
    deviceInfo: MediaDeviceInfo | null
  }> {
    // Quality to resolution mapping
    const resolutions = {
      low: { width: 640, height: 480 },
      medium: { width: 1280, height: 720 },
      high: { width: 1920, height: 1080 }
    }

    const resolution = resolutions[quality]

    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: resolution.width },
        height: { ideal: resolution.height },
        ...(deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : {})
      },
      audio: false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.currentStream = stream

      // Get device information
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')

      let deviceInfo: MediaDeviceInfo | null = null
      if (deviceId && deviceId !== 'default') {
        deviceInfo = videoDevices.find((device) => device.deviceId === deviceId) || null
      } else {
        // Use the first available camera or the one currently being used
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const settings = videoTrack.getSettings()
          deviceInfo =
            videoDevices.find((device) => device.deviceId === settings.deviceId) ||
            videoDevices[0] ||
            null
        }
      }

      return { stream, deviceInfo }
    } catch (error) {
      throw new Error(
        `Failed to access camera: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Capture image from current stream
   */
  async captureImage(
    format: 'jpg' | 'png' = 'jpg',
    quality: number = 0.9
  ): Promise<{
    base64Data: string
    width: number
    height: number
  }> {
    if (!this.currentStream) {
      throw new Error('Camera stream not initialized')
    }

    // Create video element if not exists
    if (!this.videoElement) {
      this.videoElement = document.createElement('video')
      this.videoElement.style.display = 'none'
      document.body.appendChild(this.videoElement)
    }

    // Create canvas element if not exists
    if (!this.canvasElement) {
      this.canvasElement = document.createElement('canvas')
      this.canvasElement.style.display = 'none'
      document.body.appendChild(this.canvasElement)
    }

    return new Promise((resolve, reject) => {
      if (!this.videoElement || !this.canvasElement) {
        reject(new Error('Video or canvas element not available'))
        return
      }

      const video = this.videoElement
      const canvas = this.canvasElement

      video.srcObject = this.currentStream
      video.play()

      video.onloadedmetadata = () => {
        try {
          const width = video.videoWidth
          const height = video.videoHeight

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas 2D context'))
            return
          }

          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, width, height)

          // Convert to base64
          const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
          const base64Data = canvas.toDataURL(mimeType, quality)

          resolve({
            base64Data,
            width,
            height
          })
        } catch (error) {
          reject(error)
        }
      }

      video.onerror = (error) => {
        reject(new Error(`Video loading error: ${error}`))
      }

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Camera capture timeout'))
      }, 10000)
    })
  }

  /**
   * Stop current camera stream and cleanup
   */
  cleanup(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop())
      this.currentStream = null
    }

    if (this.videoElement) {
      document.body.removeChild(this.videoElement)
      this.videoElement = null
    }

    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement)
      this.canvasElement = null
    }
  }
}

/**
 * Tool for capturing images from camera using HTML5 getUserMedia API
 */
export class CameraCaptureTool extends BaseTool<CameraCaptureInput, CameraCaptureResult> {
  static readonly toolName = 'cameraCapture'
  static readonly toolDescription =
    'Capture images from PC camera using HTML5 getUserMedia API and save as an image file. Optionally analyze the captured image with AI to extract text content, identify objects, and provide detailed visual descriptions for analysis and documentation purposes.'

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
            description:
              'Optional camera device ID to use for capture. If not provided, the default camera will be used.'
          },
          recognizePrompt: {
            type: 'string',
            description:
              'Optional prompt for image recognition analysis. If provided, the captured image will be automatically analyzed with AI using the configured model.'
          },
          quality: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description:
              'Image quality setting. Low: 640x480, Medium: 1280x720, High: 1920x1080. Default is medium.'
          },
          format: {
            type: 'string',
            enum: ['jpg', 'png'],
            description: 'Output image format. Default is jpg.'
          }
        }
      }
    }
  } as const

  /**
   * System prompt description
   */
  static readonly systemPromptDescription =
    'Capture images from camera using HTML5 getUserMedia API for AI analysis.\nUseful for real-time visual input, object recognition, and document scanning.\nAvailable cameras: {{allowedCameras}}'

  /**
   * Validate input parameters
   */
  protected validateInput(input: CameraCaptureInput): ValidationResult {
    const errors: string[] = []

    // Validate quality if provided
    if (input.quality && !['low', 'medium', 'high'].includes(input.quality)) {
      errors.push('Quality must be one of: low, medium, high')
    }

    // Validate format if provided
    if (input.format && !['jpg', 'png'].includes(input.format)) {
      errors.push('Format must be one of: jpg, png')
    }

    // Validate deviceId format if provided
    if (input.deviceId && typeof input.deviceId !== 'string') {
      errors.push('Device ID must be a string')
    }

    // Validate recognizePrompt if provided
    if (input.recognizePrompt && typeof input.recognizePrompt !== 'string') {
      errors.push('Recognition prompt must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the camera capture using HTML5 getUserMedia API
   */
  protected async executeInternal(input: CameraCaptureInput): Promise<CameraCaptureResult> {
    const hasRecognizePrompt = !!input.recognizePrompt
    const quality = input.quality || 'medium'
    const format = input.format || 'jpg'

    this.logger.info('Starting camera capture with getUserMedia API', {
      deviceId: input.deviceId || 'default',
      quality,
      format,
      willAnalyze: hasRecognizePrompt
    })

    const cameraManager = new CameraStreamManager()

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia API is not available in this browser')
      }

      // Initialize camera stream
      const { deviceInfo } = await cameraManager.initializeCamera(input.deviceId, quality)

      this.logger.info('Camera stream initialized', {
        deviceName: deviceInfo?.label || 'Unknown Camera',
        deviceId: deviceInfo?.deviceId || 'unknown'
      })

      // Wait a moment for camera to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Capture image
      const captureData = await cameraManager.captureImage(format, 0.9)

      this.logger.info('Image captured from camera', {
        width: captureData.width,
        height: captureData.height,
        format,
        dataSize: captureData.base64Data.length
      })

      // Save captured image via IPC
      const saveResult = await api.camera.saveCapturedImage({
        base64Data: captureData.base64Data,
        deviceId: deviceInfo?.deviceId || 'default',
        deviceName: deviceInfo?.label || 'Unknown Camera',
        width: captureData.width,
        height: captureData.height,
        format
      })

      if (!saveResult.success) {
        throw new Error('Failed to save captured image')
      }

      this.logger.info('Camera capture completed successfully', {
        filePath: this.sanitizePath(saveResult.filePath),
        width: saveResult.metadata.width,
        height: saveResult.metadata.height,
        format: saveResult.metadata.format,
        fileSize: saveResult.metadata.fileSize,
        deviceName: saveResult.metadata.deviceName
      })

      // Prepare the base result
      const result: CameraCaptureResult = {
        success: true,
        name: 'cameraCapture',
        message: `Camera capture successful: ${saveResult.metadata.width}x${saveResult.metadata.height} (${saveResult.metadata.format}) from ${saveResult.metadata.deviceName}`,
        result: {
          filePath: saveResult.filePath,
          metadata: saveResult.metadata
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
            imagePaths: [saveResult.filePath],
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
    } finally {
      // Always cleanup camera resources
      cameraManager.cleanup()
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
      deviceId: input.deviceId || 'default',
      hasRecognizePrompt: !!input.recognizePrompt,
      quality: input.quality || 'medium',
      format: input.format || 'jpg'
    }
  }
}
