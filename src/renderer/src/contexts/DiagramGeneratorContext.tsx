import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { AttachedImage } from '@/types/generator-contexts'
import { IdentifiableMessage } from '@/types/chat/message'
import { ToolName } from '@/types/tools'
import { useAgentChat } from '@renderer/pages/ChatPage/hooks/useAgentChat'
import { useSettings } from './SettingsContext'
import {
  DIAGRAM_GENERATOR_SYSTEM_PROMPT,
  SOFTWARE_ARCHITECTURE_SYSTEM_PROMPT,
  BUSINESS_PROCESS_SYSTEM_PROMPT
} from '@renderer/pages/ChatPage/constants/DEFAULT_AGENTS'

export type DiagramMode = 'aws' | 'software-architecture' | 'business-process'

interface DiagramGeneratorContextType {
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

  // Diagram Generator State
  diagramMode: DiagramMode
  setDiagramMode: (mode: DiagramMode) => void
  xml: string
  setXml: (xml: string) => void
  diagramExplanation: string
  setDiagramExplanation: (explanation: string) => void
  streamingExplanation: string
  setStreamingExplanation: (explanation: string) => void

  // History Management
  diagramHistory: Array<{
    xml: string
    explanation: string
    prompt: string
  }>
  setDiagramHistory: (history: Array<{ xml: string; explanation: string; prompt: string }>) => void
  selectedHistoryIndex: number | null
  setSelectedHistoryIndex: (index: number | null) => void
  loadDiagramFromHistory: (index: number) => void

  // UI State
  showExplanation: boolean
  setShowExplanation: (show: boolean) => void
  enableSearch: boolean
  setEnableSearch: (enabled: boolean) => void

  // Progress State
  generationStartTime: number
  setGenerationStartTime: (time: number) => void
  xmlProgress: number
  setXmlProgress: (progress: number) => void
  progressMessage: string
  setProgressMessage: (message: string) => void
  xmlLoading: boolean
  setXmlLoading: (loading: boolean) => void
  hasValidXml: boolean
  setHasValidXml: (valid: boolean) => void
}

const DiagramGeneratorContext = createContext<DiagramGeneratorContextType | undefined>(undefined)

export const DiagramGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentLLM: llm, getAgentTools, enabledTavilySearch } = useSettings()

  // Diagram Generator State
  const [diagramMode, setDiagramMode] = useState<DiagramMode>('aws')
  const [xml, setXml] = useState('')
  const [diagramExplanation, setDiagramExplanation] = useState('')
  const [streamingExplanation, setStreamingExplanation] = useState('')
  const [userInput, setUserInput] = useState('')

  // Context内でのメッセージ永続化（enableHistory: falseでも状態保持のため）
  const [persistedMessages, setPersistedMessages] = useState<IdentifiableMessage[]>([])

  // History Management
  const [diagramHistory, setDiagramHistory] = useState<
    Array<{
      xml: string
      explanation: string
      prompt: string
    }>
  >([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)

  // UI State
  const [showExplanation, setShowExplanation] = useState(true)
  const [enableSearch, setEnableSearch] = useState(false)

  // Progress State
  const [generationStartTime, setGenerationStartTime] = useState(0)
  const [xmlProgress, setXmlProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [xmlLoading, setXmlLoading] = useState(false)
  const [hasValidXml, setHasValidXml] = useState(false)

  // ダイアグラム生成用のエージェントID（モードに応じて変更）
  const diagramAgentId = useMemo(() => {
    switch (diagramMode) {
      case 'aws':
        return 'diagramGeneratorAgent'
      case 'software-architecture':
        return 'softwareArchitectureAgent'
      case 'business-process':
        return 'businessProcessAgent'
      default:
        return 'diagramGeneratorAgent'
    }
  }, [diagramMode])

  // カスタムシステムプロンプトを定義 - モードに応じたベースプロンプトを選択
  const getSystemPrompt = useCallback(() => {
    // モードに応じたベースプロンプトを選択
    let basePrompt: string
    switch (diagramMode) {
      case 'aws':
        basePrompt = DIAGRAM_GENERATOR_SYSTEM_PROMPT
        break
      case 'software-architecture':
        basePrompt = SOFTWARE_ARCHITECTURE_SYSTEM_PROMPT
        break
      case 'business-process':
        basePrompt = BUSINESS_PROCESS_SYSTEM_PROMPT
        break
      default:
        basePrompt = DIAGRAM_GENERATOR_SYSTEM_PROMPT
    }

    // 言語設定を追加（固定値として設定）
    basePrompt = basePrompt.replace(
      'Respond in the following languages included in the user request.',
      'Respond in the following languages: ja.'
    )

    // 検索機能が無効の場合、関連する部分を削除
    if (!enableSearch) {
      basePrompt = basePrompt.replace(
        "* If the user's request requires specific information, use the tavilySearch tool to gather up-to-date information before creating the diagram.",
        ''
      )
    }

    return basePrompt
  }, [diagramMode, enableSearch])

  const systemPrompt = getSystemPrompt()

  // Diagram Generator Agent で利用可能なツールを定義
  const diagramAgentTools = useMemo(() => {
    const agentTools = getAgentTools(diagramAgentId)

    if (!enableSearch || !enabledTavilySearch) {
      // diagramAgentIdからツールを取得し、tavilySearch ツールだけをフィルタリング
      return agentTools.filter((tool) => tool.toolSpec?.name !== 'tavilySearch')
    }

    return agentTools
  }, [enableSearch, getAgentTools, diagramAgentId, enabledTavilySearch])

  const options = {
    enableHistory: false,
    tools: diagramAgentTools // 明示的にツール設定を渡す
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
  } = useAgentChat(llm?.modelId, systemPrompt, diagramAgentId, undefined, options)

  // useAgentChatのmessagesとContext内のpersistedMessagesを同期
  useEffect(() => {
    if (messages.length > 0) {
      setPersistedMessages(messages)
    }
  }, [messages])

  // 初期化時にpersistedMessagesからuseAgentChatを復元
  useEffect(() => {
    if (persistedMessages.length > 0 && messages.length === 0) {
      setMessages(persistedMessages)
    }
  }, [persistedMessages, messages, setMessages])

  // 自動クリア機能を削除 - 画面遷移時の状態保持のため
  // useEffect(() => {
  //   clearChat()
  // }, [diagramAgentId, clearChat])

  const handleSubmitWrapper = useCallback(
    async (input: string, images?: AttachedImage[]) => {
      await handleSubmit(input, images)
      setUserInput('')
      // 履歴から選択していた場合はリセット
      setSelectedHistoryIndex(null)
      // 生成開始時間を記録
      setGenerationStartTime(Date.now())
      setXmlProgress(0)
      setProgressMessage('')
      // XML生成状態をリセット
      setXmlLoading(true)
      setHasValidXml(false)

      // 既存のダイアグラムをクリアして即座にローダーを表示
      setXml('')
      setDiagramExplanation('')
    },
    [handleSubmit]
  )

  // 履歴からダイアグラムを読み込む関数
  const loadDiagramFromHistory = useCallback(
    (index: number) => {
      if (diagramHistory[index]) {
        const historyItem = diagramHistory[index]
        setXml(historyItem.xml)
        setDiagramExplanation(historyItem.explanation)
        setUserInput(historyItem.prompt)
        setSelectedHistoryIndex(index)
      }
    },
    [diagramHistory]
  )

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

    // Diagram Generator State
    diagramMode,
    setDiagramMode,
    xml,
    setXml,
    diagramExplanation,
    setDiagramExplanation,
    streamingExplanation,
    setStreamingExplanation,

    // History Management
    diagramHistory,
    setDiagramHistory,
    selectedHistoryIndex,
    setSelectedHistoryIndex,
    loadDiagramFromHistory,

    // UI State
    showExplanation,
    setShowExplanation,
    enableSearch,
    setEnableSearch,

    // Progress State
    generationStartTime,
    setGenerationStartTime,
    xmlProgress,
    setXmlProgress,
    progressMessage,
    setProgressMessage,
    xmlLoading,
    setXmlLoading,
    hasValidXml,
    setHasValidXml
  }

  return (
    <DiagramGeneratorContext.Provider value={value}>{children}</DiagramGeneratorContext.Provider>
  )
}

export const useDiagramGenerator = () => {
  const context = useContext(DiagramGeneratorContext)
  if (context === undefined) {
    throw new Error('useDiagramGenerator must be used within a DiagramGeneratorProvider')
  }
  return context
}
