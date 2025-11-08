import { useState, useCallback, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import {
  CustomAgent,
  ToolState,
  AgentCategory,
  KnowledgeBase,
  McpServerConfig,
  FlowConfig
} from '@/types/agent-chat'
import { ToolName } from '@/types/tools'
import useSetting from '@renderer/hooks/useSetting'
import { BedrockAgent } from '@/types/agent'
import { CommandConfig } from '../../modals/useToolSettingModal'
import { usePromptGeneration } from './usePromptGeneration'

/**
 * エージェントフォームの状態管理と主要機能を担当するカスタムフック
 */
// タブ識別子の型定義
type AgentFormTabId = 'basic' | 'mcp-servers' | 'agentcore-gateways' | 'tools'

export const useAgentForm = (initialAgent?: CustomAgent, onSave?: (agent: CustomAgent) => void) => {
  // 基本フォームデータの状態
  const [formData, setFormData] = useState<CustomAgent>({
    id: initialAgent?.id || `custom_agent_${nanoid(8)}`,
    name: initialAgent?.name || '',
    description: initialAgent?.description || '',
    system: initialAgent?.system || '',
    scenarios: initialAgent?.scenarios || [],
    tags: initialAgent?.tags || [],
    isCustom: true,
    icon: initialAgent?.icon || 'robot',
    iconColor: initialAgent?.iconColor,
    tools: initialAgent?.tools || ([] as ToolName[]),
    category: initialAgent?.category || 'all',
    additionalInstruction: initialAgent?.additionalInstruction || '',
    environmentContextSettings: {
      projectRule: initialAgent?.environmentContextSettings?.projectRule ?? true,
      visualExpressionRules: initialAgent?.environmentContextSettings?.visualExpressionRules ?? true
    }
  })

  // タブナビゲーション用の状態
  const [activeTab, setActiveTab] = useState<AgentFormTabId>('basic')

  // ツールとカテゴリの状態
  const [agentTools, setAgentTools] = useState<ToolState[]>([])
  const [agentCategory, setAgentCategory] = useState<AgentCategory>(initialAgent?.category || 'all')

  // MCPツール取得状態
  const [isLoadingMcpTools, setIsLoadingMcpTools] = useState<boolean>(false)
  const [tempMcpTools, setTempMcpTools] = useState<ToolState[]>([])

  // AgentCore Gatewayツール取得状態
  const [isLoadingAgentCoreTools, setIsLoadingAgentCoreTools] = useState<boolean>(false)
  const [tempAgentCoreTools, setTempAgentCoreTools] = useState<ToolState[]>([])

  // 初期化完了状態
  const initializationDone = useRef(false)

  // 設定データへのアクセス
  const { getDefaultToolsForCategory } = useSetting()

  // useCallbackでメモ化して、再レンダリングによる関数参照の変更を防止
  const updateField = useCallback(
    <K extends keyof CustomAgent>(field: K, value: CustomAgent[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // System prompt update callback functions with useCallback memoization
  const handleSystemPromptUpdate = useCallback(
    (prompt: string) => updateField('system', prompt),
    [updateField]
  )

  const handleScenariosUpdate = useCallback(
    (scenarios: Array<{ title: string; content: string }>) => updateField('scenarios', scenarios),
    [updateField]
  )

  // Prompt generation functionality integration
  const {
    generateSystemPrompt,
    generateVoiceChatPrompt,
    generateScenarios,
    isGeneratingSystem,
    isGeneratingVoiceChat,
    isGeneratingScenarios
  } = usePromptGeneration(
    formData.name,
    formData.description,
    formData.system,
    handleSystemPromptUpdate,
    handleScenariosUpdate,
    formData.additionalInstruction,
    agentTools
  )

  // 複数フィールドを一度に更新する関数
  const updateMultipleFields = useCallback((updates: Array<[keyof CustomAgent, any]>) => {
    setFormData((prev) => {
      const newFormData = { ...prev }
      updates.forEach(([field, value]) => {
        ;(newFormData[field] as any) = value
      })
      return newFormData
    })
  }, [])

  // エージェント初期化関数
  const initializeAgent = useCallback(() => {
    // 初期化済みならスキップ
    if (initializationDone.current) {
      return
    }

    // 初期化実行済みとしてマーク
    initializationDone.current = true

    if (!initialAgent) {
      // 新規エージェント - デフォルトツールを設定
      const defaultTools = getDefaultToolsForCategory('all')
      setAgentTools(defaultTools)

      const defaultToolNames = defaultTools
        .filter((tool) => tool.enabled)
        .map((tool) => tool.toolSpec?.name as ToolName)
        .filter(Boolean)

      // バッチ更新で処理を一度にまとめる
      updateMultipleFields([
        ['tools', defaultToolNames],
        ['category', 'all' as AgentCategory],
        ['mcpServers', [] as McpServerConfig[]],
        ['allowedCommands', [] as CommandConfig[]],
        ['knowledgeBases', [] as KnowledgeBase[]],
        ['bedrockAgents', [] as BedrockAgent[]],
        ['flows', [] as FlowConfig[]]
      ])

      return
    }

    // 既存エージェントの編集
    const category = initialAgent.category || 'all'
    setAgentCategory(category)

    // カテゴリに基づくすべてのツールを取得（デフォルトでは全て無効）
    const allAvailableTools = getDefaultToolsForCategory(category).map((tool) => ({
      ...tool,
      enabled: false // デフォルトは無効
    }))

    // エージェント固有のツール設定を適用
    const toolsWithState = allAvailableTools.map((toolState) => {
      const toolName = toolState.toolSpec?.name as ToolName
      // エージェントのツールリストに含まれている場合のみ有効化
      const isEnabled = initialAgent.tools?.includes(toolName) || false
      return { ...toolState, enabled: isEnabled }
    })

    setAgentTools(toolsWithState)

    // 既存のエージェントが持つすべてのツール設定情報を明示的にformDataに設定
    updateMultipleFields([
      ['mcpServers', initialAgent.mcpServers || []],
      ['agentCoreGateways', initialAgent.agentCoreGateways || []],
      ['knowledgeBases', initialAgent.knowledgeBases || []],
      ['allowedCommands', initialAgent.allowedCommands || []],
      ['bedrockAgents', initialAgent.bedrockAgents || []],
      ['flows', initialAgent.flows || []]
    ])
  }, [initialAgent, getDefaultToolsForCategory, updateMultipleFields])

  // MCPツール取得関数
  const fetchMcpTools = useCallback(
    async (mcpServersToUse?: McpServerConfig[]) => {
      // 引数がなければ現在のformDataから取得（サーバー参照を最新化）
      const currentServers = mcpServersToUse || formData.mcpServers

      // デバッグ - 呼び出し内容を確認
      console.log(
        'fetchMcpTools called with:',
        mcpServersToUse ? `${mcpServersToUse.length} provided servers` : 'no servers provided',
        'current formData servers:',
        formData.mcpServers?.length || 0
      )

      // MCPサーバーが設定されていない場合は明示的にツールをクリア
      if (!currentServers || currentServers.length === 0) {
        console.log('No MCP servers available in fetchMcpTools, clearing tools')
        setTempMcpTools([])
        return
      }

      setIsLoadingMcpTools(true)
      try {
        console.log(
          'Fetching MCP tools for tab switch:',
          currentServers.length,
          'servers:',
          currentServers.map((s) => s.name).join(', ')
        )
        const tools = await window.api.mcp.getToolSpecs(currentServers)

        if (tools && tools.length > 0) {
          console.log('Received MCP tools:', tools.length)
          // APIから取得したツールをToolState形式に変換
          const toolStates = tools.map((tool) => ({
            toolSpec: tool.toolSpec,
            // MCPツールは常に有効化
            enabled: true,
            toolType: 'mcp' as const
          })) as ToolState[]

          setTempMcpTools(toolStates)
        } else {
          console.log('No MCP tools found from servers')
          setTempMcpTools([])
        }
      } catch (error) {
        console.error('Failed to fetch MCP tools:', error)
        setTempMcpTools([])
      } finally {
        setIsLoadingMcpTools(false)
      }
    },
    [formData.mcpServers]
  )

  // AgentCore Gatewayツール取得関数
  const fetchAgentCoreGatewayTools = useCallback(
    async (gatewaysToUse?: any[]) => {
      // 引数がなければ現在のformDataから取得
      const currentGateways = gatewaysToUse || formData.agentCoreGateways

      // デバッグ - 呼び出し内容を確認
      console.log(
        'fetchAgentCoreGatewayTools called with:',
        gatewaysToUse ? `${gatewaysToUse.length} provided gateways` : 'no gateways provided',
        'current formData gateways:',
        formData.agentCoreGateways?.length || 0
      )

      // Gatewayが設定されていない場合は明示的にツールをクリア
      if (!currentGateways || currentGateways.length === 0) {
        console.log('No AgentCore Gateways available, clearing tools')
        setTempAgentCoreTools([])
        return
      }

      setIsLoadingAgentCoreTools(true)
      try {
        console.log('Fetching AgentCore Gateway tools from:', currentGateways.length, 'gateways')

        // 全てのGatewayからツールを取得
        const allTools: any[] = []
        for (const gateway of currentGateways) {
          try {
            const tools = await window.api.agentcore.getTools(gateway)
            if (tools && tools.length > 0) {
              allTools.push(...tools)
            }
          } catch (error) {
            console.error(`Failed to fetch tools from gateway ${gateway.endpoint}:`, error)
          }
        }

        if (allTools.length > 0) {
          console.log('Received AgentCore Gateway tools:', allTools.length)
          // APIから取得したツールをToolState形式に変換
          const toolStates = allTools.map((tool) => ({
            toolSpec: tool.toolSpec,
            // AgentCore Gatewayツールは常に有効化
            enabled: true,
            toolType: 'agentcore' as const
          })) as ToolState[]

          setTempAgentCoreTools(toolStates)
        } else {
          console.log('No AgentCore Gateway tools found')
          setTempAgentCoreTools([])
        }
      } catch (error) {
        console.error('Failed to fetch AgentCore Gateway tools:', error)
        setTempAgentCoreTools([])
      } finally {
        setIsLoadingAgentCoreTools(false)
      }
    },
    [formData.agentCoreGateways]
  )

  // ツール設定変更ハンドラー
  const handleToolsChange = useCallback(
    (tools: ToolState[]) => {
      setAgentTools(tools)

      // 有効な標準ツール名のみを抽出（MCPとAgentCore Gatewayツールは除外）
      const enabledToolNames = tools
        .filter((tool) => tool.enabled && tool.toolSpec?.name && tool.toolType === 'standard')
        .map((tool) => tool.toolSpec?.name as ToolName)
        .filter(Boolean)

      updateField('tools', enabledToolNames)
    },
    [updateField]
  )

  // カテゴリ変更ハンドラー
  const handleCategoryChange = useCallback(
    (category: AgentCategory) => {
      setAgentCategory(category)
      updateField('category', category)
    },
    [updateField]
  )

  // タブ切り替えハンドラー
  const handleTabChange = useCallback(
    async (tabId: AgentFormTabId) => {
      setActiveTab(tabId)

      // ツールタブへの切り替え時
      if (tabId === 'tools') {
        console.log(
          'Switching to tools tab, fetching MCP tools with current servers:',
          formData.mcpServers?.length || 0,
          'and AgentCore Gateways:',
          formData.agentCoreGateways?.length || 0
        )

        // MCPツールを取得
        await fetchMcpTools(formData.mcpServers)

        // AgentCore Gatewayツールを取得
        await fetchAgentCoreGatewayTools(formData.agentCoreGateways)
      }
    },
    [
      fetchMcpTools,
      fetchAgentCoreGatewayTools,
      formData.mcpServers,
      formData.agentCoreGateways,
      formData.tools,
      agentTools,
      updateField
    ]
  )

  // サーバー設定変更時にツールをクリア
  useEffect(() => {
    if (formData.mcpServers && formData.mcpServers.length === 0) {
      console.log('MCP servers empty, clearing tempMcpTools')
      setTempMcpTools([])
    }
  }, [formData.mcpServers])

  // 最後にMCPツールを取得した時刻を記録するRef
  const lastMcpToolsFetchRef = useRef<number>(0)

  // アクティブタブが変わった時にツール情報を更新
  useEffect(() => {
    // 基本設定・ツールタブに切り替わったときのみ実行
    if (
      (activeTab === 'tools' || activeTab == 'basic') &&
      formData.mcpServers &&
      formData.mcpServers.length > 0
    ) {
      // 前回のフェッチから一定時間以上経過した場合のみ再取得
      const now = Date.now()
      const timeSinceLastFetch = now - lastMcpToolsFetchRef.current

      // 500ms以上経過していれば再取得（デバウンス効果）
      if (timeSinceLastFetch > 500) {
        console.log('Active tab changed to tools, refreshing MCP tools...')
        // タイマーを使用して状態更新の競合を避ける
        setTimeout(() => {
          fetchMcpTools(formData.mcpServers)
          lastMcpToolsFetchRef.current = now
        }, 0)
      } else {
        console.log('MCP tools fetched recently, skipping redundant fetch')
      }
    }
  }, [activeTab, formData.mcpServers, fetchMcpTools])

  // 初期化処理
  useEffect(() => {
    initializeAgent()
  }, [initializeAgent])

  // フォーム送信ハンドラー
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      console.log('Form submitted with data:', formData)
      console.log(
        'ツール情報:',
        formData.tools ? `${formData.tools.length}件` : '未設定',
        formData.tools
      )

      // 保存前に空のシナリオを除外
      const filteredScenarios = formData.scenarios.filter(
        (scenario) => scenario.title.trim() !== '' || scenario.content.trim() !== ''
      )

      if (formData.tools && formData.tools.length === 0) {
        // ここで対処: ツールが設定されていない場合はデフォルトツール設定を適用
        const defaultTools = getDefaultToolsForCategory('all')
        const defaultToolNames = defaultTools
          .filter((tool) => tool.enabled)
          .map((tool) => tool.toolSpec?.name as ToolName)
          .filter(Boolean)

        // formDataを更新
        const updatedFormData = {
          ...formData,
          tools: defaultToolNames,
          scenarios: filteredScenarios
        }

        if (onSave) {
          onSave(updatedFormData)
        }
      } else if (onSave) {
        onSave({
          ...formData,
          scenarios: filteredScenarios
        })
      } else {
        console.warn('onSave callback is not provided')
      }
    },
    [formData, onSave, getDefaultToolsForCategory]
  )

  return {
    // 状態
    formData,
    activeTab,
    agentTools,
    agentCategory,
    isLoadingMcpTools,
    tempMcpTools,
    isLoadingAgentCoreTools,
    tempAgentCoreTools,

    // プロンプト生成関連
    generateSystemPrompt,
    generateVoiceChatPrompt,
    generateScenarios,
    isGeneratingSystem,
    isGeneratingVoiceChat,
    isGeneratingScenarios,

    // 状態更新関数
    updateField,
    updateMultipleFields,
    setAgentTools,
    setActiveTab,

    // ハンドラー
    handleSubmit,
    handleToolsChange,
    handleCategoryChange,
    handleTabChange,
    fetchMcpTools,
    fetchAgentCoreGatewayTools
  }
}
