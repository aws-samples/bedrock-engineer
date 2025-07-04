export const notificationSettings = {
  en: {
    notification: {
      title: 'Notification Settings',
      description: 'Configure desktop notifications for chat responses',
      enable: 'Enable desktop notifications',
      messages: {
        chatComplete: {
          title: 'Task Complete 🎉',
          body: 'AI response has arrived'
        },
        backgroundAgentSuccess: {
          title: 'Background Task Complete ✅',
          body: 'Background agent task completed successfully'
        },
        backgroundAgentError: {
          title: 'Background Task Failed ❌',
          body: 'Background agent task failed to execute'
        }
      }
    }
  },
  ja: {
    notification: {
      title: '通知設定',
      description: 'チャットの応答に関するデスクトップ通知を設定します',
      enable: 'デスクトップ通知を有効にする',
      messages: {
        chatComplete: {
          title: 'タスクが完了しました 🎉',
          body: 'AIからの返信が届きました'
        },
        backgroundAgentSuccess: {
          title: 'バックグラウンドタスク完了 ✅',
          body: 'バックグラウンドエージェントタスクが正常に完了しました'
        },
        backgroundAgentError: {
          title: 'バックグラウンドタスクエラー ❌',
          body: 'バックグラウンドエージェントタスクの実行に失敗しました'
        }
      }
    }
  }
}
