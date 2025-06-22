import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { KnowledgeBase, ToolState } from '@/types/agent-chat'
import { AttachedImage } from '@/types/generator-contexts'
import { IdentifiableMessage } from '@/types/chat/message'
import { ToolName } from '@/types/tools'
import { useAgentChat } from '@renderer/pages/ChatPage/hooks/useAgentChat'
import { useSettings } from './SettingsContext'
import prompts from '@renderer/prompts/prompts'
import { replacePlaceholders } from '@renderer/pages/WebsiteGeneratorPage/util'

interface WebsiteGeneratorContextType {
  // Knowledge Base Settings
  knowledgeBases: KnowledgeBase[]
  setKnowledgeBases: (knowledgeBases: KnowledgeBase[]) => void
  enableKnowledgeBase: boolean
  setEnableKnowledgeBase: (bool: boolean) => void
  enableSearch: boolean
  setEnableSearch: (bool: boolean) => void

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

  // Website Generator State
  template: string
  setTemplate: (template: string) => void
  styleType: { label: string; value: string }
  setStyleType: (style: { label: string; value: string }) => void
  showCode: boolean
  setShowCode: (show: boolean) => void
  showContinueDevelopmentButton: boolean
  setShowContinueDevelopmentButton: (show: boolean) => void
}

const WebsiteGeneratorContext = createContext<WebsiteGeneratorContextType | undefined>(undefined)

export const WebsiteGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentLLM: llm, getAgentTools } = useSettings()

  // Knowledge Base Settings
  const [knowledgeBases, setStateKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [enableKnowledgeBase, setStateEnableKnowledgeBase] = useState<boolean>(false)
  const [enableSearch, setStateEnableSearch] = useState(false)

  // Website Generator State
  const [template, setTemplate] = useState<string>('react-ts')
  const [styleType, setStyleType] = useState<{ label: string; value: string }>({
    label: 'Tailwind.css',
    value: 'tailwind'
  })
  const [showCode, setShowCode] = useState(false)
  const [showContinueDevelopmentButton, setShowContinueDevelopmentButton] = useState(false)
  const [userInput, setUserInput] = useState('')

  // Context内でのメッセージ永続化（enableHistory: falseでも状態保持のため）
  const [persistedMessages, setPersistedMessages] = useState<IdentifiableMessage[]>([])

  // テンプレートに応じたエージェントIDの選択
  const getAgentIdForTemplate = useCallback((template: string): string => {
    const agentMap = {
      'react-ts': 'reactGeneratorAgent',
      'vue-ts': 'vueGeneratorAgent',
      svelte: 'svelteGeneratorAgent'
    }
    return agentMap[template] || 'reactGeneratorAgent'
  }, [])

  const websiteAgentId = getAgentIdForTemplate(template)

  // テンプレート固有のシステムプロンプトを動的生成
  const systemPrompt = useMemo(() => {
    const templateSpecificPrompt = prompts.WebsiteGenerator.system[template]({
      styleType: styleType.value,
      libraries: [], // templates情報は後で追加
      ragEnabled: enableKnowledgeBase,
      tavilySearchEnabled: enableSearch
    })

    return replacePlaceholders(templateSpecificPrompt, knowledgeBases)
  }, [template, styleType.value, enableKnowledgeBase, enableSearch, knowledgeBases])

  // Website Generator Agent で利用可能なツールを定義
  const websiteAgentTools = useMemo(() => {
    const tools: ToolState[] = []
    const agentTools = getAgentTools(websiteAgentId)

    // 検索機能が有効な場合、tavilySearch ツールを追加
    if (enableSearch) {
      const searchTools = agentTools.filter(
        (tool) => tool.toolSpec?.name === 'tavilySearch' && tool.enabled
      )
      tools.push(...searchTools)
    }

    // Knowledge Base機能が有効な場合、retrieve ツールを追加
    if (enableKnowledgeBase) {
      const retrieveTools = agentTools.filter(
        (tool) => tool.toolSpec?.name === 'retrieve' && tool.enabled
      )
      tools.push(...retrieveTools)
    }

    return tools
  }, [enableSearch, enableKnowledgeBase, getAgentTools, websiteAgentId])

  const options = {
    enableHistory: false,
    tools: websiteAgentTools
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
  } = useAgentChat(llm?.modelId, systemPrompt, websiteAgentId, undefined, options)

  // Initialize settings
  useEffect(() => {
    const settings = window.store.get('websiteGenerator')
    if (settings?.knowledgeBases) {
      setStateKnowledgeBases(settings.knowledgeBases)
    }
    if (settings?.enableKnowledgeBase) {
      setStateEnableKnowledgeBase(settings.enableKnowledgeBase)
    }
    if (settings?.enableSearch) {
      setStateEnableSearch(settings.enableSearch)
    }
  }, [])

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
  // }, [websiteAgentId, clearChat])

  const setKnowledgeBases = useCallback((knowledgeBases: KnowledgeBase[]) => {
    const settings = window.store.get('websiteGenerator')
    setStateKnowledgeBases(knowledgeBases)
    window.store.set('websiteGenerator', {
      ...settings,
      knowledgeBases: knowledgeBases
    })
  }, [])

  const setEnableKnowledgeBase = useCallback((bool: boolean) => {
    setStateEnableKnowledgeBase(bool)
    const settings = window.store.get('websiteGenerator')
    window.store.set('websiteGenerator', {
      ...settings,
      enableKnowledgeBase: bool
    })
  }, [])

  const setEnableSearch = useCallback((bool: boolean) => {
    setStateEnableSearch(bool)
    const settings = window.store.get('websiteGenerator')
    window.store.set('websiteGenerator', {
      ...settings,
      enableSearch: bool
    })
  }, [])

  const handleSubmitWrapper = useCallback(
    async (input: string, images?: AttachedImage[]) => {
      await handleSubmit(input, images)
      setUserInput('')
    },
    [handleSubmit]
  )

  const value = {
    // Knowledge Base Settings
    knowledgeBases,
    setKnowledgeBases,
    enableKnowledgeBase,
    setEnableKnowledgeBase,
    enableSearch,
    setEnableSearch,

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

    // Website Generator State
    template,
    setTemplate,
    styleType,
    setStyleType,
    showCode,
    setShowCode,
    showContinueDevelopmentButton,
    setShowContinueDevelopmentButton
  }

  return (
    <WebsiteGeneratorContext.Provider value={value}>{children}</WebsiteGeneratorContext.Provider>
  )
}

export const useWebsiteGeneratorSetting = () => {
  const context = useContext(WebsiteGeneratorContext)
  if (context === undefined) {
    throw new Error('useWebsiteGenerator must be used within a WebsiteGeneratorProvider')
  }
  return context
}

// 新しいhook：すべての機能（設定＋チャット）にアクセス
export const useWebsiteGenerator = () => {
  const context = useContext(WebsiteGeneratorContext)
  if (context === undefined) {
    throw new Error('useWebsiteGenerator must be used within a WebsiteGeneratorProvider')
  }
  return context
}
