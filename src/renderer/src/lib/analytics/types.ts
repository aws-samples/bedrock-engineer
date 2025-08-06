import { IdentifiableMessage } from '@/types/chat/message'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
}

export interface CostAnalysis {
  inputCost: number
  outputCost: number
  cacheReadCost: number
  cacheWriteCost: number
  totalCost: number
  cacheSavings: number // プロンプトキャッシュによる削減額
}

export interface TimeSeriesDataPoint {
  timestamp: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  cacheReadCost: number
  cacheWriteCost: number
  totalCost: number
}

export interface Analytics {
  tokenUsage: TokenUsage
  costAnalysis: CostAnalysis
  timeSeriesData: TimeSeriesDataPoint[]
}

export interface TokenAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  messages: IdentifiableMessage[]
  modelId: string
}

export type TabType = 'summary' | 'timeSeries'
