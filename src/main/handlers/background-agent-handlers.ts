import { IpcMainInvokeEvent } from 'electron'
import { BackgroundAgentService } from '../api/bedrock/services/backgroundAgent/BackgroundAgentService'
import { BackgroundAgentConfig } from '../api/bedrock/services/backgroundAgent/types'
import { ServiceContext } from '../api/bedrock/types'
import { createCategoryLogger } from '../../common/logger'
import { store } from '../../preload/store'

const backgroundAgentLogger = createCategoryLogger('background-agent:ipc')

// BackgroundAgentServiceのインスタンスを作成
let backgroundAgentService: BackgroundAgentService | null = null

function getBackgroundAgentService(): BackgroundAgentService {
  if (!backgroundAgentService) {
    const context: ServiceContext = {
      store: store
    }
    backgroundAgentService = new BackgroundAgentService(context)
  }
  return backgroundAgentService
}

export const backgroundAgentHandlers = {
  'background-agent:chat': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Background agent chat request', {
      sessionId: params.sessionId,
      modelId: params.config?.modelId,
      hasSystemPrompt: !!params.config?.systemPrompt,
      userMessageLength: params.userMessage?.length || 0
    })

    try {
      const config: BackgroundAgentConfig = {
        modelId: params.config.modelId,
        systemPrompt: params.config.systemPrompt,
        agentId: params.config.agentId
      }

      const service = getBackgroundAgentService()
      const result = await service.chat(params.sessionId, config, params.userMessage)

      backgroundAgentLogger.info('Background agent chat completed', {
        sessionId: params.sessionId,
        responseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0
      })

      return result
    } catch (error: any) {
      backgroundAgentLogger.error('Background agent chat failed', {
        sessionId: params.sessionId,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  },

  'background-agent:create-session': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Create session request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      service.createSession(params.sessionId)

      backgroundAgentLogger.info('Session created', {
        sessionId: params.sessionId
      })

      return { success: true, sessionId: params.sessionId }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to create session', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:delete-session': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Delete session request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      const deleted = service.deleteSession(params.sessionId)

      backgroundAgentLogger.info('Session deletion result', {
        sessionId: params.sessionId,
        deleted
      })

      return { success: deleted, sessionId: params.sessionId }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to delete session', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:list-sessions': async (_event: IpcMainInvokeEvent) => {
    backgroundAgentLogger.debug('List sessions request')

    try {
      const service = getBackgroundAgentService()
      const sessions = service.listSessions()

      backgroundAgentLogger.info('Sessions listed', {
        count: sessions.length
      })

      return { sessions }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to list sessions', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-session-history': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Get session history request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      const history = service.getSessionHistory(params.sessionId)

      backgroundAgentLogger.info('Session history retrieved', {
        sessionId: params.sessionId,
        messageCount: history.length
      })

      return { history }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get session history', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-session-stats': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Get session stats request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      const stats = service.getSessionStats(params.sessionId)

      backgroundAgentLogger.info('Session stats retrieved', {
        sessionId: params.sessionId,
        stats
      })

      return stats
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get session stats', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  }
} as const
