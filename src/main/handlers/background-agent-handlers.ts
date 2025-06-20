import { IpcMainInvokeEvent } from 'electron'
import { BackgroundAgentManager } from '../managers/backgroundAgentManager'
import { BackgroundAgentStartParams } from '../../types/background-agent'
import { createCategoryLogger } from '../../common/logger'

const logger = createCategoryLogger('background-agent:ipc')

let backgroundAgentManager: BackgroundAgentManager | null = null

// BackgroundAgentManagerのインスタンスを設定する関数
export function setBackgroundAgentManager(manager: BackgroundAgentManager) {
  backgroundAgentManager = manager
}

export const backgroundAgentHandlers = {
  'backgroundAgent:getAvailableAgents': async (_event: IpcMainInvokeEvent) => {
    logger.debug('Getting available agents')

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const agents = backgroundAgentManager.getAvailableAgents()
      logger.info('Available agents retrieved', {
        customAgentsCount: agents.customAgents.length,
        sharedAgentsCount: agents.sharedAgents.length
      })
      return agents
    } catch (error: any) {
      logger.error('Failed to get available agents', error)
      throw error
    }
  },

  'backgroundAgent:start': async (
    _event: IpcMainInvokeEvent,
    params: BackgroundAgentStartParams
  ) => {
    logger.debug('Starting background agent', {
      agentId: params.agentId,
      modelId: params.modelId
    })

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const result = await backgroundAgentManager.startAgent(params)
      logger.info('Background agent start result', {
        success: result.success,
        agentId: params.agentId,
        error: result.error
      })
      return result
    } catch (error: any) {
      logger.error('Failed to start background agent', error)
      throw error
    }
  },

  'backgroundAgent:stop': async (_event: IpcMainInvokeEvent, agentId: string) => {
    logger.debug('Stopping background agent', { agentId })

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const result = await backgroundAgentManager.stopAgent(agentId)
      logger.info('Background agent stop result', {
        success: result.success,
        agentId,
        error: result.error
      })
      return result
    } catch (error: any) {
      logger.error('Failed to stop background agent', error)
      throw error
    }
  },

  'backgroundAgent:restart': async (_event: IpcMainInvokeEvent, agentId: string) => {
    logger.debug('Restarting background agent', { agentId })

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const result = await backgroundAgentManager.restartAgent(agentId)
      logger.info('Background agent restart result', {
        success: result.success,
        agentId,
        error: result.error
      })
      return result
    } catch (error: any) {
      logger.error('Failed to restart background agent', error)
      throw error
    }
  },

  'backgroundAgent:getStatus': async (_event: IpcMainInvokeEvent, agentId: string) => {
    logger.debug('Getting background agent status', { agentId })

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const status = backgroundAgentManager.getAgentStatus(agentId)
      logger.debug('Background agent status retrieved', {
        agentId,
        status: status?.status
      })
      return status
    } catch (error: any) {
      logger.error('Failed to get background agent status', error)
      throw error
    }
  },

  'backgroundAgent:getAllStatuses': async (_event: IpcMainInvokeEvent) => {
    logger.debug('Getting all background agent statuses')

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const statuses = backgroundAgentManager.getAllAgentStatuses()
      logger.debug('All background agent statuses retrieved', {
        count: statuses.length
      })
      return statuses
    } catch (error: any) {
      logger.error('Failed to get all background agent statuses', error)
      throw error
    }
  },

  'backgroundAgent:processMessage': async (
    _event: IpcMainInvokeEvent,
    params: { agentId: string; message: string; sessionId?: string }
  ) => {
    logger.debug('Processing message for background agent', {
      agentId: params.agentId,
      messageLength: params.message.length,
      hasSessionId: !!params.sessionId
    })

    if (!backgroundAgentManager) {
      throw new Error('Background agent manager not initialized')
    }

    try {
      const messages = await backgroundAgentManager.processMessage(
        params.agentId,
        params.message,
        params.sessionId
      )
      logger.info('Message processed for background agent', {
        agentId: params.agentId,
        messageCount: messages.length
      })
      return messages
    } catch (error: any) {
      logger.error('Failed to process message for background agent', error)
      throw error
    }
  }
} as const
