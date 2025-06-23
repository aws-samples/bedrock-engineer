// Amazon Nova 動画認識関連の型定義

export interface VideoRecognitionRequest {
  videoPath: string // ローカル動画ファイルのパス
  prompt?: string // オプションのプロンプト（デフォルトは動画の説明）
  modelId?: string // 使用するモデルのID（デフォルトはNova Lite）
  s3BucketName?: string // S3バケット名（指定がない場合は自動設定）
  s3Key?: string // S3オブジェクトキー（指定がない場合は自動生成）
  cleanupS3?: boolean // 処理後にS3から削除するか（デフォルトはtrue）
}

export interface VideoRecognitionResponse {
  description: string // 動画の説明
  s3Uri?: string // アップロードされたS3 URI
  processingTime: number // 処理時間（ミリ秒）
  modelUsed: string // 使用されたモデル
  frameCount?: number // サンプリングされたフレーム数
  estimatedTokens?: number // 推定トークン数
}

export interface VideoUploadResult {
  s3Uri: string // S3 URI
  s3Key: string // S3オブジェクトキー
  bucketName: string // S3バケット名
  contentType: string // MIMEタイプ
  fileSize: number // ファイルサイズ（バイト）
}

export interface VideoValidationResult {
  isValid: boolean
  format?: VideoFormat
  size?: number
  duration?: number
  errorMessage?: string
}

export interface VideoMetadata {
  format: VideoFormat
  size: number // ファイルサイズ（バイト）
  duration?: number // 動画の長さ（秒）
  width?: number
  height?: number
  fps?: number
}

// サポートされる動画形式
export type VideoFormat =
  | 'mp4'
  | 'mov'
  | 'mkv'
  | 'webm'
  | 'flv'
  | 'mpeg'
  | 'mpg'
  | 'wmv'
  | 'three_gp' // 3GP形式はAPI上では "three_gp" として指定

// Nova動画認識用のリクエスト形式（Converse API用）
export interface NovaVideoConverseRequest {
  modelId: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: Array<{
      video?: {
        format: VideoFormat
        source: {
          s3Location: {
            uri: string
            bucketOwner?: string
          }
        }
      }
      text?: string
    }>
  }>
  system?: Array<{
    text: string
  }>
  inferenceConfig?: {
    maxTokens?: number
    temperature?: number
    topP?: number
    topK?: number
    stopSequences?: string[]
  }
}

// 動画認識エラーの型
export interface VideoRecognitionError extends Error {
  code:
    | 'INVALID_FILE'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FORMAT'
    | 'UPLOAD_FAILED'
    | 'RECOGNITION_FAILED'
    | 'S3_ACCESS_ERROR'
  details?: any
}

// 動画ファイルの制限
export const VIDEO_CONSTRAINTS = {
  // ファイルサイズ制限（バイト）
  MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB
  BASE64_THRESHOLD: 25 * 1024 * 1024, // 25MB（Base64使用の閾値）

  // サポートされるファイル形式
  SUPPORTED_FORMATS: ['mp4', 'mov', 'mkv', 'webm', 'flv', 'mpeg', 'mpg', 'wmv', '3gp'] as const,

  // MIMEタイプマッピング
  MIME_TYPES: {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    flv: 'video/x-flv',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    wmv: 'video/x-ms-wmv',
    '3gp': 'video/3gpp'
  } as const,

  // 推奨動画時間制限（秒）
  RECOMMENDED_DURATION: {
    LOW_MOTION: 3600, // 1時間
    HIGH_MOTION: 960 // 16分
  },

  // フレームサンプリング制限
  FRAME_LIMITS: {
    NOVA_MICRO_LITE_PRO: 960,
    NOVA_PREMIER: 3200
  }
} as const

// Nova動画認識モデル一覧
export const NOVA_VIDEO_MODELS = [
  'amazon.nova-micro-v1:0',
  'amazon.nova-lite-v1:0',
  'amazon.nova-pro-v1:0',
  'amazon.nova-premier-v1:0'
] as const

// クロスリージョンモデル対応
export const NOVA_VIDEO_CROSS_REGION_MODELS = [
  'us.amazon.nova-micro-v1:0',
  'us.amazon.nova-lite-v1:0',
  'us.amazon.nova-pro-v1:0',
  'us.amazon.nova-premier-v1:0',
  'eu.amazon.nova-micro-v1:0',
  'eu.amazon.nova-lite-v1:0',
  'eu.amazon.nova-pro-v1:0',
  'eu.amazon.nova-premier-v1:0',
  'apac.amazon.nova-micro-v1:0',
  'apac.amazon.nova-lite-v1:0',
  'apac.amazon.nova-pro-v1:0',
  'apac.amazon.nova-premier-v1:0'
] as const

export type NovaVideoModelId =
  | (typeof NOVA_VIDEO_MODELS)[number]
  | (typeof NOVA_VIDEO_CROSS_REGION_MODELS)[number]

// モデル判定ヘルパー関数
export function isNovaVideoModel(modelId: string): modelId is NovaVideoModelId {
  return (
    NOVA_VIDEO_MODELS.includes(modelId as any) ||
    NOVA_VIDEO_CROSS_REGION_MODELS.includes(modelId as any)
  )
}

export function isNovaPremierModel(modelId: string): boolean {
  return modelId.includes('nova-premier')
}

// 推定トークン数計算
export function estimateVideoTokens(durationSeconds: number, modelId: string): number {
  const isPremier = isNovaPremierModel(modelId)

  if (durationSeconds <= 10) {
    return 2880
  } else if (durationSeconds <= 30) {
    return 8640
  } else if (durationSeconds <= 960) {
    // 16分
    return 276480
  } else if (isPremier) {
    // Nova Premier の場合、フレーム数に応じて計算
    if (durationSeconds <= 1200) {
      // 20分
      return 345600
    } else if (durationSeconds <= 1800) {
      // 30分
      return 518400
    } else if (durationSeconds <= 2700) {
      // 45分
      return 777600
    } else {
      return 777600 // 上限
    }
  } else {
    // Nova Micro/Lite/Pro の場合、16分以降は固定
    return 276480
  }
}

// デフォルト設定
export const DEFAULT_VIDEO_RECOGNITION_CONFIG = {
  MODEL_ID: 'amazon.nova-lite-v1:0',
  SYSTEM_PROMPT:
    'あなたは動画認識を行うAIアシスタントです。提供された動画を詳細に分析し、内容を分かりやすく日本語で説明してください。',
  DEFAULT_PROMPT: 'この動画の内容を詳しく説明してください。',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.3,
  TOP_P: 0.9,
  TOP_K: 50,
  S3_PREFIX: 'temp-videos/',
  CLEANUP_S3: true
} as const
