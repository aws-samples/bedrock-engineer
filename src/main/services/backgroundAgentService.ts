import { CustomAgent, ToolState } from '../../types/agent-chat'
import {
  BackgroundAgentConfig,
  BackgroundAgentStatus,
  LogEntry
} from '../../types/background-agent'
import { ChatSessionManager } from '../store/chatSession'
import { BedrockService } from '../api/bedrock'
import { IdentifiableMessage } from '../../types/chat/message'
import {
  ContentBlock,
  ConversationRole,
  Message,
  StopReason
} from '@aws-sdk/client-bedrock-runtime'
import { generateMessageId } from '../../types/chat/metadata'
import { createCategoryLogger } from '../../common/logger'
import { CallConverseAPIProps } from '../api/bedrock/types'

export class BackgroundAgentService {
  private readonly logger = createCategoryLogger('background-agent-service')
  private isRunning = false
  private abortController: AbortController | null = null
  private status: BackgroundAgentStatus
  private logs: LogEntry[] = []
  private readonly maxLogs = 1000

  constructor(
    private readonly id: string,
    private readonly customAgent: CustomAgent,
    private readonly modelId: string,
    private readonly config: BackgroundAgentConfig,
    private readonly sessionManager: ChatSessionManager,
    private readonly bedrockService: BedrockService,
    private readonly toolStates: ToolState[]
  ) {
    this.status = {
      id: this.id,
      agentId: this.customAgent.id,
      status: 'idle',
      totalSessions: 0,
      activeSessionCount: 0,
      messagesProcessed: 0,
      toolsExecuted: 0,
      errorCount: 0,
      config: this.config
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Background agent is already running')
    }

    this.log('info', `Starting background agent: ${this.customAgent.name}`)
    this.isRunning = true
    this.abortController = new AbortController()

    this.updateStatus({
      status: 'running',
      startedAt: Date.now(),
      lastActivity: Date.now()
    })

    try {
      // エージェントのメインループ（非同期で実行、awaitしない）
      this.runMainLoop().catch((error: any) => {
        this.log('error', `Background agent error: ${error.message}`, error)
        this.updateStatus({
          status: 'error',
          lastError: error.message,
          errorCount: this.status.errorCount + 1
        })
      })
    } catch (error: any) {
      this.log('error', `Background agent startup error: ${error.message}`, error)
      this.updateStatus({
        status: 'error',
        lastError: error.message,
        errorCount: this.status.errorCount + 1
      })
    }
  }

  async stop(): Promise<void> {
    this.log('info', `Stopping background agent: ${this.customAgent.name}`)
    this.isRunning = false

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    this.updateStatus({
      status: 'stopped'
    })
  }

  private async runMainLoop(): Promise<void> {
    // 現時点では基本的な待機ループ
    // 将来的には外部トリガーやスケジュールに基づく処理を実装
    while (this.isRunning && !this.abortController?.signal.aborted) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      this.updateStatus({ lastActivity: Date.now() })
    }
  }

  // チャット処理のメソッド（useAgentChatから移植）
  async processMessage(userInput: string, sessionId?: string): Promise<IdentifiableMessage[]> {
    if (!this.isRunning) {
      throw new Error('Background agent is not running')
    }

    this.log('info', `Processing message in session: ${sessionId}`)

    let currentSessionId = sessionId
    if (!currentSessionId) {
      // 新しいセッションを作成
      currentSessionId = await this.sessionManager.createSession(
        this.customAgent.id,
        this.modelId,
        this.customAgent.system
      )
      this.updateStatus({
        currentSessionId,
        totalSessions: this.status.totalSessions + 1
      })
    }

    const session = this.sessionManager.getSession(currentSessionId)
    if (!session) {
      throw new Error(`Session not found: ${currentSessionId}`)
    }

    const messages: IdentifiableMessage[] = [...(session.messages as IdentifiableMessage[])]

    // ユーザーメッセージを追加
    const userMessage: IdentifiableMessage = {
      role: 'user',
      content: [{ text: userInput }],
      id: generateMessageId()
    }
    messages.push(userMessage)
    await this.sessionManager.addMessage(currentSessionId, {
      id: userMessage.id!,
      role: userMessage.role!,
      content: userMessage.content!,
      timestamp: Date.now(),
      metadata: {
        modelId: this.modelId,
        tools: this.toolStates
      }
    })

    // AI応答を生成
    const assistantMessage = await this.generateResponse(messages, currentSessionId)
    messages.push(assistantMessage)

    this.updateStatus({
      messagesProcessed: this.status.messagesProcessed + 1,
      lastActivity: Date.now()
    })

    return messages
  }

  private async generateResponse(
    messages: IdentifiableMessage[],
    sessionId: string
  ): Promise<IdentifiableMessage> {
    const props: CallConverseAPIProps = {
      messages: messages as Message[],
      modelId: this.modelId,
      system: this.customAgent.system ? [{ text: this.customAgent.system }] : [],
      toolConfig: this.toolStates.length ? { tools: this.toolStates } : undefined
    }

    try {
      // Bedrock converseStreamを使用してレスポンスを生成
      const response = await this.bedrockService.converseStream(props)

      let responseText = ''
      let role: ConversationRole = 'assistant'
      const content: ContentBlock[] = []
      let stopReason: StopReason | undefined

      // ストリームを処理
      if (response.stream) {
        for await (const chunk of response.stream) {
          if (this.abortController?.signal.aborted) {
            throw new Error('Operation aborted')
          }

          if (chunk.messageStart) {
            role = chunk.messageStart.role ?? 'assistant'
          } else if (chunk.messageStop) {
            stopReason = chunk.messageStop.stopReason
          } else if (chunk.contentBlockDelta?.delta?.text) {
            responseText += chunk.contentBlockDelta.delta.text
          }
        }
      }

      if (responseText) {
        content.push({ text: responseText })
      }

      const assistantMessage: IdentifiableMessage = {
        role,
        content,
        id: generateMessageId()
      }

      // セッションに保存
      await this.sessionManager.addMessage(sessionId, {
        id: assistantMessage.id!,
        role: assistantMessage.role!,
        content: assistantMessage.content!,
        timestamp: Date.now(),
        metadata: {
          modelId: this.modelId,
          tools: this.toolStates
        }
      })

      // ツール実行が必要な場合の処理は後で実装
      if (stopReason === 'tool_use') {
        this.log('info', 'Tool execution required - not implemented yet')
      }

      return assistantMessage
    } catch (error: any) {
      this.log('error', `Error generating response: ${error.message}`, error)
      throw error
    }
  }

  getStatus(): BackgroundAgentStatus {
    return {
      ...this.status,
      uptime: this.status.startedAt ? Date.now() - this.status.startedAt : undefined
    }
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit)
  }

  private log(level: LogEntry['level'], message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context
    }

    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    this.logger[level](message, context)
  }

  private updateStatus(updates: Partial<BackgroundAgentStatus>): void {
    this.status = { ...this.status, ...updates }
  }
}
