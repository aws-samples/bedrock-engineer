import { BrowserWindow } from 'electron'
import { createCategoryLogger } from '../../common/logger'

const logger = createCategoryLogger('window-manager')

/**
 * BrowserWindow操作の共通ユーティリティクラス
 * 複数のサービスで重複していたBrowserWindow取得処理を統合
 */
export class WindowManager {
  private static instance: WindowManager
  private activeWindows: Map<number, BrowserWindow> = new Map()

  private constructor() {
    // シングルトンパターン
  }

  public static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager()
    }
    return WindowManager.instance
  }

  /**
   * アクティブなメインウィンドウを取得
   * 複数ファイルで重複していた処理を統合
   */
  public getMainWindow(): BrowserWindow | null {
    const allWindows = BrowserWindow.getAllWindows()
    const mainWindow = allWindows.find((window) => !window.isDestroyed())

    if (!mainWindow || !mainWindow.webContents) {
      logger.warn('No active main window available')
      return null
    }

    return mainWindow
  }

  /**
   * 全ての有効なウィンドウを取得
   */
  public getAllActiveWindows(): BrowserWindow[] {
    return BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed())
  }

  /**
   * 全ての有効なウィンドウにメッセージを送信
   * BackgroundAgentSchedulerで重複していた処理を統合
   */
  public broadcastToAllWindows(channel: string, data: any): number {
    const allWindows = this.getAllActiveWindows()
    let successCount = 0

    for (const window of allWindows) {
      try {
        if (window.webContents && !window.webContents.isDestroyed()) {
          window.webContents.send(channel, data)
          successCount++
        }
      } catch (error: any) {
        logger.error('Failed to send message to window', {
          channel,
          windowId: window.id,
          error: error.message
        })
      }
    }

    logger.debug('Broadcasted message to windows', {
      channel,
      totalWindows: allWindows.length,
      successCount
    })

    return successCount
  }

  /**
   * メインウィンドウにメッセージを送信
   */
  public sendToMainWindow(channel: string, data: any): boolean {
    const mainWindow = this.getMainWindow()

    if (!mainWindow) {
      return false
    }

    try {
      mainWindow.webContents.send(channel, data)
      return true
    } catch (error: any) {
      logger.error('Failed to send message to main window', {
        channel,
        error: error.message
      })
      return false
    }
  }

  /**
   * ウィンドウの状態監視を開始
   */
  public startMonitoring(): void {
    // ウィンドウの作成・破棄イベントを監視して内部状態を更新
    // 必要に応じて実装
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.activeWindows.clear()
  }
}

// デフォルトインスタンスをエクスポート
export const windowManager = WindowManager.getInstance()
