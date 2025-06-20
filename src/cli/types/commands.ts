export interface ChatCommandOptions {
  agent?: string
  prompt: string
  output?: 'text' | 'json'
  verbose?: boolean
  config?: string
  sessionId?: string
  tools?: string[]
  model?: string
}

export interface InteractiveCommandOptions {
  agent?: string
  config?: string
  verbose?: boolean
  model?: string
}

export interface AgentCommandOptions {
  format?: 'text' | 'json' | 'yaml'
  verbose?: boolean
}

export interface ConfigCommandOptions {
  global?: boolean
  verbose?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  toolUses?: ToolUse[]
  toolResults?: ToolResult[]
}

export interface ToolUse {
  id: string
  name: string
  input: any
}

export interface ToolResult {
  id: string
  content: string | object
  status: 'success' | 'error'
}

export interface ChatResponse {
  message: string
  toolUses?: ToolUse[]
  toolResults?: ToolResult[]
  metadata?: {
    modelId: string
    inputTokens?: number
    outputTokens?: number
    cost?: number
  }
}

export interface ChatDelta {
  type: 'text' | 'tool_use' | 'tool_result' | 'metadata'
  content: string | ToolUse | ToolResult | any
}