import * as cron from 'node-cron'
import { v4 as uuidv4 } from 'uuid'
import { BrowserWindow } from 'electron'
import Store from 'electron-store'
import { createCategoryLogger } from '../../../../../common/logger'
import { ScheduleConfig, ScheduledTask, TaskExecutionResult, BackgroundAgentConfig } from './types'
import { BackgroundAgentService } from './BackgroundAgentService'
import { ServiceContext } from '../../types'

const logger = createCategoryLogger('background-agent:scheduler')

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

    logger.info('BackgroundAgentScheduler initialized')

    // アプリケーション起動時にすべてのスケジューラ状態をリセット
    this.resetAllSchedulerState()

    // 永続化されたタスクを復元
    this.restorePersistedTasks()
  }

  /**
   * アプリケーション起動時にすべてのスケジューラ状態をリセット
   */
  private resetAllSchedulerState(): void {
    try {
      logger.info('Resetting all scheduler state on startup')

      // 1. メモリ上のすべてのcronジョブを停止・削除
      for (const [taskId, cronJob] of this.cronJobs.entries()) {
        try {
          cronJob.stop()
          if (typeof cronJob.destroy === 'function') {
            cronJob.destroy()
          }
          logger.debug('Stopped existing cron job during reset', { taskId })
        } catch (error: any) {
          // エラーは無視（既に停止済みの可能性）
          logger.debug('Error stopping cron job during reset (ignored)', {
            taskId,
            error: error.message
          })
        }
      }
      this.cronJobs.clear()

      // 2. 永続化されたタスクの実行状態をリセット
      const persistedTasksData = this.context.store.get('backgroundAgentScheduledTasks')
      if (Array.isArray(persistedTasksData)) {
        const cleanedTasks = persistedTasksData.map((task: any) => ({
          ...task,
          isExecuting: false,
          lastExecutionStarted: undefined
        }))
        this.context.store.set('backgroundAgentScheduledTasks', cleanedTasks)

        logger.info('Cleaned execution state for persisted tasks', {
          taskCount: cleanedTasks.length
        })
      }

      // 3. メモリ上のタスクマップもクリア
      this.scheduledTasks.clear()

      logger.info('All scheduler state reset completed on startup', {
        clearedCronJobs: this.cronJobs.size,
        clearedTasks: this.scheduledTasks.size
      })
    } catch (error: any) {
      logger.error('Failed to reset scheduler state', {
        error: error.message,
        stack: error.stack
      })
    }
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

      logger.info('Restored persisted scheduled tasks', {
        count: persistedTasks.length,
        enabledCount: persistedTasks.filter((t: any) => t.enabled).length
      })
    } catch (error: any) {
      logger.error('Failed to restore persisted tasks', {
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

      logger.debug('Tasks persisted to store', {
        count: tasksArray.length
      })
    } catch (error: any) {
      logger.error('Failed to persist tasks', {
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

      logger.info('Scheduled task created', {
        taskId: task.id,
        name: task.name,
        cronExpression: task.cronExpression,
        enabled: task.enabled,
        nextRun: task.nextRun
      })

      return task.id
    } catch (error: any) {
      logger.error('Failed to schedule task', {
        error: error.message,
        config
      })
      throw error
    }
  }

  /**
   * Cronジョブを開始（重複防止機能付き）
   */
  private startCronJob(task: ScheduledTask): void {
    try {
      const taskId = task.id

      // 既存のジョブがあれば停止
      const existingJob = this.cronJobs.get(taskId)
      if (existingJob) {
        logger.warn('Stopping existing cron job before creating new one', {
          taskId,
          taskName: task.name
        })

        try {
          existingJob.stop()
          existingJob.destroy() // より確実にリソースを解放
        } catch (stopError: any) {
          logger.error('Failed to stop existing cron job', {
            taskId,
            error: stopError.message
          })
        }

        this.cronJobs.delete(taskId)
      }

      // Cron式の妥当性を再確認
      if (!cron.validate(task.cronExpression)) {
        throw new Error(`Invalid cron expression for task ${taskId}: ${task.cronExpression}`)
      }

      // 新しいCronジョブを作成
      const cronJob = cron.schedule(
        task.cronExpression,
        async () => {
          await this.executeTask(taskId)
        },
        {
          timezone: 'Asia/Tokyo' // タイムゾーンを設定
        }
      )

      this.cronJobs.set(taskId, cronJob)

      logger.info('Cron job started successfully', {
        taskId,
        taskName: task.name,
        cronExpression: task.cronExpression,
        totalActiveCronJobs: this.cronJobs.size
      })
    } catch (error: any) {
      logger.error('Failed to start cron job', {
        taskId: task.id,
        taskName: task.name,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * 手動実行用のタスク実行（無効化されたタスクでも実行可能）
   */
  private async executeTaskForManual(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId)
    if (!task) {
      logger.warn('Attempted to execute non-existent task', {
        taskId,
        exists: false
      })
      return
    }

    // 手動実行の場合は無効化されたタスクでも実行
    if (!task.enabled) {
      logger.info('Executing disabled task manually', {
        taskId,
        taskName: task.name,
        enabled: task.enabled
      })
    }

    await this.executeTaskInternal(task, true)
  }

  /**
   * タスクを実行（重複実行防止機能付き）
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId)
    if (!task || !task.enabled) {
      logger.warn('Attempted to execute disabled or non-existent task', {
        taskId,
        exists: !!task,
        enabled: task?.enabled
      })
      return
    }

    // 重複実行チェック
    if (task.isExecuting) {
      const executionTime = task.lastExecutionStarted ? Date.now() - task.lastExecutionStarted : 0
      logger.warn('Task is already executing, skipping duplicate execution', {
        task: JSON.stringify(task),
        taskId,
        taskName: task.name,
        executionTime: Math.round(executionTime / 1000) // 秒単位
      })

      // 重複実行スキップの通知を送信
      this.sendTaskSkippedNotification({
        taskId,
        taskName: task.name,
        reason: 'duplicate_execution',
        executionTime
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
    isManualExecution: boolean
  ): Promise<void> {
    const taskId = task.id

    // 手動実行でない場合、または手動実行でも重複チェックを行う場合
    if (!isManualExecution) {
      // 実行状態を設定
      task.isExecuting = true
      task.lastExecutionStarted = Date.now()
      this.scheduledTasks.set(taskId, task)
    }

    const executionId = uuidv4()

    // セッション継続ロジック
    let sessionId: string
    let promptToUse: string = task.wakeWord
    let isSessionContinuation = false

    if (task.continueSession && task.lastSessionId) {
      // 前回のセッションが有効かチェック
      const sessionManager = this.backgroundAgentService['sessionManager']
      if (sessionManager && sessionManager.hasValidSession(task.lastSessionId)) {
        // セッション継続が有効で、前回のセッションが有効な場合
        sessionId = task.lastSessionId
        isSessionContinuation = true

        // 継続時専用プロンプトがある場合はそれを使用
        if (task.continueSessionPrompt && task.continueSessionPrompt.trim()) {
          promptToUse = task.continueSessionPrompt
        }

        logger.info('Continuing existing valid session', {
          taskId,
          sessionId,
          continueSessionPrompt: !!task.continueSessionPrompt
        })
      } else {
        // 前回のセッションが無効または破損している場合は新規作成
        sessionId = `scheduled-${taskId}-${uuidv4()}`

        // lastSessionIdをリセット
        task.lastSessionId = undefined
        this.scheduledTasks.set(taskId, task)
        this.persistTasks()

        logger.warn('Previous session invalid, creating new session', {
          taskId,
          previousSessionId: task.lastSessionId,
          newSessionId: sessionId
        })
      }
    } else {
      // 新しいセッションを作成（UUIDを使用してユニーク性を保証）
      sessionId = `scheduled-${taskId}-${uuidv4()}`

      logger.info('Creating new session', {
        taskId,
        sessionId,
        continueSessionEnabled: !!task.continueSession
      })
    }

    logger.info('Executing scheduled task', {
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
      logger.debug('Session history before chat execution', {
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

      logger.debug('Session history after chat execution', {
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
        logger.debug('Session ID saved for continuation', {
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
          .filter((item: any) => 'text' in item && item.text)
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
        executedAt: Date.now(),
        executionTime: Date.now() - executionResult.executedAt,
        sessionId: executionResult.sessionId,
        messageCount: executionResult.messageCount,
        toolExecutions: result.toolExecutions?.length || 0,
        runCount: task.runCount,
        nextRun: task.nextRun
      })

      logger.info('Scheduled task executed successfully', {
        taskId,
        executionId,
        sessionId,
        responseLength: result.response.content.length,
        toolExecutionCount: result.toolExecutions?.length || 0
      })
    } catch (error: any) {
      logger.error('Scheduled task execution failed', {
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
    } finally {
      // 実行状態を確実にクリア（成功・失敗問わず）
      if (!isManualExecution) {
        task.isExecuting = false
        task.lastExecutionStarted = undefined
        this.scheduledTasks.set(taskId, task)

        logger.debug('Task execution state cleared', {
          taskId,
          taskName: task.name
        })
      }
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

      logger.debug('Task execution start notification sent to all windows', {
        taskId: params.taskId,
        taskName: params.taskName,
        windowCount: allWindows.length
      })
    } catch (error: any) {
      logger.error('Failed to send task execution start notification', {
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
    executionTime?: number
    sessionId?: string
    messageCount?: number
    toolExecutions?: number
    runCount?: number
    nextRun?: number
  }): void {
    try {
      // すべてのレンダラープロセスに通知イベントを送信
      const allWindows = BrowserWindow.getAllWindows()
      for (const window of allWindows) {
        if (!window.isDestroyed()) {
          window.webContents.send('background-agent:task-notification', params)
        }
      }

      logger.debug('Task notification sent to all windows', {
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

  /**
   * タスクスキップ通知を送信（重複実行防止など）
   */
  private sendTaskSkippedNotification(params: {
    taskId: string
    taskName: string
    reason: string
    executionTime?: number
  }): void {
    try {
      // すべてのレンダラープロセスに通知イベントを送信
      const allWindows = BrowserWindow.getAllWindows()
      for (const window of allWindows) {
        if (!window.isDestroyed()) {
          window.webContents.send('background-agent:task-skipped', params)
        }
      }

      logger.debug('Task skipped notification sent to all windows', {
        taskId: params.taskId,
        taskName: params.taskName,
        reason: params.reason,
        windowCount: allWindows.length
      })
    } catch (error: any) {
      logger.error('Failed to send task skipped notification', {
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

      logger.debug('Task execution recorded and persisted', {
        taskId,
        success: result.success,
        historyCount: allHistory[taskId].length
      })
    } catch (error: any) {
      logger.error('Failed to record execution history', {
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

      logger.info('Scheduled task cancelled', {
        taskId,
        taskName: task.name
      })

      return true
    } catch (error: any) {
      logger.error('Failed to cancel task', {
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
        logger.error('Task not found for update', { taskId })
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

      logger.info('Task updated successfully', {
        taskId,
        name: updatedTask.name,
        cronExpression: updatedTask.cronExpression,
        enabled: updatedTask.enabled,
        nextRun: updatedTask.nextRun
      })

      return true
    } catch (error: any) {
      logger.error('Failed to update task', {
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

      logger.info('Task toggle completed', {
        taskId,
        enabled,
        taskName: task.name
      })

      return true
    } catch (error: any) {
      logger.error('Failed to toggle task', {
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
      logger.error('Failed to get task execution history', {
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

    logger.info('Manual task execution requested', {
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
    logger.info('Shutting down scheduler', {
      activeCronJobs: this.cronJobs.size,
      scheduledTasks: this.scheduledTasks.size
    })

    // すべてのCronジョブを停止
    for (const [taskId, cronJob] of this.cronJobs.entries()) {
      try {
        cronJob.stop()
        logger.debug('Stopped cron job', { taskId })
      } catch (error: any) {
        logger.error('Error stopping cron job', {
          taskId,
          error: error.message
        })
      }
    }

    this.cronJobs.clear()

    // 最終状態を永続化
    this.persistTasks()

    logger.info('Scheduler shutdown completed')
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
