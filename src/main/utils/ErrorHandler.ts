import { createCategoryLogger } from '../../common/logger'

export interface ErrorContext {
  operation: string
  component: string
  metadata?: Record<string, any>
}

export interface ErrorLogOptions {
  logLevel?: 'error' | 'warn' | 'info'
  includeStack?: boolean
  notify?: boolean
}

/**
 * 統一されたエラーハンドリングユーティリティ
 * 複数のサービスで重複していたエラーログ処理を統合
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private loggers: Map<string, any> = new Map()

  private constructor() {
    // シングルトンパターン
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * コンポーネント用のロガーを取得またはキャッシュ
   */
  private getLogger(component: string) {
    if (!this.loggers.has(component)) {
      this.loggers.set(component, createCategoryLogger(component))
    }
    return this.loggers.get(component)
  }

  /**
   * 統一されたエラーログ出力
   * try-catchブロックで重複していたパターンを統合
   */
  public logError(
    error: Error | unknown,
    context: ErrorContext,
    options: ErrorLogOptions = {}
  ): void {
    const { logLevel = 'error', includeStack = true, notify = false } = options

    const logger = this.getLogger(context.component)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error && includeStack ? error.stack : undefined

    const logData = {
      operation: context.operation,
      error: errorMessage,
      ...(errorStack && { stack: errorStack }),
      ...(context.metadata && { ...context.metadata })
    }

    // ログレベルに応じて出力
    switch (logLevel) {
      case 'error':
        logger.error(`${context.operation} failed`, logData)
        break
      case 'warn':
        logger.warn(`${context.operation} warning`, logData)
        break
      case 'info':
        logger.info(`${context.operation} info`, logData)
        break
    }

    // 通知が必要な場合（将来的に実装）
    if (notify) {
      // NotificationServiceへの通知処理
    }
  }

  /**
   * 非同期操作のエラーハンドリング
   */
  public async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: ErrorLogOptions & { defaultValue?: T } = {}
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      this.logError(error, context, options)
      return options.defaultValue
    }
  }

  /**
   * 同期操作のエラーハンドリング
   */
  public handleSyncOperation<T>(
    operation: () => T,
    context: ErrorContext,
    options: ErrorLogOptions & { defaultValue?: T } = {}
  ): T | undefined {
    try {
      return operation()
    } catch (error) {
      this.logError(error, context, options)
      return options.defaultValue
    }
  }

  /**
   * Promise.allSettled の結果を処理
   */
  public handleSettledResults<T>(
    results: PromiseSettledResult<T>[],
    context: ErrorContext,
    options: ErrorLogOptions = {}
  ): T[] {
    const successfulResults: T[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value)
      } else {
        this.logError(
          result.reason,
          {
            ...context,
            operation: `${context.operation} (item ${index})`,
            metadata: {
              ...context.metadata,
              index
            }
          },
          options
        )
      }
    })

    return successfulResults
  }

  /**
   * カスタムエラークラス作成
   */
  public createError(
    message: string,
    code: string,
    context?: ErrorContext
  ): Error & { code: string; context?: ErrorContext } {
    const error = new Error(message) as Error & { code: string; context?: ErrorContext }
    error.code = code
    error.context = context
    return error
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.loggers.clear()
  }
}

// デフォルトインスタンスをエクスポート
export const errorHandler = ErrorHandler.getInstance()
