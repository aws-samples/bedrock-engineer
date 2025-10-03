import { InferenceConfiguration } from '@aws-sdk/client-bedrock-runtime'

export interface JSONSchema {
  type: string
  properties?: Record<string, any>
  required?: string[]
  items?: any
  description?: string
  [key: string]: any
}

export interface StructuredOutputRequest {
  modelId: string
  systemPrompt: string
  userMessage: string
  outputSchema: JSONSchema
  toolOptions?: {
    name?: string
    description?: string
  }
  inferenceConfig?: InferenceConfiguration
}

export class StructuredOutputError extends Error {
  constructor(
    message: string,
    public code: 'MISSING_OUTPUT' | 'VALIDATION_ERROR' | 'SCHEMA_ERROR',
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'StructuredOutputError'
  }
}
