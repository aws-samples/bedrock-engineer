import {
  ContentBlock,
  ConversationRole,
  InferenceConfiguration,
  Message
} from '@aws-sdk/client-bedrock-runtime'

export interface BackgroundAgentConfig {
  modelId: string
  systemPrompt?: string
  agentId: string // エージェントIDを必須にして、エージェント設定から取得
  projectDirectory?: string // 作業ディレクトリを指定
  inferenceConfig?: InferenceConfiguration // タスク固有の推論設定
}

export interface BackgroundMessage extends Message {
  id: string
  role: ConversationRole
  content: ContentBlock[]
  timestamp: number
  metadata?: {
    converseMetadata?: any
    sessionCost?: number
  }
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

export interface BackgroundAgentSession {
  sessionId: string
  projectDirectory?: string
  createdAt: number
  lastActiveAt: number
  agentId: string
  modelId: string
}

// スケジューリング機能用の型定義
export interface ScheduleConfig {
  taskId?: string
  name: string
  cronExpression: string // "0 9 * * 1-5" (平日9時)
  agentConfig: BackgroundAgentConfig
  wakeWord: string // 実行時に送信するプロンプト
  enabled: boolean
  continueSession?: boolean // セッション継続フラグ
  continueSessionPrompt?: string // セッション継続時専用プロンプト
}

export interface ScheduledTask {
  id: string
  name: string
  cronExpression: string
  agentId: string
  modelId: string
  projectDirectory?: string
  wakeWord: string
  enabled: boolean
  createdAt: number
  lastRun?: number
  nextRun?: number
  runCount: number
  lastError?: string
  inferenceConfig?: InferenceConfiguration // タスク固有の推論設定
  continueSession?: boolean // セッション継続フラグ
  continueSessionPrompt?: string // セッション継続時専用プロンプト
  lastSessionId?: string // 最後に使用したセッションID
  isExecuting?: boolean // 実行中フラグ（重複実行防止用）
  lastExecutionStarted?: number // 最後の実行開始時刻
}

export interface TaskExecutionResult {
  taskId: string
  executedAt: number
  status: 'running' | 'success' | 'failed'
  error?: string
  sessionId: string
  messageCount: number
}
