import { AWS_REGIONS } from './aws-regions'

// Extract Bedrock supported regions from AWS_REGIONS
export const BEDROCK_SUPPORTED_REGIONS = AWS_REGIONS.filter(
  (region) => region.bedrockSupported
).map((region) => region.id)

// Create a union type from the aws-regions
export type BedrockSupportRegion = (typeof AWS_REGIONS)[number]['id']

// Define thinking mode budget tokens
export enum ThinkingModeBudget {
  NONE = 0, // No thinking mode
  QUICK = 1024, // Quick thinking mode
  NORMAL = 4096, // Normal thinking mode
  DEEP = 16384, // Deep thinking mode
  DEEPER = 32768 // Deeper thinking mode
}

// Thinking mode type
export interface ThinkingMode {
  type: 'enabled' | 'disabled'
  budget_tokens?: ThinkingModeBudget // Make it optional when type is 'disabled'
}

// Enhanced LLM interface with additional type safety
export interface LLM {
  readonly modelId: string // Make it readonly for immutability
  readonly modelName: string
  readonly toolUse: boolean
  readonly regions: readonly BedrockSupportRegion[] // Use the specific region type
  readonly maxTokensLimit?: number // Optional parameter for model-specific limits
  readonly supportsThinking?: boolean // Whether the model supports extended thinking
  readonly isInferenceProfile?: boolean // Whether this is an inference profile
  readonly inferenceProfileArn?: string // ARN of the inference profile if applicable
  readonly description?: string // Description of the inference profile
}

// Type guard for LLM validation
export const isValidLLM = (llm: LLM): boolean => {
  return (
    typeof llm.modelId === 'string' &&
    typeof llm.modelName === 'string' &&
    typeof llm.toolUse === 'boolean' &&
    Array.isArray(llm.regions) &&
    llm.regions.every((region) => BEDROCK_SUPPORTED_REGIONS.includes(region))
  )
}

export interface InferenceParameters {
  maxTokens: number
  temperature: number
  topP?: number
}

// Application Inference Profile for cost allocation
export interface ApplicationInferenceProfile {
  readonly inferenceProfileArn: string
  readonly inferenceProfileName: string
  readonly description?: string
  readonly status: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly modelSource: {
    copyFrom: string
  }
  readonly type: string
}
