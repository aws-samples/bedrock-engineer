import { CustomAgent, ToolState } from '../../types/agent-chat'
import {
  BackgroundAgentConfig,
  BackgroundAgentStatus,
  BackgroundAgentStartParams,
  BackgroundAgentResponse
} from '../../types/background-agent'
import { BackgroundAgentService } from '../services/backgroundAgentService'
import { ChatSessionManager } from '../store/chatSession'
import { BedrockService } from '../api/bedrock'
import { createCategoryLogger } from '../../common/logger'
import { store } from '../../preload/store'

export class BackgroundAgentManager {
  private readonly logger = createCategoryLogger('background-agent-manager')
  private readonly agents = new Map<string, BackgroundAgentService>()
  private readonly sessionManager: ChatSessionManager
  private readonly bedrockService: BedrockService

  constructor(sessionManager: ChatSessionManager, bedrockService: BedrockService) {
    this.sessionManager = sessionManager
    this.bedrockService = bedrockService
  }

  async startAgent(params: BackgroundAgentStartParams): Promise<BackgroundAgentResponse> {
    try {
      const { agentId, modelId, config } = params

      // エージェントが既に実行中かチェック
      if (this.agents.has(agentId)) {
        const existingAgent = this.agents.get(agentId)!
        const status = existingAgent.getStatus()
        if (status.status === 'running') {
          return {
            success: false,
            error: `Agent ${agentId} is already running`
          }
        }
      }

      // カスタムエージェントを取得
      const customAgents = store.get('customAgents') || []
      const customAgent = customAgents.find((agent) => agent.id === agentId)
      if (!customAgent) {
        return {
          success: false,
          error: `Custom agent not found: ${agentId}`
        }
      }

      // ツール設定を取得
      const toolStates = this.getAgentTools(customAgent)

      // 設定オブジェクトを作成
      const agentConfig: BackgroundAgentConfig = {
        id: `bg-agent-${Date.now()}`,
        name: customAgent.name,
        agentId: customAgent.id,
        modelId,
        autoStart: config?.autoStart || false,
        maxSessions: config?.maxSessions || 10,
        logLevel: config?.logLevel || 'info'
      }

      // BackgroundAgentServiceを作成
      const agentService = new BackgroundAgentService(
        agentConfig.id,
        customAgent,
        modelId,
        agentConfig,
        this.sessionManager,
        this.bedrockService,
        toolStates
      )

      // エージェントを開始
      await agentService.start()

      // マネージャーに登録
      this.agents.set(agentId, agentService)

      this.logger.info(`Background agent started: ${customAgent.name}`, {
        agentId,
        modelId,
        configId: agentConfig.id
      })

      return {
        success: true,
        data: {
          agentId,
          configId: agentConfig.id,
          status: agentService.getStatus()
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to start background agent: ${error.message}`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async stopAgent(agentId: string): Promise<BackgroundAgentResponse> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) {
        return {
          success: false,
          error: `Agent not found: ${agentId}`
        }
      }

      await agent.stop()
      this.agents.delete(agentId)

      this.logger.info(`Background agent stopped: ${agentId}`)

      return {
        success: true,
        data: { agentId }
      }
    } catch (error: any) {
      this.logger.error(`Failed to stop background agent: ${error.message}`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async restartAgent(agentId: string): Promise<BackgroundAgentResponse> {
    try {
      // 停止してから開始
      const stopResult = await this.stopAgent(agentId)
      if (!stopResult.success) {
        return stopResult
      }

      // 元の設定を復元して再開始（簡易実装）
      const customAgents = store.get('customAgents') || []
      const customAgent = customAgents.find((agent) => agent.id === agentId)
      if (!customAgent) {
        return {
          success: false,
          error: `Custom agent not found: ${agentId}`
        }
      }

      // デフォルト設定で再開始
      return await this.startAgent({
        agentId,
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' // デフォルトモデル
      })
    } catch (error: any) {
      this.logger.error(`Failed to restart background agent: ${error.message}`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  getAgentStatus(agentId: string): BackgroundAgentStatus | null {
    const agent = this.agents.get(agentId)
    return agent ? agent.getStatus() : null
  }

  getAllAgentStatuses(): BackgroundAgentStatus[] {
    return Array.from(this.agents.values()).map((agent) => agent.getStatus())
  }

  getAvailableAgents(): {
    customAgents: CustomAgent[]
    sharedAgents: CustomAgent[]
  } {
    const customAgents = store.get('customAgents') || []
    const sharedAgents = store.get('sharedAgents') || []

    return {
      customAgents,
      sharedAgents
    }
  }

  async processMessage(agentId: string, message: string, sessionId?: string) {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    return await agent.processMessage(message, sessionId)
  }

  private getAgentTools(customAgent: CustomAgent): ToolState[] {
    // エージェント固有のツール設定を取得
    const globalTools = store.get('tools') || []
    const agentToolNames = customAgent.tools || []

    // エージェントで指定されたツールのみをフィルタリング
    return globalTools.filter((tool) => {
      const toolName = tool.toolSpec?.name
      return toolName && agentToolNames.includes(toolName as any)
    })
  }

  // クリーンアップ処理
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down all background agents')

    const stopPromises = Array.from(this.agents.keys()).map((agentId) => this.stopAgent(agentId))

    await Promise.allSettled(stopPromises)
    this.agents.clear()

    this.logger.info('All background agents stopped')
  }
}
