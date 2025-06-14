import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import {
  FlowConfig,
  KnowledgeBase,
  McpServerConfig,
  SendMsgKey,
  ToolState,
  WindowConfig,
  CameraConfig
} from 'src/types/agent-chat'
import { ToolName } from 'src/types/tools'
import { listModels } from '@renderer/lib/api'
import { CustomAgent } from '@/types/agent-chat'
import { replacePlaceholders } from '@renderer/pages/ChatPage/utils/placeholder'
import { DEFAULT_AGENTS } from '@renderer/pages/ChatPage/constants/DEFAULT_AGENTS'
import { InferenceParameters, LLM, BEDROCK_SUPPORTED_REGIONS, ThinkingMode } from '@/types/llm'
import type { AwsCredentialIdentity } from '@smithy/types'
import { BedrockAgent } from '@/types/agent'
import { AgentCategory } from '@/types/agent-chat'
import { getToolsForCategory } from '../constants/defaultToolSets'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { CodeInterpreterContainerConfig } from 'src/preload/tools/handlers/interpreter/types'
import { getEnvironmentContext } from '@renderer/pages/ChatPage/constants/AGENTS_ENVIRONMENT_CONTEXT'

const DEFAULT_INFERENCE_PARAMS: InferenceParameters = {
  maxTokens: 4096,
  temperature: 0.5,
  topP: 0.9
}

interface CommandConfig {
  pattern: string
  description: string
}

export interface SettingsContextType {
  // Advanced Settings
  sendMsgKey: SendMsgKey
  updateSendMsgKey: (key: SendMsgKey) => void

  // Plan/Act Mode Settings
  planMode: boolean
  setPlanMode: (enabled: boolean) => void

  // Agent Chat Settings
  contextLength: number
  updateContextLength: (length: number) => void
  enablePromptCache: boolean
  setEnablePromptCache: (enabled: boolean) => void

  // Notification Settings
  notification: boolean
  setNotification: (enabled: boolean) => void

  // recognizeImage Tool Settings
  recognizeImageModel: string
  setRecognizeImageModel: (modelId: string) => void

  // generateImage Tool Settings
  generateImageModel: string
  setGenerateImageModel: (modelId: string) => void

  // generateVideo Tool Settings
  generateVideoS3Uri: string
  setGenerateVideoS3Uri: (s3Uri: string) => void

  // codeInterpreter Tool Settings
  codeInterpreterConfig: CodeInterpreterContainerConfig
  setCodeInterpreterConfig: (config: CodeInterpreterContainerConfig) => void

  // LLM Settings
  currentLLM: LLM
  updateLLM: (selectedModel: LLM) => void
  availableModels: LLM[]
  llmError: any

  // 軽量処理用モデル設定
  lightProcessingModel: LLM | null
  updateLightProcessingModel: (model: LLM | null) => void

  // Thinking Mode Settings
  thinkingMode?: ThinkingMode
  updateThinkingMode: (mode: ThinkingMode) => void

  // Interleave Thinking Settings
  interleaveThinking: boolean
  setInterleaveThinking: (enabled: boolean) => void

  // Inference Parameters
  inferenceParams: InferenceParameters
  updateInferenceParams: (params: Partial<InferenceParameters>) => void

  // Bedrock Settings
  bedrockSettings: {
    enableRegionFailover: boolean
    availableFailoverRegions: string[]
  }
  updateBedrockSettings: (
    settings: Partial<{
      enableRegionFailover: boolean
      availableFailoverRegions: string[]
    }>
  ) => void

  // Guardrail Settings
  guardrailSettings: {
    enabled: boolean
    guardrailIdentifier: string
    guardrailVersion: string
    trace: 'enabled' | 'disabled'
  }
  updateGuardrailSettings: (
    settings: Partial<{
      enabled: boolean
      guardrailIdentifier: string
      guardrailVersion: string
      trace: 'enabled' | 'disabled'
    }>
  ) => void

  // userDataPath (Electorn store directory)
  userDataPath: string

  // Project Settings
  projectPath: string
  setProjectPath: (path: string) => void
  selectDirectory: () => Promise<void>

  // Tavily Search Settings
  tavilySearchApiKey: string
  setTavilySearchApiKey: (apiKey: string) => void
  enabledTavilySearch: boolean

  // AWS Settings
  awsRegion: string
  setAwsRegion: (region: string) => void
  awsAccessKeyId: string
  setAwsAccessKeyId: (accessKeyId: string) => void
  awsSecretAccessKey: string
  setAwsSecretAccessKey: (secretAccessKey: string) => void
  awsSessionToken: string
  setAwsSessionToken: (sessionToken: string) => void
  useAwsProfile: boolean
  setUseAwsProfile: (useProfile: boolean) => void
  awsProfile: string
  setAwsProfile: (profile: string) => void

  // Custom Agents Settings
  customAgents: CustomAgent[]
  saveCustomAgents: (agents: CustomAgent[]) => void
  sharedAgents: CustomAgent[]
  loadSharedAgents: () => Promise<void>

  // Directory Agents Settings
  directoryAgents: CustomAgent[]
  loadDirectoryAgents: () => Promise<void>
  addDirectoryAgentToCustom: (agent: CustomAgent) => Promise<boolean>
  isDirectoryAgentLoading: boolean

  // Selected Agent Settings
  selectedAgentId: string
  setSelectedAgentId: (agentId: string) => void
  agents: CustomAgent[]
  currentAgent: CustomAgent | undefined
  currentAgentSystemPrompt: string

  // MCP Tool Settings
  fetchMcpTools: (mcpServers?: McpServerConfig[]) => Promise<Tool[]>
  getAgentMcpTools: (agentId: string) => ToolState[]
  updateAgentMcpTools: (agentId: string, tools: ToolState[]) => void

  // エージェント固有のツール設定
  getAgentTools: (agentId: string) => ToolState[]
  updateAgentTools: (agentId: string, tools: ToolState[]) => void
  getDefaultToolsForCategory: (category: string) => ToolState[]

  // エージェント固有の許可コマンド設定
  getAgentAllowedCommands: (agentId: string) => CommandConfig[]
  updateAgentAllowedCommands: (agentId: string, commands: CommandConfig[]) => void

  // エージェント固有の許可ウィンドウ設定
  getAgentAllowedWindows: (agentId: string) => WindowConfig[]
  updateAgentAllowedWindows: (agentId: string, windows: WindowConfig[]) => void

  // エージェント固有の許可カメラ設定
  getAgentAllowedCameras: (agentId: string) => CameraConfig[]
  updateAgentAllowedCameras: (agentId: string, cameras: CameraConfig[]) => void

  // エージェント固有のBedrock Agents設定
  getAgentBedrockAgents: (agentId: string) => BedrockAgent[]
  updateAgentBedrockAgents: (agentId: string, agents: BedrockAgent[]) => void

  // エージェント固有のKnowledge Base設定
  getAgentKnowledgeBases: (agentId: string) => KnowledgeBase[]
  updateAgentKnowledgeBases: (agentId: string, bases: KnowledgeBase[]) => void

  // エージェント固有のFlow設定
  getAgentFlows: (agentId: string) => FlowConfig[]
  updateAgentFlows: (agentId: string, flows: FlowConfig[]) => void

  // エージェント設定の一括更新
  updateAgentSettings: (
    agentId: string,
    settings: Partial<{
      tools: ToolState[]
      allowedCommands: CommandConfig[]
      bedrockAgents: BedrockAgent[]
      knowledgeBases: KnowledgeBase[]
      mcpTools: ToolState[]
    }>
  ) => void

  // Shell Settings
  shell: string
  setShell: (shell: string) => void

  // Ignore Files Settings
  ignoreFiles: string[]
  setIgnoreFiles: (files: string[]) => void

  // Voice Settings
  selectedVoiceId: string
  setSelectedVoiceId: (voiceId: string) => void

  // Translation Settings
  translationEnabled: boolean
  setTranslationEnabled: (enabled: boolean) => void
  translationTargetLanguage: string
  setTranslationTargetLanguage: (language: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tool specifications from ToolMetadataCollector
  const tools = useMemo(() => {
    return window.api?.tools?.getToolSpecs() || []
  }, [])

  // Advanced Settings
  const [sendMsgKey, setSendMsgKey] = useState<SendMsgKey>('Enter')

  // Plan/Act Mode Settings
  const [planMode, setStatePlanMode] = useState<boolean>(false)

  // Agent Chat Settings
  const [contextLength, setContextLength] = useState<number>(60)
  const [enablePromptCache, setStateEnablePromptCache] = useState<boolean>(true)

  // Notification Settings
  const [notification, setStateNotification] = useState<boolean>(true)

  // recognizeImage Tool Settings
  const [recognizeImageModel, setStateRecognizeImageModel] = useState<string>(
    'anthropic.claude-3-5-sonnet-20241022-v2:0'
  )

  // generateImage Tool Settings
  const [generateImageModel, setStateGenerateImageModel] = useState<string>(
    'amazon.titan-image-generator-v2:0'
  )

  // generateVideo Tool Settings
  const [generateVideoS3Uri, setStateGenerateVideoS3Uri] = useState<string>('')

  // codeInterpreter Tool Settings
  const [codeInterpreterConfig, setStateCodeInterpreterConfig] =
    useState<CodeInterpreterContainerConfig>({
      memoryLimit: '256m',
      cpuLimit: 0.5,
      timeout: 30
    })

  // LLM Settings
  const [llmError, setLLMError] = useState<any>()
  const defaultModel = {
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    modelName: 'Claude 3.5 Sonnet v2',
    toolUse: true,
    regions: BEDROCK_SUPPORTED_REGIONS,
    supportsThinking: false
  }
  const [currentLLM, setCurrentLLM] = useState<LLM>(defaultModel)
  const [availableModels, setAvailableModels] = useState<LLM[]>([])
  const [inferenceParams, setInferenceParams] =
    useState<InferenceParameters>(DEFAULT_INFERENCE_PARAMS)

  // 軽量処理用モデル設定
  const [lightProcessingModel, setLightProcessingModel] = useState<LLM | null>(null)

  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>()

  // Interleave Thinking Settings
  const [interleaveThinking, setStateInterleaveThinking] = useState<boolean>(false)

  const [bedrockSettings, setBedrockSettings] = useState<{
    enableRegionFailover: boolean
    availableFailoverRegions: string[]
  }>({
    enableRegionFailover: false,
    availableFailoverRegions: []
  })

  // Guardrail Settings
  const [guardrailSettings, setGuardrailSettings] = useState<{
    enabled: boolean
    guardrailIdentifier: string
    guardrailVersion: string
    trace: 'enabled' | 'disabled'
  }>({
    enabled: false,
    guardrailIdentifier: '',
    guardrailVersion: 'DRAFT',
    trace: 'enabled'
  })

  const userDataPath = window.store.get('userDataPath') || ''

  // Project Settings
  const [projectPath, setProjectPath] = useState<string>('')

  // Tavily Search Settings
  const [tavilySearchApiKey, setStateApiKey] = useState<string>('')

  // AWS Settings
  const [awsRegion, setStateAwsRegion] = useState<string>('')
  const [awsAccessKeyId, setStateAwsAccessKeyId] = useState<string>('')
  const [awsSecretAccessKey, setStateAwsSecretAccessKey] = useState<string>('')
  const [awsSessionToken, setStateAwsSessionToken] = useState<string>('')
  const [useAwsProfile, setStateUseAwsProfile] = useState<boolean>(false)
  const [awsProfile, setStateAwsProfile] = useState<string>('default')

  // Custom Agents Settings
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([])
  const [sharedAgents, setSharedAgents] = useState<CustomAgent[]>([])

  // Directory Agents Settings
  const [directoryAgents, setDirectoryAgents] = useState<CustomAgent[]>([])
  const [isDirectoryAgentLoading, setIsDirectoryAgentLoading] = useState<boolean>(false)

  // Selected Agent Settings
  const [selectedAgentId, setStateSelectedAgentId] = useState<string>('softwareAgent')

  // Shell Settings
  const [shell, setStateShell] = useState<string>('/bin/bash')

  // Ignore Files Settings
  const [ignoreFiles, setStateIgnoreFiles] = useState<string[]>([
    '.git',
    '.vscode',
    'node_modules',
    '.github'
  ])

  // Voice Settings
  const [selectedVoiceId, setStateSelectedVoiceId] = useState<string>('amy')

  // Translation Settings
  const [translationEnabled, setStateTranslationEnabled] = useState<boolean>(false)
  const [translationTargetLanguage, setStateTranslationTargetLanguage] = useState<string>('ja')

  // Initialize all settings
  useEffect(() => {
    // Load Advanced Settings
    const advancedSetting = window.store.get('advancedSetting')
    setSendMsgKey(advancedSetting?.keybinding?.sendMsgKey)

    // Load Plan/Act Mode Settings
    const planModeSetting = window.store.get('planMode')
    if (planModeSetting !== undefined) {
      setStatePlanMode(planModeSetting)
    }

    // Load Notification Settings
    const notificationSetting = window.store.get('notification')
    if (notificationSetting !== undefined) {
      setStateNotification(notificationSetting)
    }

    // Load Light Processing Model Settings
    const storedLightModel = window.store.get('lightProcessingModel')
    if (storedLightModel) {
      setLightProcessingModel(storedLightModel)
    }

    // Load recognizeImage Tool Settings
    const recognizeImageSetting = window.store.get('recognizeImageTool')
    if (recognizeImageSetting?.modelId) {
      setStateRecognizeImageModel(recognizeImageSetting.modelId)
    }

    // Load generateImage Tool Settings
    const generateImageSetting = window.store.get('generateImageTool')
    if (generateImageSetting?.modelId) {
      setStateGenerateImageModel(generateImageSetting.modelId)
    }

    // Load generateVideo Tool Settings (backward compatibility with generateVideoTool)
    const generateVideoSetting = window.store.get('generateVideoTool')
    if (generateVideoSetting?.s3Uri) {
      setStateGenerateVideoS3Uri(generateVideoSetting.s3Uri)
    }

    // Load codeInterpreter Tool Settings
    const codeInterpreterSetting = window.store.get('codeInterpreterTool')
    if (codeInterpreterSetting && typeof codeInterpreterSetting === 'object') {
      // Check if it's the old format (enabled boolean) and migrate
      if (
        'enabled' in codeInterpreterSetting &&
        typeof codeInterpreterSetting.enabled === 'boolean'
      ) {
        // Migrate from old format - use default container settings
        const defaultConfig: CodeInterpreterContainerConfig = {
          memoryLimit: '256m',
          cpuLimit: 0.5,
          timeout: 30
        }
        setStateCodeInterpreterConfig(defaultConfig)
        window.store.set('codeInterpreterTool', defaultConfig)
      } else if (
        'memoryLimit' in codeInterpreterSetting &&
        'cpuLimit' in codeInterpreterSetting &&
        'timeout' in codeInterpreterSetting
      ) {
        // New format - load container configuration
        setStateCodeInterpreterConfig({
          memoryLimit: codeInterpreterSetting.memoryLimit as string,
          cpuLimit: codeInterpreterSetting.cpuLimit as number,
          timeout: codeInterpreterSetting.timeout as number
        })
      }
    }

    // Load LLM Settings
    const storedLLM = window.store.get('llm')
    if (storedLLM) {
      setCurrentLLM(storedLLM)
    }

    // Load Inference Parameters
    const storedInferenceParams = window.store.get('inferenceParams')
    if (storedInferenceParams) {
      setInferenceParams(storedInferenceParams)
    }

    // Load thinking mode
    const thinkingMode = window.store.get('thinkingMode')
    if (thinkingMode) {
      setThinkingMode(thinkingMode)
      if (thinkingMode.type === 'disabled') {
        setInterleaveThinking(false)
      }
    }

    // Load Interleave Thinking Settings
    const storedInterleaveThinking = window.store.get('interleaveThinking')
    if (storedInterleaveThinking !== undefined) {
      setStateInterleaveThinking(storedInterleaveThinking)
    }

    // Load Bedrock Settings
    const storedBedrockSettings = window.store.get('bedrockSettings')
    if (storedBedrockSettings) {
      setBedrockSettings(storedBedrockSettings)
    }

    // Load Guardrail Settings
    const storedGuardrailSettings = window.store.get('guardrailSettings')
    if (storedGuardrailSettings) {
      setGuardrailSettings(storedGuardrailSettings)
    }

    // Load Project Settings
    const path = window.store.get('projectPath')
    if (path) {
      setProjectPath(path)
    }

    // Load Tavily Search Settings
    const tavilySearchConfig = window.store.get('tavilySearch')
    if (tavilySearchConfig) {
      setStateApiKey(tavilySearchConfig.apikey)
    }

    // Load AWS Settings
    const awsConfig = window.store.get('aws')
    if (awsConfig) {
      setStateAwsRegion(awsConfig.region || '')
      setStateAwsAccessKeyId(awsConfig.accessKeyId || '')
      setStateAwsSecretAccessKey(awsConfig.secretAccessKey || '')
      setStateAwsSessionToken(awsConfig.sessionToken || '')
      setStateUseAwsProfile(awsConfig.useProfile || false)
      setStateAwsProfile(awsConfig.profile || 'default')
    }

    // Load Custom Agents
    const savedAgents = window.store.get('customAgents') || []

    // DEFAULT_AGENTSの各エージェントについて、全ての重要なプロパティを比較し、変更があれば更新
    let hasChanges = false
    // 更新後のエージェントリスト
    const finalAgents: CustomAgent[] = []
    // 処理済みのエージェントIDを追跡
    const processedIds = new Set<string>()

    DEFAULT_AGENTS.forEach((defaultAgent) => {
      // そのIDのエージェントがすでにカスタムエージェントに存在するかチェック
      const existingAgent = savedAgents.find((agent) => agent.id === defaultAgent.id)
      processedIds.add(defaultAgent.id)

      // プロパティが完全に一致するかチェック（ツール設定は除外してユーザーのカスタマイズを保持）
      const isIdentical =
        existingAgent &&
        // 基本情報の比較
        existingAgent.name === defaultAgent.name &&
        existingAgent.description === defaultAgent.description &&
        existingAgent.system === defaultAgent.system &&
        existingAgent.icon === defaultAgent.icon &&
        existingAgent.iconColor === defaultAgent.iconColor &&
        existingAgent.category === defaultAgent.category

      if (existingAgent && !isIdentical) {
        // IDが一致するが内容が異なる場合は、デフォルトエージェントの内容で更新
        // ただし、isCustomフラグは既存の値を維持
        finalAgents.push({
          ...defaultAgent,
          isCustom: existingAgent.isCustom ?? defaultAgent.isCustom
        })
        hasChanges = true
      } else if (!existingAgent) {
        // 存在しない場合は新規追加
        finalAgents.push({ ...defaultAgent })
        hasChanges = true
      } else {
        // 完全に一致する場合は既存のエージェントをそのまま使用
        finalAgents.push(existingAgent)
      }
    })

    // デフォルトエージェントに含まれていない既存のカスタムエージェントを追加
    savedAgents.forEach((agent) => {
      if (!processedIds.has(agent.id)) {
        finalAgents.push(agent)
      }
    })

    // 変更があった場合のみ保存
    setCustomAgents(finalAgents)
    if (hasChanges) {
      window.store.set('customAgents', finalAgents)
    }

    // Load Selected Agent
    const savedAgentId = window.store.get('selectedAgentId')
    if (savedAgentId) {
      setSelectedAgentId(savedAgentId)
    }

    // Load Shell Setting
    const shell = window.store.get('shell')
    if (shell) {
      setStateShell(shell)
    }

    // Load Ignore Files Settings および Context Length
    const agentChatConfig = window.store.get('agentChatConfig') || {}

    // ignoreFiles の設定
    if (agentChatConfig?.ignoreFiles) {
      setStateIgnoreFiles(agentChatConfig.ignoreFiles)
    } else {
      // 初期値を設定
      const initialIgnoreFiles = ['.git', '.vscode', 'node_modules', '.github']
      setStateIgnoreFiles(initialIgnoreFiles)
      agentChatConfig.ignoreFiles = initialIgnoreFiles
    }

    // contextLength の設定
    const defaultContextLength = 60

    // agentChatConfig に contextLength が未設定の場合はデフォルト値を設定
    if (agentChatConfig.contextLength === undefined) {
      agentChatConfig.contextLength = defaultContextLength
    }

    // contextLength の状態を更新
    setContextLength(agentChatConfig.contextLength || defaultContextLength)

    // enablePromptCache の設定
    if (agentChatConfig.enablePromptCache === undefined) {
      agentChatConfig.enablePromptCache = true
    }

    // enablePromptCache の状態を更新
    setStateEnablePromptCache(agentChatConfig.enablePromptCache)

    // 設定を保存
    window.store.set('agentChatConfig', agentChatConfig)

    // Load Voice Settings
    const storedVoiceId = window.store.get('selectedVoiceId') as string
    if (storedVoiceId && typeof storedVoiceId === 'string') {
      setStateSelectedVoiceId(storedVoiceId)
    }

    // Load Translation Settings
    const storedTranslationEnabled = window.store.get('translationEnabled' as any)
    if (typeof storedTranslationEnabled === 'boolean') {
      setStateTranslationEnabled(storedTranslationEnabled)
    }

    const storedTranslationLanguage = window.store.get('translationTargetLanguage' as any)
    if (typeof storedTranslationLanguage === 'string') {
      setStateTranslationTargetLanguage(storedTranslationLanguage)
    }
  }, [])

  useEffect(() => {
    fetchModels()
  }, [awsRegion, awsAccessKeyId, awsSecretAccessKey, awsProfile, useAwsProfile])

  // MCPツールをロードする - 状態を更新せずツールのみを返すように修正
  const fetchMcpTools = useCallback(async (mcpServers?: McpServerConfig[]) => {
    try {
      if (window.api?.mcp?.getToolSpecs) {
        const fetchedTools = await window.api.mcp.getToolSpecs(mcpServers)
        // 取得したツールの生データを返す（状態管理は呼び出し側で行う）
        return fetchedTools || []
      }
      return []
    } catch (error) {
      console.error('Failed to fetch MCP tools:', error)
      return []
    }
  }, [])

  // エージェント固有のMCPツールを更新する関数
  const updateAgentMcpTools = useCallback(
    (agentId: string, tools: ToolState[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, mcpTools: tools } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // Load MCP tools when component mounts and when current agent changes
  useEffect(() => {
    // 初期ロードではエージェント固有のMCPサーバー設定は使わない
    // (アプリ起動直後はまだcurrentAgentが設定されていないため)
    fetchMcpTools()
  }, [fetchMcpTools])

  //  この効果はallAgentsとcurrentAgentの定義後に移動

  // Load shared agents when component mounts or project path changes
  useEffect(() => {
    // Load shared agents right away
    loadSharedAgents()

    // Load directory agents on mount
    loadDirectoryAgents()
  }, [projectPath])

  // Function to load shared agents from project directory
  const loadSharedAgents = async () => {
    try {
      // window.file が利用可能かチェック
      if (!window.file || typeof window.file.readSharedAgents !== 'function') {
        console.error('File API is not available')
        return
      }

      const { agents, error } = await window.file.readSharedAgents()
      if (error) {
        console.error('Error loading shared agents:', error)
      } else {
        setSharedAgents(agents || [])
        // store にも保存して、プリロードプロセスからアクセスできるようにする
        window.store.set('sharedAgents', agents || [])
      }
    } catch (error) {
      console.error('Failed to load shared agents:', error)
    }
  }

  // Function to load directory agents from app resources
  const loadDirectoryAgents = async () => {
    try {
      // window.file が利用可能かチェック
      if (!window.file || typeof window.file.readDirectoryAgents !== 'function') {
        console.error('File API is not available')
        return
      }

      setIsDirectoryAgentLoading(true)
      const { agents, error } = await window.file.readDirectoryAgents()
      if (error) {
        console.error('Error loading directory agents:', error)
      } else {
        setDirectoryAgents(agents || [])
      }
    } catch (error) {
      console.error('Failed to load directory agents:', error)
    } finally {
      setIsDirectoryAgentLoading(false)
    }
  }

  // Function to add a directory agent to custom agents
  const addDirectoryAgentToCustom = async (agent: CustomAgent): Promise<boolean> => {
    try {
      // Generate a new unique ID for this custom agent
      const timestamp = Date.now().toString(36)
      const randomStr = Math.random().toString(36).substring(2, 7)
      const newId = `custom-${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}-${randomStr}`

      // Create a new custom agent based on the directory agent
      const newCustomAgent: CustomAgent = {
        ...agent,
        id: newId,
        isCustom: true,
        directoryOnly: false
      }

      // MCPサーバー設定がある場合は、このタイミングでMCPツールを取得
      if (newCustomAgent.mcpServers && newCustomAgent.mcpServers.length > 0) {
        try {
          const mcpTools = await fetchMcpTools(newCustomAgent.mcpServers)
          if (mcpTools && mcpTools.length > 0) {
            newCustomAgent.mcpTools = mcpTools.map((tool: Tool) => ({ ...tool, enabled: true }))
          }
        } catch (error) {
          console.error(`Failed to fetch MCP tools for agent ${newCustomAgent.name}:`, error)
        }
      }

      // Add to custom agents list
      const updatedAgents = [...customAgents, newCustomAgent]
      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)

      return true
    } catch (error) {
      console.error('Error adding directory agent to custom agents:', error)
      return false
    }
  }

  useEffect(() => {
    if (currentLLM) {
      // Update maxTokens based on model's maxTokensLimit
      if (currentLLM.maxTokensLimit) {
        const updatedParams = { ...inferenceParams, maxTokens: currentLLM.maxTokensLimit }
        setInferenceParams(updatedParams)
        window.store.set('inferenceParams', updatedParams)
      }
    }
  }, [currentLLM])

  // Methods
  const updateSendMsgKey = (key: SendMsgKey) => {
    setSendMsgKey(key)
    window.store.set('advancedSetting', {
      keybinding: { sendMsgKey: key }
    })
  }

  const updateContextLength = (length: number) => {
    setContextLength(length)
    const agentChatConfig = window.store.get('agentChatConfig') || {}
    window.store.set('agentChatConfig', {
      ...agentChatConfig,
      contextLength: length
    })
  }

  const fetchModels = async () => {
    try {
      const models = await listModels()
      if (models) {
        // Add thinking mode support to Claude 3.7 Sonnet
        const enhancedModels = (models as LLM[]).map((model) => {
          if (model.modelId.includes('anthropic.claude-3-7-sonnet')) {
            return {
              ...model,
              supportsThinking: true
            }
          }
          return model
        })
        setAvailableModels(enhancedModels)
      }
    } catch (e: any) {
      console.log(e)
      setLLMError(e)
      throw e
    }
  }

  const updateLLM = (selectedModel: LLM) => {
    setCurrentLLM(selectedModel)
    window.store.set('llm', selectedModel)

    // Claude Sonnet 4とClaude Opus 4以外が選択された場合、インターリーブ思考をOFFにする
    const isClaude4Model =
      selectedModel.modelId.includes('claude-sonnet-4') ||
      selectedModel.modelId.includes('claude-opus-4')

    if (!isClaude4Model && interleaveThinking) {
      setInterleaveThinking(false)
    }
  }

  const updateLightProcessingModel = (model: LLM | null) => {
    setLightProcessingModel(model)
    window.store.set('lightProcessingModel', model)
  }

  const updateInferenceParams = (params: Partial<InferenceParameters>) => {
    const updatedParams = { ...inferenceParams, ...params }
    setInferenceParams(updatedParams)
    window.store.set('inferenceParams', updatedParams)
  }

  const updateThinkingMode = (mode: ThinkingMode) => {
    setThinkingMode(mode)
    window.store.set('thinkingMode', mode)
  }

  const setInterleaveThinking = (enabled: boolean) => {
    setStateInterleaveThinking(enabled)
    window.store.set('interleaveThinking', enabled)
  }

  const updateBedrockSettings = (settings: Partial<typeof bedrockSettings>) => {
    const updatedSettings = { ...bedrockSettings, ...settings }
    setBedrockSettings(updatedSettings)
    window.store.set('bedrockSettings', updatedSettings)
  }

  const updateGuardrailSettings = (settings: Partial<typeof guardrailSettings>) => {
    const updatedSettings = { ...guardrailSettings, ...settings }
    setGuardrailSettings(updatedSettings)
    window.store.set('guardrailSettings', updatedSettings)
  }

  const selectDirectory = async () => {
    const path = await window.file.handleFolderOpen()
    if (path) {
      setProjectPath(path)
      window.store.set('projectPath', path)
    }
  }

  const setTavilySearchApiKey = (apikey: string) => {
    setStateApiKey(apikey)
    window.store.set('tavilySearch', {
      apikey: apikey
    })
  }

  const setAwsRegion = (region: string) => {
    setStateAwsRegion(region)
    const credentials: AwsCredentialIdentity = {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      sessionToken: !awsSessionToken ? undefined : awsSessionToken
    }
    saveAwsConfig(credentials, region)

    // availableFailoverRegions をリセット
    setBedrockSettings({
      ...bedrockSettings,
      availableFailoverRegions: []
    })
    window.store.set('bedrockSettings', {
      ...bedrockSettings,
      availableFailoverRegions: [...BEDROCK_SUPPORTED_REGIONS]
    })

    // リージョン変更時にカスタムエージェントのツール設定を更新
    // 特にgenerateImageツールのリージョン対応を確認
    if (customAgents.length > 0) {
      const updatedAgents = customAgents.map((agent) => {
        // エージェント固有のツール設定がある場合のみ更新
        if (agent.tools && agent.tools.length > 0) {
          const isGenerateImageSupported = [
            'us-east-1',
            'us-west-2',
            'ap-northeast-1',
            'eu-west-1',
            'eu-west-2',
            'ap-south-1'
          ].includes(region)

          // generateImageツールがリストに含まれているか確認
          const hasGenerateImageTool = agent.tools.includes('generateImage')

          // リージョンがサポートされていない場合は、generateImageツールを削除
          if (!isGenerateImageSupported && hasGenerateImageTool) {
            return {
              ...agent,
              tools: agent.tools.filter((toolName) => toolName !== 'generateImage')
            }
          }
        }
        return agent
      })

      // 変更があった場合のみ保存
      if (JSON.stringify(customAgents) !== JSON.stringify(updatedAgents)) {
        setCustomAgents(updatedAgents)
        window.store.set('customAgents', updatedAgents)
      }
    }
  }

  const setAwsAccessKeyId = (accessKeyId: string) => {
    setStateAwsAccessKeyId(accessKeyId)
    const credentials: AwsCredentialIdentity = {
      accessKeyId,
      secretAccessKey: awsSecretAccessKey,
      sessionToken: !awsSessionToken ? undefined : awsSessionToken
    }
    saveAwsConfig(credentials, awsRegion)
  }

  const setAwsSecretAccessKey = (secretAccessKey: string) => {
    setStateAwsSecretAccessKey(secretAccessKey)
    const credentials: AwsCredentialIdentity = {
      accessKeyId: awsAccessKeyId,
      secretAccessKey,
      sessionToken: !awsSessionToken ? undefined : awsSessionToken
    }
    saveAwsConfig(credentials, awsRegion)
  }

  const setAwsSessionToken = (sessionToken: string) => {
    setStateAwsSessionToken(sessionToken)
    const credentials: AwsCredentialIdentity = {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      sessionToken: !sessionToken ? undefined : sessionToken
    }
    saveAwsConfig(credentials, awsRegion)
  }

  const setUseAwsProfile = (useProfile: boolean) => {
    setStateUseAwsProfile(useProfile)
    const credentials: AwsCredentialIdentity = {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      sessionToken: !awsSessionToken ? undefined : awsSessionToken
    }
    window.store.set('aws', {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region: awsRegion,
      useProfile: useProfile,
      profile: awsProfile
    })
  }

  const setAwsProfile = (profile: string) => {
    setStateAwsProfile(profile)
    const credentials: AwsCredentialIdentity = {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      sessionToken: !awsSessionToken ? undefined : awsSessionToken
    }
    window.store.set('aws', {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region: awsRegion,
      useProfile: useAwsProfile,
      profile: profile
    })
  }

  const saveAwsConfig = (credentials: AwsCredentialIdentity, region: string) => {
    window.store.set('aws', {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region,
      useProfile: useAwsProfile,
      profile: awsProfile
    })
  }

  const saveCustomAgents = (agents: CustomAgent[]) => {
    setCustomAgents(agents)
    window.store.set('customAgents', agents)
  }

  const setSelectedAgentId = (agentId: string) => {
    // エージェント切り替え時に既存のカメラプレビューウィンドウを閉じる
    if (window.api?.camera?.hidePreviewWindow) {
      window.api.camera.hidePreviewWindow().catch((error) => {
        console.warn('Failed to hide camera preview window during agent switch:', error)
      })
    }

    setStateSelectedAgentId(agentId)
    window.store.set('selectedAgentId', agentId)
  }

  // Make sure there are no duplicate IDs between agents from different sources
  const allAgents = useMemo(() => {
    // Create a mapping of IDs to count occurrences
    const idCounts = new Map<string, number>()

    // First pass - count all IDs
    ;[...customAgents, ...sharedAgents].forEach((agent) => {
      if (agent.id) {
        idCounts.set(agent.id, (idCounts.get(agent.id) || 0) + 1)
      }
    })

    // Clone and fix duplicate IDs by adding a suffix
    const result = [
      ...customAgents,
      // Apply special handling for shared agents which may have duplicates
      ...sharedAgents.map((agent) => {
        // If this ID is unique or already has 'shared-' prefix, keep it as is
        if (
          (agent.id && idCounts.get(agent.id) === 1) ||
          (agent.id && agent.id.startsWith('shared-'))
        ) {
          return agent
        }

        // Otherwise, generate a new ID with timestamp to make it unique
        return {
          ...agent,
          id: `shared-${agent.id || ''}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
        }
      })
    ]

    return result
  }, [customAgents, sharedAgents])

  // エージェント固有のMCPツールを取得する関数
  const getAgentMcpTools = useCallback(
    (agentId: string): ToolState[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)
      // エージェント固有のMCPツール設定を返す（なければ空配列）
      return agent?.mcpTools || []
    },
    [allAgents]
  )
  const currentAgent = useMemo(() => {
    return allAgents.find((a) => a.id === selectedAgentId)
  }, [allAgents, selectedAgentId])

  // 現在選択中のエージェントが変更されたらMCPツールを再読み込み
  useEffect(() => {
    if (!currentAgent) return

    // エージェントにMCPサーバー設定があり、かつmcpToolsがまだ設定されていない場合
    if (currentAgent?.mcpServers && currentAgent.mcpServers.length > 0) {
      // すでにMCPツールがあるか確認
      const hasMcpTools = currentAgent.mcpTools && currentAgent.mcpTools.length > 0

      if (!hasMcpTools) {
        console.log(
          `Fetching MCP tools for agent: ${currentAgent.name} (${currentAgent.mcpServers.length} servers)`
        )

        // 非同期で実行
        const fetchAndSetMcpTools = async () => {
          const fetchedTools = await fetchMcpTools(currentAgent.mcpServers)
          if (fetchedTools && fetchedTools.length > 0) {
            const toolStates = fetchedTools.map((tool) => ({
              toolSpec: tool.toolSpec,
              enabled: true
            })) as ToolState[]

            // カスタムエージェントの場合はグローバル状態を更新して保存
            if (currentAgent.isCustom) {
              updateAgentMcpTools(currentAgent.id, toolStates)
            } else if (currentAgent.isShared) {
              // 共有エージェントやディレクトリエージェントの場合は一時的にメモリ上でのみ設定
              // 既存の参照を変更せずに新しい配列を作成しmcpToolsプロパティを設定
              // これによりオブジェクトの参照が変更され、UIが再レンダリングされる
              const updatedAgentsArray = sharedAgents.map((agent) =>
                agent.id === currentAgent.id ? { ...agent, mcpTools: toolStates } : agent
              )

              // 共有エージェントの場合
              if (currentAgent.isShared) {
                setSharedAgents(updatedAgentsArray)
                // ここではwindow.store.setは呼ばない（再起動時に再度読み込まれるため）
              }
            }
          } else {
            console.log(`No MCP tools found for agent: ${currentAgent.name}`)
          }
        }

        fetchAndSetMcpTools()
      } else {
        console.log(
          `Agent ${currentAgent.name} already has ${currentAgent.mcpTools?.length} MCP tools`
        )
      }
    } else if (currentAgent) {
      // 現在のエージェントにMCPサーバー設定がない場合
      console.log(`Agent ${currentAgent.name} has no MCP servers configured`)
    }
  }, [currentAgent, fetchMcpTools, updateAgentMcpTools, sharedAgents, directoryAgents])

  const enabledTavilySearch = tavilySearchApiKey.length > 0

  const setShell = (newShell: string) => {
    setStateShell(newShell)
    window.store.set('shell', newShell)
  }

  const setIgnoreFiles = useCallback((files: string[]) => {
    setStateIgnoreFiles(files)
    const agentChatConfig = window.store.get('agentChatConfig') || {}
    window.store.set('agentChatConfig', {
      ...agentChatConfig,
      ignoreFiles: files
    })
  }, [])

  const setEnablePromptCache = useCallback((enabled: boolean) => {
    setStateEnablePromptCache(enabled)
    const agentChatConfig = window.store.get('agentChatConfig') || {}
    window.store.set('agentChatConfig', {
      ...agentChatConfig,
      enablePromptCache: enabled
    })
  }, [])

  const setNotification = useCallback((enabled: boolean) => {
    setStateNotification(enabled)
    window.store.set('notification', enabled)
  }, [])

  const setRecognizeImageModel = useCallback((modelId: string) => {
    setStateRecognizeImageModel(modelId)
    window.store.set('recognizeImageTool', { modelId })
  }, [])

  const setGenerateImageModel = useCallback((modelId: string) => {
    setStateGenerateImageModel(modelId)
    window.store.set('generateImageTool', { modelId })
  }, [])

  const setGenerateVideoS3Uri = useCallback((s3Uri: string) => {
    setStateGenerateVideoS3Uri(s3Uri)
    window.store.set('generateVideoTool', { s3Uri })
  }, [])

  const setCodeInterpreterConfig = useCallback((config: CodeInterpreterContainerConfig) => {
    setStateCodeInterpreterConfig(config)
    window.store.set('codeInterpreterTool', config)
  }, [])

  // エージェント固有のツール設定を取得する関数
  const getAgentTools = useCallback(
    (agentId: string): ToolState[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)
      // MCP ツールを取得（常に有効）
      const mcpTools = agent?.mcpTools || []
      const agentMcpTools = mcpTools.map((tool) => ({
        ...tool,
        enabled: true // MCP ツールは常に有効
      }))

      // 標準ツールのみを処理（MCP ツールは別途管理）
      // エージェント固有のツール設定がある場合
      if (agent && agent.tools && agent.tools.length > 0) {
        // 標準ツールの ToolState[] を生成（デフォルトは無効）
        const standardToolStates = tools.map((tool) => ({ ...tool, enabled: false }))

        // エージェントのツール名リストに含まれる標準ツールを有効化
        const enabledStandardTools = standardToolStates.map((toolState) => {
          // ツール名を取得
          const toolName = toolState.toolSpec?.name as ToolName

          if (!toolName) return { ...toolState, enabled: false }

          // エージェントのツールリストに含まれるかどうか確認
          const isEnabled = agent.tools?.includes(toolName) || false
          return { ...toolState, enabled: isEnabled }
        })

        // 標準ツールと MCP ツールを結合して返す
        return [...enabledStandardTools, ...agentMcpTools]
      }

      // MCP ツールだけを返す
      return agentMcpTools
    },
    [allAgents, tools]
  )

  // エージェント固有の許可コマンドを取得する関数
  const getAgentAllowedCommands = useCallback(
    (agentId: string): CommandConfig[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有の許可コマンド設定がある場合はそれを返す
      // それ以外は空配列を返す
      return (agent && agent.allowedCommands) || []
    },
    [allAgents]
  )

  // エージェント固有の許可ウィンドウを取得する関数
  const getAgentAllowedWindows = useCallback(
    (agentId: string): WindowConfig[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有の許可ウィンドウ設定がある場合はそれを返す
      // それ以外は空配列を返す
      return (agent && agent.allowedWindows) || []
    },
    [allAgents]
  )

  // エージェント固有のBedrock Agentsを取得する関数
  const getAgentBedrockAgents = useCallback(
    (agentId: string): BedrockAgent[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有のBedrock Agents設定がある場合はそれを返す
      // それ以外は空配列を返す
      return (agent && agent.bedrockAgents) || []
    },
    [allAgents]
  )

  // エージェント固有のKnowledge Basesを取得する関数
  const getAgentKnowledgeBases = useCallback(
    (agentId: string): KnowledgeBase[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有のKnowledge Base設定がある場合はそれを返す
      // それ以外は空配列を返す
      return (agent && agent.knowledgeBases) || []
    },
    [allAgents]
  )

  // エージェント固有の設定を使用
  const systemPrompt = useMemo(() => {
    if (!currentAgent?.system) return ''

    // 現在のエージェントの有効なツールを取得
    const agentTools = getAgentTools(selectedAgentId)
    // エージェント固有の環境コンテキスト設定を取得
    const systemPromptContext = getEnvironmentContext(
      agentTools,
      currentAgent?.environmentContextSettings
    )

    return replacePlaceholders(currentAgent.system + '\n\n' + systemPromptContext, {
      projectPath,
      allowedCommands: allAgents.find((a) => a.id === selectedAgentId)?.allowedCommands || [],
      allowedWindows: allAgents.find((a) => a.id === selectedAgentId)?.allowedWindows || [],
      allowedCameras: allAgents.find((a) => a.id === selectedAgentId)?.allowedCameras || [],
      knowledgeBases: allAgents.find((a) => a.id === selectedAgentId)?.knowledgeBases || [],
      bedrockAgents: allAgents.find((a) => a.id === selectedAgentId)?.bedrockAgents || [],
      flows: allAgents.find((a) => a.id === selectedAgentId)?.flows || []
    })
  }, [currentAgent, selectedAgentId, projectPath, allAgents, getAgentTools])

  // エージェントツール設定を更新する関数
  const updateAgentTools = useCallback(
    (agentId: string, updatedTools: ToolState[]) => {
      // MCP ツールを取得
      const agent = customAgents.find((a) => a.id === agentId)
      const mcpTools = agent?.mcpTools || []
      const mcpToolNames = mcpTools.map((tool) => tool.toolSpec?.name).filter(Boolean)

      // 有効な標準ツールの名前のみを抽出（MCP ツールは除外）
      const enabledToolNames = updatedTools
        .filter((tool) => {
          // MCP ツールは除外し、有効な標準ツールのみを含める
          const toolName = tool.toolSpec?.name
          return tool.enabled && toolName && !mcpToolNames.includes(toolName)
        })
        .map((tool) => tool.toolSpec?.name as ToolName)
        .filter(Boolean)

      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, tools: enabledToolNames } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェントの許可コマンド設定を更新する関数
  const updateAgentAllowedCommands = useCallback(
    (agentId: string, commands: CommandConfig[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, allowedCommands: commands } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェントの許可ウィンドウ設定を更新する関数
  const updateAgentAllowedWindows = useCallback(
    (agentId: string, windows: WindowConfig[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, allowedWindows: windows } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェント固有の許可カメラを取得する関数
  const getAgentAllowedCameras = useCallback(
    (agentId: string): CameraConfig[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有の許可カメラ設定がある場合はそれを返す
      // それ以外は空配列を返す
      return (agent && agent.allowedCameras) || []
    },
    [allAgents]
  )

  // エージェントの許可カメラ設定を更新する関数
  const updateAgentAllowedCameras = useCallback(
    (agentId: string, cameras: CameraConfig[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, allowedCameras: cameras } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェントのBedrock Agents設定を更新する関数
  const updateAgentBedrockAgents = useCallback(
    (agentId: string, agents: BedrockAgent[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, bedrockAgents: agents } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェントのKnowledge Base設定を更新する関数
  const updateAgentKnowledgeBases = useCallback(
    (agentId: string, bases: KnowledgeBase[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, knowledgeBases: bases } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェント固有のFlow設定を取得する関数
  const getAgentFlows = useCallback(
    (agentId: string): FlowConfig[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有のFlow設定がある場合はそれを返す
      // それ以外は空配列を返す
      return (agent && agent.flows) || []
    },
    [allAgents]
  )

  // エージェントのFlow設定を更新する関数
  const updateAgentFlows = useCallback(
    (agentId: string, flows: FlowConfig[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, flows } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // エージェント設定の一括更新関数
  const updateAgentSettings = useCallback(
    (
      agentId: string,
      settings: {
        tools?: ToolState[]
        allowedCommands?: CommandConfig[]
        bedrockAgents?: BedrockAgent[]
        knowledgeBases?: KnowledgeBase[]
        mcpTools?: ToolState[]
      }
    ) => {
      // 更新用の設定オブジェクトを作成
      const processedSettings: Partial<CustomAgent> = {}

      // 各プロパティを個別に処理
      if (settings.allowedCommands) {
        processedSettings.allowedCommands = settings.allowedCommands
      }

      if (settings.bedrockAgents) {
        processedSettings.bedrockAgents = settings.bedrockAgents
      }

      if (settings.knowledgeBases) {
        processedSettings.knowledgeBases = settings.knowledgeBases
      }

      // MCPツールが含まれている場合、そのまま設定
      if (settings.mcpTools) {
        processedSettings.mcpTools = settings.mcpTools
      }

      // tools が含まれている場合、ToolState[] から ToolName[] に変換（MCP ツールは除外）
      if (settings.tools) {
        // MCP ツールを取得
        const agent = customAgents.find((a) => a.id === agentId)
        const mcpTools = agent?.mcpTools || []
        const mcpToolNames = mcpTools.map((tool) => tool.toolSpec?.name).filter(Boolean)

        // 有効な標準ツールの名前のみを抽出（MCP ツールは除外）
        const enabledToolNames = settings.tools
          .filter((tool) => {
            // MCP ツールは除外し、有効な標準ツールのみを含める
            const toolName = tool.toolSpec?.name
            return tool.enabled && toolName && !mcpToolNames.includes(toolName)
          })
          .map((tool) => tool.toolSpec?.name as ToolName)
          .filter(Boolean) as ToolName[]

        processedSettings.tools = enabledToolNames
      }

      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, ...processedSettings } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // カテゴリーに基づいてデフォルトツール設定を返す関数
  const getDefaultToolsForCategory = useCallback(
    (category: string, enableByDefault: boolean = true): ToolState[] => {
      const allWindowTools = tools.map((tool) => ({
        ...tool,
        enabled: enableByDefault
      })) as ToolState[]
      return getToolsForCategory(category as AgentCategory, allWindowTools)
    },
    [tools]
  )

  const setPlanMode = useCallback((enabled: boolean) => {
    setStatePlanMode(enabled)
    window.store.set('planMode', enabled)
  }, [])

  const setSelectedVoiceId = useCallback((voiceId: string) => {
    setStateSelectedVoiceId(voiceId)
    window.store.set('selectedVoiceId', voiceId)
  }, [])

  // Translation Settings functions
  const setTranslationEnabled = useCallback((enabled: boolean) => {
    setStateTranslationEnabled(enabled)
    ;(window.store as any).set('translationEnabled', enabled)
  }, [])

  const setTranslationTargetLanguage = useCallback((language: string) => {
    setStateTranslationTargetLanguage(language)
    ;(window.store as any).set('translationTargetLanguage', language)
  }, [])

  const value = {
    // Advanced Settings
    sendMsgKey,
    updateSendMsgKey,

    // Plan/Act Mode Settings
    planMode,
    setPlanMode,

    // Agent Chat Settings
    contextLength,
    updateContextLength,
    enablePromptCache,
    setEnablePromptCache,

    // Notification Settings
    notification,
    setNotification,

    // recognizeImage Tool Settings
    recognizeImageModel,
    setRecognizeImageModel,

    // generateImage Tool Settings
    generateImageModel,
    setGenerateImageModel,

    // generateVideo Tool Settings
    generateVideoS3Uri,
    setGenerateVideoS3Uri,

    // codeInterpreter Tool Settings
    codeInterpreterConfig,
    setCodeInterpreterConfig,

    // LLM Settings
    currentLLM,
    updateLLM,
    availableModels,
    llmError,

    // 軽量処理用モデル設定
    lightProcessingModel,
    updateLightProcessingModel,

    // Thinking Mode Settings
    thinkingMode,
    updateThinkingMode,

    // Interleave Thinking Settings
    interleaveThinking,
    setInterleaveThinking,

    // Inference Parameters
    inferenceParams,
    updateInferenceParams,

    // Bedrock Settings
    bedrockSettings,
    updateBedrockSettings,

    // Guardrail Settings
    guardrailSettings,
    updateGuardrailSettings,

    // userDataPath (Electron store directory)
    userDataPath,

    // Project Settings
    projectPath,
    setProjectPath,
    selectDirectory,

    // Tavily Search Settings
    tavilySearchApiKey,
    setTavilySearchApiKey,
    enabledTavilySearch,

    // AWS Settings
    awsRegion,
    setAwsRegion,
    awsAccessKeyId,
    setAwsAccessKeyId,
    awsSecretAccessKey,
    setAwsSecretAccessKey,
    awsSessionToken,
    setAwsSessionToken,
    useAwsProfile,
    setUseAwsProfile,
    awsProfile,
    setAwsProfile,

    // Custom Agents Settings
    customAgents,
    saveCustomAgents,
    sharedAgents,
    loadSharedAgents,

    // Directory Agents Settings
    directoryAgents,
    loadDirectoryAgents,
    addDirectoryAgentToCustom,
    isDirectoryAgentLoading,

    // Selected Agent Settings
    selectedAgentId,
    setSelectedAgentId,
    agents: allAgents,
    currentAgent,
    currentAgentSystemPrompt: systemPrompt,

    // エージェントのツール設定
    getAgentTools,
    updateAgentTools,
    getDefaultToolsForCategory,

    // MCP Tool Settings
    fetchMcpTools,
    getAgentMcpTools,
    updateAgentMcpTools,

    // エージェント固有の設定
    getAgentAllowedCommands,
    updateAgentAllowedCommands,
    getAgentAllowedWindows,
    updateAgentAllowedWindows,
    getAgentAllowedCameras,
    updateAgentAllowedCameras,
    getAgentBedrockAgents,
    updateAgentBedrockAgents,
    getAgentKnowledgeBases,
    updateAgentKnowledgeBases,
    getAgentFlows,
    updateAgentFlows,
    updateAgentSettings,

    // Shell Settings
    shell,
    setShell,

    // Ignore Files Settings
    ignoreFiles,
    setIgnoreFiles,

    // Voice Settings
    selectedVoiceId,
    setSelectedVoiceId,

    // Translation Settings
    translationEnabled,
    setTranslationEnabled,
    translationTargetLanguage,
    setTranslationTargetLanguage
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
