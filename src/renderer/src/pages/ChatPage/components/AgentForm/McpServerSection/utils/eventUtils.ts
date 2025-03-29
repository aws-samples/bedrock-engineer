import React from 'react'

/**
 * モーダルを閉じないようにするためのイベントハンドラ
 * @param e イベントオブジェクト
 */
export function preventModalClose(e: React.MouseEvent): void {
  e.preventDefault()
  e.stopPropagation()
}

/**
 * イベントハンドラをラップして preventModalClose を適用する
 * @param handler 元のイベントハンドラ
 * @returns {Function} ラップされたイベントハンドラ
 */
export function withPreventClose<T extends React.MouseEvent>(
  handler: (e: T) => void
): (e: T) => void {
  return (e: T) => {
    preventModalClose(e)
    handler(e)
  }
}
