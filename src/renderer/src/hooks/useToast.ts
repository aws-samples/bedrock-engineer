import { toastService, ToastOptions } from '@renderer/services/ToastService'

export const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions) => {
      return toastService.success(message, options)
    },

    error: (message: string, options?: ToastOptions) => {
      return toastService.error(message, options)
    },

    info: (message: string, options?: ToastOptions) => {
      return toastService.info(message, options)
    },

    loading: (message: string, options?: ToastOptions) => {
      return toastService.loading(message, options)
    },

    // ユーティリティメソッド
    dismiss: (toastId?: string) => {
      toastService.dismiss(toastId)
    },

    dismissAll: () => {
      toastService.dismissAll()
    }
  }
}
