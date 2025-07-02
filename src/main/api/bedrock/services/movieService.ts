import {
  BedrockRuntimeClient,
  StartAsyncInvokeCommand,
  GetAsyncInvokeCommand
} from '@aws-sdk/client-bedrock-runtime'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createWriteStream } from 'fs'
import { promises as fs } from 'fs'
import { pipeline } from 'stream/promises'
import path from 'path'
import type { ServiceContext } from '../types'
import { createRuntimeClient, createS3Client } from '../client'
import type {
  GenerateMovieRequest,
  GeneratedMovie,
  AsyncInvocationStatus,
  NovaReelRequest,
  Shot
} from '../types/movie'
import {
  getNovaReelModelId,
  isNovaReelSupportedInRegion,
  isNovaReelV1_0,
  NOVA_REEL_RESOLUTION,
  NOVA_REEL_FPS,
  isValidDuration,
  getTaskTypeForRequest,
  NOVA_REEL_REGION_SUPPORT
} from '../types/movie'

export class VideoService {
  private runtimeClient: BedrockRuntimeClient
  private s3Client: S3Client
  private region: string

  constructor(private context: ServiceContext) {
    const awsCredentials = this.context.store.get('aws')

    if (
      !awsCredentials.region ||
      (!awsCredentials.useProfile &&
        (!awsCredentials.accessKeyId || !awsCredentials.secretAccessKey))
    ) {
      console.warn('AWS credentials not configured properly')
    }

    this.region = awsCredentials.region || 'us-east-1' // Default to us-east-1

    // Validate that Nova Reel is supported in the selected region
    if (!isNovaReelSupportedInRegion(this.region)) {
      console.warn(
        `Nova Reel is not available in region ${this.region}. Supported regions: ${Object.keys(
          NOVA_REEL_REGION_SUPPORT
        ).join(', ')}`
      )
    }

    this.runtimeClient = createRuntimeClient(awsCredentials)

    // S3 client for downloading generated videos
    this.s3Client = createS3Client(awsCredentials)
  }

  private validateRequest(request: GenerateMovieRequest): void {
    if (!request.prompt || request.prompt.length === 0) {
      throw new Error('Prompt is required and cannot be empty')
    }

    if (request.prompt.length > 4000) {
      throw new Error('Prompt must be 4000 characters or less')
    }

    if (!isValidDuration(request.durationSeconds)) {
      throw new Error(
        `Duration must be 6 seconds (TEXT_VIDEO) or a multiple of 6 between 12-120 seconds (MULTI_SHOT_AUTOMATED). Valid values: 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120`
      )
    }

    if (!request.s3Uri) {
      throw new Error('S3 URI is required for video generation')
    }

    if (!request.s3Uri.startsWith('s3://')) {
      throw new Error('S3 URI must start with s3://')
    }

    if (request.seed !== undefined && (request.seed < 0 || request.seed > 2147483646)) {
      throw new Error('Seed must be between 0 and 2147483646')
    }

    // Validate input images
    if (request.inputImages && request.inputImages.length > 0) {
      // For TEXT_VIDEO (6 seconds), only allow single image
      if (request.durationSeconds === 6 && request.inputImages.length > 1) {
        throw new Error('TEXT_VIDEO mode (6 seconds) supports only a single input image')
      }

      // Validate each image file
      for (let i = 0; i < request.inputImages.length; i++) {
        const imagePath = request.inputImages[i]
        const ext = imagePath.toLowerCase().split('.').pop()
        if (!ext || !['png', 'jpg', 'jpeg'].includes(ext)) {
          throw new Error(`Image ${i + 1} must be PNG or JPEG format: ${imagePath}`)
        }
      }

      // Validate prompts if provided
      if (request.prompts) {
        if (request.prompts.length !== request.inputImages.length) {
          throw new Error(
            `Number of prompts (${request.prompts.length}) must match number of images (${request.inputImages.length})`
          )
        }

        request.prompts.forEach((prompt, index) => {
          if (!prompt || prompt.trim().length === 0) {
            throw new Error(`Prompt ${index + 1} cannot be empty`)
          }
          if (prompt.length > 4000) {
            throw new Error(`Prompt ${index + 1} must be 4000 characters or less`)
          }
        })
      }
    }

    // If prompts provided without images, that's an error
    if (request.prompts && !request.inputImages) {
      throw new Error('Prompts can only be used together with input images')
    }
  }

  /**
   * Detect image format from file extension
   */
  private detectImageFormat(imagePath: string): 'png' | 'jpeg' {
    const ext = imagePath.toLowerCase().split('.').pop()
    if (ext === 'png') return 'png'
    if (ext === 'jpg' || ext === 'jpeg') return 'jpeg'
    throw new Error(`Unsupported image format: ${ext}`)
  }

  /**
   * Read image file and convert to base64
   */
  private async readImageAsBase64(imagePath: string): Promise<string> {
    try {
      const imageData = await fs.readFile(imagePath)
      return imageData.toString('base64')
    } catch (error) {
      throw new Error(`Failed to read image file ${imagePath}: ${error}`)
    }
  }

  /**
   * Upload image to S3 and return the S3 URI
   */
  private async uploadImageToS3(imagePath: string, s3BaseUri: string): Promise<string> {
    try {
      // Parse S3 base URI to get bucket
      const s3Match = s3BaseUri.match(/^s3:\/\/([^/]+)/)
      if (!s3Match) {
        throw new Error(`Invalid S3 URI format: ${s3BaseUri}`)
      }

      const bucket = s3Match[1]
      const timestamp = Date.now()
      const fileName = path.basename(imagePath)
      const s3Key = `temp-images/${timestamp}/${fileName}`

      // Read image file
      const imageData = await fs.readFile(imagePath)

      // Detect content type
      const format = this.detectImageFormat(imagePath)
      const contentType = format === 'png' ? 'image/png' : 'image/jpeg'

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: imageData,
        ContentType: contentType
      })

      await this.s3Client.send(command)

      return `s3://${bucket}/${s3Key}`
    } catch (error) {
      throw new Error(`Failed to upload image to S3: ${error}`)
    }
  }

  /**
   * Build shots array for MULTI_SHOT_MANUAL
   */
  private async buildShotsArray(request: GenerateMovieRequest): Promise<Shot[]> {
    if (!request.inputImages || request.inputImages.length === 0) {
      throw new Error('Input images are required for building shots array')
    }

    const shots: Shot[] = []

    for (let i = 0; i < request.inputImages.length; i++) {
      const imagePath = request.inputImages[i]
      const prompt = request.prompts ? request.prompts[i] : request.prompt

      // Upload image to S3
      const s3Uri = await this.uploadImageToS3(imagePath, request.s3Uri)

      // Create shot with image
      const shot: Shot = {
        text: prompt,
        image: {
          format: this.detectImageFormat(imagePath),
          source: {
            s3Location: {
              uri: s3Uri
            }
          }
        }
      }

      shots.push(shot)
    }

    return shots
  }

  private async buildNovaReelRequest(request: GenerateMovieRequest): Promise<NovaReelRequest> {
    const hasInputImages = Boolean(request.inputImages && request.inputImages.length > 0)
    const modelId = getNovaReelModelId(this.region)

    // Nova Reel v1.0 only supports TEXT_VIDEO format - it doesn't support MULTI_SHOT_AUTOMATED
    if (isNovaReelV1_0(modelId)) {
      const textToVideoParams: any = {
        text: request.prompt
      }

      // Add image for TEXT_VIDEO with single image
      if (hasInputImages && request.inputImages!.length === 1) {
        const imagePath = request.inputImages![0]
        const base64Data = await this.readImageAsBase64(imagePath)

        textToVideoParams.images = [
          {
            format: this.detectImageFormat(imagePath),
            source: {
              bytes: base64Data
            }
          }
        ]
      }

      return {
        taskType: 'TEXT_VIDEO',
        textToVideoParams,
        videoGenerationConfig: {
          durationSeconds: request.durationSeconds,
          fps: NOVA_REEL_FPS,
          dimension: NOVA_REEL_RESOLUTION,
          seed: request.seed || Math.floor(Math.random() * 2147483647)
        }
      }
    }

    // Nova Reel v1.1 supports the full API with different task types
    const taskType = getTaskTypeForRequest(request.durationSeconds, hasInputImages)

    if (taskType === 'TEXT_VIDEO') {
      const textToVideoParams: any = {
        text: request.prompt
      }

      // Add image for TEXT_VIDEO with single image
      if (hasInputImages && request.inputImages!.length === 1) {
        const imagePath = request.inputImages![0]
        const base64Data = await this.readImageAsBase64(imagePath)

        textToVideoParams.images = [
          {
            format: this.detectImageFormat(imagePath),
            source: {
              bytes: base64Data
            }
          }
        ]
      }

      return {
        taskType,
        textToVideoParams,
        videoGenerationConfig: {
          durationSeconds: request.durationSeconds,
          fps: NOVA_REEL_FPS,
          dimension: NOVA_REEL_RESOLUTION,
          seed: request.seed || Math.floor(Math.random() * 2147483647)
        }
      }
    } else if (taskType === 'MULTI_SHOT_MANUAL') {
      // Build shots array with uploaded images
      const shots = await this.buildShotsArray(request)

      // For MULTI_SHOT_MANUAL, don't include durationSeconds in videoGenerationConfig
      // Duration is determined by the number of shots
      return {
        taskType,
        multiShotManualParams: {
          shots
        },
        videoGenerationConfig: {
          fps: NOVA_REEL_FPS,
          dimension: NOVA_REEL_RESOLUTION,
          seed: request.seed || Math.floor(Math.random() * 2147483647)
        }
      }
    } else {
      // MULTI_SHOT_AUTOMATED
      return {
        taskType,
        multiShotAutomatedParams: {
          text: request.prompt
        },
        videoGenerationConfig: {
          durationSeconds: request.durationSeconds,
          fps: NOVA_REEL_FPS,
          dimension: NOVA_REEL_RESOLUTION,
          seed: request.seed || Math.floor(Math.random() * 2147483647)
        }
      }
    }
  }

  async startVideoGeneration(request: GenerateMovieRequest): Promise<GeneratedMovie> {
    this.validateRequest(request)

    const novaReelRequest = await this.buildNovaReelRequest(request)

    // Get the dynamic model ID for the current region
    const modelId = getNovaReelModelId(this.region)

    try {
      // Add detailed logging for debugging
      console.log('Nova Reel Request Structure:', JSON.stringify(novaReelRequest, null, 2))
      console.log(`Using Nova Reel model: ${modelId} for region: ${this.region}`)

      const command = new StartAsyncInvokeCommand({
        modelId,
        modelInput: novaReelRequest as any, // AWS SDK expects DocumentType
        outputDataConfig: {
          s3OutputDataConfig: {
            s3Uri: request.s3Uri
          }
        }
      })

      console.log(
        'AWS Command:',
        JSON.stringify(
          {
            modelId,
            modelInput: novaReelRequest,
            outputDataConfig: { s3OutputDataConfig: { s3Uri: request.s3Uri } }
          },
          null,
          2
        )
      )

      const response = await this.runtimeClient.send(command)

      if (!response.invocationArn) {
        throw new Error('Failed to start video generation: No invocation ARN returned')
      }

      return {
        invocationArn: response.invocationArn,
        status: {
          invocationArn: response.invocationArn,
          modelId,
          status: 'InProgress',
          submitTime: new Date(),
          outputDataConfig: {
            s3OutputDataConfig: {
              s3Uri: request.s3Uri
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error starting video generation:', error)

      // If MULTI_SHOT_MANUAL fails with validation error, try fallback to MULTI_SHOT_AUTOMATED
      if (
        error.name === 'ValidationException' &&
        novaReelRequest.taskType === 'MULTI_SHOT_MANUAL' &&
        error.message?.includes('textToVideoParams')
      ) {
        console.log('MULTI_SHOT_MANUAL failed, attempting fallback to MULTI_SHOT_AUTOMATED...')

        try {
          // Create fallback request with combined prompts
          const combinedPrompt = request.prompts ? request.prompts.join('. ') : request.prompt

          const fallbackRequest: NovaReelRequest = {
            taskType: 'MULTI_SHOT_AUTOMATED',
            multiShotAutomatedParams: {
              text: combinedPrompt
            },
            videoGenerationConfig: {
              ...novaReelRequest.videoGenerationConfig,
              durationSeconds: request.durationSeconds // Add back durationSeconds for MULTI_SHOT_AUTOMATED
            }
          }

          console.log('Fallback Request:', JSON.stringify(fallbackRequest, null, 2))

          const fallbackCommand = new StartAsyncInvokeCommand({
            modelId,
            modelInput: fallbackRequest as any,
            outputDataConfig: {
              s3OutputDataConfig: {
                s3Uri: request.s3Uri
              }
            }
          })

          const response = await this.runtimeClient.send(fallbackCommand)

          if (!response.invocationArn) {
            throw new Error('Failed to start video generation: No invocation ARN returned')
          }

          console.log('Fallback succeeded! Note: Images were not used due to API limitations.')

          return {
            invocationArn: response.invocationArn,
            status: {
              invocationArn: response.invocationArn,
              modelId,
              status: 'InProgress',
              submitTime: new Date(),
              outputDataConfig: {
                s3OutputDataConfig: {
                  s3Uri: request.s3Uri
                }
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
          throw new Error(
            `Both MULTI_SHOT_MANUAL and fallback failed. Original error: ${error.message}. Fallback error: ${fallbackError}`
          )
        }
      }

      if (error.name === 'UnrecognizedClientException') {
        throw new Error('AWS authentication failed. Please check your credentials and permissions.')
      }
      if (error.name === 'ValidationException') {
        throw new Error(`Invalid request parameters: ${error.message}`)
      }
      if (error.name === 'AccessDeniedException') {
        throw new Error('Access denied. Please ensure you have permissions for Bedrock and S3.')
      }
      if (error.name === 'ThrottlingException') {
        throw new Error('Request was throttled. Please try again later.')
      }

      throw error
    }
  }

  async getJobStatus(invocationArn: string): Promise<AsyncInvocationStatus> {
    try {
      const command = new GetAsyncInvokeCommand({
        invocationArn
      })

      const response = await this.runtimeClient.send(command)

      // Get the dynamic model ID for the current region
      const modelId = getNovaReelModelId(this.region)

      return {
        invocationArn: response.invocationArn || invocationArn,
        modelId, // Use dynamic model ID based on region
        status: response.status as 'InProgress' | 'Completed' | 'Failed',
        submitTime: response.submitTime || new Date(),
        endTime: response.endTime,
        outputDataConfig: response.outputDataConfig as any, // Type assertion for AWS SDK compatibility
        failureMessage: response.failureMessage
      }
    } catch (error: any) {
      console.error('Error getting job status:', error)
      throw error
    }
  }

  async downloadVideoFromS3(s3Uri: string, localPath: string): Promise<string> {
    try {
      // Parse S3 URI (s3://bucket/key)
      const s3Match = s3Uri.match(/^s3:\/\/([^/]+)\/(.+)$/)
      if (!s3Match) {
        throw new Error(`Invalid S3 URI format: ${s3Uri}`)
      }

      const [, bucket, key] = s3Match

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })

      const response = await this.s3Client.send(command)

      if (!response.Body) {
        throw new Error('No data received from S3')
      }

      // Ensure output directory exists
      const outputDir = path.dirname(localPath)
      const fs = await import('fs/promises')
      await fs.mkdir(outputDir, { recursive: true })

      // Stream the file to local storage
      const writeStream = createWriteStream(localPath)
      await pipeline(response.Body as NodeJS.ReadableStream, writeStream)

      return localPath
    } catch (error: any) {
      console.error('Error downloading video from S3:', error)
      throw error
    }
  }

  async waitForCompletion(
    invocationArn: string,
    options: {
      maxWaitTime?: number // Maximum wait time in milliseconds (default: 30 minutes)
      pollInterval?: number // Polling interval in milliseconds (default: 30 seconds)
      onProgress?: (status: AsyncInvocationStatus) => void
    } = {}
  ): Promise<AsyncInvocationStatus> {
    const {
      maxWaitTime = 30 * 60 * 1000, // 30 minutes
      pollInterval = 30 * 1000, // 30 seconds
      onProgress
    } = options

    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getJobStatus(invocationArn)

      if (onProgress) {
        onProgress(status)
      }

      if (status.status === 'Completed') {
        return status
      }

      if (status.status === 'Failed') {
        throw new Error(`Video generation failed: ${status.failureMessage || 'Unknown error'}`)
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Video generation timed out after ${maxWaitTime / 1000} seconds`)
  }

  async generateVideo(request: GenerateMovieRequest): Promise<GeneratedMovie> {
    // Start the generation job
    const initialResult = await this.startVideoGeneration(request)

    // Wait for completion
    const finalStatus = await this.waitForCompletion(initialResult.invocationArn, {
      onProgress: (status) => {
        console.log(`Video generation status: ${status.status}`)
      }
    })

    // Download the video if completed successfully
    let localPath: string | undefined
    if (
      finalStatus.status === 'Completed' &&
      finalStatus.outputDataConfig?.s3OutputDataConfig?.s3Uri
    ) {
      if (request.outputPath) {
        // Ensure the file has a .mp4 extension
        const outputPath = request.outputPath.endsWith('.mp4')
          ? request.outputPath
          : `${request.outputPath}.mp4`

        localPath = await this.downloadVideoFromS3(
          finalStatus.outputDataConfig.s3OutputDataConfig.s3Uri,
          outputPath
        )
      }
    }

    return {
      invocationArn: initialResult.invocationArn,
      status: finalStatus,
      outputLocation: finalStatus.outputDataConfig?.s3OutputDataConfig?.s3Uri,
      localPath,
      error: finalStatus.status === 'Failed' ? finalStatus.failureMessage : undefined
    }
  }
}
