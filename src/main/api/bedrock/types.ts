import {
  GuardrailConfiguration,
  InferenceConfiguration,
  Message,
  SystemContentBlock,
  ToolConfiguration
} from '@aws-sdk/client-bedrock-runtime'
import { ConfigStore } from '../../../preload/store'

export type CallConverseAPIProps = {
  modelId: string
  messages: Message[]
  system: SystemContentBlock[]
  toolConfig?: ToolConfiguration
  guardrailConfig?: GuardrailConfiguration
  inferenceConfig?: InferenceConfiguration
}

export type ProxyConfiguration = {
  enabled: boolean
  host?: string
  port?: number
  username?: string
  password?: string
  protocol?: 'http' | 'https'
}

export type ProxySettings = {
  proxyConfig?: ProxyConfiguration
  autoDetectProxy?: boolean // OSプロキシ自動検出を有効にするか
}

export type AWSCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  profile?: string
  useProfile?: boolean
  proxyConfig?: ProxyConfiguration
  autoDetectProxy?: boolean
}

export interface ThinkingMode {
  type: 'enabled' | 'disabled'
  budget_tokens?: number
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
