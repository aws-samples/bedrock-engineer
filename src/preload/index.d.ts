import { ElectronAPI } from '@electron-toolkit/preload'
import { ChatMessage, ChatSession } from '../types/chat/history'
import { API } from '@preload/api'

interface ChatHistoryAPI {
  createSession(agentId: string, modelId: string, systemPrompt?: string): string
  addMessage(sessionId: string, message: ChatMessage): void
  getSession(sessionId: string): ChatSession | null
  updateSessionTitle(sessionId: string, title: string): void
  deleteSession(sessionId: string): void
  deleteAllSessions(): void
  getRecentSessions(): ChatSession[]
  getAllSessionMetadata(): SessionMetadata[]
  setActiveSession(sessionId: string | undefined): void
  getActiveSessionId(): string | undefined
  updateMessageContent(sessionId: string, messageIndex: number, updatedMessage: ChatMessage): void
  deleteMessage(sessionId: string, messageIndex: number): void
  // トークン制限を考慮した最適化されたメッセージリストを取得する
  getOptimizedMessages(sessionId: string): {
    messages: any[]
    systemPromptText: string
    summarized: boolean
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
    store: any // 既存のstore型があればそれに合わせてください
    file: any // 既存のfile型があればそれに合わせてください
    tools: any // 既存のtools型があればそれに合わせてください
    chatHistory: ChatHistoryAPI
  }
}
