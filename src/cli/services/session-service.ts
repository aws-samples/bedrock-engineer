/**
 * CLI用のシンプルなセッション管理サービス
 */
import fs from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { getConfigDir } from '../utils/config'

// セッションディレクトリ
const SESSIONS_DIR = path.join(getConfigDir(), 'sessions')

// セッション型
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  agentId: string
  modelId: string
}

/**
 * セッションディレクトリを準備
 */
function ensureSessionDir(): void {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
  }
}

/**
 * セッションファイルのパスを取得
 */
function getSessionFilePath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}.json`)
}

/**
 * 新しいセッションを作成
 */
export function createSession(agentId: string, modelId: string): string {
  ensureSessionDir()
  
  const sessionId = `session_${Date.now()}_${uuidv4().slice(0, 8)}`
  const session: ChatSession = {
    id: sessionId,
    title: `Chat ${new Date().toLocaleString()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    agentId,
    modelId
  }
  
  // セッションをファイルに保存
  const filePath = getSessionFilePath(sessionId)
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2))
  
  return sessionId
}

/**
 * セッションにメッセージを追加
 */
export function addMessage(sessionId: string, role: 'user' | 'assistant', content: string): void {
  const session = getSession(sessionId)
  if (!session) {
    throw new Error(`セッションID "${sessionId}" が見つかりません`)
  }
  
  // メッセージを追加
  const message: ChatMessage = {
    id: uuidv4(),
    role,
    content,
    timestamp: Date.now()
  }
  
  session.messages.push(message)
  session.updatedAt = Date.now()
  
  // セッションをファイルに保存
  const filePath = getSessionFilePath(sessionId)
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2))
}

/**
 * セッションを取得
 */
export function getSession(sessionId: string): ChatSession | null {
  const filePath = getSessionFilePath(sessionId)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data) as ChatSession
  } catch (error) {
    console.error(`セッションファイルの読み込みに失敗しました: ${error}`)
    return null
  }
}

/**
 * セッションを削除
 */
export function deleteSession(sessionId: string): boolean {
  const filePath = getSessionFilePath(sessionId)
  
  if (!fs.existsSync(filePath)) {
    return false
  }
  
  try {
    fs.unlinkSync(filePath)
    return true
  } catch (error) {
    console.error(`セッションファイルの削除に失敗しました: ${error}`)
    return false
  }
}

/**
 * すべてのセッションを削除
 */
export function deleteAllSessions(): boolean {
  ensureSessionDir()
  
  try {
    const files = fs.readdirSync(SESSIONS_DIR)
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(SESSIONS_DIR, file))
      }
    }
    return true
  } catch (error) {
    console.error(`すべてのセッションの削除に失敗しました: ${error}`)
    return false
  }
}

/**
 * すべてのセッションを取得
 */
export function getAllSessions(): ChatSession[] {
  ensureSessionDir()
  
  try {
    const files = fs.readdirSync(SESSIONS_DIR)
    const sessions: ChatSession[] = []
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(SESSIONS_DIR, file)
        try {
          const data = fs.readFileSync(filePath, 'utf-8')
          const session = JSON.parse(data) as ChatSession
          sessions.push(session)
        } catch (error) {
          console.error(`セッションファイルの読み込みに失敗しました (${file}): ${error}`)
        }
      }
    }
    
    // 最終更新日時の降順でソート
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (error) {
    console.error(`セッション一覧の取得に失敗しました: ${error}`)
    return []
  }
}