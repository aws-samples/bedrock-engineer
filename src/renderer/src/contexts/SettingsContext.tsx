import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { KnowledgeBase, Scenario, SendMsgKey, ToolState } from 'src/types/agent-chat'
import { listModels } from '@renderer/lib/api'
import { CustomAgent } from '@/types/agent-chat'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { replacePlaceholders } from '@renderer/pages/ChatPage/utils/placeholder'
import { useTranslation } from 'react-i18next'
import { DEFAULT_AGENTS } from '@renderer/pages/ChatPage/constants/DEFAULT_AGENTS'
import { InferenceParameters, LLM, BEDROCK_SUPPORTED_REGIONS, ThinkingMode } from '@/types/llm'
import type { AwsCredentialIdentity } from '@smithy/types'
import { BedrockAgent } from '@/types/agent'
import { AgentCategory } from '@/types/agent-chat'
import { getToolsForCategory } from '../constants/defaultToolSets'

const DEFAULT_INFERENCE_PARAMS: InferenceParameters = {
  maxTokens: 4096,
  temperature: 0.5,
  topP: 0.9
}

// デフォルトのシェル設定
const DEFAULT_SHELL = '/bin/bash'

// TODO: リージョンに応じて動的にツールの enum を設定したい
// "us-east-1",  "us-west-2", "ap-northeast-1" 以外は generateImage ツールを無効化する
const isGenerateImageTool = (name: string) => name === 'generateImage'

const supportGenerateImageToolRegions: string[] = [
  'us-east-1',
  'us-west-2',
  'ap-northeast-1',
  'eu-west-1',
  'eu-west-2',
  'ap-south-1'
]
const availableImageGenerationModelsMap: Record<string, string[]> = {
  'us-east-1': [
    'amazon.nova-canvas-v1:0',
    'amazon.titan-image-generator-v1',
    'amazon.titan-image-generator-v2:0'
  ],
  'us-west-2': [
    'stability.sd3-large-v1:0',
    'stability.sd3-5-large-v1:0',
    'stability.stable-image-core-v1:0',
    'stability.stable-image-core-v1:1',
    'stability.stable-image-ultra-v1:0',
    'stability.stable-image-ultra-v1:1',
    'amazon.titan-image-generator-v2:0',
    'amazon.titan-image-generator-v1'
  ],
  'ap-northeast-1': ['amazon.titan-image-generator-v2:0', 'amazon.titan-image-generator-v1'],
  'ap-south-1': ['amazon.titan-image-generator-v1'],
  'eu-west-1': ['amazon.titan-image-generator-v1'],
  'eu-west-2': ['amazon.titan-image-generator-v1']
}

const compareTools = (savedTools: ToolState[], windowTools: typeof window.tools): boolean => {
  if (savedTools.length !== windowTools.length) return true

  const savedToolNames = new Set(savedTools.map((tool) => tool.toolSpec?.name))
  const windowToolNames = new Set(windowTools.map((tool) => tool.toolSpec?.name))

  // 名前のセットが異なる場合は変更があったとみなす
  if (savedToolNames.size !== windowToolNames.size) return true

  // 各ツールの名前を比較
  for (const name of savedToolNames) {
    if (!windowToolNames.has(name)) return true
  }

  // ツールの詳細な内容を比較
  for (const windowTool of windowTools) {
    const savedTool = savedTools.find((tool) => tool.toolSpec?.name === windowTool.toolSpec?.name)

    if (!savedTool) return true

    // ツールの重要なプロパティを比較
    if (JSON.stringify(windowTool.toolSpec) !== JSON.stringify(savedTool.toolSpec)) {
      return true
    }
  }

  return false
}

interface CommandConfig {
  pattern: string
  description: string
}

export interface SettingsContextType {
  // Advanced Settings
  sendMsgKey: SendMsgKey
  updateSendMsgKey: (key: SendMsgKey) => void

  // Agent Chat Settings
  contextLength: number
  updateContextLength: (length: number) => void

  // Notification Settings
  notification: boolean
  setNotification: (enabled: boolean) => void

  // LLM Settings
  currentLLM: LLM
  updateLLM: (selectedModel: LLM) => void
  availableModels: LLM[]
  llmError: any

  // Thinking Mode Settings
  thinkingMode?: ThinkingMode
  updateThinkingMode: (mode: ThinkingMode) => void

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

  // Selected Agent Settings
  selectedAgentId: string
  setSelectedAgentId: (agentId: string) => void
  agents: CustomAgent[]
  currentAgent: CustomAgent | undefined
  currentAgentSystemPrompt: string

  // Tools Settings
  tools: ToolState[]
  setTools: (tools: ToolState[]) => void
  enabledTools: ToolState[]

  // エージェント固有のツール設定
  getAgentTools: (agentId: string) => ToolState[]
  updateAgentTools: (agentId: string, tools: ToolState[]) => void
  getDefaultToolsForCategory: (category: string) => ToolState[]

  allowedCommands: CommandConfig[]
  setAllowedCommands: (commands: CommandConfig[]) => void

  knowledgeBases: KnowledgeBase[]
  setKnowledgeBases: (knowledgeBases: KnowledgeBase[]) => void

  // Bedrock Agent Settings
  bedrockAgents: BedrockAgent[]
  setBedrockAgents: (agents: BedrockAgent[]) => void

  // Shell Settings
  shell: string
  setShell: (shell: string) => void

  // Ignore Files Settings
  ignoreFiles: string[]
  setIgnoreFiles: (files: string[]) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Advanced Settings
  const [sendMsgKey, setSendMsgKey] = useState<SendMsgKey>('Enter')

  // Agent Chat Settings
  const [contextLength, setContextLength] = useState<number>(60)

  // Notification Settings
  const [notification, setStateNotification] = useState<boolean>(true)

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

  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>()

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

  // Selected Agent Settings
  const [selectedAgentId, setStateSelectedAgentId] = useState<string>('softwareAgent')

  // Tools Settings
  const [tools, setStateTools] = useState<ToolState[]>([])

  // Knowledge Base Settings
  const [knowledgeBases, setStateKnowledgeBases] = useState<KnowledgeBase[]>([])

  // Bedrock Agent Settings
  const [bedrockAgents, setStateBedrockAgents] = useState<BedrockAgent[]>([])

  // Command Settings
  const [allowedCommands, setStateAllowedCommands] = useState<CommandConfig[]>([
    {
      pattern: 'ls *',
      description: 'List directory contents'
    }
  ])

  // Shell Settings
  const [shell, setStateShell] = useState<string>(DEFAULT_SHELL)

  // Ignore Files Settings
  const [ignoreFiles, setStateIgnoreFiles] = useState<string[]>([
    '.git',
    '.vscode',
    'node_modules',
    '.github'
  ])

  // Initialize all settings
  useEffect(() => {
    // Load Advanced Settings
    const advancedSetting = window.store.get('advancedSetting')
    setSendMsgKey(advancedSetting?.keybinding?.sendMsgKey)

    // Load Notification Settings
    const notificationSetting = window.store.get('notification')
    if (notificationSetting !== undefined) {
      setStateNotification(notificationSetting)
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
    }

    // Load Thinking Mode Settings
    const storedThinkingMode = window.store.get('thinkingMode')
    if (storedThinkingMode) {
      setThinkingMode(storedThinkingMode)
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
    const savedAgents = window.store.get('customAgents')
    if (savedAgents) {
      setCustomAgents(savedAgents)
    }

    // Load Selected Agent
    const savedAgentId = window.store.get('selectedAgentId')
    if (savedAgentId) {
      setSelectedAgentId(savedAgentId)
    }

    // Load Tools Settings
    const savedTools = window.store.get('tools')
    if (savedTools) {
      const toolsNeedUpdate = compareTools(savedTools, window.tools)
      if (toolsNeedUpdate) {
        const initialTools = window.tools
          .map((tool) => {
            if (!tool.toolSpec?.name) {
              return
            }
            return {
              ...tool,
              enabled: true
            } as Tool
          })
          .filter((item): item is ToolState => item !== undefined)

        setStateTools(initialTools)
        window.store.set('tools', initialTools)
      } else if (savedTools) {
        setStateTools(savedTools)
      }
    }

    // Load Knowledge Base Settings
    const savedKnowledgeBases = window.store.get('knowledgeBases')
    if (savedKnowledgeBases) {
      setStateKnowledgeBases(savedKnowledgeBases)
    }

    // Load Bedrock Agent Settings
    const savedBedrockAgents = window.store.get('bedrockAgents')
    if (savedBedrockAgents) {
      setStateBedrockAgents(savedBedrockAgents)
    }

    // Load Command Settings
    const commandSettings = window.store.get('command')
    if (commandSettings?.allowedCommands) {
      setStateAllowedCommands(commandSettings.allowedCommands)
      // Load Shell Setting
      if (commandSettings.shell) {
        setStateShell(commandSettings.shell)
      }
    } else {
      // 初期値を設定
      const initialCommands = [
        {
          pattern: 'ls *',
          description: 'List directory contents'
        }
      ]
      setStateAllowedCommands(initialCommands)
      window.store.set('command', {
        allowedCommands: initialCommands,
        shell: DEFAULT_SHELL
      })
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

    // 設定を保存
    window.store.set('agentChatConfig', agentChatConfig)
  }, [])

  useEffect(() => {
    fetchModels()
    if (awsRegion) {
      const updatedTools = replaceGenerateImageModels(tools, awsRegion)
      setStateTools(updatedTools)
      window.store.set('tools', updatedTools)
    }
  }, [awsRegion, awsAccessKeyId, awsSecretAccessKey, awsProfile, useAwsProfile])

  // Load shared agents when component mounts or project path changes
  useEffect(() => {
    // Load shared agents right away
    loadSharedAgents()
  }, [projectPath])

  // Function to load shared agents from project directory
  const loadSharedAgents = async () => {
    try {
      const { agents, error } = await window.file.readSharedAgents()
      if (error) {
        console.error('Error loading shared agents:', error)
      } else {
        setSharedAgents(agents || [])
      }
    } catch (error) {
      console.error('Failed to load shared agents:', error)
    }
  }

  useEffect(() => {
    if (currentLLM) {
      // Update tools based on toolUse support
      if (currentLLM.toolUse === false) {
        // currentLLM が ToolUse をサポートしないモデルだった場合ツールを全て disabled にする
        const updatedTools = window.tools.map((tool) => ({ ...tool, enabled: false }))
        setStateTools(updatedTools)
        window.store.set('tools', updatedTools)
      } else if (currentLLM.toolUse === true) {
        const updatedTools = window.tools.map((tool) => ({ ...tool, enabled: true }))
        setStateTools(updatedTools)
        window.store.set('tools', updatedTools)
      }

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
    setStateSelectedAgentId(agentId)
    window.store.set('selectedAgentId', agentId)
  }

  const { t, i18n } = useTranslation()

  const getBaseAgents = useCallback((): CustomAgent[] => {
    // シナリオをローカライズする関数
    const localizeScenarios = useCallback(
      (scenarios: Scenario[]): Scenario[] => {
        return scenarios.map((scenario) => ({
          title: t(scenario.title),
          content: replacePlaceholders(t(`${scenario.title} description`), {
            projectPath: projectPath || t('no project path'),
            allowedCommands: allowedCommands,
            knowledgeBases: knowledgeBases,
            bedrockAgents: bedrockAgents
          })
        }))
      },
      [t, replacePlaceholders, projectPath, allowedCommands, knowledgeBases, bedrockAgents]
    )

    // ローカライズされたエージェントを生成
    const localizedAgents = useMemo(() => {
      return DEFAULT_AGENTS.map((agent) => ({
        ...agent,
        name: agent.name,
        description: t(agent.description),
        system: replacePlaceholders(agent.system, {
          projectPath: projectPath || t('no project path'),
          allowedCommands: allowedCommands,
          knowledgeBases: knowledgeBases,
          bedrockAgents: bedrockAgents
        }),
        scenarios: localizeScenarios(agent.scenarios)
      }))
    }, [i18n.language, t, replacePlaceholders, localizeScenarios])

    return localizedAgents
  }, [t, projectPath, allowedCommands, knowledgeBases, bedrockAgents])

  const baseAgents = getBaseAgents()
  // Make sure there are no duplicate IDs between agents from different sources
  const allAgents = useMemo(() => {
    // Create a mapping of IDs to count occurrences
    const idCounts = new Map<string, number>()

    // First pass - count all IDs
    ;[...baseAgents, ...customAgents, ...sharedAgents].forEach((agent) => {
      if (agent.id) {
        idCounts.set(agent.id, (idCounts.get(agent.id) || 0) + 1)
      }
    })

    // Clone and fix duplicate IDs by adding a suffix
    const result = [
      ...baseAgents,
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
  }, [baseAgents, customAgents, sharedAgents])
  const currentAgent = allAgents.find((a) => a.id === selectedAgentId)
  const systemPrompt = currentAgent?.system
    ? replacePlaceholders(currentAgent?.system, {
        projectPath,
        allowedCommands: allowedCommands,
        knowledgeBases: knowledgeBases,
        bedrockAgents: bedrockAgents
      })
    : ''

  const setTools = (newTools: ToolState[]) => {
    setStateTools(newTools)
    window.store.set('tools', newTools)
  }

  const enabledTavilySearch = tavilySearchApiKey.length > 0

  const setKnowledgeBases = (knowledgeBases: KnowledgeBase[]) => {
    setStateKnowledgeBases(knowledgeBases)
    window.store.set('knowledgeBases', knowledgeBases)
  }

  const setBedrockAgents = (agents: BedrockAgent[]) => {
    setStateBedrockAgents(agents)
    window.store.set('bedrockAgents', agents)
  }

  const setAllowedCommands = (commands: CommandConfig[]) => {
    setStateAllowedCommands(commands)
    window.store.set('command', {
      allowedCommands: commands,
      shell: shell
    })
  }

  const setShell = (newShell: string) => {
    setStateShell(newShell)
    window.store.set('command', {
      allowedCommands: allowedCommands,
      shell: newShell
    })
  }

  const setIgnoreFiles = useCallback((files: string[]) => {
    setStateIgnoreFiles(files)
    const agentChatConfig = window.store.get('agentChatConfig') || {}
    window.store.set('agentChatConfig', {
      ...agentChatConfig,
      ignoreFiles: files
    })
  }, [])

  const setNotification = useCallback((enabled: boolean) => {
    setStateNotification(enabled)
    window.store.set('notification', enabled)
  }, [])

  // エージェント固有のツール設定を取得する関数
  const getAgentTools = useCallback(
    (agentId: string): ToolState[] => {
      // 現在選択されているエージェントを見つける
      const agent = allAgents.find((a) => a.id === agentId)

      // エージェント固有のツール設定がある場合はそれを返す
      if (agent && agent.tools) {
        return agent.tools
      }

      // それ以外は全てのツールセットを返す
      return getToolsForCategory('all', tools)
    },
    [allAgents, tools]
  )

  // 現在選択されているエージェント用のツール設定を取得
  const effectiveTools = useMemo(() => {
    // 選択されているエージェントのツール設定を取得する
    return getAgentTools(selectedAgentId)
  }, [selectedAgentId, getAgentTools])

  // 有効なツールのみをフィルタリング
  const enabledTools = effectiveTools
    .filter((tool) => tool.enabled)
    .filter((tool) => {
      if (tool.toolSpec?.name === 'tavilySearch') {
        return enabledTavilySearch
      }
      return true
    })

  // effectiveToolsの宣言は getAgentTools 関数の定義後に移動しました

  // enabledToolsの宣言は後に移動しました

  // エージェントツール設定を更新する関数
  const updateAgentTools = useCallback(
    (agentId: string, updatedTools: ToolState[]) => {
      // カスタムエージェントの場合のみ更新可能
      const updatedAgents = customAgents.map((agent) =>
        agent.id === agentId ? { ...agent, tools: updatedTools } : agent
      )

      setCustomAgents(updatedAgents)
      window.store.set('customAgents', updatedAgents)
    },
    [customAgents]
  )

  // カテゴリーに基づいてデフォルトツール設定を返す関数
  const getDefaultToolsForCategory = useCallback(
    (category: string): ToolState[] => {
      return getToolsForCategory(category as AgentCategory, tools)
    },
    [tools]
  )

  const value = {
    // Advanced Settings
    sendMsgKey,
    updateSendMsgKey,

    // Agent Chat Settings
    contextLength,
    updateContextLength,

    // Notification Settings
    notification,
    setNotification,

    // LLM Settings
    currentLLM,
    updateLLM,
    availableModels,
    llmError,

    // Thinking Mode Settings
    thinkingMode,
    updateThinkingMode,

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

    // Selected Agent Settings
    selectedAgentId,
    setSelectedAgentId,
    agents: allAgents,
    currentAgent,
    currentAgentSystemPrompt: systemPrompt,

    // Tools Settings
    tools,
    setTools,
    enabledTools,
    getAgentTools,
    updateAgentTools,
    getDefaultToolsForCategory,

    knowledgeBases,
    setKnowledgeBases,

    bedrockAgents,
    setBedrockAgents,

    allowedCommands,
    setAllowedCommands,

    // Shell Settings
    shell,
    setShell,

    // Ignore Files Settings
    ignoreFiles,
    setIgnoreFiles
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

/**
 * ToolSpec の中で、generateImage のツールでは指定できる modelId がリージョンによって異なる
 * @param tools
 * @param awsRegion
 * @returns
 */
function replaceGenerateImageModels(tools: ToolState[], awsRegion: string) {
  const updatedTools = tools.map((tool) => {
    if (tool.toolSpec?.name && isGenerateImageTool(tool.toolSpec?.name)) {
      if (supportGenerateImageToolRegions.includes(awsRegion)) {
        return {
          ...tool,
          toolSpec: {
            ...tool.toolSpec,
            inputSchema: {
              ...tool.toolSpec.inputSchema,
              json: {
                ...(tool.toolSpec.inputSchema?.json as any),
                properties: {
                  ...(tool.toolSpec.inputSchema?.json as any).properties,
                  modelId: {
                    ...((tool.toolSpec.inputSchema?.json as any).properties.modelId as any),
                    enum: availableImageGenerationModelsMap[awsRegion],
                    default: availableImageGenerationModelsMap[awsRegion][0]
                  }
                }
              }
            }
          },
          enabled: true
        }
      } else {
        return { ...tool, enabled: false }
      }
    }
    return tool
  })
  return updatedTools
}
