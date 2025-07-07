import * as cron from 'node-cron'
import { v4 as uuidv4 } from 'uuid'
import { BrowserWindow } from 'electron'
import Store from 'electron-store'
import { createCategoryLogger } from '../../../../../common/logger'
import { ScheduleConfig, ScheduledTask, TaskExecutionResult, BackgroundAgentConfig } from './types'
import { BackgroundAgentService } from './BackgroundAgentService'
import { ServiceContext } from '../../types'

const schedulerLogger = createCategoryLogger('background-agent:scheduler')

export class BackgroundAgentScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map()
  private cronJobs: Map<string, cron.ScheduledTask> = new Map()
  private backgroundAgentService: BackgroundAgentService
  private context: ServiceContext
  private executionHistoryStore: Store<{
    executionHistory: { [key: string]: TaskExecutionResult[] }
  }>

  constructor(context: ServiceContext) {
    this.context = context
    this.backgroundAgentService = new BackgroundAgentService(context)

    // 実行履歴用のストアを初期化
    this.executionHistoryStore = new Store({
      name: 'background-agent-execution-history',
      defaults: {
        executionHistory: {} as { [key: string]: TaskExecutionResult[] }
      }
    })

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
        runCount: 0,
        inferenceConfig: config.agentConfig.inferenceConfig,
        continueSession: config.continueSession,
        continueSessionPrompt: config.continueSessionPrompt
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

    // セッション継続ロジック
    let sessionId: string
    let promptToUse: string = task.wakeWord
    let isSessionContinuation = false

    if (task.continueSession && task.lastSessionId) {
      // セッション継続が有効で、前回のセッションIDが存在する場合
      sessionId = task.lastSessionId
      isSessionContinuation = true

      // 継続時専用プロンプトがある場合はそれを使用
      if (task.continueSessionPrompt && task.continueSessionPrompt.trim()) {
        promptToUse = task.continueSessionPrompt
      }

      schedulerLogger.info('Continuing existing session', {
        taskId,
        sessionId,
        continueSessionPrompt: !!task.continueSessionPrompt
      })
    } else {
      // 新しいセッションを作成
      sessionId = `scheduled-${taskId}-${Date.now()}`

      schedulerLogger.info('Creating new session', {
        taskId,
        sessionId,
        continueSessionEnabled: !!task.continueSession
      })
    }

    schedulerLogger.info('Executing scheduled task', {
      taskId,
      executionId,
      sessionId,
      taskName: task.name,
      runCount: task.runCount + 1,
      isSessionContinuation,
      promptType: task.continueSessionPrompt ? 'continuation' : 'wake'
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
        projectDirectory: task.projectDirectory,
        inferenceConfig: task.inferenceConfig
      }

      // タスク実行前のメッセージ数をデバッグログ出力
      const sessionHistoryBefore = this.backgroundAgentService.getSessionHistory(sessionId)
      schedulerLogger.debug('Session history before chat execution', {
        taskId,
        sessionId,
        messageCountBefore: sessionHistoryBefore.length,
        isSessionContinuation
      })

      // タスク実行
      const result = await this.backgroundAgentService.chat(sessionId, agentConfig, promptToUse, {
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

      // セッション継続が有効な場合は、セッションIDを保存
      if (task.continueSession) {
        task.lastSessionId = sessionId
        schedulerLogger.debug('Session ID saved for continuation', {
          taskId,
          sessionId,
          continueSession: task.continueSession
        })
      }

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
    try {
      // 現在の実行履歴を取得
      const allHistory = this.executionHistoryStore.get('executionHistory')

      // 該当タスクの履歴を取得または初期化
      if (!allHistory[taskId]) {
        allHistory[taskId] = []
      }

      // 新しい実行結果を追加
      allHistory[taskId].push(result)

      // 履歴は最新100件まで保持
      if (allHistory[taskId].length > 100) {
        allHistory[taskId].splice(0, allHistory[taskId].length - 100)
      }

      // 永続化
      this.executionHistoryStore.set('executionHistory', allHistory)

      schedulerLogger.debug('Task execution recorded and persisted', {
        taskId,
        success: result.success,
        historyCount: allHistory[taskId].length
      })
    } catch (error: any) {
      schedulerLogger.error('Failed to record execution history', {
        taskId,
        error: error.message
      })
    }
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

      // 実行履歴からも削除
      const allHistory = this.executionHistoryStore.get('executionHistory')
      delete allHistory[taskId]
      this.executionHistoryStore.set('executionHistory', allHistory)

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
   * タスクを更新
   */
  updateTask(taskId: string, config: ScheduleConfig): boolean {
    try {
      const existingTask = this.scheduledTasks.get(taskId)
      if (!existingTask) {
        schedulerLogger.error('Task not found for update', { taskId })
        return false
      }

      // Cron式の妥当性を検証
      if (!cron.validate(config.cronExpression)) {
        throw new Error(`Invalid cron expression: ${config.cronExpression}`)
      }

      // 既存のCronジョブを停止
      const existingJob = this.cronJobs.get(taskId)
      if (existingJob) {
        existingJob.stop()
        this.cronJobs.delete(taskId)
      }

      // タスクを更新（作成日時、実行統計、最後のセッションIDは保持）
      const updatedTask: ScheduledTask = {
        ...existingTask,
        name: config.name,
        cronExpression: config.cronExpression,
        agentId: config.agentConfig.agentId,
        modelId: config.agentConfig.modelId,
        projectDirectory: config.agentConfig.projectDirectory,
        wakeWord: config.wakeWord,
        enabled: config.enabled,
        nextRun: this.calculateNextRun(config.cronExpression),
        inferenceConfig: config.agentConfig.inferenceConfig,
        continueSession: config.continueSession,
        continueSessionPrompt: config.continueSessionPrompt,
        // エラーをクリア（設定が更新されたため）
        lastError: undefined
      }

      this.scheduledTasks.set(taskId, updatedTask)

      // 新しい設定でCronジョブを開始（有効な場合）
      if (updatedTask.enabled) {
        this.startCronJob(updatedTask)
      }

      // タスクを永続化
      this.persistTasks()

      schedulerLogger.info('Task updated successfully', {
        taskId,
        name: updatedTask.name,
        cronExpression: updatedTask.cronExpression,
        enabled: updatedTask.enabled,
        nextRun: updatedTask.nextRun
      })

      return true
    } catch (error: any) {
      schedulerLogger.error('Failed to update task', {
        taskId,
        error: error.message,
        config
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
    try {
      const allHistory = this.executionHistoryStore.get('executionHistory')
      return allHistory[taskId] || []
    } catch (error: any) {
      schedulerLogger.error('Failed to get task execution history', {
        taskId,
        error: error.message
      })
      return []
    }
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
