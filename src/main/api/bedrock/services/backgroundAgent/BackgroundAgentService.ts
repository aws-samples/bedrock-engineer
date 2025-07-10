import { ContentBlock, ConversationRole } from '@aws-sdk/client-bedrock-runtime'
import { BedrockService } from '../../index'
import { ServiceContext } from '../../types'
import { createCategoryLogger } from '../../../../../common/logger'
import {
  BackgroundAgentConfig,
  BackgroundMessage,
  BackgroundChatResult,
  BackgroundAgentOptions
} from './types'
import { BackgroundChatSessionManager } from './BackgroundChatSessionManager'
import { v4 as uuidv4 } from 'uuid'
import { ToolInput, ToolName, ToolResult } from '../../../../../types/tools'
import { agentHandlers } from '../../../../handlers/agent-handlers'
import {
  CustomAgent,
  ToolState,
  EnvironmentContextSettings,
  CommandConfig,
  WindowConfig,
  CameraConfig,
  KnowledgeBase,
  FlowConfig
} from '../../../../../types/agent-chat'
import { BedrockAgent } from '../../../../../types/agent'
import { BrowserWindow, ipcMain } from 'electron'
import { pubSubManager } from '../../../../lib/pubsub-manager'

const logger = createCategoryLogger('background-agent')

export class BackgroundAgentService {
  private bedrockService: BedrockService
  private sessionManager: BackgroundChatSessionManager
  private context: ServiceContext
  private executionHistoryUpdateCallback?: (
    taskId: string,
    sessionId: string,
    messageCount: number
  ) => void

  constructor(context: ServiceContext) {
    this.context = context
    this.bedrockService = new BedrockService(context)
    this.sessionManager = new BackgroundChatSessionManager()

    logger.info('BackgroundAgentService initialized (using persistent sessions)')
  }

  /**
   * 実行履歴更新のコールバックを設定
   */
  setExecutionHistoryUpdateCallback(
    callback: (taskId: string, sessionId: string, messageCount: number) => void
  ): void {
    this.executionHistoryUpdateCallback = callback
  }

  /**
   * エージェントIDからエージェント設定を取得
   * フロントエンドのSettingsContextと同じロジックでcustomAgentsとsharedAgentsを統合
   */
  private async getAgentById(agentId: string): Promise<CustomAgent | null> {
    try {
      // 1. sharedAgentsを取得
      const sharedResult = await agentHandlers['read-shared-agents'](null as any)
      const sharedAgents = sharedResult.agents || []

      // 2. customAgentsを取得（storeから）
      const customAgents = this.context.store.get('customAgents') || []

      // 3. 統合して検索（フロントエンドと同じロジック）
      const allAgents = [...customAgents, ...sharedAgents]
      const agent = allAgents.find((a) => a.id === agentId)

      logger.debug('Agent search completed', {
        agentId,
        customAgentsCount: customAgents.length,
        sharedAgentsCount: sharedAgents.length,
        totalAgentsCount: allAgents.length,
        found: !!agent,
        availableIds: allAgents.map((a) => a.id)
      })

      return agent || null
    } catch (error: any) {
      logger.error('Failed to get agent by ID', {
        agentId,
        error: error.message,
        stack: error.stack
      })
      return null
    }
  }

  /**
   * IPC経由でpreloadツール仕様を取得
   */
  private async getPreloadToolSpecs(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timeoutMs = 10000 // 10秒タイムアウト
      const requestId = uuidv4()

      const timeout = setTimeout(() => {
        ipcMain.removeAllListeners(`tool-specs-response-${requestId}`)
        reject(new Error('Tool specs request timeout'))
      }, timeoutMs)

      const responseHandler = (_event: any, specs: any[]) => {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-specs-response-${requestId}`, responseHandler)
        resolve(specs)
      }

      ipcMain.once(`tool-specs-response-${requestId}`, responseHandler)

      // 既存のBrowserWindowを取得
      const allWindows = BrowserWindow.getAllWindows()
      const mainWindow = allWindows.find((window) => !window.isDestroyed())

      if (!mainWindow || !mainWindow.webContents) {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-specs-response-${requestId}`, responseHandler)
        resolve([])
        return
      }

      try {
        mainWindow.webContents.send('get-tool-specs-request', { requestId })
      } catch (sendError: any) {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-specs-response-${requestId}`, responseHandler)
        reject(sendError)
      }
    })
  }

  /**
   * エージェント固有のツール設定からToolStateを生成
   * IPC経由でpreloadツール仕様を取得
   */
  private async generateToolSpecs(toolNames: ToolName[]): Promise<ToolState[]> {
    try {
      const toolStates: ToolState[] = []

      // IPC経由でpreloadツール仕様を取得
      const allToolSpecs = await this.getPreloadToolSpecs()

      for (const toolName of toolNames) {
        // preloadツールから対応するツール仕様を検索
        const toolSpec = allToolSpecs.find((spec) => spec.toolSpec?.name === toolName)

        if (toolSpec && toolSpec.toolSpec) {
          const toolState: ToolState = {
            enabled: true,
            toolSpec: toolSpec.toolSpec
          }
          toolStates.push(toolState)
          logger.debug('Found preload tool spec', { toolName })
        } else {
          // 仕様が見つからない場合は基本的な仕様を生成
          logger.warn('Preload tool spec not found, generating basic spec', {
            toolName
          })
          const basicToolState: ToolState = {
            enabled: true,
            toolSpec: {
              name: toolName,
              description: `${toolName} tool`,
              inputSchema: {
                json: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }
            }
          }
          toolStates.push(basicToolState)
        }
      }

      logger.info('Generated tool specs from preload tools', {
        requestedCount: toolNames.length,
        generatedCount: toolStates.length,
        tools: toolStates.map((ts) => ts.toolSpec?.name).filter(Boolean)
      })

      return toolStates
    } catch (error: any) {
      logger.error('Failed to generate tool specs', {
        toolNames,
        error: error.message,
        stack: error.stack
      })
      return []
    }
  }

  /**
   * プレースホルダーを置換する
   */
  private replacePlaceholders(
    text: string,
    placeholders: {
      projectPath: string
      allowedCommands?: CommandConfig[]
      allowedWindows?: WindowConfig[]
      allowedCameras?: CameraConfig[]
      knowledgeBases?: KnowledgeBase[]
      bedrockAgents?: BedrockAgent[]
      flows?: FlowConfig[]
    }
  ): string {
    const {
      projectPath,
      allowedCommands = [],
      allowedWindows = [],
      allowedCameras = [],
      knowledgeBases = [],
      bedrockAgents = [],
      flows = []
    } = placeholders

    const yyyyMMdd = new Date().toISOString().slice(0, 10)

    return text
      .replace(/{{projectPath}}/g, projectPath)
      .replace(/{{date}}/g, yyyyMMdd)
      .replace(/{{allowedCommands}}/g, JSON.stringify(allowedCommands))
      .replace(/{{allowedWindows}}/g, JSON.stringify(allowedWindows))
      .replace(/{{allowedCameras}}/g, JSON.stringify(allowedCameras))
      .replace(/{{knowledgeBases}}/g, JSON.stringify(knowledgeBases))
      .replace(/{{bedrockAgents}}/g, JSON.stringify(bedrockAgents))
      .replace(/{{flows}}/g, JSON.stringify(flows))
  }

  /**
   * 環境コンテキストを生成する
   */
  private getEnvironmentContext(
    enabledTools: ToolState[],
    contextSettings?: EnvironmentContextSettings
  ): string {
    // デフォルト設定（すべて有効）
    const defaultSettings: EnvironmentContextSettings = {
      todoListInstruction: true,
      projectRule: true,
      visualExpressionRules: true
    }

    // 設定が指定されていない場合はデフォルト設定を使用
    const settings = contextSettings || defaultSettings

    // 基本環境コンテキスト
    let context = `**<context>**

- working directory: {{projectPath}}
- date: {{date}}

**</context>**
`

    // プロジェクトルール
    if (settings.projectRule) {
      context += `
**<project rule>**

- If there are files under {{projectPath}}/.bedrock-engineer/rules, make sure to load them before working on them.
  This folder contains project-specific rules.

**</project rule>**
`
    }

    // 視覚的表現ルール
    if (settings.visualExpressionRules) {
      context += `
**<visual expression rule>**

If you are acting as a voice chat, please ignore this illustration rule.

- Create Mermaid.js diagrams for visual explanations (maximum 2 per response unless specified)
- If a complex diagram is required  please express it in draw.io xml format.
- Ask user permission before generating images with Stable Diffusion
- Display images using Markdown syntax: \`![image-name](url)\`
  - (example) \`![img]({{projectPath}}/generated_image.png)\`
  - (example) \`![img]({{projectPath}}/workspaces/workspace-20250529-session_1748509562336_4xe58p/generated_image.png)\`
  - Do not start with file://. Start with /.
- Use KaTeX format for mathematical formulas
- For web applications, source images from Pexels or user-specified sources

**</visual expression rule>**`
    }

    // TODOリスト指示
    if (settings.todoListInstruction) {
      context += `
**<todo list handling rule>**

If you expect the work will take a long time, create the following file to create a work plan and TODO list, and refer to and update it as you work. Be sure to write in detail so that you can start the same work again if the AI agent's session is interrupted.

{{projectPath}}/.bedrock-engineer/{{TASK_NAME}}_TODO.md

**</todo list handling rule>**`
    }

    // ツールルール
    context += this.generateToolRules(enabledTools)

    return context
  }

  /**
   * ツールルールを生成する
   */
  private generateToolRules(enabledTools: ToolState[]): string {
    if (
      !enabledTools ||
      enabledTools.length === 0 ||
      enabledTools.filter((tool) => tool.enabled).length === 0
    ) {
      return `
**<tool usage rules>**
No tools are currently enabled for this agent.
**</tool usage rules>**`
    }

    const activeTools = enabledTools.filter((tool) => tool.enabled)

    let rulesContent = '\n**<tool usage rules>**\n'
    rulesContent += 'Available tools and their usage:\n\n'

    // 各ツールの説明を追加
    activeTools.forEach((tool) => {
      const toolName = tool.toolSpec?.name || 'unknown'
      const description = tool.toolSpec?.description || 'Tool with specific functionality.'
      rulesContent += `**${toolName}**\n${description}\n\n`
    })

    rulesContent += 'General guidelines:\n'
    rulesContent += '- Use tools one at a time and wait for results\n'
    rulesContent += '- Always use absolute paths starting from {{projectPath}}\n'
    rulesContent += '- Request permission for destructive operations\n'
    rulesContent += '- Handle errors gracefully with clear explanations\n\n'

    rulesContent += '**</tool usage rules>**'

    return rulesContent
  }

  /**
   * エージェントのシステムプロンプトを構築する
   */
  private buildSystemPrompt(
    agent: CustomAgent,
    toolStates: ToolState[],
    projectDirectory?: string
  ): string {
    if (!agent.system) return ''

    // 環境コンテキストを生成
    const environmentContext = this.getEnvironmentContext(
      toolStates,
      agent.environmentContextSettings
    )

    // システムプロンプトと環境コンテキストを結合
    const fullPrompt = agent.system + '\n\n' + environmentContext

    // プロジェクトディレクトリが指定されている場合はそれを使用、なければstoreから取得
    const workingDirectory = projectDirectory || this.context.store.get('projectPath') || ''

    // プレースホルダーを置換
    return this.replacePlaceholders(fullPrompt, {
      projectPath: workingDirectory,
      allowedCommands: agent.allowedCommands || [],
      allowedWindows: agent.allowedWindows || [],
      allowedCameras: agent.allowedCameras || [],
      knowledgeBases: agent.knowledgeBases || [],
      bedrockAgents: agent.bedrockAgents || [],
      flows: agent.flows || []
    })
  }

  /**
   * セッション付きエージェント会話を実行
   */
  async chat(
    sessionId: string,
    config: BackgroundAgentConfig,
    userMessage: string,
    options: BackgroundAgentOptions = {}
  ): Promise<BackgroundChatResult> {
    // エージェント設定を取得
    const agent = await this.getAgentById(config.agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${config.agentId}`)
    }

    // エージェント固有のツール設定を生成
    const toolStates = await this.generateToolSpecs(agent.tools || [])

    // セッション履歴を取得
    const conversationHistory = this.sessionManager.getHistory(sessionId)

    // セッションが存在しない場合は作成（プロジェクトディレクトリ情報を含む）
    if (!this.sessionManager.hasSession(sessionId)) {
      this.sessionManager.createSession(sessionId, {
        projectDirectory: config.projectDirectory,
        agentId: config.agentId,
        modelId: config.modelId
      })
    }

    logger.info('Starting background agent chat', {
      modelId: config.modelId,
      agentId: config.agentId,
      agentName: agent.name,
      hasSystemPrompt: !!config.systemPrompt,
      agentsSystemPrompt: agent.system,
      toolCount: toolStates.length,
      historyLength: conversationHistory.length,
      projectDirectory: config.projectDirectory
    })

    const threeHourMs = 10800000
    const { enableToolExecution = true, maxToolExecutions = 500, timeoutMs = threeHourMs } = options

    try {
      // メッセージ履歴をAWS Bedrock形式に変換

      // ユーザーメッセージを追加
      const messages = this.buildMessages(conversationHistory, userMessage)

      // ユーザーメッセージをセッションに保存
      try {
        const userMessageObj = messages[messages.length - 1]
        await this.sessionManager.addMessage(sessionId, userMessageObj)

        // リアルタイム通知を送信
        this.publishSessionUpdate(sessionId, userMessageObj)

        // 実行履歴を更新（コールバックがあれば）
        if (this.executionHistoryUpdateCallback) {
          const sessionHistory = this.sessionManager.getHistory(sessionId)
          const sessionMetadata = this.sessionManager.getSessionMetadata(sessionId)
          if (sessionMetadata?.taskId) {
            this.executionHistoryUpdateCallback(
              sessionMetadata.taskId,
              sessionId,
              sessionHistory.length
            )
          }
        }
      } catch (error: any) {
        logger.error('Failed to save user message to session', {
          sessionId,
          error: error.message
        })
        // ユーザーメッセージの保存に失敗した場合もエラーを投げる
        throw new Error(`Failed to save user message: ${error.message}`)
      }

      // エージェントのシステムプロンプトを構築（環境コンテキスト＋プレースホルダー置換）
      const systemPrompt = this.buildSystemPrompt(agent, toolStates, config.projectDirectory)
      const system = systemPrompt ? [{ text: systemPrompt }] : []

      logger.debug('System prompt built', {
        hasOriginalSystemPrompt: !!agent.system,
        hasProcessedSystemPrompt: !!systemPrompt,
        systemPromptLength: systemPrompt.length
      })

      // ツール設定の準備
      const toolConfig =
        toolStates.length > 0 ? { tools: toolStates.filter((tool) => tool.enabled) } : undefined

      logger.debug('Calling Bedrock converse API', {
        messageCount: messages.length,
        hasSystem: system.length > 0,
        hasTools: !!toolConfig,
        toolCount: toolConfig?.tools?.length || 0
      })

      // タイムアウト設定
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Chat timeout')), timeoutMs)
      })

      // Bedrock Converse APIを呼び出し（タスク固有のinferenceConfigがあれば使用）
      const conversePromise = this.bedrockService.converse({
        modelId: config.modelId,
        messages,
        system,
        toolConfig,
        inferenceConfig: config.inferenceConfig
      })

      const response = await Promise.race([conversePromise, timeoutPromise])

      logger.debug('Received response from Bedrock', {
        hasOutput: !!response.output,
        usage: response.usage,
        stopReason: response.stopReason
      })

      // レスポンスメッセージを作成
      const responseMessage: BackgroundMessage = {
        id: uuidv4(),
        role: 'assistant' as ConversationRole,
        content: response.output?.message?.content || [],
        timestamp: Date.now()
      }

      let result: BackgroundChatResult = {
        response: responseMessage
      }

      // ツール使用が必要な場合の処理
      if (response.stopReason === 'tool_use' && enableToolExecution) {
        logger.info('Tool execution required, processing tools')
        // 初回の応答メッセージ（ツール使用を含む）をセッションに保存
        await this.sessionManager.addMessage(sessionId, responseMessage)

        result = await this.executeToolsRecursively(
          sessionId,
          config,
          [...messages, responseMessage],
          maxToolExecutions,
          toolStates
        )
      } else {
        // ツール使用がない場合は通常通り保存
        try {
          await this.sessionManager.addMessage(sessionId, result.response)

          // リアルタイム通知を送信
          this.publishSessionUpdate(sessionId, result.response)

          // 実行履歴を更新（コールバックがあれば）
          if (this.executionHistoryUpdateCallback) {
            const sessionHistory = this.sessionManager.getHistory(sessionId)
            const sessionMetadata = this.sessionManager.getSessionMetadata(sessionId)
            if (sessionMetadata?.taskId) {
              this.executionHistoryUpdateCallback(
                sessionMetadata.taskId,
                sessionId,
                sessionHistory.length
              )
            }
          }
        } catch (error: any) {
          logger.error('Failed to save assistant response to session', {
            sessionId,
            messageId: result.response.id,
            error: error.message
          })
          // アシスタントレスポンスの保存に失敗した場合もエラーを投げる
          throw new Error(`Failed to save assistant response: ${error.message}`)
        }
      }

      logger.info('Background agent chat completed successfully', {
        sessionId,
        finalResponseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0
      })

      return result
    } catch (error: any) {
      logger.error('Error in background agent chat', {
        error: error.message,
        stack: error.stack,
        modelId: config.modelId
      })
      throw error
    }
  }

  /**
   * ツールを再帰的に実行
   */
  private async executeToolsRecursively(
    sessionId: string,
    config: BackgroundAgentConfig,
    messages: BackgroundMessage[],
    maxExecutions: number,
    toolStates: ToolState[]
  ): Promise<BackgroundChatResult> {
    const toolExecutions: BackgroundChatResult['toolExecutions'] = []
    const currentMessages = [...messages]
    let executionCount = 0

    while (executionCount < maxExecutions) {
      const lastMessage = currentMessages[currentMessages.length - 1]

      if (!lastMessage || lastMessage.role !== 'assistant') {
        break
      }

      // ツール使用を探す
      const toolUseBlocks = lastMessage.content.filter((block) => 'toolUse' in block)

      if (toolUseBlocks.length === 0) {
        break
      }

      logger.debug(
        `Executing ${toolUseBlocks.length} tools (execution ${executionCount + 1}/${maxExecutions})`
      )

      // ツール結果を準備
      const toolResults: ContentBlock[] = []

      for (const block of toolUseBlocks) {
        if ('toolUse' in block && block.toolUse) {
          const toolExecution = await this.executeTool(block.toolUse)
          toolExecutions?.push(toolExecution)

          // ツール結果をメッセージに追加
          toolResults.push({
            toolResult: {
              toolUseId: block.toolUse.toolUseId,
              content: toolExecution.success
                ? [{ text: JSON.stringify(toolExecution.output) }]
                : [{ text: toolExecution.error || 'Tool execution failed' }],
              status: toolExecution.success ? 'success' : 'error'
            }
          })
        }
      }

      // ツール結果メッセージを追加
      const toolResultMessage: BackgroundMessage = {
        id: uuidv4(),
        role: 'user' as ConversationRole,
        content: toolResults,
        timestamp: Date.now()
      }

      currentMessages.push(toolResultMessage)
      // ツール実行結果もセッションに保存する（BackgroundAgentでは履歴が重要）
      try {
        await this.sessionManager.addMessage(sessionId, toolResultMessage)

        // リアルタイム通知を送信
        this.publishSessionUpdate(sessionId, toolResultMessage)
      } catch (error: any) {
        logger.error('Failed to save tool result message to session', {
          sessionId,
          messageId: toolResultMessage.id,
          error: error.message
        })
        // ツール結果メッセージの保存に失敗してもエラーを投げない（処理継続）
        // ただしログは出力して問題を把握できるようにする
      }

      // 次のAI応答を取得（タスク固有のinferenceConfigがあれば使用）
      const nextResponse = await this.bedrockService.converse({
        modelId: config.modelId,
        messages: currentMessages,
        system: config.systemPrompt ? [{ text: config.systemPrompt }] : [],
        toolConfig:
          toolStates.length > 0 ? { tools: toolStates.filter((tool) => tool.enabled) } : undefined,
        inferenceConfig: config.inferenceConfig
      })

      const nextResponseMessage: BackgroundMessage = {
        id: uuidv4(),
        role: 'assistant' as ConversationRole,
        content: nextResponse.output?.message?.content || [],
        timestamp: Date.now()
      }

      currentMessages.push(nextResponseMessage)
      // 中間のassistantメッセージもセッションに保存
      await this.sessionManager.addMessage(sessionId, nextResponseMessage)

      // リアルタイム通知を送信
      this.publishSessionUpdate(sessionId, nextResponseMessage)
      executionCount++

      // ツール使用が不要になった場合は終了
      if (nextResponse.stopReason !== 'tool_use') {
        return {
          response: nextResponseMessage,
          toolExecutions
        }
      }
    }

    logger.warn('Maximum tool executions reached', { maxExecutions })

    return {
      response: currentMessages[currentMessages.length - 1],
      toolExecutions
    }
  }

  /**
   * IPC経由でpreloadツールを実行
   */
  private async executePreloadToolViaIPC(toolInput: ToolInput): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4()
      const timeoutMs = 30000 // 30秒タイムアウト

      // タイムアウト設定
      const timeout = setTimeout(() => {
        ipcMain.removeAllListeners(`preload-tool-response`)
        reject(new Error('Preload tool execution timeout'))
      }, timeoutMs)

      // レスポンスリスナーを設定
      const responseHandler = (_event: any, data: { requestId: string; result: ToolResult }) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout)
          ipcMain.removeListener('preload-tool-response', responseHandler)
          resolve(data.result)
        }
      }

      ipcMain.on('preload-tool-response', responseHandler)

      // 既存のBrowserWindowを取得
      const allWindows = BrowserWindow.getAllWindows()
      const mainWindow = allWindows.find((window) => !window.isDestroyed())

      if (!mainWindow || !mainWindow.webContents) {
        clearTimeout(timeout)
        ipcMain.removeListener('preload-tool-response', responseHandler)

        const noWindowResult: ToolResult = {
          name: toolInput.type as any,
          success: false,
          result: null,
          error: 'No active window available for preload tool execution',
          message: 'No active window for preload tools'
        }

        resolve(noWindowResult)
        return
      }

      // リクエストを送信
      try {
        mainWindow.webContents.send('preload-tool-request', {
          requestId,
          toolInput
        })

        logger.debug('Sent preload tool request via IPC', {
          requestId,
          toolType: toolInput.type
        })
      } catch (sendError: any) {
        clearTimeout(timeout)
        ipcMain.removeListener('preload-tool-response', responseHandler)

        const sendErrorResult: ToolResult = {
          name: toolInput.type as any,
          success: false,
          result: null,
          error: sendError.message || 'Failed to send preload tool request',
          message: 'Failed to send preload tool request'
        }

        resolve(sendErrorResult)
      }
    })
  }

  /**
   * 単一ツールの実行
   * preloadツールのみを使用（IPC経由）
   */
  private async executeTool(
    toolUse: any
  ): Promise<NonNullable<BackgroundChatResult['toolExecutions']>[0]> {
    try {
      logger.debug('Executing tool via preload tool system', {
        toolName: toolUse.name,
        toolUseId: toolUse.toolUseId,
        input: toolUse.input
      })

      const toolInput: ToolInput = {
        type: toolUse.name,
        ...toolUse.input
      } as ToolInput

      // IPC経由でpreloadツールを実行
      const toolResult = await this.executePreloadToolViaIPC(toolInput)

      if (toolResult.success) {
        logger.debug('Tool execution completed via preload tools', {
          toolName: toolUse.name,
          success: true
        })

        return {
          toolName: toolUse.name,
          input: toolUse.input,
          output: toolResult.result,
          success: true,
          error: undefined
        }
      } else {
        logger.warn('Tool execution failed via preload tools', {
          toolName: toolUse.name,
          error: toolResult.error
        })

        return {
          toolName: toolUse.name,
          input: toolUse.input,
          output: null,
          success: false,
          error: toolResult.error || 'Tool execution failed'
        }
      }
    } catch (error: any) {
      logger.error('Tool execution failed', {
        toolName: toolUse.name,
        error: error.message,
        stack: error.stack
      })

      return {
        toolName: toolUse.name,
        input: toolUse.input,
        output: null,
        success: false,
        error: error.message || 'Tool execution failed'
      }
    }
  }

  /**
   * セッション作成
   */
  createSession(
    sessionId: string,
    options?: {
      taskId?: string
      projectDirectory?: string
      agentId?: string
      modelId?: string
    }
  ): void {
    this.sessionManager.createSession(sessionId, {
      taskId: options?.taskId,
      agentId: options?.agentId,
      modelId: options?.modelId,
      projectDirectory: options?.projectDirectory
    })
  }

  /**
   * セッション削除
   */
  deleteSession(sessionId: string): boolean {
    return this.sessionManager.deleteSession(sessionId)
  }

  /**
   * セッション一覧取得
   */
  listSessions(): string[] {
    return this.sessionManager.listSessions()
  }

  /**
   * セッション統計情報取得
   */
  getSessionStats(sessionId: string) {
    return this.sessionManager.getSessionStats(sessionId)
  }

  /**
   * 全セッション統計情報取得
   */
  getAllSessionStats() {
    return this.sessionManager.getAllSessionStats()
  }

  /**
   * セッション履歴取得
   */
  getSessionHistory(sessionId: string): BackgroundMessage[] {
    return this.sessionManager.getHistory(sessionId)
  }

  /**
   * 全セッションメタデータを取得
   */
  getAllSessionsMetadata() {
    return this.sessionManager.getAllSessionsMetadata()
  }

  /**
   * プロジェクトディレクトリでセッションをフィルタ
   */
  getSessionsByProjectDirectory(projectDirectory: string) {
    return this.sessionManager.getSessionsByProjectDirectory(projectDirectory)
  }

  /**
   * エージェントIDでセッションをフィルタ
   */
  getSessionsByAgentId(agentId: string) {
    return this.sessionManager.getSessionsByAgentId(agentId)
  }

  /**
   * セッションメタデータを取得
   */
  getSessionMetadata(sessionId: string) {
    return this.sessionManager.getSessionMetadata(sessionId)
  }

  /**
   * タスクのシステムプロンプトを取得（プレースホルダー置換済み）
   */
  async getTaskSystemPrompt(taskId: string): Promise<string> {
    try {
      // BackgroundAgentSchedulerから対象タスクを取得
      const { BackgroundAgentScheduler } = await import('./BackgroundAgentScheduler')
      const scheduler = new BackgroundAgentScheduler(this.context)
      const task = scheduler.getTask(taskId)

      if (!task) {
        throw new Error(`Task not found: ${taskId}`)
      }

      // エージェント設定を取得
      const agent = await this.getAgentById(task.agentId)
      if (!agent) {
        throw new Error(`Agent not found: ${task.agentId}`)
      }

      // エージェント固有のツール設定を生成
      const toolStates = await this.generateToolSpecs(agent.tools || [])

      // システムプロンプトを構築（プレースホルダー置換済み）
      const systemPrompt = this.buildSystemPrompt(agent, toolStates, task.projectDirectory)

      logger.debug('Task system prompt generated', {
        taskId,
        agentId: task.agentId,
        agentName: agent.name,
        systemPromptLength: systemPrompt.length,
        toolCount: toolStates.length
      })

      return systemPrompt
    } catch (error: any) {
      logger.error('Failed to get task system prompt', {
        taskId,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * セッション更新をPub-Sub経由で通知
   */
  private publishSessionUpdate(sessionId: string, message: BackgroundMessage): void {
    try {
      const channel = `session-update:${sessionId}`
      const updateData = {
        type: 'message-added',
        sessionId,
        message,
        timestamp: Date.now()
      }

      pubSubManager.publish(channel, updateData)

      logger.debug('Published session update', {
        channel,
        messageId: message.id,
        messageRole: message.role,
        subscriberCount:
          pubSubManager.getStats().channels.find((c) => c.channel === channel)?.subscriberCount || 0
      })
    } catch (error) {
      logger.warn('Failed to publish session update', {
        sessionId,
        messageId: message.id,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * 環境固有情報の付与（Background Agent では定常的にエージェントが実行されるため、日時だけでなく実行時間を与えるニーズが多いため）
   */
  private buildContext(): string {
    const context = `<context>
Date: ${new Date()}
<context>
`
    return context
  }

  /**
   * メッセージ履歴を構築
   */
  private buildMessages(history: BackgroundMessage[], userMessage: string): BackgroundMessage[] {
    const messages = [...history]

    // ユーザーメッセージを追加
    messages.push({
      id: uuidv4(),
      role: 'user' as ConversationRole,
      content: [{ text: userMessage + '\n' + this.buildContext() }],
      timestamp: Date.now()
    })

    return messages
  }
}
