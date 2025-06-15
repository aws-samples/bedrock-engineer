import { useState, useEffect, useCallback, useRef } from 'react'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { generateSessionTitle } from '../../utils/titleGenerator'
import { useLightProcessingModel } from '@renderer/lib/modelSelection'
import { useTranslation } from 'react-i18next'
import { IdentifiableMessage } from '@/types/chat/message'

export interface UseSessionManagerProps {
  modelId: string
  systemPrompt?: string
  sessionId?: string
  enableHistory?: boolean
}

export interface UseSessionManagerReturn {
  currentSessionId: string | undefined
  setCurrentSessionId: (sessionId: string) => void
  clearSession: () => Promise<void>
  initializeSession: () => Promise<void>
  generateTitleForCurrentSession: () => Promise<void>
}

export const useSessionManager = ({
  modelId,
  systemPrompt,
  sessionId,
  enableHistory = true
}: UseSessionManagerProps): UseSessionManagerReturn => {
  const [currentSessionId, setCurrentSessionIdState] = useState<string | undefined>(sessionId)

  // タイトル生成済みフラグ（同じセッションで複数回生成しないため）
  const titleGenerated = useRef<Set<string>>(new Set())
  const MESSAGE_THRESHOLD = 4 // タイトル生成のためのメッセージ数閾値

  const { t } = useTranslation()
  const { getLightModelId } = useLightProcessingModel()

  const { getSession, createSession, updateSessionTitle, setActiveSession } = useChatHistory()

  // セッションの初期化
  const initializeSession = useCallback(async () => {
    if (sessionId) {
      const session = getSession(sessionId)
      if (session) {
        setCurrentSessionIdState(sessionId)
      }
    } else if (enableHistory) {
      // 履歴保存が有効な場合のみ新しいセッションを作成
      const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
      setCurrentSessionIdState(newSessionId)
    }
  }, [sessionId, enableHistory, getSession, createSession, modelId, systemPrompt])

  // セッションを切り替える
  const setCurrentSessionId = useCallback(
    (newSessionId: string) => {
      setCurrentSessionIdState(newSessionId)
      if (newSessionId) {
        setActiveSession(newSessionId)
      }
    },
    [setActiveSession]
  )

  // セッションをクリア（新しいセッションを作成）
  const clearSession = useCallback(async () => {
    if (!enableHistory) {
      setCurrentSessionIdState(undefined)
      return
    }

    const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
    setCurrentSessionIdState(newSessionId)
  }, [enableHistory, createSession, modelId, systemPrompt])

  // 現在のセッションにタイトルを生成する関数
  const generateTitleForCurrentSession = useCallback(async () => {
    if (!currentSessionId || !enableHistory) return

    // このセッションIDをタイトル生成済みとしてマーク
    titleGenerated.current.add(currentSessionId)

    try {
      // セッションの詳細を取得
      const session = getSession(currentSessionId)
      if (!session) return

      // セッションのタイトルが既にカスタマイズされている場合は生成しない
      // "Chat "で始まるデフォルトタイトルのみ置き換える
      if (!session.title.startsWith('Chat ')) return

      // 軽量処理用モデルIDを取得
      const lightModelId = getLightModelId()

      // 軽量モデルでタイトルを生成
      const newTitle = await generateSessionTitle(session, lightModelId, t)
      if (newTitle) {
        await updateSessionTitle(currentSessionId, newTitle)
      }
    } catch (error) {
      console.error('Error generating title for current session:', error)
    }
  }, [currentSessionId, enableHistory, getSession, getLightModelId, t, updateSessionTitle])

  // メッセージ数を監視してタイトル生成をトリガーする関数
  const checkAndGenerateTitle = useCallback(
    async (messages: IdentifiableMessage[]) => {
      // メッセージが閾値を超え、まだタイトルが生成されていない場合に実行
      if (
        messages.length > MESSAGE_THRESHOLD &&
        currentSessionId &&
        !titleGenerated.current.has(currentSessionId) &&
        enableHistory
      ) {
        await generateTitleForCurrentSession()
      }
    },
    [currentSessionId, generateTitleForCurrentSession, enableHistory]
  )

  // 初期化
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  return {
    currentSessionId,
    setCurrentSessionId,
    clearSession,
    initializeSession,
    generateTitleForCurrentSession: checkAndGenerateTitle
  }
}
