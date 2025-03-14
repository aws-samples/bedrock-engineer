export class NotificationService {
  private static instance: NotificationService

  private constructor() {
    // シングルトンパターンのためprivateコンストラクタ
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  public async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    // ウィンドウがフォーカスされている場合は通知を表示しない
    try {
      const isFocused = await window.appWindow?.isFocused?.()
      if (isFocused) {
        return
      }
    } catch (error) {
      console.warn('Failed to check window focus state:', error)
      // エラーが発生した場合は通知を表示する方向で処理を継続
    }

    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser')
      return
    }

    if (Notification.permission !== 'granted') {
      const permitted = await this.requestPermission()
      if (!permitted) {
        console.warn('Notification permission not granted')
        return
      }
    }

    try {
      const defaultOptions: NotificationOptions = {
        body: 'AIからの返信が届きました',
        icon: '/icon.png', // アプリケーションのアイコンを使用
        silent: false, // 通知音を有効化
        ...options
      }

      new Notification(title, defaultOptions)
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  private isSupported(): boolean {
    return 'Notification' in window
  }
}

export const notificationService = NotificationService.getInstance()
