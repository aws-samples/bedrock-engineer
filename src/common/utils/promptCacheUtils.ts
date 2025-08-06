import type {
  Message,
  ContentBlock,
  ToolConfiguration,
  ConverseStreamMetadataEvent
} from '@aws-sdk/client-bedrock-runtime'
import {
  getModelCacheableFields,
  isModelPromptCacheSupported,
  type CacheableField
} from '../../main/api/bedrock/models'

/**
 * キャッシュ可能なフィールドの型定義（再エクスポート）
 */
export type { CacheableField }

/**
 * メッセージにキャッシュポイントを追加
 *
 * @param messages メッセージ配列
 * @param modelId モデルID
 * @param firstCachePoint 最初のキャッシュポイント
 * @returns キャッシュポイントを追加したメッセージ配列
 */
export function addCachePointsToMessages(
  messages: Message[],
  modelId: string,
  firstCachePoint?: number
): Message[] {
  // モデルがPrompt Cacheをサポートしていない場合、またはmessagesフィールドがキャッシュ対象でない場合は
  // 元のメッセージをそのまま返す
  if (
    !isModelPromptCacheSupported(modelId) ||
    !getModelCacheableFields(modelId).includes('messages')
  ) {
    return messages
  }

  if (messages.length === 0) return messages

  // メッセージのコピーを作成
  const messagesWithCachePoints = [...messages]

  // キャッシュポイントを設定するインデックスを決定
  const secondCachePoint = messages.length - 1

  // 両方のキャッシュポイントを設定（重複を排除）
  const indicesToAddCache = [
    ...new Set([...(firstCachePoint !== undefined ? [firstCachePoint] : []), secondCachePoint])
  ].filter(
    (index) =>
      // Amazon Nova の場合、toolResult 直後に cachePoint を置くとエラーになる
      getModelCacheableFields(modelId).includes('tools') ||
      !messages[index].content?.some((b) => b.toolResult)
  )

  // 選択したメッセージにだけキャッシュポイントを追加
  const result = messagesWithCachePoints.map((message, index) => {
    if (indicesToAddCache.includes(index) && message.content && Array.isArray(message.content)) {
      // キャッシュポイントを追加（型を明示的に指定）
      return {
        ...message,
        content: [
          ...message.content,
          { cachePoint: { type: 'default' } } as ContentBlock.CachePointMember
        ]
      }
    }
    return message
  })

  // 次の会話のために現在の secondCachePoint を返す
  return result
}

/**
 * システムプロンプトにキャッシュポイントを追加
 *
 * @param system システムプロンプト
 * @param modelId モデルID
 * @returns キャッシュポイントを追加したシステムプロンプト
 */
export function addCachePointToSystem<T extends ContentBlock[] | { text: string }[]>(
  system: T,
  modelId: string
): T {
  // モデルがPrompt Cacheをサポートしていない場合、またはsystemフィールドがキャッシュ対象でない場合は
  // 元のシステムプロンプトをそのまま返す
  if (
    !isModelPromptCacheSupported(modelId) ||
    !getModelCacheableFields(modelId).includes('system')
  ) {
    return system
  }

  // システムプロンプトにcachePointを追加
  if (system.length > 0) {
    // キャッシュポイントを追加
    const updatedSystem = [
      ...system,
      { cachePoint: { type: 'default' } } as ContentBlock.CachePointMember
    ]
    return updatedSystem as T
  }

  return system
}

/**
 * ツール設定にキャッシュポイントを追加
 *
 * @param toolConfig ツール設定
 * @param modelId モデルID
 * @returns キャッシュポイントを追加したツール設定
 */
export function addCachePointToTools(
  toolConfig: ToolConfiguration | undefined,
  modelId: string
): ToolConfiguration | undefined {
  // ツール設定がない場合はundefinedを返す
  if (!toolConfig) {
    return toolConfig
  }

  // モデルがPrompt Cacheをサポートしていない場合、またはtoolsフィールドがキャッシュ対象でない場合は
  // 元のツール設定をそのまま返す
  if (
    !isModelPromptCacheSupported(modelId) ||
    !getModelCacheableFields(modelId).includes('tools')
  ) {
    return toolConfig
  }

  // ツール設定にcachePointを追加
  if (toolConfig.tools && toolConfig.tools.length > 0) {
    // キャッシュポイントを追加
    const cachePointTool = { cachePoint: { type: 'default' } } as any

    return {
      ...toolConfig,
      tools: [...toolConfig.tools, cachePointTool]
    }
  }

  return toolConfig
}

/**
 * キャッシュ使用状況のログ出力
 *
 * @param metadata メタデータ
 * @param modelId モデルID
 */
export function logCacheUsage(
  metadata: ConverseStreamMetadataEvent | Record<string, any>,
  modelId: string
): void {
  // メタデータからキャッシュ関連の情報を抽出
  const inputTokens = metadata.usage?.inputTokens ?? 0
  const outputTokens = metadata.usage?.outputTokens ?? 0
  const cacheReadInputTokens = metadata.usage?.cacheReadInputTokens ?? 0
  const cacheWriteInputTokens = metadata.usage?.cacheWriteInputTokens ?? 0

  // キャッシュヒット率を計算
  const totalInputTokens = cacheReadInputTokens + cacheWriteInputTokens + inputTokens
  const cacheHitRatio =
    totalInputTokens > 0 ? (cacheReadInputTokens / totalInputTokens).toFixed(2) : '0.00'

  // キャッシュ使用状況をログ出力
  console.debug('Converse API cache usage', {
    inputTokens,
    outputTokens,
    cacheReadInputTokens,
    cacheWriteInputTokens,
    cacheHitRatio,
    modelId,
    isPromptCacheSupported: isModelPromptCacheSupported(modelId),
    cacheableFields: getModelCacheableFields(modelId)
  })
}
