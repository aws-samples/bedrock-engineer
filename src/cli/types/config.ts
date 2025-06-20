import { CustomAgent } from '../../types/agent-chat'
import { LLM } from '../../types/llm'

export interface CLIConfig {
  version: string
  
  // AWS Settings
  aws?: {
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
    sessionToken?: string
    profile?: string
    useProfile?: boolean
  }
  
  // Project Settings
  project?: {
    path?: string
    ignoreFiles?: string[]
  }
  
  // Agent Settings
  agents?: {
    defaultAgentId?: string
    customAgents?: CustomAgent[]
  }
  
  // Model Settings
  model?: {
    defaultModel?: LLM
    lightProcessingModel?: LLM
    inferenceParams?: {
      maxTokens?: number
      temperature?: number
      topP?: number
    }
  }
  
  // Tool Settings
  tools?: {
    tavilyApiKey?: string
    enabledTools?: string[]
  }
  
  // CLI Settings
  cli?: {
    defaultOutput?: 'text' | 'json'
    verboseLogging?: boolean
    colorOutput?: boolean
    showProgress?: boolean
  }
  
  // Cache Settings
  cache?: {
    enablePromptCache?: boolean
    contextLength?: number
  }
  
  // Guardrail Settings
  guardrail?: {
    enabled?: boolean
    guardrailIdentifier?: string
    guardrailVersion?: string
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ConfigPaths {
  globalConfig: string
  localConfig: string
  userDataDir: string
  cacheDir: string
  logsDir: string
}