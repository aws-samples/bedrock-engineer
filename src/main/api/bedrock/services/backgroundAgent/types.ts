import { ContentBlock, ConversationRole } from '@aws-sdk/client-bedrock-runtime'

export interface BackgroundAgentConfig {
  modelId: string
  systemPrompt?: string
  agentId: string // エージェントIDを必須にして、エージェント設定から取得
}

export interface BackgroundMessage {
  id: string
  role: ConversationRole
  content: ContentBlock[]
  timestamp: number
}

export interface BackgroundChatResult {
  response: BackgroundMessage
  toolExecutions?: Array<{
    toolName: string
    input: any
    output: any
    success: boolean
    error?: string
  }>
}

export interface BackgroundAgentOptions {
  enableToolExecution?: boolean
  maxToolExecutions?: number
  timeoutMs?: number
}
