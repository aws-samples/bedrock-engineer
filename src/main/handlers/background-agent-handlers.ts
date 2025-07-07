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

const logger = createCategoryLogger('background-agent:ipc')

// BackgroundAgentServiceのインスタンスを作成
let backgroundAgentService: BackgroundAgentService | null = null
let backgroundAgentScheduler: BackgroundAgentScheduler | null = null

// 排他制御用のフラグ
let isSchedulerInitializing = false
const toggleOperationMutex = new Map<string, Promise<boolean>>()

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
  if (!backgroundAgentScheduler && !isSchedulerInitializing) {
    try {
      isSchedulerInitializing = true
      const context: ServiceContext = {
        store: store
      }
      backgroundAgentScheduler = new BackgroundAgentScheduler(context)
      logger.info('BackgroundAgentScheduler instance created')
    } catch (error: any) {
      logger.error('Failed to create BackgroundAgentScheduler instance', {
        error: error.message
      })
      throw error
    } finally {
      isSchedulerInitializing = false
    }
  }
  return backgroundAgentScheduler!
}

/**
 * BackgroundAgentSchedulerをシャットダウン
 */
export function shutdownBackgroundAgentScheduler(): void {
  if (backgroundAgentScheduler) {
    try {
      backgroundAgentScheduler.shutdown()
      logger.info('BackgroundAgentScheduler shutdown completed')
    } catch (error: any) {
      logger.error('Failed to shutdown BackgroundAgentScheduler', {
        error: error.message
      })
    } finally {
      backgroundAgentScheduler = null
    }
  }
}

export const backgroundAgentHandlers = {
  'background-agent:chat': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Background agent chat request', {
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

      logger.info('Background agent chat completed', {
        sessionId: params.sessionId,
        responseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0,
        projectDirectory: config.projectDirectory
      })

      return result
    } catch (error: any) {
      logger.error('Background agent chat failed', {
        sessionId: params.sessionId,
        error: error.message,
        stack: error.stack,
        projectDirectory: params.config?.projectDirectory
      })
      throw error
    }
  },

  'background-agent:create-session': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Create session request', {
      sessionId: params.sessionId,
      projectDirectory: params.options?.projectDirectory,
      agentId: params.options?.agentId,
      modelId: params.options?.modelId
    })

    try {
      const service = getBackgroundAgentService()
      service.createSession(params.sessionId, params.options)

      logger.info('Session created', {
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
      logger.error('Failed to create session', {
        sessionId: params.sessionId,
        error: error.message,
        projectDirectory: params.options?.projectDirectory
      })
      throw error
    }
  },

  'background-agent:delete-session': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Delete session request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      const deleted = service.deleteSession(params.sessionId)

      logger.info('Session deletion result', {
        sessionId: params.sessionId,
        deleted
      })

      return { success: deleted, sessionId: params.sessionId }
    } catch (error: any) {
      logger.error('Failed to delete session', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:list-sessions': async (_event: IpcMainInvokeEvent) => {
    logger.debug('List sessions request')

    try {
      const service = getBackgroundAgentService()
      const sessions = service.listSessions()

      logger.info('Sessions listed', {
        count: sessions.length
      })

      return { sessions }
    } catch (error: any) {
      logger.error('Failed to list sessions', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-session-history': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Get session history request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      const history = service.getSessionHistory(params.sessionId)

      logger.info('Session history retrieved', {
        sessionId: params.sessionId,
        messageCount: history.length
      })

      return { history }
    } catch (error: any) {
      logger.error('Failed to get session history', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-session-stats': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Get session stats request', {
      sessionId: params.sessionId
    })

    try {
      const service = getBackgroundAgentService()
      const stats = service.getSessionStats(params.sessionId)

      logger.info('Session stats retrieved', {
        sessionId: params.sessionId,
        stats
      })

      return stats
    } catch (error: any) {
      logger.error('Failed to get session stats', {
        sessionId: params.sessionId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-all-sessions-metadata': async (_event: IpcMainInvokeEvent) => {
    logger.debug('Get all sessions metadata request')

    try {
      const service = getBackgroundAgentService()
      const metadata = service.getAllSessionsMetadata()

      logger.info('All sessions metadata retrieved', {
        sessionCount: metadata.length
      })

      return { metadata }
    } catch (error: any) {
      logger.error('Failed to get all sessions metadata', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-sessions-by-project': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Get sessions by project request', {
      projectDirectory: params.projectDirectory
    })

    try {
      const service = getBackgroundAgentService()
      const sessions = service.getSessionsByProjectDirectory(params.projectDirectory)

      logger.info('Sessions by project retrieved', {
        projectDirectory: params.projectDirectory,
        sessionCount: sessions.length
      })

      return { sessions }
    } catch (error: any) {
      logger.error('Failed to get sessions by project', {
        projectDirectory: params.projectDirectory,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-sessions-by-agent': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Get sessions by agent request', {
      agentId: params.agentId
    })

    try {
      const service = getBackgroundAgentService()
      const sessions = service.getSessionsByAgentId(params.agentId)

      logger.info('Sessions by agent retrieved', {
        agentId: params.agentId,
        sessionCount: sessions.length
      })

      return { sessions }
    } catch (error: any) {
      logger.error('Failed to get sessions by agent', {
        agentId: params.agentId,
        error: error.message
      })
      throw error
    }
  },

  // スケジューリング機能のIPCハンドラー
  'background-agent:schedule-task': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Schedule task request', {
      name: params.config?.name,
      cronExpression: params.config?.cronExpression,
      agentId: params.config?.agentConfig?.agentId
    })

    try {
      const config: ScheduleConfig = params.config
      const scheduler = getBackgroundAgentScheduler()
      const taskId = scheduler.scheduleTask(config)

      logger.info('Task scheduled successfully', {
        taskId,
        name: config.name,
        cronExpression: config.cronExpression
      })

      return { success: true, taskId }
    } catch (error: any) {
      logger.error('Failed to schedule task', {
        error: error.message,
        config: params.config
      })
      throw error
    }
  },

  'background-agent:cancel-task': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Cancel task request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const success = scheduler.cancelTask(params.taskId)

      logger.info('Task cancellation result', {
        taskId: params.taskId,
        success
      })

      return { success }
    } catch (error: any) {
      logger.error('Failed to cancel task', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:toggle-task': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Toggle task request', {
      taskId: params.taskId,
      enabled: params.enabled
    })

    const taskId = params.taskId

    // 排他制御: 同じタスクのトグル操作が同時実行されることを防ぐ
    const existingOperation = toggleOperationMutex.get(taskId)
    if (existingOperation) {
      logger.warn('Toggle operation already in progress for task', {
        taskId
      })
      await existingOperation
    }

    // 新しいトグル操作を開始
    const togglePromise = (async (): Promise<boolean> => {
      try {
        const scheduler = getBackgroundAgentScheduler()
        const success = scheduler.toggleTask(taskId, params.enabled)

        logger.info('Task toggle result', {
          taskId,
          enabled: params.enabled,
          success
        })

        return success
      } catch (error: any) {
        logger.error('Failed to toggle task', {
          taskId,
          enabled: params.enabled,
          error: error.message
        })
        throw error
      } finally {
        // 操作完了後にミューテックスから削除
        toggleOperationMutex.delete(taskId)
      }
    })()

    // ミューテックスに登録
    toggleOperationMutex.set(taskId, togglePromise)

    const success = await togglePromise
    return { success }
  },

  'background-agent:list-tasks': async (_event: IpcMainInvokeEvent) => {
    logger.debug('List tasks request')

    try {
      const scheduler = getBackgroundAgentScheduler()
      const tasks = scheduler.listTasks()

      logger.info('Tasks listed', {
        count: tasks.length
      })

      return { tasks }
    } catch (error: any) {
      logger.error('Failed to list tasks', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-task': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Get task request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const task = scheduler.getTask(params.taskId)

      logger.info('Task retrieved', {
        taskId: params.taskId,
        found: !!task
      })

      return { task }
    } catch (error: any) {
      logger.error('Failed to get task', {
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
    logger.debug('Get task execution history request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const history = scheduler.getTaskExecutionHistory(params.taskId)

      logger.info('Task execution history retrieved', {
        taskId: params.taskId,
        historyCount: history.length
      })

      return { history }
    } catch (error: any) {
      logger.error('Failed to get task execution history', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:execute-task-manually': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Execute task manually request', {
      taskId: params.taskId
    })

    try {
      const scheduler = getBackgroundAgentScheduler()
      const result = await scheduler.executeTaskManually(params.taskId)

      if (!result) {
        throw new Error('No execution result returned from scheduler')
      }

      logger.info('Task executed manually', {
        taskId: params.taskId,
        success: result.success
      })

      return { result }
    } catch (error: any) {
      logger.error('Failed to execute task manually', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  'background-agent:get-scheduler-stats': async (_event: IpcMainInvokeEvent) => {
    logger.debug('Get scheduler stats request')

    try {
      const scheduler = getBackgroundAgentScheduler()
      const stats = scheduler.getStats()

      logger.info('Scheduler stats retrieved', {
        totalTasks: stats.totalTasks,
        enabledTasks: stats.enabledTasks,
        activeCronJobs: stats.activeCronJobs
      })

      return { stats }
    } catch (error: any) {
      logger.error('Failed to get scheduler stats', {
        error: error.message
      })
      throw error
    }
  },

  'background-agent:update-task': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Update task request', {
      taskId: params.taskId,
      name: params.config?.name,
      cronExpression: params.config?.cronExpression,
      agentId: params.config?.agentConfig?.agentId
    })

    try {
      const config: ScheduleConfig = params.config
      const scheduler = getBackgroundAgentScheduler()
      const success = scheduler.updateTask(params.taskId, config)

      if (!success) {
        throw new Error(`Failed to update task: ${params.taskId}`)
      }

      logger.info('Task updated successfully', {
        taskId: params.taskId,
        name: config.name,
        cronExpression: config.cronExpression
      })

      return { success: true, taskId: params.taskId }
    } catch (error: any) {
      logger.error('Failed to update task', {
        taskId: params.taskId,
        error: error.message,
        config: params.config
      })
      throw error
    }
  },

  'background-agent:continue-session': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Continue session request', {
      sessionId: params.sessionId,
      taskId: params.taskId,
      userMessageLength: params.userMessage?.length || 0
    })

    try {
      const service = getBackgroundAgentService()

      // タスク情報を取得してエージェント設定を復元
      const scheduler = getBackgroundAgentScheduler()
      const task = scheduler.getTask(params.taskId)

      if (!task) {
        throw new Error(`Task not found: ${params.taskId}`)
      }

      const config = {
        modelId: task.modelId,
        agentId: task.agentId,
        projectDirectory: task.projectDirectory
      }

      const result = await service.chat(
        params.sessionId,
        config,
        params.userMessage,
        params.options || {
          enableToolExecution: true,
          maxToolExecutions: 5,
          timeoutMs: 300000 // 5分タイムアウト
        }
      )

      logger.info('Session continued successfully', {
        sessionId: params.sessionId,
        taskId: params.taskId,
        responseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0
      })

      return result
    } catch (error: any) {
      logger.error('Failed to continue session', {
        sessionId: params.sessionId,
        taskId: params.taskId,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  },

  'background-agent:get-task-system-prompt': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Get task system prompt request', {
      taskId: params.taskId
    })

    try {
      const service = getBackgroundAgentService()
      const systemPrompt = await service.getTaskSystemPrompt(params.taskId)

      logger.info('Task system prompt retrieved', {
        taskId: params.taskId,
        systemPromptLength: systemPrompt.length
      })

      return { systemPrompt }
    } catch (error: any) {
      logger.error('Failed to get task system prompt', {
        taskId: params.taskId,
        error: error.message
      })
      throw error
    }
  },

  // 通知ハンドラー
  'background-agent:task-notification': async (_event: IpcMainInvokeEvent, params: any) => {
    logger.debug('Task notification request', {
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

      logger.info('Task notification sent to all windows', {
        taskId: params.taskId,
        taskName: params.taskName,
        success: params.success,
        windowCount: allWindows.length
      })
    } catch (error: any) {
      logger.error('Failed to send task notification', {
        taskId: params.taskId,
        error: error.message
      })
    }
  }
} as const
