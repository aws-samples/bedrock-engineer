import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import type { ServiceContext } from '../types'
import type {
  AspectRatio,
  GenerateImageRequest,
  GeneratedImage,
  ImageGeneratorModel
} from '../types/image'

type ModelType = 'core' | 'ultra' | 'sd3' | 'nova' | 'titan'

interface CoreModelRequest {
  prompt: string
  negative_prompt?: string
  aspect_ratio?: AspectRatio
  style_preset?: string
  seed?: number
  output_format: 'png' | 'jpeg' | 'webp'
}

interface SD3ModelRequest extends CoreModelRequest {
  mode: 'text-to-image' | 'image-to-image'
}

interface NovaModelRequest {
  taskType: 'TEXT_IMAGE'
  textToImageParams: {
    text: string
    negativeText?: string
  }
  imageGenerationConfig: {
    width: number
    height: number
    quality: 'standard' | 'premium'
    cfgScale: number
    seed: number
    numberOfImages: number
  }
}

interface TitanModelRequest {
  taskType: 'TEXT_IMAGE'
  textToImageParams: {
    text: string
    negativeText?: string
  }
  imageGenerationConfig: {
    numberOfImages: number // 1-4
    height: number
    width: number
    cfgScale?: number // デフォルト8.0
    seed?: number
  }
}

// レスポンス型の定義
interface CoreModelResponse {
  images: string[]
  seeds?: number[]
  finish_reasons?: string[]
}

interface NovaModelResponse {
  images: string[]
  error?: string
}

interface TitanModelResponse {
  images: string[]
  error?: string
}

// Titanモデルの許容サイズ定義
interface TitanImageSize {
  width: number
  height: number
  aspectRatio: string
  pricing: '512x512' | '1024x1024'
}

export class ImageService {
  private runtimeClient: BedrockRuntimeClient

  // Titanモデルの許容サイズ一覧
  private readonly titanAllowedSizes: TitanImageSize[] = [
    { width: 1024, height: 1024, aspectRatio: '1:1', pricing: '1024x1024' },
    { width: 768, height: 768, aspectRatio: '1:1', pricing: '512x512' },
    { width: 512, height: 512, aspectRatio: '1:1', pricing: '512x512' },
    { width: 768, height: 1152, aspectRatio: '2:3', pricing: '1024x1024' },
    { width: 384, height: 576, aspectRatio: '2:3', pricing: '512x512' },
    { width: 1152, height: 768, aspectRatio: '3:2', pricing: '1024x1024' },
    { width: 576, height: 384, aspectRatio: '3:2', pricing: '512x512' },
    { width: 768, height: 1280, aspectRatio: '3:5', pricing: '1024x1024' },
    { width: 384, height: 640, aspectRatio: '3:5', pricing: '512x512' },
    { width: 1280, height: 768, aspectRatio: '5:3', pricing: '1024x1024' },
    { width: 640, height: 384, aspectRatio: '5:3', pricing: '512x512' },
    { width: 896, height: 1152, aspectRatio: '7:9', pricing: '1024x1024' },
    { width: 448, height: 576, aspectRatio: '7:9', pricing: '512x512' },
    { width: 1152, height: 896, aspectRatio: '9:7', pricing: '1024x1024' },
    { width: 576, height: 448, aspectRatio: '9:7', pricing: '512x512' },
    { width: 768, height: 1408, aspectRatio: '6:11', pricing: '1024x1024' },
    { width: 384, height: 704, aspectRatio: '6:11', pricing: '512x512' },
    { width: 1408, height: 768, aspectRatio: '11:6', pricing: '1024x1024' },
    { width: 704, height: 384, aspectRatio: '11:6', pricing: '512x512' },
    { width: 640, height: 1408, aspectRatio: '5:11', pricing: '1024x1024' },
    { width: 320, height: 704, aspectRatio: '5:11', pricing: '512x512' },
    { width: 1408, height: 640, aspectRatio: '11:5', pricing: '1024x1024' },
    { width: 704, height: 320, aspectRatio: '11:5', pricing: '512x512' },
    { width: 1152, height: 640, aspectRatio: '9:5', pricing: '1024x1024' },
    { width: 1173, height: 640, aspectRatio: '16:9', pricing: '1024x1024' }
  ]

  constructor(private context: ServiceContext) {
    const { accessKeyId, secretAccessKey, sessionToken, region } = this.context.store.get('aws')

    if (!accessKeyId || !secretAccessKey || !region) {
      console.warn('AWS credentials not configured')
    }

    this.runtimeClient = new BedrockRuntimeClient({
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken
      },
      region
    })
  }

  private getModelType(modelId: ImageGeneratorModel): ModelType {
    if (modelId.includes('core')) return 'core'
    if (modelId.includes('ultra')) return 'ultra'
    if (modelId.includes('sd3')) return 'sd3'
    if (modelId.includes('nova')) return 'nova'
    if (modelId.includes('titan')) return 'titan'
    throw new Error(`Unknown model type for modelId: ${modelId}`)
  }

  private findClosestTitanSize(aspectRatio?: AspectRatio): TitanImageSize {
    if (!aspectRatio) {
      // アスペクト比が指定されていない場合は1024x1024を返す
      return this.titanAllowedSizes[0]
    }

    // 要求されたアスペクト比を数値に変換（例：'16:9' → 16/9）
    const [w, h] = aspectRatio.split(':').map(Number)
    const targetRatio = w / h

    // 最も近いアスペクト比のサイズを見つける
    return this.titanAllowedSizes.reduce((closest, current) => {
      const [cw, ch] = current.aspectRatio.split(':').map(Number)
      const currentRatio = cw / ch
      const [prevW, prevH] = closest.aspectRatio.split(':').map(Number)
      const prevRatio = prevW / prevH

      // 現在のサイズと目標のアスペクト比との差を計算
      const currentDiff = Math.abs(currentRatio - targetRatio)
      const prevDiff = Math.abs(prevRatio - targetRatio)

      // より近いアスペクト比を持つサイズを選択
      // 同じ場合は大きい方のサイズを選択
      if (currentDiff < prevDiff || (currentDiff === prevDiff && current.pricing === '1024x1024')) {
        return current
      }
      return closest
    })
  }

  private getImageDimensions(
    aspectRatio: AspectRatio | undefined,
    modelType: ModelType
  ): { width: number; height: number } {
    if (modelType === 'titan') {
      const titanSize = this.findClosestTitanSize(aspectRatio)
      return {
        width: titanSize.width,
        height: titanSize.height
      }
    }

    // Stability AI models (core, ultra, sd3)とNova Canvasの場合
    if (!aspectRatio) return { width: 1024, height: 1024 }

    const [w, h] = aspectRatio.split(':').map(Number)
    // const maxSize = modelType === 'nova' ? 4096 : 1024
    const maxSize = 1024
    const baseSize = maxSize

    if (w > h) {
      return {
        width: baseSize,
        height: Math.round((baseSize * h) / w)
      }
    } else {
      return {
        width: Math.round((baseSize * w) / h),
        height: baseSize
      }
    }
  }

  private buildRequestBody(
    modelType: ModelType,
    request: GenerateImageRequest
  ): CoreModelRequest | SD3ModelRequest | NovaModelRequest | TitanModelRequest {
    const { prompt, negativePrompt, aspect_ratio, seed, output_format = 'png' } = request
    const { width, height } = this.getImageDimensions(aspect_ratio, modelType)

    switch (modelType) {
      case 'core':
        return {
          prompt,
          negative_prompt: negativePrompt,
          aspect_ratio,
          seed,
          output_format
        }

      case 'ultra':
        return {
          prompt,
          negative_prompt: negativePrompt,
          aspect_ratio,
          seed,
          output_format
        }

      case 'sd3':
        return {
          prompt,
          negative_prompt: negativePrompt,
          aspect_ratio,
          seed,
          mode: 'text-to-image',
          output_format
        }

      case 'nova':
        return {
          taskType: 'TEXT_IMAGE',
          textToImageParams: {
            text: prompt,
            negativeText: negativePrompt || undefined
          },
          imageGenerationConfig: {
            numberOfImages: 1,
            height,
            width,
            quality: 'standard',
            cfgScale: 8.0,
            seed: seed || Math.floor(Math.random() * 2147483647)
          }
        }

      case 'titan':
        return {
          taskType: 'TEXT_IMAGE',
          textToImageParams: {
            text: prompt,
            negativeText: negativePrompt || undefined
          },
          imageGenerationConfig: {
            numberOfImages: 1,
            height,
            width,
            cfgScale: 8.0,
            seed: seed || Math.floor(Math.random() * 2147483647)
          }
        }
    }
  }

  async generateImage(request: GenerateImageRequest): Promise<GeneratedImage> {
    const { modelId } = request

    // Validate model ID
    if (!this.isModelSupported(modelId)) {
      throw new Error(
        `Model ${modelId} is not supported. Supported models: ${this.getSupportedModels().join(', ')}`
      )
    }

    const modelType = this.getModelType(modelId)
    const requestBody = this.buildRequestBody(modelType, request)

    try {
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      })

      const response = await this.runtimeClient.send(command)
      const responseBody = new TextDecoder().decode(response.body)

      if (modelType === 'core' || modelType === 'ultra' || modelType === 'sd3') {
        const result = JSON.parse(responseBody) as CoreModelResponse
        if (!result.images || !Array.isArray(result.images)) {
          throw new Error('Invalid response format from Bedrock')
        }
        return {
          images: result.images,
          seeds: result.seeds,
          finish_reasons: result.finish_reasons
        }
      } else if (modelType === 'nova') {
        const result = JSON.parse(responseBody) as NovaModelResponse
        if (result.error) {
          throw new Error(`Nova error: ${result.error}`)
        }
        if (!result.images) {
          throw new Error('Invalid response format from Nova')
        }
        return {
          images: result.images
        }
      } else if (modelType === 'titan') {
        const result = JSON.parse(responseBody) as TitanModelResponse
        if (result.error) {
          throw new Error(`Titan error: ${result.error}`)
        }
        if (!result.images || !Array.isArray(result.images)) {
          throw new Error('Invalid response format from Titan')
        }
        return {
          images: result.images
        }
      }

      throw new Error('Unsupported model type')
    } catch (error: any) {
      console.error('Error generating image:', error)
      if (error.name === 'UnrecognizedClientException') {
        throw new Error('AWS authentication failed. Please check your credentials and permissions.')
      }
      if (error.name === 'ValidationException') {
        throw new Error(`Invalid request parameters: ${error.message}`)
      }
      throw error
    }
  }

  // Helper method to validate model compatibility
  isModelSupported(modelId: string): modelId is ImageGeneratorModel {
    return this.getSupportedModels().includes(modelId as ImageGeneratorModel)
  }

  private getSupportedModels(): ImageGeneratorModel[] {
    return [
      'stability.sd3-large-v1:0',
      'stability.sd3-5-large-v1:0',
      'stability.stable-image-core-v1:0',
      'stability.stable-image-core-v1:1',
      'stability.stable-image-ultra-v1:0',
      'stability.stable-image-ultra-v1:1',
      'amazon.nova-canvas-v1:0',
      'amazon.titan-image-generator-v2:0',
      'amazon.titan-image-generator-v1'
    ]
  }
}
