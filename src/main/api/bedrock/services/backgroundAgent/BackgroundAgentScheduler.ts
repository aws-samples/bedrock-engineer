import * as cron from 'node-cron'
import { v4 as uuidv4 } from 'uuid'
import { BrowserWindow } from 'electron'
import { createCategoryLogger } from '../../../../../common/logger'
import { ScheduleConfig, ScheduledTask, TaskExecutionResult, BackgroundAgentConfig } from './types'
import { BackgroundAgentService } from './BackgroundAgentService'
import { ServiceContext } from '../../types'

const schedulerLogger = createCategoryLogger('background-agent:scheduler')

export class BackgroundAgentScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map()
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()
  private executionHistory: Map<string, TaskExecutionResult[]> = new Map()
  private backgroundAgentService: BackgroundAgentService
  private context: ServiceContext

  constructor(context: ServiceContext) {
    this.context = context
    this.backgroundAgentService = new BackgroundAgentService(context)

    schedulerLogger.info('BackgroundAgentScheduler initialized')

    // アプリケーション起動時に永続化されたタスクを復元
    this.restorePersistedTasks()
  }

  /**
   * 永続化されたタスクを復元
   */
  private restorePersistedTasks(): void {
    try {
      const persistedTasksData = this.context.store.get('backgroundAgentScheduledTasks')
      const persistedTasks = Array.isArray(persistedTasksData) ? persistedTasksData : []

      for (const taskData of persistedTasks) {
        const task: ScheduledTask = {
          ...taskData,
          // 次回実行時刻を再計算
          nextRun: this.calculateNextRun(taskData.cronExpression)
        }

        this.scheduledTasks.set(task.id, task)

        if (task.enabled) {
          this.startCronJob(task)
        }
      }

      schedulerLogger.info('Restored persisted scheduled tasks', {
        count: persistedTasks.length,
        enabledCount: persistedTasks.filter((t: any) => t.enabled).length
      })
    } catch (error: any) {
      schedulerLogger.error('Failed to restore persisted tasks', {
        error: error.message
      })
    }
  }

  /**
   * タスクを永続化
   */
  private persistTasks(): void {
    try {
      const tasksArray = Array.from(this.scheduledTasks.values())
      this.context.store.set('backgroundAgentScheduledTasks', tasksArray)

      schedulerLogger.debug('Tasks persisted to store', {
        count: tasksArray.length
      })
    } catch (error: any) {
      schedulerLogger.error('Failed to persist tasks', {
        error: error.message
      })
    }
  }

  /**
   * 新しいスケジュールタスクを作成
   */
  scheduleTask(config: ScheduleConfig): string {
    try {
      // Cron式の妥当性を検証
      if (!cron.validate(config.cronExpression)) {
        throw new Error(`Invalid cron expression: ${config.cronExpression}`)
      }

      const task: ScheduledTask = {
        id: config.taskId || uuidv4(),
        name: config.name,
        cronExpression: config.cronExpression,
        agentId: config.agentConfig.agentId,
        modelId: config.agentConfig.modelId,
        projectDirectory: config.agentConfig.projectDirectory,
        wakeWord: config.wakeWord,
        enabled: config.enabled,
        createdAt: Date.now(),
        nextRun: this.calculateNextRun(config.cronExpression),
        runCount: 0
      }

      this.scheduledTasks.set(task.id, task)

      if (task.enabled) {
        this.startCronJob(task)
      }

      // タスクを永続化
      this.persistTasks()

      schedulerLogger.info('Scheduled task created', {
        taskId: task.id,
        name: task.name,
        cronExpression: task.cronExpression,
        enabled: task.enabled,
        nextRun: task.nextRun
      })

      return task.id
    } catch (error: any) {
      schedulerLogger.error('Failed to schedule task', {
        error: error.message,
        config
      })
      throw error
    }
  }

  /**
   * Cronジョブを開始
   */
  private startCronJob(task: ScheduledTask): void {
    try {
      // 既存のジョブがあれば停止
      const existingJob = this.cronJobs.get(task.id)
      if (existingJob) {
        existingJob.stop()
        this.cronJobs.delete(task.id)
      }

      // 新しいCronジョブを作成
      const cronJob = cron.schedule(
        task.cronExpression,
        async () => {
          await this.executeTask(task.id)
        },
        {
          timezone: 'Asia/Tokyo' // タイムゾーンを設定
        }
      )

      this.cronJobs.set(task.id, cronJob)

      schedulerLogger.debug('Cron job started', {
        taskId: task.id,
        cronExpression: task.cronExpression
      })
    } catch (error: any) {
      schedulerLogger.error('Failed to start cron job', {
        taskId: task.id,
        error: error.message
      })
    }
  }

  /**
   * 手動実行用のタスク実行（無効化されたタスクでも実行可能）
   */
  private async executeTaskForManual(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId)
    if (!task) {
      schedulerLogger.warn('Attempted to execute non-existent task', {
        taskId,
        exists: false
      })
      return
    }

    // 手動実行の場合は無効化されたタスクでも実行
    if (!task.enabled) {
      schedulerLogger.info('Executing disabled task manually', {
        taskId,
        taskName: task.name,
        enabled: task.enabled
      })
    }

    await this.executeTaskInternal(task, true)
  }

  /**
   * タスクを実行
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId)
    if (!task || !task.enabled) {
      schedulerLogger.warn('Attempted to execute disabled or non-existent task', {
        taskId,
        exists: !!task,
        enabled: task?.enabled
      })
      return
    }

    await this.executeTaskInternal(task, false)
  }

  /**
   * タスク実行の内部実装
   */
  private async executeTaskInternal(
    task: ScheduledTask,
    _isManualExecution: boolean
  ): Promise<void> {
    const taskId = task.id

    const executionId = uuidv4()
    const sessionId = `scheduled-${taskId}-${Date.now()}`

    schedulerLogger.info('Executing scheduled task', {
      taskId,
      executionId,
      sessionId,
      taskName: task.name,
      runCount: task.runCount + 1
    })

    // 実行開始通知を送信
    this.sendTaskExecutionStartNotification({
      taskId,
      taskName: task.name,
      executedAt: Date.now()
    })

    try {
      // BackgroundAgentConfigを構築
      const agentConfig: BackgroundAgentConfig = {
        modelId: task.modelId,
        agentId: task.agentId,
        projectDirectory: task.projectDirectory
      }

      // タスク実行前のメッセージ数をデバッグログ出力
      const sessionHistoryBefore = this.backgroundAgentService.getSessionHistory(sessionId)
      schedulerLogger.debug('Session history before chat execution', {
        taskId,
        sessionId,
        messageCountBefore: sessionHistoryBefore.length
      })

      // タスク実行
      const result = await this.backgroundAgentService.chat(sessionId, agentConfig, task.wakeWord, {
        enableToolExecution: true,
        maxToolExecutions: 10,
        timeoutMs: 600000 // 10分タイムアウト
      })

      // セッション履歴から実際のメッセージ数を取得
      const sessionHistory = this.backgroundAgentService.getSessionHistory(sessionId)

      schedulerLogger.debug('Session history after chat execution', {
        taskId,
        sessionId,
        messageCountAfter: sessionHistory.length,
        responseContentLength: result.response.content.length,
        toolExecutions: result.toolExecutions?.length || 0
      })

      // 実行結果を記録
      const executionResult: TaskExecutionResult = {
        taskId,
        executedAt: Date.now(),
        success: true,
        sessionId,
        messageCount: sessionHistory.length // 実際のセッション履歴からメッセージ数を取得
      }

      this.recordExecution(taskId, executionResult)

      // タスクの統計を更新
      task.runCount++
      task.lastRun = Date.now()
      task.nextRun = this.calculateNextRun(task.cronExpression)
      delete task.lastError // エラーをクリア

      this.scheduledTasks.set(taskId, task)
      this.persistTasks()

      // AIからのメッセージを抽出（通知用）
      let aiMessage = ''
      if (result.response.content && Array.isArray(result.response.content)) {
        const textContent = result.response.content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join(' ')
        aiMessage = textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent
      }

      // 成功通知を送信
      this.sendTaskNotification({
        taskId,
        taskName: task.name,
        success: true,
        aiMessage,
        executedAt: Date.now()
      })

      schedulerLogger.info('Scheduled task executed successfully', {
        taskId,
        executionId,
        sessionId,
        responseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0
      })
    } catch (error: any) {
      schedulerLogger.error('Scheduled task execution failed', {
        taskId,
        executionId,
        sessionId,
        error: error.message,
        stack: error.stack
      })

      // エラー結果を記録
      const executionResult: TaskExecutionResult = {
        taskId,
        executedAt: Date.now(),
        success: false,
        error: error.message,
        sessionId,
        messageCount: 0
      }

      this.recordExecution(taskId, executionResult)

      // タスクにエラー情報を記録
      task.lastError = error.message
      task.lastRun = Date.now()
      task.nextRun = this.calculateNextRun(task.cronExpression)

      this.scheduledTasks.set(taskId, task)
      this.persistTasks()

      // エラー通知を送信
      this.sendTaskNotification({
        taskId,
        taskName: task.name,
        success: false,
        error: error.message,
        executedAt: Date.now()
      })
    }
  }

  /**
   * タスク実行開始通知を送信
   */
  private sendTaskExecutionStartNotification(params: {
    taskId: string
    taskName: string
    executedAt: number
  }): void {
    try {
      // すべてのレンダラープロセスに実行開始通知イベントを送信
      const allWindows = BrowserWindow.getAllWindows()
      for (const window of allWindows) {
        if (!window.isDestroyed()) {
          window.webContents.send('background-agent:task-execution-start', params)
        }
      }

      schedulerLogger.debug('Task execution start notification sent to all windows', {
        taskId: params.taskId,
        taskName: params.taskName,
        windowCount: allWindows.length
      })
    } catch (error: any) {
      schedulerLogger.error('Failed to send task execution start notification', {
        taskId: params.taskId,
        error: error.message
      })
    }
  }

  /**
   * タスク通知を送信
   */
  private sendTaskNotification(params: {
    taskId: string
    taskName: string
    success: boolean
    error?: string
    aiMessage?: string
    executedAt: number
  }): void {
    try {
      // すべてのレンダラープロセスに通知イベントを送信
      const allWindows = BrowserWindow.getAllWindows()
      for (const window of allWindows) {
        if (!window.isDestroyed()) {
          window.webContents.send('background-agent:task-notification', params)
        }
      }

      schedulerLogger.debug('Task notification sent to all windows', {
        taskId: params.taskId,
        taskName: params.taskName,
        success: params.success,
        windowCount: allWindows.length
      })
    } catch (error: any) {
      schedulerLogger.error('Failed to send task notification', {
        taskId: params.taskId,
        error: error.message
      })
    }
  }

  /**
   * 実行履歴を記録
   */
  private recordExecution(taskId: string, result: TaskExecutionResult): void {
    if (!this.executionHistory.has(taskId)) {
      this.executionHistory.set(taskId, [])
    }

    const history = this.executionHistory.get(taskId)!
    history.push(result)

    // 履歴は最新100件まで保持
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }

    schedulerLogger.debug('Task execution recorded', {
      taskId,
      success: result.success,
      historyCount: history.length
    })
  }

  /**
   * 次回実行時刻を計算
   */
  private calculateNextRun(_cronExpression: string): number {
    try {
      // 現在時刻から次回実行時刻を計算
      // 簡易実装として、現在時刻から1分後を設定
      // 実際のcron計算ロジックは複雑なので簡略化
      return Date.now() + 60000 // 1分後
    } catch (error) {
      return Date.now() + 3600000 // エラー時は1時間後
    }
  }

  /**
   * タスクをキャンセル
   */
  cancelTask(taskId: string): boolean {
    try {
      const task = this.scheduledTasks.get(taskId)
      if (!task) {
        return false
      }

      // Cronジョブを停止
      const cronJob = this.cronJobs.get(taskId)
      if (cronJob) {
        cronJob.stop()
        this.cronJobs.delete(taskId)
      }

      // タスクを削除
      this.scheduledTasks.delete(taskId)
      this.executionHistory.delete(taskId)

      // 永続化を更新
      this.persistTasks()

      schedulerLogger.info('Scheduled task cancelled', {
        taskId,
        taskName: task.name
      })

      return true
    } catch (error: any) {
      schedulerLogger.error('Failed to cancel task', {
        taskId,
        error: error.message
      })
      return false
    }
  }

  /**
   * タスクを有効/無効切り替え
   */
  toggleTask(taskId: string, enabled: boolean): boolean {
    try {
      const task = this.scheduledTasks.get(taskId)
      if (!task) {
        return false
      }

      task.enabled = enabled

      if (enabled) {
        this.startCronJob(task)
      } else {
        const cronJob = this.cronJobs.get(taskId)
        if (cronJob) {
          cronJob.stop()
          this.cronJobs.delete(taskId)
        }
      }

      this.scheduledTasks.set(taskId, task)
      this.persistTasks()

      schedulerLogger.info('Task toggle completed', {
        taskId,
        enabled,
        taskName: task.name
      })

      return true
    } catch (error: any) {
      schedulerLogger.error('Failed to toggle task', {
        taskId,
        enabled,
        error: error.message
      })
      return false
    }
  }

  /**
   * タスク一覧を取得
   */
  listTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values())
  }

  /**
   * 特定のタスクを取得
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.scheduledTasks.get(taskId)
  }

  /**
   * タスクの実行履歴を取得
   */
  getTaskExecutionHistory(taskId: string): TaskExecutionResult[] {
    return this.executionHistory.get(taskId) || []
  }

  /**
   * タスクを手動実行
   */
  async executeTaskManually(taskId: string): Promise<TaskExecutionResult> {
    const task = this.scheduledTasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    schedulerLogger.info('Manual task execution requested', {
      taskId,
      taskName: task.name
    })

    // 手動実行専用のexecuteTask呼び出し
    await this.executeTaskForManual(taskId)

    // 最新の実行結果を返す
    const history = this.getTaskExecutionHistory(taskId)
    const latestResult = history[history.length - 1]

    if (!latestResult) {
      throw new Error(`No execution result found for task: ${taskId}`)
    }

    return latestResult
  }

  /**
   * スケジューラーをシャットダウン
   */
  shutdown(): void {
    schedulerLogger.info('Shutting down scheduler', {
      activeCronJobs: this.cronJobs.size,
      scheduledTasks: this.scheduledTasks.size
    })

    // すべてのCronジョブを停止
    for (const [taskId, cronJob] of this.cronJobs.entries()) {
      try {
        cronJob.stop()
        schedulerLogger.debug('Stopped cron job', { taskId })
      } catch (error: any) {
        schedulerLogger.error('Error stopping cron job', {
          taskId,
          error: error.message
        })
      }
    }

    this.cronJobs.clear()

    // 最終状態を永続化
    this.persistTasks()

    schedulerLogger.info('Scheduler shutdown completed')
  }

  /**
   * 統計情報を取得
   */
  getStats() {
    const tasks = Array.from(this.scheduledTasks.values())
    const enabledTasks = tasks.filter((t) => t.enabled)
    const totalExecutions = tasks.reduce((sum, task) => sum + task.runCount, 0)
    const tasksWithErrors = tasks.filter((t) => t.lastError).length

    return {
      totalTasks: tasks.length,
      enabledTasks: enabledTasks.length,
      disabledTasks: tasks.length - enabledTasks.length,
      totalExecutions,
      tasksWithErrors,
      activeCronJobs: this.cronJobs.size
    }
  }
}
