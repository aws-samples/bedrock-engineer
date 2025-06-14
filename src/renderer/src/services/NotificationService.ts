export class NotificationService {
  private static instance: NotificationService

  private constructor() {
    // シングルトンパターンのためprivateコンストラクタ
    this.setupIpcListeners();
  }

  // IPC通信のリスナー設定
  private setupIpcListeners() {
    if (window.ipcRenderer) {
      window.ipcRenderer.on('show-notification', (_, data) => {
        if (data?.title && data?.message) {
          this.showWarningNotification(data.title, data.message);
        }
      });
    }
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
  
  /**
   * 警告通知を表示（特にトークン制限など）
   */
  public async showWarningNotification(title: string, message: string): Promise<void> {
    // アプリがフォーカスされているかにかかわらず通知を表示
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
      const options: NotificationOptions = {
        body: message,
        icon: '/icon.png',
        silent: false,
        tag: 'warning-notification', // 同じ種類の通知を重複表示しないためのタグ
        requireInteraction: true // ユーザーが操作するまで通知を閉じない
      }

      new Notification(title, options)
      
      // アプリ内でもトーストや警告UIを表示するため、カスタムイベントを発行
      window.dispatchEvent(
        new CustomEvent('app-warning', { 
          detail: { title, message, type: 'token-limit' }
        })
      )
    } catch (error) {
      console.error('Error showing warning notification:', error)
    }
  }
}

export const notificationService = NotificationService.getInstance()
