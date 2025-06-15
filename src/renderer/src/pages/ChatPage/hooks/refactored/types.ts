// 共通の型定義ファイル

import { IdentifiableMessage } from '@/types/chat/message'
import { ToolName } from '@/types/tools'

// UI状態の型
export interface ChatUIState {
  loading: boolean
  reasoning: boolean
  executingTool: ToolName | null
  latestReasoningText: string
}

// セッション管理の型
export interface SessionInfo {
  currentSessionId: string | undefined
  enableHistory: boolean
}

// ツール実行の型
export interface ToolExecutionState {
  isExecuting: boolean
  currentTool: ToolName | null
}

// メッセージ管理の型
export interface MessageOperations {
  addMessage: (message: IdentifiableMessage) => Promise<void>
  persistMessage: (message: IdentifiableMessage) => Promise<IdentifiableMessage>
  clearMessages: () => void
}

// ストリーミングの型
export interface StreamingState {
  isStreaming: boolean
  abortController: AbortController | null
}

// リファクタリング後のフックの戻り値の型
export interface UseAgentChatReturn {
  // メッセージ関連
  messages: IdentifiableMessage[]
  setMessages: React.Dispatch<React.SetStateAction<IdentifiableMessage[]>>
  
  // UI状態
  loading: boolean
  reasoning: boolean
  executingTool: ToolName | null
  latestReasoningText: string
  
  // セッション管理
  currentSessionId: string | undefined
  setCurrentSessionId: (sessionId: string) => void
  clearChat: () => Promise<void>
  
  // メイン機能
  handleSubmit: (userInput: string, attachedImages?: any[]) => Promise<any>
  stopGeneration: () => void
}