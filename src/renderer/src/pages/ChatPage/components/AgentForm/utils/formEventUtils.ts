import React from 'react'

/**
 * フォーム関連のイベント処理を統一化するユーティリティ
 */
export const formEventUtils = {
  /**
   * イベント伝播を防止する関数
   */
  preventPropagation: (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return e
  },

  /**
   * イベント伝播を防止しつつ指定したハンドラーを呼び出す関数を返す
   */
  createSafeHandler:
    <T extends React.SyntheticEvent>(handler?: (e: T) => void) =>
    (e: T) => {
      e.preventDefault()
      e.stopPropagation()
      if (handler) {
        handler(e)
      }
    },

  /**
   * イベント伝播を防止しつつ提出処理を行うハンドラーを作成
   */
  createSubmitHandler: (handler: (e: React.FormEvent) => void) => (e: React.FormEvent) => {
    e.stopPropagation()
    handler(e)
  },

  /**
   * タブ切り替えハンドラーを作成
   */
  createTabChangeHandler:
    (
      setActiveTab: (tabId: string) => void,
      tabId: string,
      additionalAction?: () => Promise<void> | void
    ) =>
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setActiveTab(tabId)
      if (additionalAction) {
        await additionalAction()
      }
    }
}
