import React from 'react'

/**
 * クリックイベントの伝播を停止する
 */
export const stopPropagation = (e: React.SyntheticEvent): void => {
  e.stopPropagation()
}

/**
 * クリックイベントとデフォルト動作を停止する
 */
export const preventEventPropagation = (e: React.SyntheticEvent): void => {
  e.preventDefault()
  e.stopPropagation()
}

/**
 * マウスダウンとイベント伝播を停止する（ドラッグ防止用）
 */
export const preventMouseDownPropagation = (e: React.MouseEvent): void => {
  e.preventDefault()
  e.stopPropagation()
}

/**
 * クリックイベント用のラッパー関数を作成
 * @param handler 実行するハンドラー関数
 * @param preventDefault デフォルト動作を防止するかどうか（デフォルト: false）
 */
export const createClickHandler = <T extends (e: React.MouseEvent) => void>(
  handler: T,
  preventDefault: boolean = false
): ((e: React.MouseEvent) => void) => {
  return (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (preventDefault) {
      e.preventDefault()
    }
    handler(e)
  }
}
