import { IdentifiableMessage } from '@/types/chat/message'
import { calculateCost } from '@renderer/lib/pricing/modelPricing'
import { Analytics, TokenUsage, CostAnalysis, TimeSeriesDataPoint } from './types'

// メッセージからトークン使用量とコストを計算する関数
export const calculateAnalytics = async (
  messages: IdentifiableMessage[],
  modelId: string
): Promise<Analytics> => {
  // 初期値を設定
  const tokenUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0
  }

  const costAnalysis: CostAnalysis = {
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
    totalCost: 0,
    cacheSavings: 0
  }

  // 時系列データを格納する配列
  const timeSeriesData: TimeSeriesDataPoint[] = []

  // アシスタントメッセージのメタデータからトークン使用量を集計
  for (const message of messages) {
    if (message.role === 'assistant' && message.metadata?.converseMetadata?.usage) {
      const usage = message.metadata.converseMetadata.usage

      // トークン使用量を加算
      tokenUsage.inputTokens += usage.inputTokens || 0
      tokenUsage.outputTokens += usage.outputTokens || 0
      tokenUsage.cacheReadTokens += usage.cacheReadInputTokens || 0
      tokenUsage.cacheWriteTokens += usage.cacheWriteInputTokens || 0

      // メッセージごとのコスト計算
      const msgInputCost = await calculateCost(modelId, usage.inputTokens || 0, 0, 0, 0)
      const msgOutputCost = await calculateCost(modelId, 0, usage.outputTokens || 0, 0, 0)
      const msgCacheReadCost = await calculateCost(
        modelId,
        0,
        0,
        usage.cacheReadInputTokens || 0,
        0
      )
      const msgCacheWriteCost = await calculateCost(
        modelId,
        0,
        0,
        0,
        usage.cacheWriteInputTokens || 0
      )
      const msgTotalCost = msgInputCost + msgOutputCost + msgCacheReadCost + msgCacheWriteCost

      // タイムスタンプの取得（メタデータにタイムスタンプがない場合は現在時刻を使用）
      const timestamp = message.timestamp || Date.now()

      // 時系列データポイントを追加
      timeSeriesData.push({
        timestamp,
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        cacheReadTokens: usage.cacheReadInputTokens || 0,
        cacheWriteTokens: usage.cacheWriteInputTokens || 0,
        totalTokens:
          (usage.inputTokens || 0) +
          (usage.outputTokens || 0) +
          (usage.cacheReadInputTokens || 0) +
          (usage.cacheWriteInputTokens || 0),
        inputCost: msgInputCost,
        outputCost: msgOutputCost,
        cacheReadCost: msgCacheReadCost,
        cacheWriteCost: msgCacheWriteCost,
        totalCost: msgTotalCost
      })
    }
  }

  // 時系列データを時間順にソート
  timeSeriesData.sort((a, b) => a.timestamp - b.timestamp)

  // 合計トークン数を計算
  tokenUsage.totalTokens =
    tokenUsage.inputTokens +
    tokenUsage.outputTokens +
    tokenUsage.cacheReadTokens +
    tokenUsage.cacheWriteTokens

  // コスト計算
  if (modelId) {
    costAnalysis.inputCost = await calculateCost(modelId, tokenUsage.inputTokens, 0, 0, 0)
    costAnalysis.outputCost = await calculateCost(modelId, 0, tokenUsage.outputTokens, 0, 0)
    costAnalysis.cacheReadCost = await calculateCost(modelId, 0, 0, tokenUsage.cacheReadTokens, 0)
    costAnalysis.cacheWriteCost = await calculateCost(modelId, 0, 0, 0, tokenUsage.cacheWriteTokens)
    costAnalysis.totalCost =
      costAnalysis.inputCost +
      costAnalysis.outputCost +
      costAnalysis.cacheReadCost +
      costAnalysis.cacheWriteCost

    // キャッシュによる削減額の計算
    if (tokenUsage.cacheReadTokens > 0) {
      // モデルから価格情報を取得
      const pricing = await window.api.bedrock.getModelPricing(modelId)
      if (pricing) {
        // キャッシュがなかった場合のコスト (通常の入力トークン価格で計算)
        const costWithoutCache = (tokenUsage.cacheReadTokens * pricing.input) / 1000
        // 実際のキャッシュコスト
        const actualCacheCost = (tokenUsage.cacheReadTokens * pricing.cacheRead) / 1000
        // 削減額を計算
        costAnalysis.cacheSavings = costWithoutCache - actualCacheCost
      }
    }
  }

  return { tokenUsage, costAnalysis, timeSeriesData }
}

// 統計計算のヘルパー関数
export const calculateStatistics = (analytics: Analytics) => {
  const { tokenUsage, costAnalysis, timeSeriesData } = analytics

  return {
    averageTokensPerMessage:
      timeSeriesData.length > 0 ? Math.round(tokenUsage.totalTokens / timeSeriesData.length) : 0,
    averageCostPerMessage:
      timeSeriesData.length > 0 ? costAnalysis.totalCost / timeSeriesData.length : 0,
    tokenUsageEfficiency:
      tokenUsage.inputTokens > 0 ? (tokenUsage.outputTokens / tokenUsage.inputTokens) * 100 : 0,
    cacheEfficiency:
      tokenUsage.inputTokens + tokenUsage.outputTokens > 0
        ? (tokenUsage.cacheReadTokens / (tokenUsage.inputTokens + tokenUsage.outputTokens)) * 100
        : 0
  }
}
