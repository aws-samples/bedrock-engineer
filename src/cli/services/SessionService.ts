import { promises as fs } from 'fs'
import { join } from 'path'
import { CLISession, SessionManager, SessionStorage } from '../types/session'
import { ChatMessage } from '../types/commands'
import { ConfigService } from './ConfigService'
import { logger } from '../utils/logger'

export class FileSessionStorage implements SessionStorage {
  private sessionsDir: string

  constructor(dataDir: string) {
    this.sessionsDir = join(dataDir, 'sessions')
  }

  private async ensureSessionsDir(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true })
    } catch (error) {
      logger.debug('Failed to create sessions directory:', error)
    }
  }

  async save(session: CLISession): Promise<void> {
    await this.ensureSessionsDir()
    const sessionFile = join(this.sessionsDir, `${session.id}.json`)
    const sessionData = JSON.stringify(session, null, 2)
    await fs.writeFile(sessionFile, sessionData, 'utf-8')
  }

  async load(sessionId: string): Promise<CLISession | null> {
    try {
      const sessionFile = join(this.sessionsDir, `${sessionId}.json`)
      const sessionData = await fs.readFile(sessionFile, 'utf-8')
      return JSON.parse(sessionData) as CLISession
    } catch (error) {
      logger.debug(`Failed to load session ${sessionId}:`, error)
      return null
    }
  }

  async list(): Promise<string[]> {
    try {
      await this.ensureSessionsDir()
      const files = await fs.readdir(this.sessionsDir)
      return files.filter((file) => file.endsWith('.json')).map((file) => file.replace('.json', ''))
    } catch (error) {
      logger.debug('Failed to list sessions:', error)
      return []
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    try {
      const sessionFile = join(this.sessionsDir, `${sessionId}.json`)
      await fs.unlink(sessionFile)
      return true
    } catch (error) {
      logger.debug(`Failed to delete session ${sessionId}:`, error)
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      const sessionIds = await this.list()
      await Promise.all(sessionIds.map((id) => this.delete(id)))
    } catch (error) {
      logger.debug('Failed to clear sessions:', error)
    }
  }
}

export class CLISessionManager implements SessionManager {
  private storage: SessionStorage
  private sessions: Map<string, CLISession> = new Map()

  constructor(configService: ConfigService) {
    const paths = configService.getPaths()
    this.storage = new FileSessionStorage(paths.userDataDir)
  }

  async createSession(agentId: string): Promise<CLISession> {
    const session: CLISession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agentId,
      agent: {} as any, // Will be populated by the caller
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        modelId: '',
        totalTokens: 0,
        totalCost: 0,
        toolsUsed: []
      }
    }

    this.sessions.set(session.id, session)
    await this.storage.save(session)

    logger.debug(`Created session: ${session.id}`)
    return session
  }

  async getSession(sessionId: string): Promise<CLISession | null> {
    // Check memory cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!
    }

    // Load from storage
    const session = await this.storage.load(sessionId)
    if (session) {
      this.sessions.set(sessionId, session)
    }

    return session
  }

  async updateSession(sessionId: string, updates: Partial<CLISession>): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: Date.now()
    }

    this.sessions.set(sessionId, updatedSession)
    await this.storage.save(updatedSession)

    logger.debug(`Updated session: ${sessionId}`)
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    this.sessions.delete(sessionId)
    const deleted = await this.storage.delete(sessionId)

    if (deleted) {
      logger.debug(`Deleted session: ${sessionId}`)
    }

    return deleted
  }

  async listSessions(): Promise<CLISession[]> {
    const sessionIds = await this.storage.list()
    const sessions: CLISession[] = []

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId)
      if (session) {
        sessions.push(session)
      }
    }

    // Sort by creation time (newest first)
    return sessions.sort((a, b) => b.createdAt - a.createdAt)
  }

  async clearSessions(): Promise<void> {
    this.sessions.clear()
    await this.storage.clear()
    logger.debug('Cleared all sessions')
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    session.messages.push(message)
    session.updatedAt = Date.now()

    // Update metadata
    if (message.toolUses) {
      message.toolUses.forEach((toolUse) => {
        if (!session.metadata.toolsUsed.includes(toolUse.name)) {
          session.metadata.toolsUsed.push(toolUse.name)
        }
      })
    }

    this.sessions.set(sessionId, session)
    await this.storage.save(session)

    logger.debug(`Added message to session: ${sessionId}`)
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getSession(sessionId)
    return session?.messages || []
  }

  // Utility methods
  async getSessionStats(sessionId: string): Promise<{
    messageCount: number
    totalTokens: number
    totalCost: number
    toolsUsed: string[]
    duration: number
  } | null> {
    const session = await this.getSession(sessionId)
    if (!session) {
      return null
    }

    const duration = session.updatedAt - session.createdAt

    return {
      messageCount: session.messages.length,
      totalTokens: session.metadata.totalTokens || 0,
      totalCost: session.metadata.totalCost || 0,
      toolsUsed: session.metadata.toolsUsed,
      duration
    }
  }

  async exportSession(sessionId: string, format: 'json' | 'text' = 'json'): Promise<string> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    if (format === 'json') {
      return JSON.stringify(session, null, 2)
    } else {
      // Text format for readability
      let output = `Session: ${session.id}\n`
      output += `Agent: ${session.agent.name}\n`
      output += `Created: ${new Date(session.createdAt).toLocaleString()}\n`
      output += `Updated: ${new Date(session.updatedAt).toLocaleString()}\n`
      output += `Messages: ${session.messages.length}\n`

      if (session.metadata.toolsUsed.length > 0) {
        output += `Tools Used: ${session.metadata.toolsUsed.join(', ')}\n`
      }

      output += '\n--- Messages ---\n\n'

      session.messages.forEach((message, index) => {
        const role = message.role === 'user' ? 'User' : 'Assistant'
        output += `${index + 1}. ${role} (${new Date(message.timestamp).toLocaleString()}):\n`
        output += `${message.content}\n\n`
      })

      return output
    }
  }
}
