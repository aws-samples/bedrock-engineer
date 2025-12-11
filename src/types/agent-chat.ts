import type { Tool } from '@aws-sdk/client-bedrock-runtime'

// Re-export types used by CustomAgent
export type { BedrockAgent } from './agent'
export type { ToolName } from './tools'

// Import Zod-inferred types
import type {
  CommandConfigSchemaType,
  WindowConfigSchemaType,
  CameraConfigSchemaType,
  ScenarioSchemaType,
  AgentIconSchemaType,
  AgentCategorySchemaType,
  BaseAgentSchemaType,
  CustomAgentSchemaType,
  KnowledgeBaseSchemaType,
  InputTypeSchemaType,
  FlowConfigSchemaType,
  McpServerConfigSchemaType,
  TavilySearchConfigSchemaType,
  EnvironmentContextSettingsSchemaType
} from './agent-chat.schema'

export type CommandConfig = CommandConfigSchemaType
export type WindowConfig = WindowConfigSchemaType
export type CameraConfig = CameraConfigSchemaType
export type Scenario = ScenarioSchemaType
export type AgentIcon = AgentIconSchemaType
export type AgentCategory = AgentCategorySchemaType
export type Agent = BaseAgentSchemaType
export type CustomAgent = CustomAgentSchemaType
export type KnowledgeBase = KnowledgeBaseSchemaType
export type InputType = InputTypeSchemaType
export type FlowConfig = FlowConfigSchemaType
export type McpServerConfig = McpServerConfigSchemaType
export type TavilySearchConfig = TavilySearchConfigSchemaType
export type EnvironmentContextSettings = EnvironmentContextSettingsSchemaType

export type AgentChatConfig = {
  ignoreFiles?: string[]
  contextLength?: number
  enablePromptCache?: boolean
  requestTimeout?: number
}

export type SendMsgKey = 'Enter' | 'Cmd+Enter'

export type ToolState = {
  enabled: boolean
} & Tool

export type AgentSettings = {
  customAgents: CustomAgent[]
}

// 組織設定の型定義
export interface OrganizationConfig {
  id: string
  name: string
  description?: string
  s3Config: {
    bucket: string
    prefix?: string // パス単位での分離
    region: string
  }
}
