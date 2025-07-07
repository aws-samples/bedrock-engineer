import { Notification, BrowserWindow } from 'electron'
import { createCategoryLogger } from '../../../../common/logger'
import { ServiceContext } from '../types'

const logger = createCategoryLogger('notification-service')

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  silent?: boolean
}

export class MainNotificationService {
  private context: ServiceContext

  constructor(context: ServiceContext) {
    this.context = context
    logger.info('MainNotificationService initialized')
  }

  /**
   * OS通知を表示する
   */
  public async showNotification(options: NotificationOptions): Promise<void> {
    try {
      // 通知設定をstoreから取得
      const notificationEnabled = this.context.store.get('notification') ?? true

      if (!notificationEnabled) {
        logger.debug('Notification disabled by user settings', {
          title: options.title
        })
        return
      }

      // アプリケーションウィンドウがフォーカスされているかチェック
      const isFocused = await this.isAppWindowFocused()
      if (isFocused) {
        logger.debug('App window is focused, skipping notification', {
          title: options.title
        })
        return
      }

      // Electron Notification APIを使用してOS通知を表示
      const notification = new Notification({
        title: options.title,
        body: options.body,
        icon: options.icon,
        silent: options.silent || false
      })

      notification.show()

      logger.info('OS notification displayed', {
        title: options.title,
        bodyLength: options.body.length
      })
    } catch (error: any) {
      logger.error('Failed to show notification', {
        title: options.title,
        error: error.message,
        stack: error.stack
      })
    }
  }

  /**
   * BackgroundAgent タスク用の通知を表示
   */
  public async showBackgroundAgentNotification(params: {
    taskName: string
    success: boolean
    aiMessage?: string
    error?: string
  }): Promise<void> {
    try {
      const { taskName, success, aiMessage, error } = params

      let title: string
      let body: string

      if (success) {
        // 成功通知
        title = 'Background Agent Task Completed' // TODO: i18n対応
        body = aiMessage || 'Task completed successfully'
      } else {
        // エラー通知
        title = 'Background Agent Task Failed' // TODO: i18n対応
        body = error || 'Task execution failed'
      }

      await this.showNotification({
        title,
        body: `[${taskName}] ${body}`,
        icon:
          process.platform === 'darwin'
            ? undefined // macOSではアプリアイコンが自動で使用される
            : 'icon.png', // 他のプラットフォームではアイコンパスを指定
        silent: false
      })
    } catch (error: any) {
      logger.error('Failed to show background agent notification', {
        taskName: params.taskName,
        success: params.success,
        error: error.message
      })
    }
  }

  /**
   * アプリケーションウィンドウがフォーカスされているかチェック
   */
  private async isAppWindowFocused(): Promise<boolean> {
    try {
      const allWindows = BrowserWindow.getAllWindows()
      const mainWindow = allWindows.find((window) => !window.isDestroyed())

      if (!mainWindow) {
        return false
      }

      return mainWindow.isFocused()
    } catch (error: any) {
      logger.warn('Failed to check window focus state', {
        error: error.message
      })
      // エラーが発生した場合は通知を表示する方向で処理
      return false
    }
  }

  /**
   * 通知権限をリクエスト（必要に応じて）
   */
  public async requestPermission(): Promise<boolean> {
    try {
      // Electronでは通常、OS通知の権限は自動的に処理される
      // プラットフォーム固有の処理が必要な場合はここに実装
      logger.debug('Notification permission check (Electron handles this automatically)')
      return true
    } catch (error: any) {
      logger.error('Failed to request notification permission', {
        error: error.message
      })
      return false
    }
  }
}
