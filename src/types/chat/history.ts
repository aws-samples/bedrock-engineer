import { ConversationRole, ContentBlock } from '@aws-sdk/client-bedrock-runtime'
import { ToolState } from '../agent-chat'

type AttachedImage = {
  file: File
  preview: string
  base64: string
}

export interface ChatMessage {
  id: string
  role: ConversationRole
  content: ContentBlock[]
  timestamp: number
  metadata?: {
    modelId?: string
    tools?: ToolState[]
    images?: AttachedImage[]
    converseMetadata?: Record<string, any> // BedrockのConverseStreamMetadataEvent型のデータを保存するフィールド
    diagram?: DiagramMetadata // ダイアグラム関連のメタデータ
  }
}

export interface DiagramMetadata {
  xml?: string
  explanation?: string
  diagramMode?: 'aws' | 'software-architecture' | 'business-process'
}

export interface SessionMetadata {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messageCount: number
  agentId: string
  modelId: string
  systemPrompt?: string
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  agentId: string
  systemPrompt?: string
  modelId: string
}

export interface ChatHistoryStore {
  sessions: {
    [key: string]: ChatSession
  }
  activeSessionId?: string
  recentSessions: string[] // 最近使用したセッションID（最大10個）
}
