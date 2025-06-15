import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { notificationService } from '@renderer/services/NotificationService'
import { IdentifiableMessage } from '@/types/chat/message'

interface UseChatNotificationProps {
  notification: boolean
}

export function useChatNotification({ notification }: UseChatNotificationProps) {
  const { t } = useTranslation()

  /**
   * チャット完了時の通知を表示
   */
  const showChatCompleteNotification = useCallback(
    async (messages: IdentifiableMessage[]) => {
      if (!notification) return

      // 最新のアシスタントメッセージを取得
      const lastAssistantMessage = messages.filter((msg) => msg.role === 'assistant').pop()

      // テキストコンテンツを抽出
      let notificationBody = ''
      if (lastAssistantMessage?.content) {
        const textContent = lastAssistantMessage.content
          .filter((content) => 'text' in content)
          .map((content) => (content as { text: string }).text)
          .join(' ')

        // 最初の1-2文を抽出（または最初の100文字程度）
        notificationBody = textContent
          .split(/[.。]/)
          .filter((sentence) => sentence.trim().length > 0)
          .slice(0, 2)
          .join('. ')
          .trim()

        // 長すぎる場合は切り詰める
        if (notificationBody.length > 100) {
          notificationBody = notificationBody.substring(0, 100) + '...'
        }
      }

      // 応答が空の場合はデフォルトメッセージを使用
      if (!notificationBody) {
        notificationBody = t('notification.messages.chatComplete.body')
      }

      await notificationService.showNotification(t('notification.messages.chatComplete.title'), {
        body: notificationBody,
        silent: false // 通知音を有効化
      })
    },
    [notification, t]
  )

  return {
    showChatCompleteNotification
  }
}
