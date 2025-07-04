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
import { BackgroundAgentSessionManager } from './BackgroundAgentSessionManager'
import { v4 as uuidv4 } from 'uuid'
import { ToolInput, ToolName, ToolResult } from '../../../../../types/tools'
import { agentHandlers } from '../../../../handlers/agent-handlers'
import { CustomAgent, ToolState } from '../../../../../types/agent-chat'
import { BrowserWindow, ipcMain } from 'electron'

const backgroundAgentLogger = createCategoryLogger('background-agent')

export class BackgroundAgentService {
  private bedrockService: BedrockService
  private sessionManager: BackgroundAgentSessionManager
  private context: ServiceContext

  constructor(context: ServiceContext) {
    this.context = context
    this.bedrockService = new BedrockService(context)
    this.sessionManager = new BackgroundAgentSessionManager()

    backgroundAgentLogger.info('BackgroundAgentService initialized (using preload tools only)')
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

      backgroundAgentLogger.debug('Agent search completed', {
        agentId,
        customAgentsCount: customAgents.length,
        sharedAgentsCount: sharedAgents.length,
        totalAgentsCount: allAgents.length,
        found: !!agent,
        availableIds: allAgents.map((a) => a.id)
      })

      return agent || null
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get agent by ID', {
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
          backgroundAgentLogger.debug('Found preload tool spec', { toolName })
        } else {
          // 仕様が見つからない場合は基本的な仕様を生成
          backgroundAgentLogger.warn('Preload tool spec not found, generating basic spec', {
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

      backgroundAgentLogger.info('Generated tool specs from preload tools', {
        requestedCount: toolNames.length,
        generatedCount: toolStates.length,
        tools: toolStates.map((ts) => ts.toolSpec?.name).filter(Boolean)
      })

      return toolStates
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to generate tool specs', {
        toolNames,
        error: error.message,
        stack: error.stack
      })
      return []
    }
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
    backgroundAgentLogger.info('Starting background agent chat', {
      modelId: config.modelId,
      agentId: config.agentId,
      agentName: agent.name,
      hasSystemPrompt: !!config.systemPrompt,
      agentsSystemPrompt: agent.system,
      toolCount: toolStates.length,
      historyLength: conversationHistory.length
    })

    const { enableToolExecution = true, maxToolExecutions = 5, timeoutMs = 3000000 } = options

    try {
      // メッセージ履歴をAWS Bedrock形式に変換
      const messages = this.buildMessages(conversationHistory, userMessage)

      // ユーザーメッセージをセッションに保存
      const userMessageObj = messages[messages.length - 1]
      this.sessionManager.addMessage(sessionId, userMessageObj)

      // システムプロンプトの準備
      const system = config.systemPrompt ? [{ text: config.systemPrompt }] : []

      // ツール設定の準備
      const toolConfig =
        toolStates.length > 0 ? { tools: toolStates.filter((tool) => tool.enabled) } : undefined

      backgroundAgentLogger.debug('Calling Bedrock converse API', {
        messageCount: messages.length,
        hasSystem: system.length > 0,
        hasTools: !!toolConfig,
        toolCount: toolConfig?.tools?.length || 0
      })

      // タイムアウト設定
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Chat timeout')), timeoutMs)
      })

      // Bedrock Converse APIを呼び出し
      const conversePromise = this.bedrockService.converse({
        modelId: config.modelId,
        messages,
        system,
        toolConfig
      })

      const response = await Promise.race([conversePromise, timeoutPromise])

      backgroundAgentLogger.debug('Received response from Bedrock', {
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
        backgroundAgentLogger.info('Tool execution required, processing tools')
        result = await this.executeToolsRecursively(
          config,
          [...messages, responseMessage],
          maxToolExecutions,
          toolStates
        )
      }

      // AIの応答をセッションに保存
      this.sessionManager.addMessage(sessionId, result.response)

      backgroundAgentLogger.info('Background agent chat completed successfully', {
        sessionId,
        finalResponseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0
      })

      return result
    } catch (error: any) {
      backgroundAgentLogger.error('Error in background agent chat', {
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

      backgroundAgentLogger.debug(
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
      // ツール実行中はセッションに保存しない（useAgentChatと同じパターン）

      // 次のAI応答を取得
      const nextResponse = await this.bedrockService.converse({
        modelId: config.modelId,
        messages: currentMessages,
        system: config.systemPrompt ? [{ text: config.systemPrompt }] : [],
        toolConfig:
          toolStates.length > 0 ? { tools: toolStates.filter((tool) => tool.enabled) } : undefined
      })

      const nextResponseMessage: BackgroundMessage = {
        id: uuidv4(),
        role: 'assistant' as ConversationRole,
        content: nextResponse.output?.message?.content || [],
        timestamp: Date.now()
      }

      currentMessages.push(nextResponseMessage)
      executionCount++

      // ツール使用が不要になった場合は終了
      if (nextResponse.stopReason !== 'tool_use') {
        return {
          response: nextResponseMessage,
          toolExecutions
        }
      }
    }

    backgroundAgentLogger.warn('Maximum tool executions reached', { maxExecutions })

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

        backgroundAgentLogger.debug('Sent preload tool request via IPC', {
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
      backgroundAgentLogger.debug('Executing tool via preload tool system', {
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
        backgroundAgentLogger.debug('Tool execution completed via preload tools', {
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
        backgroundAgentLogger.warn('Tool execution failed via preload tools', {
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
      backgroundAgentLogger.error('Tool execution failed', {
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
  createSession(sessionId: string): void {
    this.sessionManager.createSession(sessionId)
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
   * メッセージ履歴を構築
   */
  private buildMessages(history: BackgroundMessage[], userMessage: string): BackgroundMessage[] {
    const messages = [...history]

    // ユーザーメッセージを追加
    messages.push({
      id: uuidv4(),
      role: 'user' as ConversationRole,
      content: [{ text: userMessage }],
      timestamp: Date.now()
    })

    return messages
  }
}
