import { Message } from '@aws-sdk/client-bedrock-runtime'
import { ConfigStore } from '../../../preload/store'

export type CallConverseAPIProps = {
  modelId: string
  messages: Message[]
  system: [{ text: string }]
  toolConfig?: any
}

export type AWSCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
}

export interface ThinkingMode {
  enabled: boolean
  type: 'enabled'
  budget_tokens: number
}

export type InferenceParams = {
  maxTokens: number
  temperature: number
  topP?: number
  thinking?: ThinkingMode
}

export type ServiceContext = {
  store: ConfigStore
}
