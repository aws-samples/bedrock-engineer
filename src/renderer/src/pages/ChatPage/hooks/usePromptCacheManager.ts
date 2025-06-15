import { useRef, useCallback } from 'react'
import { Message } from '@aws-sdk/client-bedrock-runtime'
import {
  addCachePointsToMessages,
  addCachePointToSystem,
  addCachePointToTools,
  logCacheUsage
} from '@renderer/lib/promptCacheUtils'
import { ToolState } from '@/types/agent-chat'

interface UsePromptCacheManagerProps {
  modelId: string
  enablePromptCache: boolean
}

export function usePromptCacheManager({ modelId, enablePromptCache }: UsePromptCacheManagerProps) {
  // キャッシュポイントを保持するための状態
  const lastCachePoint = useRef<number | undefined>(undefined)

  /**
   * メッセージにキャッシュポイントを追加
   */
  const addCachePointsToMessagesWithState = useCallback(
    (messages: Message[]) => {
      if (!enablePromptCache) return messages

      const messagesWithCache = addCachePointsToMessages(messages, modelId, lastCachePoint.current)

      // キャッシュポイントが更新された場合、次回の会話ためにキャッシュポイントのインデックスを更新
      if (
        messagesWithCache[messagesWithCache.length - 1].content?.some((b) => b.cachePoint?.type)
      ) {
        // 次回の会話のために現在のキャッシュポイントを更新
        // 現在のメッセージ配列の最後のインデックスを次回の最初のキャッシュポイントとして設定
        lastCachePoint.current = messagesWithCache.length - 1
      }

      return messagesWithCache
    },
    [enablePromptCache, modelId]
  )

  /**
   * システムプロンプトにキャッシュポイントを追加
   */
  const addCachePointToSystemPrompt = useCallback(
    (systemPrompt: string | undefined) => {
      if (!systemPrompt) return undefined
      if (!enablePromptCache) return [{ text: systemPrompt }]
      return addCachePointToSystem([{ text: systemPrompt }], modelId)
    },
    [enablePromptCache, modelId]
  )

  /**
   * ツール設定にキャッシュポイントを追加
   */
  const addCachePointToToolConfig = useCallback(
    (toolConfig: { tools: ToolState[] }) => {
      if (!enablePromptCache) return toolConfig
      return addCachePointToTools(toolConfig, modelId)
    },
    [enablePromptCache, modelId]
  )

  /**
   * キャッシュ使用状況をログ出力
   */
  const logCacheUsageForMetadata = useCallback(
    (metadata: any) => {
      logCacheUsage(metadata, modelId)
    },
    [modelId]
  )

  /**
   * キャッシュポイントをリセット（セッション切り替え時等に使用）
   */
  const resetCachePoint = useCallback(() => {
    lastCachePoint.current = undefined
  }, [])

  return {
    addCachePointsToMessages: addCachePointsToMessagesWithState,
    addCachePointToSystemPrompt,
    addCachePointToToolConfig,
    logCacheUsageForMetadata,
    resetCachePoint
  }
}
