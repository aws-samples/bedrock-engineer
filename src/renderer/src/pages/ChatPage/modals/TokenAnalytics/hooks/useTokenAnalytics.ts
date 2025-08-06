import { useState, useEffect } from 'react'
import { IdentifiableMessage } from '@/types/chat/message'
import { Analytics, calculateAnalytics } from '@renderer/lib/analytics'

export const useTokenAnalytics = (messages: IdentifiableMessage[], modelId: string) => {
  const [analytics, setAnalytics] = useState<Analytics>({
    tokenUsage: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0
    },
    costAnalysis: {
      inputCost: 0,
      outputCost: 0,
      cacheReadCost: 0,
      cacheWriteCost: 0,
      totalCost: 0,
      cacheSavings: 0
    },
    timeSeriesData: []
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await calculateAnalytics(messages, modelId)
        setAnalytics(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate analytics')
      } finally {
        setLoading(false)
      }
    }

    if (messages.length > 0 && modelId) {
      loadAnalytics()
    } else {
      setLoading(false)
    }
  }, [messages, modelId])

  return {
    analytics,
    loading,
    error
  }
}
