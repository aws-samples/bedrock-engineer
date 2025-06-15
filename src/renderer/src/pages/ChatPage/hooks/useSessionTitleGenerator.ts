import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { useLightProcessingModel } from '@renderer/lib/modelSelection'
import { generateSessionTitle } from '../utils/titleGenerator'
import { IdentifiableMessage } from '@/types/chat/message'

interface UseSessionTitleGeneratorProps {
  enableHistory: boolean
}

export function useSessionTitleGenerator({ enableHistory }: UseSessionTitleGeneratorProps) {
  const { t } = useTranslation()
  const { getLightModelId } = useLightProcessingModel()
  const { getSession, updateSessionTitle } = useChatHistory()

  // タイトル生成済みフラグ（同じセッションで複数回生成しないため）
  const titleGenerated = useRef<Set<string>>(new Set())

  // メッセージ数が閾値を超えたときにタイトル生成を実行
  const MESSAGE_THRESHOLD = 4 // タイトル生成のためのメッセージ数閾値

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
    [generateTitleForCurrentSession, enableHistory]
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
    [generateTitleForCurrentSession, enableHistory]
  )

  return {
    checkAndGenerateTitle,
    generateTitleForPreviousSession,
    MESSAGE_THRESHOLD
  }
}
