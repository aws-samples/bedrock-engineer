import { ChatMessage } from './commands'
import { CustomAgent } from '../../types/agent-chat'

export interface CLISession {
  id: string
  agentId: string
  agent: CustomAgent
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  metadata: {
    modelId: string
    totalTokens?: number
    totalCost?: number
    toolsUsed: string[]
  }
}

export interface SessionManager {
  createSession(agentId: string): Promise<CLISession>
  getSession(sessionId: string): Promise<CLISession | null>
  updateSession(sessionId: string, updates: Partial<CLISession>): Promise<void>
  deleteSession(sessionId: string): Promise<boolean>
  listSessions(): Promise<CLISession[]>
  clearSessions(): Promise<void>
  addMessage(sessionId: string, message: ChatMessage): Promise<void>
  getMessages(sessionId: string): Promise<ChatMessage[]>
}

export interface SessionStorage {
  save(session: CLISession): Promise<void>
  load(sessionId: string): Promise<CLISession | null>
  list(): Promise<string[]>
  delete(sessionId: string): Promise<boolean>
  clear(): Promise<void>
}