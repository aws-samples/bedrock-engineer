import path from 'path'
import fs from 'fs'
import Store from 'electron-store'
import { BackgroundMessage } from './types'
import { store } from '../../../../../preload/store'
import { createCategoryLogger } from '../../../../../common/logger'

const sessionLogger = createCategoryLogger('background-agent:chat-session')

export interface BackgroundSessionMetadata {
  sessionId: string
  taskId?: string
  agentId: string
  modelId: string
  projectDirectory?: string
  createdAt: number
  updatedAt: number
  messageCount: number
  executionType: 'scheduled' | 'manual'
}

export interface BackgroundChatSession {
  sessionId: string
  taskId?: string
  agentId: string
  modelId: string
  projectDirectory?: string
  createdAt: number
  updatedAt: number
  messages: BackgroundMessage[]
  executionMetadata?: {
    executedAt: number
    success: boolean
    error?: string
  }
}

export interface CreateSessionOptions {
  taskId?: string
  agentId?: string
  modelId?: string
  projectDirectory?: string
  executionType?: 'scheduled' | 'manual'
}

/**
 * BackgroundAgentのセッション永続化管理クラス
 * 既存のChatSessionManagerを参考に実装
 */
export class BackgroundChatSessionManager {
  private readonly sessionsDir: string
  private metadataStore: Store<{
    metadata: { [key: string]: BackgroundSessionMetadata }
  }>

  constructor() {
    const userDataPath = store.get('userDataPath')
    if (!userDataPath) {
      throw new Error('userDataPath is not set in store')
    }

    // BackgroundAgentのセッションファイルを保存するディレクトリを作成
    this.sessionsDir = path.join(userDataPath, 'background-agent-sessions')
    fs.mkdirSync(this.sessionsDir, { recursive: true })

    // メタデータ用のストアを初期化
    this.metadataStore = new Store({
      name: 'background-agent-sessions-meta',
      defaults: {
        metadata: {} as { [key: string]: BackgroundSessionMetadata }
      }
    })

    // 初回起動時、既存のセッションからメタデータを生成
    this.initializeMetadata()

    sessionLogger.info('BackgroundChatSessionManager initialized', {
      sessionsDir: this.sessionsDir
    })
  }

  private initializeMetadata(): void {
    const metadata = this.metadataStore.get('metadata')
    if (Object.keys(metadata).length === 0) {
      try {
        const files = fs.readdirSync(this.sessionsDir)
        const sessionFiles = files.filter((file) => file.endsWith('.json'))

        for (const file of sessionFiles) {
          const sessionId = file.replace('.json', '')
          const session = this.readSessionFile(sessionId)
          if (session) {
            this.updateMetadata(sessionId, session)
          }
        }

        sessionLogger.info('Background session metadata initialized', {
          sessionCount: sessionFiles.length
        })
      } catch (error: any) {
        sessionLogger.error('Error initializing background session metadata', {
          error: error.message
        })
      }
    }
  }

  private getSessionFilePath(sessionId: string): string {
    return path.join(this.sessionsDir, `${sessionId}.json`)
  }

  private readSessionFile(sessionId: string): BackgroundChatSession | null {
    const filePath = this.getSessionFilePath(sessionId)
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as BackgroundChatSession
    } catch (error: any) {
      sessionLogger.debug('Error reading background session file (file may not exist)', {
        sessionId,
        error: error.message
      })
      return null
    }
  }

  private async writeSessionFile(sessionId: string, session: BackgroundChatSession): Promise<void> {
    const filePath = this.getSessionFilePath(sessionId)
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(session, null, 2))
      sessionLogger.debug('Background session file written', {
        sessionId,
        messageCount: session.messages.length
      })
    } catch (error: any) {
      sessionLogger.error('Error writing background session file', {
        sessionId,
        error: error.message
      })
    }
  }

  private updateMetadata(sessionId: string, session: BackgroundChatSession): void {
    const metadata: BackgroundSessionMetadata = {
      sessionId: session.sessionId,
      taskId: session.taskId,
      agentId: session.agentId,
      modelId: session.modelId,
      projectDirectory: session.projectDirectory,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      executionType: session.taskId ? 'scheduled' : 'manual'
    }

    const current = this.metadataStore.get('metadata')
    this.metadataStore.set('metadata', {
      ...current,
      [sessionId]: metadata
    })

    sessionLogger.debug('Background session metadata updated', {
      sessionId,
      messageCount: metadata.messageCount
    })
  }

  /**
   * 新しいセッションを作成
   */
  async createSession(sessionId: string, options: CreateSessionOptions = {}): Promise<void> {
    if (this.hasSession(sessionId)) {
      sessionLogger.warn('Background session already exists', { sessionId })
      return
    }

    const session: BackgroundChatSession = {
      sessionId,
      taskId: options.taskId,
      agentId: options.agentId || '',
      modelId: options.modelId || '',
      projectDirectory: options.projectDirectory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    }

    await this.writeSessionFile(sessionId, session)
    this.updateMetadata(sessionId, session)

    sessionLogger.info('Background session created', {
      sessionId,
      taskId: options.taskId,
      agentId: options.agentId,
      projectDirectory: options.projectDirectory
    })
  }

  /**
   * セッションが存在するかチェック
   */
  hasSession(sessionId: string): boolean {
    const filePath = this.getSessionFilePath(sessionId)
    return fs.existsSync(filePath)
  }

  /**
   * セッションにメッセージを追加
   */
  async addMessage(sessionId: string, message: BackgroundMessage): Promise<void> {
    let session = this.readSessionFile(sessionId)

    // セッションが存在しない場合は作成
    if (!session) {
      await this.createSession(sessionId)
      session = this.readSessionFile(sessionId)
      if (!session) {
        sessionLogger.error('Failed to create session for message', { sessionId })
        return
      }
    }

    session.messages.push(message)
    session.updatedAt = Date.now()

    await this.writeSessionFile(sessionId, session)
    this.updateMetadata(sessionId, session)

    sessionLogger.debug('Message added to background session', {
      sessionId,
      messageId: message.id,
      role: message.role,
      totalMessages: session.messages.length
    })
  }

  /**
   * セッションの会話履歴を取得
   */
  getHistory(sessionId: string): BackgroundMessage[] {
    const session = this.readSessionFile(sessionId)
    if (!session) {
      sessionLogger.debug('Background session not found, returning empty history', { sessionId })
      return []
    }

    sessionLogger.debug('Retrieved background session history', {
      sessionId,
      messageCount: session.messages.length
    })

    return [...session.messages] // コピーを返す
  }

  /**
   * セッションを削除
   */
  deleteSession(sessionId: string): boolean {
    const filePath = this.getSessionFilePath(sessionId)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      // メタデータからも削除
      const metadata = this.metadataStore.get('metadata')
      delete metadata[sessionId]
      this.metadataStore.set('metadata', metadata)

      sessionLogger.info('Background session deleted', { sessionId })
      return true
    } catch (error: any) {
      sessionLogger.error('Error deleting background session', {
        sessionId,
        error: error.message
      })
      return false
    }
  }

  /**
   * 全セッションID一覧を取得
   */
  listSessions(): string[] {
    try {
      const files = fs.readdirSync(this.sessionsDir)
      const sessionIds = files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''))

      sessionLogger.debug('Listed background sessions', { count: sessionIds.length })
      return sessionIds
    } catch (error: any) {
      sessionLogger.error('Error listing background sessions', {
        error: error.message
      })
      return []
    }
  }

  /**
   * セッション統計情報を取得
   */
  getSessionStats(sessionId: string): {
    exists: boolean
    messageCount: number
    userMessages: number
    assistantMessages: number
    metadata?: BackgroundSessionMetadata
  } {
    const session = this.readSessionFile(sessionId)
    if (!session) {
      return {
        exists: false,
        messageCount: 0,
        userMessages: 0,
        assistantMessages: 0
      }
    }

    const userMessages = session.messages.filter((m) => m.role === 'user').length
    const assistantMessages = session.messages.filter((m) => m.role === 'assistant').length
    const metadata = this.metadataStore.get('metadata')[sessionId]

    return {
      exists: true,
      messageCount: session.messages.length,
      userMessages,
      assistantMessages,
      metadata
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
    const sessionIds = this.listSessions()
    let totalMessages = 0

    for (const sessionId of sessionIds) {
      const session = this.readSessionFile(sessionId)
      if (session) {
        totalMessages += session.messages.length
      }
    }

    const averageMessagesPerSession = sessionIds.length > 0 ? totalMessages / sessionIds.length : 0

    return {
      totalSessions: sessionIds.length,
      totalMessages,
      averageMessagesPerSession: Math.round(averageMessagesPerSession * 100) / 100
    }
  }

  /**
   * セッションメタデータを取得
   */
  getSessionMetadata(sessionId: string): BackgroundSessionMetadata | undefined {
    return this.metadataStore.get('metadata')[sessionId]
  }

  /**
   * 全セッションメタデータを取得
   */
  getAllSessionsMetadata(): BackgroundSessionMetadata[] {
    const metadata = this.metadataStore.get('metadata')
    return Object.values(metadata)
      .filter((meta) => {
        // ファイルが実際に存在することを確認
        const filePath = this.getSessionFilePath(meta.sessionId)
        return fs.existsSync(filePath)
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * プロジェクトディレクトリでセッションをフィルタ
   */
  getSessionsByProjectDirectory(projectDirectory: string): BackgroundSessionMetadata[] {
    return this.getAllSessionsMetadata().filter(
      (session) => session.projectDirectory === projectDirectory
    )
  }

  /**
   * エージェントIDでセッションをフィルタ
   */
  getSessionsByAgentId(agentId: string): BackgroundSessionMetadata[] {
    return this.getAllSessionsMetadata().filter((session) => session.agentId === agentId)
  }

  /**
   * タスクIDでセッションをフィルタ
   */
  getSessionsByTaskId(taskId: string): BackgroundSessionMetadata[] {
    return this.getAllSessionsMetadata().filter((session) => session.taskId === taskId)
  }

  /**
   * 実行メタデータを更新
   */
  async updateExecutionMetadata(
    sessionId: string,
    executionMetadata: BackgroundChatSession['executionMetadata']
  ): Promise<void> {
    const session = this.readSessionFile(sessionId)
    if (!session) {
      sessionLogger.warn('Cannot update execution metadata for non-existent session', { sessionId })
      return
    }

    session.executionMetadata = executionMetadata
    session.updatedAt = Date.now()

    await this.writeSessionFile(sessionId, session)
    this.updateMetadata(sessionId, session)

    sessionLogger.debug('Execution metadata updated', {
      sessionId,
      success: executionMetadata?.success
    })
  }

  /**
   * メモリクリーンアップ：古いセッションを削除
   */
  cleanupOldSessions(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAgeMs
    let cleanedCount = 0

    const metadata = this.metadataStore.get('metadata')
    const sessionsToDelete = Object.values(metadata).filter(
      (session) => session.updatedAt < cutoffTime
    )

    for (const session of sessionsToDelete) {
      if (this.deleteSession(session.sessionId)) {
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      sessionLogger.info('Cleaned up old background sessions', { cleanedCount })
    }

    return cleanedCount
  }
}
