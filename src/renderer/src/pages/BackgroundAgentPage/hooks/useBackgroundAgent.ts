import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export interface ScheduledTask {
  id: string
  name: string
  cronExpression: string
  agentId: string
  modelId: string
  projectDirectory?: string
  wakeWord: string
  enabled: boolean
  createdAt: number
  lastRun?: number
  nextRun?: number
  runCount: number
  lastError?: string
  inferenceConfig?: {
    maxTokens?: number
    temperature?: number
    topP?: number
    topK?: number
    stopSequences?: string[]
  }
  continueSession?: boolean // セッション継続フラグ
  continueSessionPrompt?: string // セッション継続時専用プロンプト
  lastSessionId?: string // 最後に使用したセッションID
}

export interface TaskExecutionResult {
  taskId: string
  executedAt: number
  status: 'running' | 'success' | 'failed'
  error?: string
  sessionId: string
  messageCount: number
}

export interface ScheduleConfig {
  taskId?: string
  name: string
  cronExpression: string
  agentConfig: {
    modelId: string
    agentId: string
    projectDirectory?: string
    inferenceConfig?: {
      maxTokens?: number
      temperature?: number
      topP?: number
      topK?: number
      stopSequences?: string[]
    }
  }
  wakeWord: string
  enabled: boolean
  continueSession?: boolean // セッション継続フラグ
  continueSessionPrompt?: string // セッション継続時専用プロンプト
}

export const useBackgroundAgent = () => {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [taskLoadingStates, setTaskLoadingStates] = useState<{ [taskId: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  // 特定タスクのローディング状態を設定
  const setTaskLoading = useCallback((taskId: string, loading: boolean) => {
    setTaskLoadingStates((prev) => ({
      ...prev,
      [taskId]: loading
    }))
  }, [])

  // タスク実行開始・完了のイベントリスナー
  useEffect(() => {
    // 実行開始通知のリスナー
    const unsubscribeStart = window.api.backgroundAgent.onTaskExecutionStart((params) => {
      setTaskLoading(params.taskId, true)
    })

    // 実行完了通知のリスナー（拡張された詳細情報を含む）
    const unsubscribeComplete = window.api.backgroundAgent.onTaskNotification((params) => {
      setTaskLoading(params.taskId, false)

      // タスク情報を自動更新
      if (params.success) {
        // 成功時のタスク更新（統計情報も含む）
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === params.taskId
              ? {
                  ...task,
                  runCount: params.runCount || task.runCount,
                  lastRun: params.executedAt,
                  nextRun: params.nextRun || task.nextRun,
                  lastError: undefined
                }
              : task
          )
        )

        // シンプルなトースト通知（OS通知と同様）
        const message = params.aiMessage || t('backgroundAgent.messages.taskExecuted')
        toast.success(`[${params.taskName}]\n ${message}`, { duration: 4000 })
      } else {
        // エラー時のタスク更新
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === params.taskId
              ? {
                  ...task,
                  lastRun: params.executedAt,
                  lastError: params.error
                }
              : task
          )
        )

        // エラー時の詳細トースト通知
        toast.error(
          `${params.taskName}: ${t('backgroundAgent.messages.taskExecutionFailed')}\n` +
            `${t('backgroundAgent.error')}: ${params.error || 'Unknown error'}`,
          { duration: 6000 }
        )
      }
    })

    // タスクスキップ通知のリスナー（重複実行防止など）
    const unsubscribeSkipped = window.api.backgroundAgent.onTaskSkipped((params) => {
      setTaskLoading(params.taskId, false)

      // スキップ理由に応じた通知メッセージを表示
      let skipMessage = ''
      if (params.reason === 'duplicate_execution') {
        const executionTime = params.executionTime ? Math.round(params.executionTime / 1000) : 0
        skipMessage = t('backgroundAgent.messages.taskSkippedDuplicateExecution', {
          executionTime
        })
      } else {
        skipMessage = t('backgroundAgent.messages.taskSkipped', { reason: params.reason })
      }

      toast(`[${params.taskName}]\n ${skipMessage}`, {
        duration: 4000,
        icon: '⏭️'
      })
    })

    return () => {
      unsubscribeStart()
      unsubscribeComplete()
      unsubscribeSkipped()
    }
  }, [setTaskLoading, t])

  // タスク一覧を取得
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await window.api.backgroundAgent.listTasks()
      setTasks(result.tasks || [])
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err)
      setError(err.message || 'Failed to fetch tasks')
      toast.error(t('backgroundAgent.errors.fetchTasks'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  // タスクを作成
  const createTask = useCallback(
    async (config: ScheduleConfig) => {
      try {
        setIsLoading(true)
        const result = await window.api.backgroundAgent.scheduleTask(config)

        if (result.success) {
          toast.success(t('backgroundAgent.messages.taskCreated'))
          await fetchTasks()
          return result.taskId
        } else {
          throw new Error('Failed to create task')
        }
      } catch (err: any) {
        console.error('Failed to create task:', err)
        toast.error(t('backgroundAgent.errors.createTask'))
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [t, fetchTasks]
  )

  // タスクを更新
  const updateTask = useCallback(
    async (taskId: string, config: ScheduleConfig) => {
      try {
        setIsLoading(true)
        const result = await window.api.backgroundAgent.updateTask(taskId, config)

        if (result.success) {
          toast.success(t('backgroundAgent.messages.taskUpdated'))
          await fetchTasks()
          return result.taskId
        } else {
          throw new Error('Failed to update task')
        }
      } catch (err: any) {
        console.error('Failed to update task:', err)
        toast.error(t('backgroundAgent.errors.updateTask'))
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [t, fetchTasks]
  )

  // タスクを削除
  const cancelTask = useCallback(
    async (taskId: string) => {
      try {
        setIsLoading(true)
        const result = await window.api.backgroundAgent.cancelTask(taskId)

        if (result.success) {
          toast.success(t('backgroundAgent.messages.taskCancelled'))
          await fetchTasks()
        } else {
          throw new Error('Failed to cancel task')
        }
      } catch (err: any) {
        console.error('Failed to cancel task:', err)
        toast.error(t('backgroundAgent.errors.cancelTask'))
      } finally {
        setIsLoading(false)
      }
    },
    [t, fetchTasks]
  )

  // タスクの有効/無効を切り替え
  const toggleTask = useCallback(
    async (taskId: string, enabled: boolean) => {
      try {
        setIsLoading(true)
        const result = await window.api.backgroundAgent.toggleTask(taskId, enabled)

        if (result.success) {
          toast.success(
            enabled
              ? t('backgroundAgent.messages.taskEnabled')
              : t('backgroundAgent.messages.taskDisabled')
          )
          await fetchTasks()
        } else {
          throw new Error('Failed to toggle task')
        }
      } catch (err: any) {
        console.error('Failed to toggle task:', err)
        toast.error(t('backgroundAgent.errors.toggleTask'))
      } finally {
        setIsLoading(false)
      }
    },
    [t, fetchTasks]
  )

  // タスクを手動実行
  const executeTaskManually = useCallback(
    async (taskId: string) => {
      try {
        setTaskLoading(taskId, true)
        const result = await window.api.backgroundAgent.executeTaskManually(taskId)

        if (result.result.status === 'success') {
          toast.success(t('backgroundAgent.messages.taskExecuted'))
          await fetchTasks()
          return result.result
        } else {
          throw new Error(result.result.error || 'Task execution failed')
        }
      } catch (err: any) {
        console.error('Failed to execute task manually:', err)
        toast.error(t('backgroundAgent.errors.executeTask'))
        throw err
      } finally {
        setTaskLoading(taskId, false)
      }
    },
    [t, fetchTasks, setTaskLoading]
  )

  // タスクの実行履歴を取得
  const getTaskExecutionHistory = useCallback(
    async (taskId: string): Promise<TaskExecutionResult[]> => {
      try {
        const result = await window.api.backgroundAgent.getTaskExecutionHistory(taskId)
        return result.history || []
      } catch (err: any) {
        console.error('Failed to get task execution history:', err)
        toast.error(t('backgroundAgent.errors.fetchHistory'))
        return []
      }
    },
    [t]
  )

  // セッション履歴を取得
  const getSessionHistory = useCallback(
    async (sessionId: string): Promise<any[]> => {
      try {
        const result = await window.api.backgroundAgent.getSessionHistory(sessionId)
        return result.history || []
      } catch (err: any) {
        console.error('Failed to get session history:', err)
        toast.error(t('backgroundAgent.errors.fetchSessionHistory'))
        return []
      }
    },
    [t]
  )

  // セッションでの会話を継続
  const continueSession = useCallback(
    async (sessionId: string, taskId: string, userMessage: string): Promise<any> => {
      try {
        const result = await window.api.backgroundAgent.continueSession({
          sessionId,
          taskId,
          userMessage,
          options: {
            enableToolExecution: true,
            maxToolExecutions: 5,
            timeoutMs: 300000 // 5分タイムアウト
          }
        })

        toast.success(t('backgroundAgent.messages.sessionContinued'))
        return result
      } catch (err: any) {
        console.error('Failed to continue session:', err)
        // エラーの詳細情報を含むオブジェクトを投げる
        const errorMessage = err.message || 'Unknown error occurred'
        const errorDetails = {
          message: errorMessage,
          stack: err.stack,
          originalError: err
        }

        toast.error(t('backgroundAgent.errors.continueSession'))
        throw errorDetails
      }
    },
    [t]
  )

  // 特定のタスクを取得
  const getTask = useCallback(async (taskId: string): Promise<ScheduledTask | null> => {
    try {
      const result = await window.api.backgroundAgent.getTask(taskId)
      return result.task || null
    } catch (err: any) {
      console.error('Failed to get task:', err)
      return null
    }
  }, [])

  // タスクのシステムプロンプトを取得
  const getTaskSystemPrompt = useCallback(
    async (taskId: string): Promise<string> => {
      try {
        const result = await window.api.backgroundAgent.getTaskSystemPrompt(taskId)
        return result.systemPrompt || ''
      } catch (err: any) {
        console.error('Failed to get task system prompt:', err)
        toast.error(t('backgroundAgent.errors.getSystemPrompt'))
        throw err
      }
    },
    [t]
  )

  // データを更新
  const refreshTasks = useCallback(async () => {
    await fetchTasks()
  }, [fetchTasks])

  const refreshAll = useCallback(async () => {
    await fetchTasks()
  }, [fetchTasks])

  // 初期データ読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchTasks()
    }
    loadInitialData()
  }, [fetchTasks])

  return {
    // Data
    tasks,
    isLoading,
    taskLoadingStates,
    error,

    // Actions
    createTask,
    updateTask,
    cancelTask,
    toggleTask,
    executeTaskManually,
    getTaskExecutionHistory,
    getSessionHistory,
    getTask,
    getTaskSystemPrompt,
    continueSession,

    // Refresh functions
    refreshTasks,
    refreshAll
  }
}
