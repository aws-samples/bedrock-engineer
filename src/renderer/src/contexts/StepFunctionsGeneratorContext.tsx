import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { AttachedImage } from '@/types/generator-contexts'
import { IdentifiableMessage } from '@/types/chat/message'
import { ToolName } from '@/types/tools'
import { useAgentChat } from '@renderer/pages/ChatPage/hooks/useAgentChat'
import { useSettings } from './SettingsContext'
import prompts from '@renderer/prompts/prompts'

interface StepFunctionsGeneratorContextType {
  // Chat State Management
  messages: IdentifiableMessage[]
  loading: boolean
  reasoning: boolean
  executingTool: ToolName | null
  latestReasoningText: string
  userInput: string
  setUserInput: (input: string) => void
  handleSubmit: (input: string, images?: AttachedImage[]) => Promise<void>
  clearChat: () => Promise<void>
  stopGeneration: () => void
  setMessages: (messages: IdentifiableMessage[]) => void

  // StepFunctions Generator State
  editorValue: string
  setEditorValue: (value: string) => void
  asl: any
  setAsl: (asl: any) => void
  hasValidStateMachine: boolean
  setHasValidStateMachine: (valid: boolean) => void
  isComposing: boolean
  setIsComposing: (composing: boolean) => void

  // Utility
  lastText: string
}

const StepFunctionsGeneratorContext = createContext<StepFunctionsGeneratorContextType | undefined>(
  undefined
)

export const StepFunctionsGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { currentLLM: llm, getAgentTools } = useSettings()

  // StepFunctions Generator State
  const [editorValue, setEditorValue] = useState('')
  const [asl, setAsl] = useState<any>(null)
  const [hasValidStateMachine, setHasValidStateMachine] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [userInput, setUserInput] = useState('')

  // StepFunctions Generator用のエージェントID
  const stepFunctionsAgentId = 'stepFunctionsGeneratorAgent'

  // システムプロンプトを生成
  const systemPrompt = useMemo(() => {
    const language = 'ja' // 固定値として設定
    return prompts.StepFunctonsGenerator.system(language)
  }, [])

  // StepFunctions Generator Agent で利用可能なツールを定義
  const stepFunctionsAgentTools = useMemo(() => {
    const agentTools = getAgentTools(stepFunctionsAgentId)
    // 必要に応じてツールをフィルタリング
    return agentTools
  }, [getAgentTools, stepFunctionsAgentId])

  const options = {
    enableHistory: false,
    tools: stepFunctionsAgentTools
  }

  const {
    messages,
    loading,
    reasoning,
    executingTool,
    latestReasoningText,
    handleSubmit,
    clearChat,
    stopGeneration,
    setMessages
  } = useAgentChat(llm?.modelId, systemPrompt, stepFunctionsAgentId, undefined, options)

  const handleSubmitWrapper = useCallback(
    async (input: string, images?: AttachedImage[]) => {
      await handleSubmit(input, images)
      setUserInput('')
    },
    [handleSubmit]
  )

  // 最後のアシスタントメッセージからテキストを抽出
  const lastText = useMemo(() => {
    if (messages.length === 0) return ''

    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()

    if (!lastAssistantMessage?.content) return ''

    return lastAssistantMessage.content.map((c) => ('text' in c ? c.text : '')).join('')
  }, [messages])

  // メッセージが更新されたときにエディターの値を更新
  useEffect(() => {
    if (messages.length > 0 && lastText) {
      setEditorValue(lastText)
    }
  }, [messages, lastText])

  // ローディングが完了したときにASLを解析
  useEffect(() => {
    if (messages.length > 0 && !loading && lastText) {
      try {
        const json = JSON.parse(lastText)
        setAsl(json)
        setHasValidStateMachine(true)
      } catch (e) {
        console.error('Failed to parse ASL:', e)
        console.error('Content:', lastText)
        setHasValidStateMachine(false)
      }
    }
  }, [messages, loading, lastText])

  const value = {
    // Chat State Management
    messages,
    loading,
    reasoning,
    executingTool,
    latestReasoningText,
    userInput,
    setUserInput,
    handleSubmit: handleSubmitWrapper,
    clearChat,
    stopGeneration,
    setMessages,

    // StepFunctions Generator State
    editorValue,
    setEditorValue,
    asl,
    setAsl,
    hasValidStateMachine,
    setHasValidStateMachine,
    isComposing,
    setIsComposing,

    // Utility
    lastText
  }

  return (
    <StepFunctionsGeneratorContext.Provider value={value}>
      {children}
    </StepFunctionsGeneratorContext.Provider>
  )
}

export const useStepFunctionsGenerator = () => {
  const context = useContext(StepFunctionsGeneratorContext)
  if (context === undefined) {
    throw new Error(
      'useStepFunctionsGenerator must be used within a StepFunctionsGeneratorProvider'
    )
  }
  return context
}
