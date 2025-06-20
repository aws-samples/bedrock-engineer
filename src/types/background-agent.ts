export interface BackgroundAgentConfig {
  id: string
  name: string
  agentId: string // CustomAgentのID
  modelId: string
  autoStart?: boolean
  maxSessions?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export interface BackgroundAgentStatus {
  id: string
  agentId: string
  status: 'idle' | 'running' | 'error' | 'stopped'
  startedAt?: number
  lastActivity?: number
  uptime?: number

  // セッション情報
  currentSessionId?: string
  totalSessions: number
  activeSessionCount: number

  // パフォーマンス情報
  messagesProcessed: number
  toolsExecuted: number
  errorCount: number

  // 設定情報
  config: BackgroundAgentConfig

  // エラー情報
  lastError?: string
}

export interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: any
}

export interface BackgroundAgentStartParams {
  agentId: string
  modelId: string
  config?: Partial<BackgroundAgentConfig>
}

export interface BackgroundAgentResponse {
  success: boolean
  data?: any
  error?: string
}
