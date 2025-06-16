import { useCallback, useRef, useState } from 'react'
import { Message } from '@aws-sdk/client-bedrock-runtime'
import { IdentifiableMessage } from '@/types/chat/message'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { useTranslation } from 'react-i18next'
import { useLightProcessingModel } from '@renderer/lib/modelSelection'
import { generateSessionTitle } from '../utils/titleGenerator'

interface UseSessionManagerProps {
  sessionId?: string
  enableHistory: boolean
  modelId: string
  systemPrompt?: string
  abortCurrentRequest: () => void
}

interface SessionManagerCallbacks {
  setMessages: (
    updater: IdentifiableMessage[] | ((prev: IdentifiableMessage[]) => IdentifiableMessage[])
  ) => void
  resetCachePoint: () => void
}

export function useSessionManager({
  sessionId,
  enableHistory,
  modelId,
  systemPrompt,
  abortCurrentRequest
}: UseSessionManagerProps) {
  const { t } = useTranslation()
  const { getLightModelId } = useLightProcessingModel()
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId)

  // タイトル生成済みフラグ（同じセッションで複数回生成しないため）
  const titleGenerated = useRef<Set<string>>(new Set())
  // メッセージ数が閾値を超えたときにタイトル生成を実行
  const MESSAGE_THRESHOLD = 4 // タイトル生成のためのメッセージ数閾値

  // ChatHistoryContext から操作関数を取得
  const { getSession, createSession, updateSessionTitle, setActiveSession, deleteMessage } =
    useChatHistory()

  /**
   * 現在のセッションにタイトルを生成する関数
   */
  const generateTitleForCurrentSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId || !enableHistory) return

      // このセッションIDをタイトル生成済みとしてマーク
      titleGenerated.current.add(sessionId)

      try {
        // セッションの詳細を取得
        const session = getSession(sessionId)
        if (!session) return

        // セッションのタイトルが既にカスタマイズされている場合は生成しない
        // "Chat "で始まるデフォルトタイトルのみ置き換える
        if (!session.title.startsWith('Chat ')) return

        // 軽量処理用モデルIDを取得
        const lightModelId = getLightModelId()

        // 軽量モデルでタイトルを生成
        const newTitle = await generateSessionTitle(session, lightModelId, t)
        if (newTitle) {
          await updateSessionTitle(sessionId, newTitle)
        }
      } catch (error) {
        console.error('Error generating title for current session:', error)
      }
    },
    [enableHistory, getSession, updateSessionTitle, getLightModelId, t]
  )

  /**
   * メッセージ数に基づいてタイトル生成が必要かチェックし、実行する
   */
  const checkAndGenerateTitle = useCallback(
    (messages: IdentifiableMessage[], sessionId?: string) => {
      // メッセージが閾値を超え、まだタイトルが生成されていない場合に実行
      if (
        messages.length > MESSAGE_THRESHOLD &&
        sessionId &&
        !titleGenerated.current.has(sessionId) &&
        enableHistory
      ) {
        generateTitleForCurrentSession(sessionId)
      }
    },
    [generateTitleForCurrentSession, enableHistory, MESSAGE_THRESHOLD]
  )

  /**
   * セッション切り替え時に既存セッションのタイトル生成をチェック
   */
  const generateTitleForPreviousSession = useCallback(
    (messages: IdentifiableMessage[], previousSessionId?: string) => {
      if (
        previousSessionId &&
        messages.length > MESSAGE_THRESHOLD &&
        !titleGenerated.current.has(previousSessionId) &&
        enableHistory
      ) {
        generateTitleForCurrentSession(previousSessionId)
      }
    },
    [generateTitleForCurrentSession, enableHistory, MESSAGE_THRESHOLD]
  )

  /**
   * セッションを切り替える
   */
  const setSession = useCallback(
    (newSessionId: string, messages: IdentifiableMessage[], callbacks: SessionManagerCallbacks) => {
      const { resetCachePoint } = callbacks

      // 既存のセッションにタイトルを生成
      generateTitleForPreviousSession(messages, currentSessionId)

      // 進行中の通信を中断してから新しいセッションを設定
      abortCurrentRequest()
      setCurrentSessionId(newSessionId)
      resetCachePoint()
    },
    [abortCurrentRequest, currentSessionId, generateTitleForPreviousSession]
  )

  /**
   * チャットをクリア（新しいセッションを作成）
   */
  const clearChat = useCallback(
    async (callbacks: SessionManagerCallbacks) => {
      const { setMessages, resetCachePoint } = callbacks

      // 進行中の通信を中断
      abortCurrentRequest()

      // 新しいセッションを作成
      const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
      setCurrentSessionId(newSessionId)

      // メッセージをクリア
      setMessages([])

      // キャッシュポイントもリセット
      resetCachePoint()
    },
    [modelId, systemPrompt, abortCurrentRequest, createSession]
  )

  /**
   * セッションの初期化
   */
  const initializeSession = useCallback(
    async (callbacks: SessionManagerCallbacks) => {
      const { setMessages, resetCachePoint } = callbacks

      if (sessionId) {
        const session = getSession(sessionId)
        if (session) {
          // 既存の通信があれば中断
          abortCurrentRequest()
          setMessages(session.messages as Message[])
          setCurrentSessionId(sessionId)
          // 新しいセッションに切り替えた場合はキャッシュポイントをリセット
          resetCachePoint()
        }
      } else if (enableHistory) {
        // 履歴保存が有効な場合のみ新しいセッションを作成
        const newSessionId = await createSession('defaultAgent', modelId, systemPrompt)
        setCurrentSessionId(newSessionId)
        // 新しいセッションを作成した場合はキャッシュポイントをリセット
        resetCachePoint()
      }
    },
    [
      sessionId,
      enableHistory,
      getSession,
      createSession,
      abortCurrentRequest,
      modelId,
      systemPrompt
    ]
  )

  /**
   * セッション切り替え時の処理
   */
  const handleSessionChange = useCallback(
    (sessionId: string, callbacks: SessionManagerCallbacks) => {
      const { setMessages, resetCachePoint } = callbacks

      if (sessionId) {
        // セッション切り替え時に進行中の通信を中断
        abortCurrentRequest()
        const session = getSession(sessionId)
        if (session) {
          setMessages(session.messages as Message[])
          setActiveSession(sessionId)
          // セッション切り替え時にキャッシュポイントをリセット
          resetCachePoint()
        }
      }
    },
    [getSession, setActiveSession, abortCurrentRequest]
  )

  return {
    currentSessionId,
    setCurrentSessionId,
    checkAndGenerateTitle,
    generateTitleForPreviousSession,
    setSession,
    clearChat,
    initializeSession,
    handleSessionChange,
    deleteMessage,
    MESSAGE_THRESHOLD
  }
}
