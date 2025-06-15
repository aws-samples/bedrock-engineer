import { useState, useCallback } from 'react'
import { ToolName } from '@/types/tools'

export interface UseChatUIStateReturn {
  loading: boolean
  reasoning: boolean
  executingTool: ToolName | null
  latestReasoningText: string
  setLoading: (value: boolean) => void
  setReasoning: (value: boolean) => void
  setExecutingTool: (tool: ToolName | null) => void
  setLatestReasoningText: (text: string) => void
  resetUIState: () => void
}

export const useChatUIState = (): UseChatUIStateReturn => {
  const [loading, setLoading] = useState(false)
  const [reasoning, setReasoning] = useState(false)
  const [executingTool, setExecutingTool] = useState<ToolName | null>(null)
  const [latestReasoningText, setLatestReasoningText] = useState<string>('')

  // UI状態をリセットする関数
  const resetUIState = useCallback(() => {
    setLoading(false)
    setReasoning(false)
    setExecutingTool(null)
    setLatestReasoningText('')
  }, [])

  return {
    loading,
    reasoning,
    executingTool,
    latestReasoningText,
    setLoading,
    setReasoning,
    setExecutingTool,
    setLatestReasoningText,
    resetUIState
  }
}
