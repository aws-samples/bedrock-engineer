import { useMemo, useCallback, useState } from 'react'
import { useAgentChat } from '../../ChatPage/hooks/useAgentChat'
import { useRichWebsiteGenerator } from '../contexts/RichWebsiteGeneratorContext'
import { createSandpackToolExecutor } from '../services/sandpackToolExecutor'
import { SANDPACK_TOOL_SPECS } from '../toolSpecs'
import { RICH_WEBSITE_GENERATOR_SYSTEM_PROMPT } from '../constants/systemPrompts'
import { ToolState } from '@/types/agent-chat'
import { AttachedImage } from '../../ChatPage/components/InputForm/TextArea'

/**
 * Custom hook for managing website generator chat functionality
 * @param modelId - The LLM model ID to use
 * @returns Chat state and handlers
 */
export function useWebsiteGeneratorChat(modelId: string | undefined) {
  const { sandpackOperations } = useRichWebsiteGenerator()
  const [userInput, setUserInput] = useState('')
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false)

  // System prompt
  const systemPrompt = useMemo(() => RICH_WEBSITE_GENERATOR_SYSTEM_PROMPT, [])

  // Custom tool executor
  const customToolExecutor = useMemo(
    () => createSandpackToolExecutor(sandpackOperations),
    [sandpackOperations]
  )

  // Sandpack tools
  const sandpackTools: ToolState[] = useMemo(() => {
    return SANDPACK_TOOL_SPECS.map((tool) => ({
      enabled: true,
      ...tool
    }))
  }, [])

  // Use agent chat
  const agentChat = useAgentChat(
    modelId || '',
    systemPrompt,
    'richWebsiteGeneratorAgent',
    undefined,
    {
      enableHistory: false,
      tools: sandpackTools,
      customToolExecutor
    }
  )

  // Submit handler
  const onSubmit = useCallback(
    (input: string, images: AttachedImage[]) => {
      setHasStartedGeneration(true)
      agentChat.handleSubmit(input, images)
      setUserInput('')
    },
    [agentChat]
  )

  return {
    // State
    userInput,
    setUserInput,
    hasStartedGeneration,

    // Agent chat state
    messages: agentChat.messages,
    loading: agentChat.loading,
    reasoning: agentChat.reasoning,
    executingTools: agentChat.executingTools,
    latestReasoningText: agentChat.latestReasoningText,

    // Handlers
    onSubmit
  }
}
