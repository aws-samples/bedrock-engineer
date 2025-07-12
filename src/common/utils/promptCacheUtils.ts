import type {
  Message,
  ContentBlock,
  ToolConfiguration,
  ConverseStreamMetadataEvent
} from '@aws-sdk/client-bedrock-runtime'

/**
 * キャッシュ可能なフィールドの型定義
 */
export type CacheableField = 'messages' | 'system' | 'tools'

/**
 * モデルごとのキャッシュサポート情報
 * 各モデルがサポートするキャッシュ可能なフィールドを定義
 */
const MODEL_CACHE_SUPPORT: Record<string, CacheableField[]> = {
  // ベースモデル
  'anthropic.claude-opus-4-20250514-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-sonnet-4-20250514-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-3-7-sonnet-20250219-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-3-5-haiku-20241022-v1:0': ['messages', 'system', 'tools'],
  'anthropic.claude-3-5-sonnet-20241022-v2:0': ['messages', 'system', 'tools'],
  'amazon.nova-micro-v1:0': ['messages', 'system'],
  'amazon.nova-lite-v1:0': ['messages', 'system'],
  'amazon.nova-pro-v1:0': ['messages', 'system']

  // 将来的にサポートされるモデルはここに追加
}

/**
 * モデルIDからリージョンプレフィックスを削除して基本モデル名を取得する
 * 例: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0' → 'anthropic.claude-3-7-sonnet-20250219-v1:0'
 *
 * @param modelId リージョンプレフィックスを含む可能性のあるモデルID
 * @returns リージョンプレフィックスを削除した基本モデル名
 */
export function getBaseModelId(modelId: string): string {
  // リージョンプレフィックスのパターン: 特定のリージョンコード (例: 'us.', 'eu.', 'apac.')
  const regionPrefixPattern = /^(us|eu|apac)\./
  return modelId.replace(regionPrefixPattern, '')
}

/**
 * モデルがPrompt Cacheをサポートしているか判定
 *
 * @param modelId モデルID (リージョンプレフィックスを含む可能性あり)
 * @returns Prompt Cacheをサポートしている場合はtrue、そうでない場合はfalse
 */
export function isPromptCacheSupported(modelId: string): boolean {
  const baseModelId = getBaseModelId(modelId)
  return !!MODEL_CACHE_SUPPORT[baseModelId]
}

/**
 * モデルがサポートするキャッシュ可能なフィールドを取得
 *
 * @param modelId モデルID (リージョンプレフィックスを含む可能性あり)
 * @returns キャッシュ可能なフィールドの配列
 */
export function getCacheableFields(modelId: string): CacheableField[] {
  const baseModelId = getBaseModelId(modelId)
  return MODEL_CACHE_SUPPORT[baseModelId] || []
}

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
  if (!isPromptCacheSupported(modelId) || !getCacheableFields(modelId).includes('messages')) {
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
      getCacheableFields(modelId).includes('tools') ||
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
  if (!isPromptCacheSupported(modelId) || !getCacheableFields(modelId).includes('system')) {
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
  if (!isPromptCacheSupported(modelId) || !getCacheableFields(modelId).includes('tools')) {
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
    isPromptCacheSupported: isPromptCacheSupported(modelId),
    cacheableFields: getCacheableFields(modelId)
  })
}
