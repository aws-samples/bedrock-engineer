// Amazon Nova Reel related types

export interface GenerateMovieRequest {
  prompt: string
  durationSeconds: number
  outputPath?: string
  seed?: number
  s3Uri: string // S3 output location (required)
  inputImages?: string[] // Array of local image file paths
  prompts?: string[] // Array of prompts for each shot (when using multiple images)
}

export interface GeneratedMovie {
  invocationArn: string
  status: AsyncInvocationStatus
  outputLocation?: string
  localPath?: string
  error?: string
}

export interface AsyncInvocationStatus {
  invocationArn: string
  modelId: string
  status: 'InProgress' | 'Completed' | 'Failed'
  submitTime: Date
  endTime?: Date
  outputDataConfig?: {
    s3OutputDataConfig: {
      s3Uri: string
    }
  }
  failureMessage?: string
}

export interface ImageSource {
  format: 'png' | 'jpeg'
  source: {
    bytes?: string // Base64 encoded image for TEXT_VIDEO
    s3Location?: {
      uri: string // S3 URI for MULTI_SHOT_MANUAL
    }
  }
}

export interface Shot {
  text: string
  image?: ImageSource
}

export interface NovaReelRequest {
  taskType: 'TEXT_VIDEO' | 'MULTI_SHOT_AUTOMATED' | 'MULTI_SHOT_MANUAL'
  textToVideoParams?: {
    text: string
    images?: ImageSource[] // For TEXT_VIDEO with image input
  }
  multiShotAutomatedParams?: {
    text: string
  }
  multiShotManualParams?: {
    shots: Shot[] // For MULTI_SHOT_MANUAL with multiple images
  }
  videoGenerationConfig: {
    durationSeconds?: number // Optional for MULTI_SHOT_MANUAL mode
    fps: number // Fixed at 24
    dimension: string // Fixed at '1280x720'
    seed: number
  }
}

export interface StartAsyncInvokeRequest {
  modelId: string
  modelInput: NovaReelRequest
  outputDataConfig: {
    s3OutputDataConfig: {
      s3Uri: string
    }
  }
}

export interface AsyncInvocationResponse {
  invocationArn: string
}

export interface GetAsyncInvokeResponse {
  invocationArn: string
  modelId: string
  status: 'InProgress' | 'Completed' | 'Failed'
  submitTime: Date
  endTime?: Date
  outputDataConfig?: {
    s3OutputDataConfig: {
      s3Uri: string
    }
  }
  failureMessage?: string
}

// Nova Reel model constants
export const NOVA_REEL_V1_1 = 'amazon.nova-reel-v1:1'
export const NOVA_REEL_V1_0 = 'amazon.nova-reel-v1:0'
export const NOVA_REEL_RESOLUTION = '1280x720'
export const NOVA_REEL_FPS = 24

// Region support mapping for Nova Reel models
export const NOVA_REEL_REGION_SUPPORT: Record<string, string[]> = {
  'us-east-1': [NOVA_REEL_V1_1, NOVA_REEL_V1_0], // Both v1.1 and v1.0 available
  'eu-west-1': [NOVA_REEL_V1_0], // Only v1.0 available
  'ap-northeast-1': [NOVA_REEL_V1_0] // Only v1.0 available
}

/**
 * Get the best available Nova Reel model ID for the specified region
 * @param region AWS region (e.g., 'us-east-1')
 * @returns The model ID to use, or throws an error if Nova Reel is not supported
 */
export function getNovaReelModelId(region: string): string {
  const supportedModels = NOVA_REEL_REGION_SUPPORT[region]

  if (!supportedModels || supportedModels.length === 0) {
    throw new Error(
      `Nova Reel is not available in region ${region}. ` +
        `Supported regions: ${Object.keys(NOVA_REEL_REGION_SUPPORT).join(', ')}`
    )
  }

  // Return the first (best) available model for the region
  return supportedModels[0]
}

/**
 * Check if Nova Reel is supported in the specified region
 * @param region AWS region
 * @returns true if Nova Reel is supported in the region
 */
export function isNovaReelSupportedInRegion(region: string): boolean {
  const supportedModels = NOVA_REEL_REGION_SUPPORT[region]
  return Boolean(supportedModels && supportedModels.length > 0)
}

/**
 * Get all regions where Nova Reel is supported
 * @returns Array of supported region IDs
 */
export function getNovaReelSupportedRegions(): string[] {
  return Object.keys(NOVA_REEL_REGION_SUPPORT)
}

/**
 * Check if the given model ID is Nova Reel v1.0
 * @param modelId The Nova Reel model ID
 * @returns true if the model is v1.0
 */
export function isNovaReelV1_0(modelId: string): boolean {
  return modelId === NOVA_REEL_V1_0
}

/**
 * Check if the given model ID is Nova Reel v1.1
 * @param modelId The Nova Reel model ID
 * @returns true if the model is v1.1
 */
export function isNovaReelV1_1(modelId: string): boolean {
  return modelId === NOVA_REEL_V1_1
}

// Backward compatibility - will use us-east-1 model by default
export const NOVA_REEL_MODEL_ID = NOVA_REEL_V1_1

// Duration validation - 6 seconds for TEXT_VIDEO, multiple of 6 between 12-120 seconds for MULTI_SHOT_AUTOMATED
export const VALID_DURATIONS = [
  6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120
]

export function isValidDuration(duration: number): boolean {
  return VALID_DURATIONS.includes(duration)
}

export function getTaskTypeForDuration(duration: number): 'TEXT_VIDEO' | 'MULTI_SHOT_AUTOMATED' {
  return duration === 6 ? 'TEXT_VIDEO' : 'MULTI_SHOT_AUTOMATED'
}

export function getTaskTypeForRequest(
  duration: number,
  hasInputImages: boolean
): 'TEXT_VIDEO' | 'MULTI_SHOT_AUTOMATED' | 'MULTI_SHOT_MANUAL' {
  if (hasInputImages) {
    return duration === 6 ? 'TEXT_VIDEO' : 'MULTI_SHOT_MANUAL'
  } else {
    return duration === 6 ? 'TEXT_VIDEO' : 'MULTI_SHOT_AUTOMATED'
  }
}
