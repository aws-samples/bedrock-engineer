import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import type { ServiceContext } from '../types'
import { createS3Client } from '../client'
import { createCategoryLogger } from '../../../../common/logger'
import { ConverseService } from './converseService'
import type {
  VideoRecognitionRequest,
  VideoRecognitionResponse,
  VideoUploadResult,
  VideoValidationResult,
  VideoMetadata,
  VideoFormat,
  NovaVideoModelId,
  VideoRecognitionError
} from '../types/video'
import {
  VIDEO_CONSTRAINTS,
  DEFAULT_VIDEO_RECOGNITION_CONFIG,
  isNovaVideoModel,
  estimateVideoTokens
} from '../types/video'

// 動画認識サービス専用のカテゴリロガーを作成
const videoLogger = createCategoryLogger('bedrock:video')

/**
 * Bedrock を利用した動画認識サービス
 * Amazon Nova モデル（Micro, Lite, Pro, Premier）に対応し、
 * S3を使用した動画分析と認識を行う
 */
export class VideoRecognitionService {
  private s3Client: S3Client
  private converseService: ConverseService

  constructor(private context: ServiceContext) {
    const awsCredentials = this.context.store.get('aws')
    this.s3Client = createS3Client(awsCredentials)
    this.converseService = new ConverseService(this.context)
  }

  /**
   * 動画認識を実行する
   * @param request 動画認識リクエスト
   * @returns 動画の説明・分析結果
   */
  async recognizeVideo(request: VideoRecognitionRequest): Promise<VideoRecognitionResponse> {
    const startTime = Date.now()
    const {
      videoPath,
      prompt = DEFAULT_VIDEO_RECOGNITION_CONFIG.DEFAULT_PROMPT,
      modelId = DEFAULT_VIDEO_RECOGNITION_CONFIG.MODEL_ID,
      s3BucketName,
      s3Key,
      cleanupS3 = DEFAULT_VIDEO_RECOGNITION_CONFIG.CLEANUP_S3
    } = request

    videoLogger.debug('Starting video recognition', {
      videoPath: path.basename(videoPath),
      modelId,
      hasCustomPrompt: prompt !== DEFAULT_VIDEO_RECOGNITION_CONFIG.DEFAULT_PROMPT
    })

    let uploadResult: VideoUploadResult | null = null

    try {
      // 1. 動画ファイルの検証
      const validationResult = await this.validateVideoFile(videoPath)
      if (!validationResult.isValid) {
        throw this.createVideoError(
          'INVALID_FILE',
          validationResult.errorMessage || 'Invalid video file'
        )
      }

      // 2. 動画メタデータの取得
      const metadata = await this.getVideoMetadata(videoPath)

      // 3. S3にアップロード
      uploadResult = await this.uploadVideoToS3(videoPath, {
        bucketName: s3BucketName,
        key: s3Key,
        contentType: VIDEO_CONSTRAINTS.MIME_TYPES[metadata.format]
      })

      videoLogger.info('Video uploaded to S3', {
        fileName: path.basename(videoPath),
        s3Uri: uploadResult.s3Uri,
        fileSize: `${Math.round(uploadResult.fileSize / 1024 / 1024)}MB`
      })

      // 4. Nova モデルで動画認識実行
      const description = await this.performVideoRecognition({
        s3Uri: uploadResult.s3Uri,
        format: metadata.format,
        prompt,
        modelId: modelId as NovaVideoModelId
      })

      // 5. トークン数の推定
      const estimatedTokens = metadata.duration
        ? estimateVideoTokens(metadata.duration, modelId)
        : undefined

      const processingTime = Date.now() - startTime

      videoLogger.info('Video recognition completed successfully', {
        fileName: path.basename(videoPath),
        modelId,
        processingTime: `${processingTime}ms`,
        responseLength: description.length,
        estimatedTokens
      })

      const response: VideoRecognitionResponse = {
        description,
        s3Uri: uploadResult.s3Uri,
        processingTime,
        modelUsed: modelId,
        estimatedTokens
      }

      // 6. S3クリーンアップ（オプション）
      if (cleanupS3) {
        try {
          await this.cleanupS3File(uploadResult.s3Uri)
          videoLogger.debug('S3 file cleaned up', { s3Uri: uploadResult.s3Uri })
        } catch (cleanupError) {
          videoLogger.warn('Failed to cleanup S3 file', {
            s3Uri: uploadResult.s3Uri,
            error: cleanupError
          })
          // クリーンアップの失敗は結果に影響しない
        }
      }

      return response
    } catch (error: any) {
      videoLogger.error('Error in video recognition', {
        videoPath: path.basename(videoPath),
        modelId,
        error: error instanceof Error ? error.message : String(error)
      })

      // エラー時もS3クリーンアップを試行
      if (uploadResult && cleanupS3) {
        try {
          await this.cleanupS3File(uploadResult.s3Uri)
        } catch {
          // クリーンアップエラーは無視
        }
      }

      throw error
    }
  }

  /**
   * 動画ファイルの検証を行う
   */
  private async validateVideoFile(videoPath: string): Promise<VideoValidationResult> {
    try {
      // ファイル存在確認
      const stats = await fs.stat(videoPath)

      if (!stats.isFile()) {
        return {
          isValid: false,
          errorMessage: 'Specified path is not a file'
        }
      }

      // ファイルサイズ確認
      if (stats.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
        return {
          isValid: false,
          errorMessage: `File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum limit (${VIDEO_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB)`
        }
      }

      // ファイル形式確認
      const ext = path.extname(videoPath).toLowerCase().slice(1)
      if (!VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.includes(ext as any)) {
        return {
          isValid: false,
          errorMessage: `Unsupported video format: ${ext}. Supported formats: ${VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`
        }
      }

      const format = ext === '3gp' ? 'three_gp' : (ext as VideoFormat)

      return {
        isValid: true,
        format,
        size: stats.size
      }
    } catch (error) {
      return {
        isValid: false,
        errorMessage: `Failed to validate video file: ${error}`
      }
    }
  }

  /**
   * 動画メタデータの取得
   */
  private async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    const stats = await fs.stat(videoPath)
    const ext = path.extname(videoPath).toLowerCase().slice(1)
    const format = ext === '3gp' ? 'three_gp' : (ext as VideoFormat)

    // 基本メタデータ（ファイルサイズと形式）
    const metadata: VideoMetadata = {
      format,
      size: stats.size
    }

    // TODO: より詳細なメタデータ取得（ffprobe等を使用）
    // 現在は基本情報のみを提供

    return metadata
  }

  /**
   * 動画をS3にアップロード
   */
  private async uploadVideoToS3(
    videoPath: string,
    options: {
      bucketName?: string
      key?: string
      contentType?: string
    } = {}
  ): Promise<VideoUploadResult> {
    try {
      const bucketName = options.bucketName || this.getDefaultS3BucketName()

      if (!bucketName) {
        throw new Error('S3 bucket name not specified and no default bucket configured')
      }

      const fileName = path.basename(videoPath)
      const timestamp = Date.now()
      const key =
        options.key || `${DEFAULT_VIDEO_RECOGNITION_CONFIG.S3_PREFIX}${timestamp}/${fileName}`

      const videoData = await fs.readFile(videoPath)
      const stats = await fs.stat(videoPath)

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: videoData,
        ContentType: options.contentType || 'video/mp4'
      })

      await this.s3Client.send(command)

      const s3Uri = `s3://${bucketName}/${key}`

      return {
        s3Uri,
        s3Key: key,
        bucketName,
        contentType: options.contentType || 'video/mp4',
        fileSize: stats.size
      }
    } catch (error) {
      throw this.createVideoError('UPLOAD_FAILED', `Failed to upload video to S3: ${error}`)
    }
  }

  /**
   * Nova モデルを使用した動画認識の実行
   */
  private async performVideoRecognition(params: {
    s3Uri: string
    format: VideoFormat
    prompt: string
    modelId: NovaVideoModelId
  }): Promise<string> {
    const { s3Uri, format, prompt, modelId } = params

    if (!isNovaVideoModel(modelId)) {
      throw this.createVideoError('INVALID_FILE', `Invalid Nova video model: ${modelId}`)
    }

    videoLogger.info('Calling Nova model for video recognition', {
      modelId,
      s3Uri,
      format
    })

    try {
      const systemPrompt = [
        {
          text: DEFAULT_VIDEO_RECOGNITION_CONFIG.SYSTEM_PROMPT
        }
      ]

      const response = await this.converseService.converse({
        modelId,
        messages: [
          {
            role: 'user',
            content: [
              {
                video: {
                  format,
                  source: {
                    s3Location: {
                      uri: s3Uri
                    }
                  }
                }
              },
              {
                text: prompt
              }
            ]
          }
        ] as any, // 型キャストを使用（AWS SDKの型定義が動画に対応していない可能性）
        system: systemPrompt,
        inferenceConfig: {
          maxTokens: DEFAULT_VIDEO_RECOGNITION_CONFIG.MAX_TOKENS,
          temperature: DEFAULT_VIDEO_RECOGNITION_CONFIG.TEMPERATURE,
          topP: DEFAULT_VIDEO_RECOGNITION_CONFIG.TOP_P
        }
      })

      // レスポンスからテキスト部分を抽出
      let description = ''
      if (response.output?.message?.content) {
        if (Array.isArray(response.output.message.content)) {
          description = response.output.message.content
            .filter((item: any) => item.text)
            .map((item: any) => item.text)
            .join('\n')
        }
      }

      if (!description) {
        throw new Error('No text content in Nova response')
      }

      videoLogger.info('Video recognition successful with Nova', {
        modelId,
        responseLength: description.length
      })

      return description
    } catch (error: any) {
      videoLogger.error('Error in Nova video recognition', {
        modelId,
        s3Uri,
        error: error.message
      })
      throw this.createVideoError(
        'RECOGNITION_FAILED',
        `Video recognition failed: ${error.message}`
      )
    }
  }

  /**
   * S3ファイルのクリーンアップ
   */
  private async cleanupS3File(s3Uri: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

      // S3 URIをパース
      const match = s3Uri.match(/^s3:\/\/([^/]+)\/(.+)$/)
      if (!match) {
        throw new Error(`Invalid S3 URI format: ${s3Uri}`)
      }

      const [, bucket, key] = match

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      })

      await this.s3Client.send(command)
    } catch (error) {
      throw this.createVideoError('S3_ACCESS_ERROR', `Failed to cleanup S3 file: ${error}`)
    }
  }

  /**
   * デフォルトS3バケット名の取得
   */
  private getDefaultS3BucketName(): string | undefined {
    // TODO: 設定から取得するか、環境変数から取得
    // 現在は未実装
    return undefined
  }

  /**
   * VideoRecognitionError の作成
   */
  private createVideoError(
    code: VideoRecognitionError['code'],
    message: string,
    details?: any
  ): VideoRecognitionError {
    const error = new Error(message) as VideoRecognitionError
    error.code = code
    error.details = details
    return error
  }
}
