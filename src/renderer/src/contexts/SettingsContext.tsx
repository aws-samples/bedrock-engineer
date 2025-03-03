import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { Agent, KnowledgeBase, Scenario, SendMsgKey, ToolState } from 'src/types/agent-chat'
import { listModels } from '@renderer/lib/api'
import { CustomAgent } from '@/types/agent-chat'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BedrockAgent } from '../pages/ChatPage/modals/useToolSettingModal/BedrockAgentSettingForm'
import { replacePlaceholders } from '@renderer/pages/ChatPage/utils/placeholder'
import { useTranslation } from 'react-i18next'
import {
  SOFTWARE_AGENT_SYSTEM_PROMPT,
  CODE_BUDDY_SYSTEM_PROMPT,
  PRODUCT_DESIGNER_SYSTEM_PROMPT
} from '@renderer/pages/ChatPage/constants/DEFAULT_AGENTS'
import { InferenceParameters, LLM, BEDROCK_SUPPORTED_REGIONS } from '@/types/llm'

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

  // LLM Settings
  currentLLM: LLM
  updateLLM: (selectedModel: LLM) => void
  availableModels: LLM[]
  llmError: any

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

  // Custom Agents Settings
  customAgents: CustomAgent[]
  saveCustomAgents: (agents: CustomAgent[]) => void

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Advanced Settings
  const [sendMsgKey, setSendMsgKey] = useState<SendMsgKey>('Enter')

  // LLM Settings
  const [llmError, setLLMError] = useState<any>()
  const defaultModel = {
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    modelName: 'Claude 3.5 Sonnet v2',
    toolUse: true,
    regions: BEDROCK_SUPPORTED_REGIONS
  }
  const [currentLLM, setCurrentLLM] = useState<LLM>(defaultModel)
  const [availableModels, setAvailableModels] = useState<LLM[]>([])
  const [inferenceParams, setInferenceParams] =
    useState<InferenceParameters>(DEFAULT_INFERENCE_PARAMS)

  const [bedrockSettings, setBedrockSettings] = useState<{
    enableRegionFailover: boolean
    availableFailoverRegions: string[]
  }>({
    enableRegionFailover: true,
    availableFailoverRegions: [...BEDROCK_SUPPORTED_REGIONS]
  })

  const userDataPath = window.store.get('userDataPath')

  // Project Settings
  const [projectPath, setProjectPath] = useState<string>('')

  // Tavily Search Settings
  const [tavilySearchApiKey, setStateApiKey] = useState<string>('')

  // AWS Settings
  const [awsRegion, setStateAwsRegion] = useState<string>('')
  const [awsAccessKeyId, setStateAwsAccessKeyId] = useState<string>('')
  const [awsSecretAccessKey, setStateAwsSecretAccessKey] = useState<string>('')

  // Custom Agents Settings
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([])

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

  // Initialize all settings
  useEffect(() => {
    // Load Advanced Settings
    const advancedSetting = window.store.get('advancedSetting')
    setSendMsgKey(advancedSetting?.keybinding?.sendMsgKey)

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

    // Load Bedrock Settings
    const storedBedrockSettings = window.store.get('bedrockSettings')
    if (storedBedrockSettings) {
      setBedrockSettings(storedBedrockSettings)
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
  }, [])

  useEffect(() => {
    fetchModels()
    if (awsRegion) {
      const updatedTools = replaceGenerateImageModels(tools, awsRegion)
      setStateTools(updatedTools)
      window.store.set('tools', updatedTools)
    }
  }, [awsRegion, awsAccessKeyId, awsSecretAccessKey])

  useEffect(() => {
    if (currentLLM && currentLLM.toolUse === false) {
      // currentLLM が ToolUse をサポートしないモデルだった場合ツールを全て disabled にする
      const updatedTools = window.tools.map((tool) => ({ ...tool, enabled: false }))
      setStateTools(updatedTools)
      window.store.set('tools', updatedTools)
    }
    if (currentLLM && currentLLM.toolUse === true) {
      const updatedTools = window.tools.map((tool) => ({ ...tool, enabled: true }))
      setStateTools(updatedTools)
      window.store.set('tools', updatedTools)
    }
  }, [currentLLM])

  // Methods
  const updateSendMsgKey = (key: SendMsgKey) => {
    setSendMsgKey(key)
    window.store.set('advancedSetting', {
      keybinding: { sendMsgKey: key }
    })
  }

  const fetchModels = async () => {
    try {
      const models = await listModels()
      if (models) {
        setAvailableModels(models as LLM[])
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

  const updateBedrockSettings = (settings: Partial<typeof bedrockSettings>) => {
    const updatedSettings = { ...bedrockSettings, ...settings }
    setBedrockSettings(updatedSettings)
    window.store.set('bedrockSettings', updatedSettings)
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
    saveAwsConfig(region, awsAccessKeyId, awsSecretAccessKey)

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
    saveAwsConfig(awsRegion, accessKeyId, awsSecretAccessKey)
  }

  const setAwsSecretAccessKey = (secretAccessKey: string) => {
    setStateAwsSecretAccessKey(secretAccessKey)
    saveAwsConfig(awsRegion, awsAccessKeyId, secretAccessKey)
  }

  const saveAwsConfig = (region: string, accessKeyId: string, secretAccessKey: string) => {
    window.store.set('aws', {
      region,
      accessKeyId,
      secretAccessKey
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
  // エージェントの基本定義を取得
  const getBaseAgents = useCallback((): Agent[] => {
    return [
      {
        name: 'Software Developer',
        id: 'softwareAgent',
        description: t('softwareAgent.description'),
        system: SOFTWARE_AGENT_SYSTEM_PROMPT,
        scenarios: [
          { title: 'What is Amazon Bedrock', content: '' },
          { title: 'Organizing folders', content: '' },
          { title: 'Simple website', content: '' },
          { title: 'Simple Web API', content: '' },
          { title: 'CDK Project', content: '' },
          { title: 'Understanding the source code', content: '' },
          { title: 'Refactoring', content: '' },
          { title: 'Testcode', content: '' }
        ]
      },
      {
        name: 'Programming Mentor',
        id: 'codeBuddy',
        description: t('codeBuddy.description'),
        system: CODE_BUDDY_SYSTEM_PROMPT,
        scenarios: [
          { title: 'Learning JavaScript Basics', content: '' },
          { title: 'Understanding Functions', content: '' },
          { title: 'DOM Manipulation', content: '' },
          { title: 'Debugging JavaScript', content: '' },
          { title: 'Building a Simple Web App', content: '' },
          { title: 'Learning Python', content: '' },
          { title: 'Object-Oriented Programming', content: '' },
          { title: 'Data Visualization with Python', content: '' }
        ]
      },
      {
        name: 'Product Designer',
        id: 'productDesigner',
        description: t('productDesigner.description'),
        system: PRODUCT_DESIGNER_SYSTEM_PROMPT,
        scenarios: [
          { title: 'Wireframing a Mobile App', content: '' },
          { title: 'Designing a Landing Page', content: '' },
          { title: 'Improving User Experience', content: '' },
          { title: 'Creating a Design System', content: '' },
          { title: 'Accessibility Evaluation', content: '' },
          { title: 'Prototyping an Interface', content: '' },
          { title: 'Design Handoff', content: '' },
          { title: 'Design Trend Research', content: '' }
        ]
      }
    ]
  }, [t])

  const getLocalizedBaseAgents = useCallback((): CustomAgent[] => {
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
      const baseAgents = getBaseAgents()
      return baseAgents.map((agent) => ({
        ...agent,
        name: agent.name,
        system: replacePlaceholders(agent.system, {
          projectPath: projectPath || t('no project path'),
          allowedCommands: allowedCommands,
          knowledgeBases: knowledgeBases,
          bedrockAgents: bedrockAgents
        }),
        scenarios: localizeScenarios(agent.scenarios)
      }))
    }, [getBaseAgents, i18n.language, t, replacePlaceholders, localizeScenarios])

    return localizedAgents
  }, [t, projectPath, allowedCommands, knowledgeBases, bedrockAgents])

  const baseAgents = getLocalizedBaseAgents()
  const allAgents = useMemo(() => {
    return [...baseAgents, ...customAgents]
  }, [baseAgents, customAgents])
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

  const enabledTools = tools
    .filter((tool) => tool.enabled)
    .filter((tool) => {
      if (tool.toolSpec?.name === 'tavilySearch') {
        return enabledTavilySearch
      }
      return true
    })

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

  const value = {
    // Advanced Settings
    sendMsgKey,
    updateSendMsgKey,

    // LLM Settings
    currentLLM,
    updateLLM,
    availableModels,
    llmError,

    // Inference Parameters
    inferenceParams,
    updateInferenceParams,

    // Bedrock Settings
    bedrockSettings,
    updateBedrockSettings,

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

    // Custom Agents Settings
    customAgents,
    saveCustomAgents,

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

    knowledgeBases,
    setKnowledgeBases,

    bedrockAgents,
    setBedrockAgents,

    allowedCommands,
    setAllowedCommands,

    // Shell Settings
    shell,
    setShell
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
