import { ChatMessage } from '../types/chat/history'
import { SessionMetadata } from '../types/chat/history'
import { ChatSessionManager } from '../main/store/chatSession'

const chatSessionManager = new ChatSessionManager()

export const chatHistory = {
  async createSession(agentId: string, modelId: string, systemPrompt?: string) {
    return await chatSessionManager.createSession(agentId, modelId, systemPrompt)
  },

  async addMessage(sessionId: string, message: ChatMessage) {
    return await chatSessionManager.addMessage(sessionId, message)
  },

  getSession(sessionId: string) {
    return chatSessionManager.getSession(sessionId)
  },

  async updateSessionTitle(sessionId: string, title: string) {
    return await chatSessionManager.updateSessionTitle(sessionId, title)
  },

  deleteSession(sessionId: string) {
    return chatSessionManager.deleteSession(sessionId)
  },

  deleteAllSessions() {
    return chatSessionManager.deleteAllSessions()
  },

  getRecentSessions(): SessionMetadata[] {
    return chatSessionManager.getRecentSessions()
  },

  getAllSessionMetadata(): SessionMetadata[] {
    return chatSessionManager.getAllSessionMetadata()
  },

  setActiveSession(sessionId: string | undefined) {
    return chatSessionManager.setActiveSession(sessionId)
  },

  getActiveSessionId() {
    return chatSessionManager.getActiveSessionId()
  },

  async updateMessageContent(sessionId: string, messageIndex: number, updatedMessage: ChatMessage) {
    return await chatSessionManager.updateMessageContent(sessionId, messageIndex, updatedMessage)
  },

  async deleteMessage(sessionId: string, messageIndex: number) {
    return await chatSessionManager.deleteMessage(sessionId, messageIndex)
  }
}
