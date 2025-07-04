import { BackgroundMessage } from './types'
import { createCategoryLogger } from '../../../../../common/logger'

const sessionLogger = createCategoryLogger('background-agent:session')

/**
 * BackgroundAgentのセッション管理クラス
 * In-memoryでセッションごとの会話履歴を管理
 */
export class BackgroundAgentSessionManager {
  private sessions: Map<string, BackgroundMessage[]> = new Map()

  /**
   * 新しいセッションを作成
   */
  createSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) {
      sessionLogger.warn('Session already exists', { sessionId })
      return
    }

    this.sessions.set(sessionId, [])
    sessionLogger.info('Session created', { sessionId })
  }

  /**
   * セッションが存在するかチェック
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId)
  }

  /**
   * セッションにメッセージを追加
   */
  addMessage(sessionId: string, message: BackgroundMessage): void {
    if (!this.sessions.has(sessionId)) {
      this.createSession(sessionId)
    }

    const messages = this.sessions.get(sessionId)!
    messages.push(message)

    sessionLogger.debug('Message added to session', {
      sessionId,
      messageId: message.id,
      role: message.role,
      totalMessages: messages.length
    })
  }

  /**
   * セッションの会話履歴を取得
   */
  getHistory(sessionId: string): BackgroundMessage[] {
    if (!this.sessions.has(sessionId)) {
      sessionLogger.debug('Session not found, returning empty history', { sessionId })
      return []
    }

    const history = this.sessions.get(sessionId)!
    sessionLogger.debug('Retrieved session history', {
      sessionId,
      messageCount: history.length
    })

    return [...history] // コピーを返す
  }

  /**
   * セッションを削除
   */
  deleteSession(sessionId: string): boolean {
    const existed = this.sessions.delete(sessionId)

    if (existed) {
      sessionLogger.info('Session deleted', { sessionId })
    } else {
      sessionLogger.warn('Attempted to delete non-existent session', { sessionId })
    }

    return existed
  }

  /**
   * 全セッションID一覧を取得
   */
  listSessions(): string[] {
    const sessionIds = Array.from(this.sessions.keys())
    sessionLogger.debug('Listed sessions', { count: sessionIds.length })
    return sessionIds
  }

  /**
   * セッション統計情報を取得
   */
  getSessionStats(sessionId: string): {
    exists: boolean
    messageCount: number
    userMessages: number
    assistantMessages: number
  } {
    if (!this.sessions.has(sessionId)) {
      return {
        exists: false,
        messageCount: 0,
        userMessages: 0,
        assistantMessages: 0
      }
    }

    const messages = this.sessions.get(sessionId)!
    const userMessages = messages.filter((m) => m.role === 'user').length
    const assistantMessages = messages.filter((m) => m.role === 'assistant').length

    return {
      exists: true,
      messageCount: messages.length,
      userMessages,
      assistantMessages
    }
  }

  /**
   * 全セッションの統計情報を取得
   */
  getAllSessionStats(): {
    totalSessions: number
    totalMessages: number
    averageMessagesPerSession: number
  } {
    const totalSessions = this.sessions.size
    let totalMessages = 0

    for (const messages of this.sessions.values()) {
      totalMessages += messages.length
    }

    const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0

    return {
      totalSessions,
      totalMessages,
      averageMessagesPerSession: Math.round(averageMessagesPerSession * 100) / 100
    }
  }

  /**
   * メモリクリーンアップ：空のセッションを削除
   */
  cleanupEmptySessions(): number {
    let cleanedCount = 0

    for (const [sessionId, messages] of this.sessions.entries()) {
      if (messages.length === 0) {
        this.sessions.delete(sessionId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      sessionLogger.info('Cleaned up empty sessions', { cleanedCount })
    }

    return cleanedCount
  }
}
