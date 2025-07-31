import toast, { Toaster } from 'react-hot-toast'

export type ToastType = 'success' | 'error' | 'loading' | 'info'

export interface ToastOptions {
  duration?: number
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
  style?: React.CSSProperties
  className?: string
  icon?: string | React.ReactElement
  iconTheme?: {
    primary: string
    secondary: string
  }
  ariaProps?: {
    role: 'status' | 'alert'
    'aria-live': 'assertive' | 'off' | 'polite'
  }
}

export class ToastService {
  private static instance: ToastService

  private constructor() {
    // シングルトンパターンのためprivateコンストラクタ
  }

  public static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService()
    }
    return ToastService.instance
  }

  /**
   * 成功メッセージを表示
   */
  public success(message: string, options?: ToastOptions): string {
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
      style: {
        background: '#10B981',
        color: 'white',
        ...options?.style
      },
      ...options
    })
  }

  /**
   * エラーメッセージを表示
   */
  public error(message: string, options?: ToastOptions): string {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      style: {
        background: '#EF4444',
        color: 'white',
        ...options?.style
      },
      ...options
    })
  }

  /**
   * 情報メッセージを表示
   */
  public info(message: string, options?: ToastOptions): string {
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: '#3B82F6',
        color: 'white',
        ...options?.style
      },
      icon: '💡',
      ...options
    })
  }

  /**
   * ローディングメッセージを表示
   */
  public loading(message: string, options?: ToastOptions): string {
    return toast.loading(message, {
      position: options?.position || 'top-right',
      style: {
        background: '#6B7280',
        color: 'white',
        ...options?.style
      },
      ...options
    })
  }

  /**
   * 既存のtoastを更新
   */
  public update(toastId: string, type: ToastType, message: string, options?: ToastOptions): void {
    switch (type) {
      case 'success':
        toast.success(message, {
          id: toastId,
          duration: options?.duration || 3000,
          ...options
        })
        break
      case 'error':
        toast.error(message, {
          id: toastId,
          duration: options?.duration || 5000,
          ...options
        })
        break
      case 'info':
        toast(message, {
          id: toastId,
          duration: options?.duration || 4000,
          ...options
        })
        break
    }
  }

  /**
   * toastを削除
   */
  public dismiss(toastId?: string): void {
    toast.dismiss(toastId)
  }

  /**
   * すべてのtoastを削除
   */
  public dismissAll(): void {
    toast.dismiss()
  }

  /**
   * Toasterコンポーネント設定
   */
  public static getToasterConfig(): React.ComponentProps<typeof Toaster> {
    return {
      position: 'top-right',
      reverseOrder: false,
      gutter: 8,
      containerClassName: '',
      containerStyle: {},
      toastOptions: {
        className: '',
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '14px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px'
        },
        success: {
          duration: 3000,
          style: {
            background: '#10B981'
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff'
          }
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444'
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff'
          }
        }
      }
    }
  }
}

export const toastService = ToastService.getInstance()
