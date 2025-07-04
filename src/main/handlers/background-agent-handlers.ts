import { IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { BackgroundAgentService } from '../api/bedrock/services/backgroundAgent/BackgroundAgentService'
import { BackgroundAgentScheduler } from '../api/bedrock/services/backgroundAgent/BackgroundAgentScheduler'
import {
  BackgroundAgentConfig,
  ScheduleConfig
} from '../api/bedrock/services/backgroundAgent/types'
import { ServiceContext } from '../api/bedrock/types'
import { createCategoryLogger } from '../../common/logger'
import { store } from '../../preload/store'

const backgroundAgentLogger = createCategoryLogger('background-agent:ipc')

// BackgroundAgentServiceのインスタンスを作成
let backgroundAgentService: BackgroundAgentService | null = null
let backgroundAgentScheduler: BackgroundAgentScheduler | null = null

function getBackgroundAgentService(): BackgroundAgentService {
  if (!backgroundAgentService) {
    const context: ServiceContext = {
      store: store
    }
    backgroundAgentService = new BackgroundAgentService(context)
  }
  return backgroundAgentService
}

function getBackgroundAgentScheduler(): BackgroundAgentScheduler {
  if (!backgroundAgentScheduler) {
    const context: ServiceContext = {
      store: store
    }
    backgroundAgentScheduler = new BackgroundAgentScheduler(context)
  }
  return backgroundAgentScheduler
}

export const backgroundAgentHandlers = {
  'background-agent:chat': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Background agent chat request', {
      sessionId: params.sessionId,
      modelId: params.config?.modelId,
      hasSystemPrompt: !!params.config?.systemPrompt,
      userMessageLength: params.userMessage?.length || 0,
      projectDirectory: params.config?.projectDirectory
    })

    try {
      const config: BackgroundAgentConfig = {
        modelId: params.config.modelId,
        systemPrompt: params.config.systemPrompt,
        agentId: params.config.agentId,
        projectDirectory: params.config.projectDirectory
      }

      const service = getBackgroundAgentService()
      const result = await service.chat(
        params.sessionId,
        config,
        params.userMessage,
        params.options
      )

      backgroundAgentLogger.info('Background agent chat completed', {
        sessionId: params.sessionId,
        responseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0,
        projectDirectory: config.projectDirectory
      })

      return result
    } catch (error: any) {
      backgroundAgentLogger.error('Background agent chat failed', {
        sessionId: params.sessionId,
        error: error.message,
        stack: error.stack,
        projectDirectory: params.config?.projectDirectory
      })
      throw error
    }
  },

  'background-agent:create-session': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Create session request', {
      sessionId: params.sessionId,
      projectDirectory: params.options?.projectDirectory,
      agentId: params.options?.agentId,
      modelId: params.options?.modelId
    })

    try {
      const service = getBackgroundAgentService()
      service.createSession(params.sessionId, params.options)

      backgroundAgentLogger.info('Session created', {
        sessionId: params.sessionId,
        projectDirectory: params.options?.projectDirectory,
        agentId: params.options?.agentId,
        modelId: params.options?.modelId
      })

      return {
        success: true,
        sessionId: params.sessionId,
        projectDirectory: params.options?.projectDirectory
      }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to create session', {
        sessionId: params.sessionId,
        error: error.message,
        projectDirectory: params.options?.projectDirectory
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
  },

  'background-agent:get-all-sessions-metadata': async (_event: IpcMainInvokeEvent) => {
    backgroundAgentLogger.debug('Get all sessions metadata request')

    try {
      const service = getBackgroundAgentService()
      const metadata = service.getAllSessionsMetadata()

      backgroundAgentLogger.info('All sessions metadata retrieved', {
        sessionCount: metadata.length
      })

      return { metadata }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get all sessions metadata', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-sessions-by-project': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Get sessions by project request', {
      projectDirectory: params.projectDirectory
    })

    try {
      const service = getBackgroundAgentService()
      const sessions = service.getSessionsByProjectDirectory(params.projectDirectory)

      backgroundAgentLogger.info('Sessions by project retrieved', {
        projectDirectory: params.projectDirectory,
        sessionCount: sessions.length
      })

      return { sessions }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get sessions by project', {
        projectDirectory: params.projectDirectory,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-sessions-by-agent': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Get sessions by agent request', {
      agentId: params.agentId
    })

    try {
      const service = getBackgroundAgentService()
      const sessions = service.getSessionsByAgentId(params.agentId)

      backgroundAgentLogger.info('Sessions by agent retrieved', {
        agentId: params.agentId,
        sessionCount: sessions.length
      })

      return { sessions }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get sessions by agent', {
        agentId: params.agentId,
        error: error.message
      })
      throw error
    }
  },

  // スケジューリング機能のIPCハンドラー
  'background-agent:schedule-task': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Schedule task request', {
      name: params.config?.name,
      cronExpression: params.config?.cronExpression,
      agentId: params.config?.agentConfig?.agentId
    })

    try {
      const config: ScheduleConfig = params.config
      const scheduler = getBackgroundAgentScheduler()
      const taskId = scheduler.scheduleTask(config)

      backgroundAgentLogger.info('Task scheduled successfully', {
        taskId,
        name: config.name,
        cronExpression: config.cronExpression
      })

      return { success: true, taskId }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to schedule task', {
        error: error.message,
        config: params.config
      })
      throw error
    }
  },

  'background-agent:cancel-task': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Cancel task request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const success = scheduler.cancelTask(params.taskId)

      backgroundAgentLogger.info('Task cancellation result', {
        taskId: params.taskId,
        success
      })

      return { success }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to cancel task', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:toggle-task': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Toggle task request', {
      taskId: params.taskId,
      enabled: params.enabled
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const success = scheduler.toggleTask(params.taskId, params.enabled)

      backgroundAgentLogger.info('Task toggle result', {
        taskId: params.taskId,
        enabled: params.enabled,
        success
      })

      return { success }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to toggle task', {
        taskId: params.taskId,
        enabled: params.enabled,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:list-tasks': async (_event: IpcMainInvokeEvent) => {
    backgroundAgentLogger.debug('List tasks request')

    try {
      const scheduler = getBackgroundAgentScheduler()
      const tasks = scheduler.listTasks()

      backgroundAgentLogger.info('Tasks listed', {
        count: tasks.length
      })

      return { tasks }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to list tasks', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-task': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Get task request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const task = scheduler.getTask(params.taskId)

      backgroundAgentLogger.info('Task retrieved', {
        taskId: params.taskId,
        found: !!task
      })

      return { task }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get task', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-task-execution-history': async (
    _event: IpcMainInvokeEvent,
    params: any
  ) => {
    backgroundAgentLogger.debug('Get task execution history request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const history = scheduler.getTaskExecutionHistory(params.taskId)

      backgroundAgentLogger.info('Task execution history retrieved', {
        taskId: params.taskId,
        historyCount: history.length
      })

      return { history }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get task execution history', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:execute-task-manually': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Execute task manually request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const result = await scheduler.executeTaskManually(params.taskId)

      if (!result) {
        throw new Error('No execution result returned from scheduler')
      }

      backgroundAgentLogger.info('Task executed manually', {
        taskId: params.taskId,
        success: result.success
      })

      return { result }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to execute task manually', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-scheduler-stats': async (_event: IpcMainInvokeEvent) => {
    backgroundAgentLogger.debug('Get scheduler stats request')

    try {
      const scheduler = getBackgroundAgentScheduler()
      const stats = scheduler.getStats()

      backgroundAgentLogger.info('Scheduler stats retrieved', {
        totalTasks: stats.totalTasks,
        enabledTasks: stats.enabledTasks,
        activeCronJobs: stats.activeCronJobs
      })

      return { stats }
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to get scheduler stats', {
        error: error.message
      })
      throw error
    }
  },

  // 通知ハンドラー
  'background-agent:task-notification': async (_event: IpcMainInvokeEvent, params: any) => {
    backgroundAgentLogger.debug('Task notification request', {
      taskId: params.taskId,
      taskName: params.taskName,
      success: params.success
    })

    try {
      // すべてのレンダラープロセスに通知イベントを送信
      const allWindows = BrowserWindow.getAllWindows()
      for (const window of allWindows) {
        if (!window.isDestroyed()) {
          window.webContents.send('background-agent:task-notification', params)
        }
      }

      backgroundAgentLogger.info('Task notification sent to all windows', {
        taskId: params.taskId,
        taskName: params.taskName,
        success: params.success,
        windowCount: allWindows.length
      })
    } catch (error: any) {
      backgroundAgentLogger.error('Failed to send task notification', {
        taskId: params.taskId,
        error: error.message
      })
    }
  }
} as const
