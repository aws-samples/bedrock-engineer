import React, { useState, useEffect } from 'react'
import { SessionList } from './components/SessionList'
import { BackgroundChatArea } from './components/BackgroundChatArea'
import { NewSessionModal } from './components/NewSessionModal'
import useSetting from '@renderer/hooks/useSetting'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: any[]
  timestamp: number
}

interface SessionConfig {
  modelId: string
  agentId: string
  systemPrompt: string
}

const BackgroundAgentPage: React.FC = () => {
  const [sessions, setSessions] = useState<string[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false)
  const [sessionConfigs, setSessionConfigs] = useState<Record<string, SessionConfig>>({})

  const { currentLLM, agents } = useSetting()

  // セッション一覧を取得
  const loadSessions = async () => {
    try {
      const result = await window.api.backgroundAgent.listSessions()
      setSessions(result.sessions)
    } catch (error: any) {
      console.error('Failed to load sessions:', error)
    }
  }

  // セッション履歴を取得
  const loadSessionHistory = async (sessionId: string) => {
    try {
      const result = await window.api.backgroundAgent.getSessionHistory(sessionId)
      setMessages(result.history)
    } catch (error: any) {
      console.error('Failed to load session history:', error)
      setMessages([])
    }
  }

  // セッション選択
  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    loadSessionHistory(sessionId)
  }

  // セッション削除
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await window.api.backgroundAgent.deleteSession(sessionId)

      // セッション設定も削除
      setSessionConfigs((prev) => {
        const newConfigs = { ...prev }
        delete newConfigs[sessionId]
        return newConfigs
      })

      // セッション一覧を更新
      await loadSessions()

      // 削除されたセッションが選択されていた場合はクリア
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null)
        setMessages([])
      }
    } catch (error: any) {
      console.error('Failed to delete session:', error)
    }
  }

  // 新規セッション作成
  const handleCreateSession = async (config: {
    modelId: string
    agentId: string
    systemPrompt: string
  }) => {
    try {
      const sessionId = 'session-' + Date.now()

      // セッション作成
      await window.api.backgroundAgent.createSession(sessionId)

      // セッション設定を保存
      setSessionConfigs((prev) => ({
        ...prev,
        [sessionId]: config
      }))

      // セッション一覧を更新
      await loadSessions()

      // 新しいセッションを選択
      setSelectedSessionId(sessionId)
      setMessages([])

      console.log('Session created with config:', config)
    } catch (error: any) {
      console.error('Failed to create session:', error)
    }
  }

  // メッセージ送信
  const handleSendMessage = async (message: string) => {
    if (!selectedSessionId) return

    const sessionConfig = sessionConfigs[selectedSessionId]

    // agentIdが必須になったので、存在チェック
    if (!sessionConfig?.agentId) {
      console.error('Agent ID is required but not found in session config')
      alert(
        'エージェントが選択されていません。新しいセッションを作成してエージェントを選択してください。'
      )
      return
    }

    // ユーザーメッセージを即座に表示（useAgentChatと同じパターン）
    const userMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: [{ text: message }],
      timestamp: Date.now()
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      await window.api.backgroundAgent.chat({
        sessionId: selectedSessionId,
        config: {
          modelId:
            sessionConfig.modelId ||
            currentLLM?.modelId ||
            'anthropic.claude-3-haiku-20240307-v1:0',
          systemPrompt: sessionConfig.systemPrompt || 'You are a helpful assistant.',
          agentId: sessionConfig.agentId
        },
        userMessage: message
      })

      // セッション履歴を再読み込み（AI応答を含む最新履歴を取得）
      await loadSessionHistory(selectedSessionId)
    } catch (error: any) {
      console.error('Failed to send message:', error)

      // エラー時はユーザーメッセージを削除
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))

      alert('メッセージの送信に失敗しました: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 設定モーダルを開く（将来実装）
  const handleOpenSettings = () => {
    // TODO: 設定モーダルの実装
    console.log('Open settings modal')
  }

  // 初期ロード
  useEffect(() => {
    loadSessions()
  }, [])

  return (
    <div className="flex h-screen">
      {/* セッション一覧 */}
      <SessionList
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSessionSelect={handleSessionSelect}
        onCreateSession={() => setIsNewSessionModalOpen(true)}
        onDeleteSession={handleDeleteSession}
      />

      {/* チャットエリア */}
      <BackgroundChatArea
        sessionId={selectedSessionId}
        messages={messages}
        loading={loading}
        onSendMessage={handleSendMessage}
        onOpenSettings={handleOpenSettings}
      />

      {/* 新規セッション作成モーダル */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onCreateSession={handleCreateSession}
        agents={agents}
      />
    </div>
  )
}

export default BackgroundAgentPage
