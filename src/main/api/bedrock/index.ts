import { ConverseService } from './services/converseService'
import { ModelService } from './services/modelService'
import { AgentService } from './services/agentService'
import { ImageService } from './services/imageService'
import { ImageRecognitionService } from './services/imageRecognitionService'
import { VideoRecognitionService } from './services/videoRecognitionService'
import { FlowService, InvokeFlowInput, InvokeFlowResult } from './services/flowService'
import {
  TranslateService,
  TranslateTextOptions,
  TranslationResult
} from './services/translateService'
import { VideoService } from './services/movieService'
import type { ServiceContext } from './types'
import type { GenerateImageRequest, GeneratedImage } from './types/image'
import type { GenerateMovieRequest, GeneratedMovie } from './types/movie'
import { GuardrailService } from './services/guardrailService'
import { ApplyGuardrailRequest } from '@aws-sdk/client-bedrock-runtime'

export class BedrockService {
  private converseService: ConverseService
  private modelService: ModelService
  private agentService: AgentService
  private imageService: ImageService
  private imageRecognitionService: ImageRecognitionService
  private videoRecognitionService: VideoRecognitionService
  private guardrailService: GuardrailService
  private flowService: FlowService
  private translateService: TranslateService
  private videoService: VideoService

  constructor(context: ServiceContext) {
    this.converseService = new ConverseService(context)
    this.modelService = new ModelService(context)
    this.agentService = new AgentService(context)
    this.imageService = new ImageService(context)
    this.imageRecognitionService = new ImageRecognitionService(context)
    this.videoRecognitionService = new VideoRecognitionService(context)
    this.guardrailService = new GuardrailService(context)
    this.flowService = new FlowService(context)
    this.translateService = new TranslateService(context.store.get('aws'))
    this.videoService = new VideoService(context)
  }

  async listModels() {
    return this.modelService.listModels()
  }

  async converse(props: Parameters<ConverseService['converse']>[0]) {
    return this.converseService.converse(props)
  }

  async converseStream(props: Parameters<ConverseService['converseStream']>[0]) {
    return this.converseService.converseStream(props)
  }

  async retrieveAndGenerate(props: Parameters<AgentService['retrieveAndGenerate']>[0]) {
    return this.agentService.retrieveAndGenerate(props)
  }

  async retrieve(props: Parameters<AgentService['retrieve']>[0]) {
    return this.agentService.retrieve(props)
  }

  async invokeAgent(props: Parameters<AgentService['invokeAgent']>[0]) {
    return this.agentService.invokeAgent(props)
  }

  async generateImage(request: GenerateImageRequest): Promise<GeneratedImage> {
    return this.imageService.generateImage(request)
  }

  isImageModelSupported(modelId: string): boolean {
    return this.imageService.isModelSupported(modelId)
  }

  async recognizeImage(props: { imagePath: string; prompt?: string; modelId?: string }) {
    return this.imageRecognitionService.recognizeImage(props)
  }

  async recognizeVideo(props: {
    videoPath: string
    prompt?: string
    modelId?: string
    s3BucketName?: string
    s3Key?: string
    cleanupS3?: boolean
  }) {
    return this.videoRecognitionService.recognizeVideo(props)
  }

  async applyGuardrail(props: ApplyGuardrailRequest) {
    return this.guardrailService.applyGuardrail(props)
  }

  async invokeFlow(params: InvokeFlowInput): Promise<InvokeFlowResult> {
    return this.flowService.invokeFlow(params)
  }

  async translateText(options: TranslateTextOptions): Promise<TranslationResult> {
    return this.translateService.translateText(options)
  }

  async translateBatch(
    texts: Array<Omit<TranslateTextOptions, 'cacheKey'>>
  ): Promise<TranslationResult[]> {
    return this.translateService.translateBatch(texts)
  }

  getCachedTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): TranslationResult | null {
    return this.translateService.getCachedTranslation(text, sourceLanguage, targetLanguage)
  }

  clearTranslationCache(): void {
    this.translateService.clearCache()
  }

  getTranslationCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return this.translateService.getCacheStats()
  }

  async checkTranslationHealth(): Promise<boolean> {
    return this.translateService.healthCheck()
  }

  async generateVideo(request: GenerateMovieRequest): Promise<GeneratedMovie> {
    return this.videoService.generateVideo(request)
  }

  async startVideoGeneration(request: GenerateMovieRequest): Promise<GeneratedMovie> {
    return this.videoService.startVideoGeneration(request)
  }

  async getVideoJobStatus(invocationArn: string) {
    return this.videoService.getJobStatus(invocationArn)
  }

  async downloadVideoFromS3(s3Uri: string, localPath: string): Promise<string> {
    return this.videoService.downloadVideoFromS3(s3Uri, localPath)
  }
}

// Re-export types for convenience
export * from './types'
export * from './types/image'
export * from './types/movie'
