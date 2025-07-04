import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'
import { notificationService } from '../services/NotificationService'

export const BackgroundAgentNotificationHandler: React.FC = () => {
  const { t } = useTranslation()
  const { notification } = useSettings()

  useEffect(() => {
    // BackgroundAgent通知のイベントリスナーを設定
    const unsubscribe = window.api.backgroundAgent.onTaskNotification((params) => {
      // 通知設定が無効な場合はスキップ
      if (!notification) {
        return
      }

      if (params.success) {
        // 成功通知
        const title = t('notification.messages.backgroundAgentSuccess.title')
        const body = params.aiMessage || t('notification.messages.backgroundAgentSuccess.body')

        notificationService.showNotification(title, {
          body: `[${params.taskName}] ${body}`,
          icon: '/icon.png',
          silent: false
        })
      } else {
        // エラー通知
        const title = t('notification.messages.backgroundAgentError.title')
        const errorMessage = params.error || t('notification.messages.backgroundAgentError.body')

        notificationService.showNotification(title, {
          body: `[${params.taskName}] ${errorMessage}`,
          icon: '/icon.png',
          silent: false
        })
      }
    })

    // クリーンアップ
    return () => {
      unsubscribe()
    }
  }, [t, notification])

  // このコンポーネントは何も表示しない
  return null
}
