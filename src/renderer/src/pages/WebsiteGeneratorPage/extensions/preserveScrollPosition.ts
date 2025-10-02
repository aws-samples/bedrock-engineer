import { EditorView } from '@codemirror/view'
import { Extension } from '@codemirror/state'

/**
 * CodeMirror extension to preserve scroll position during code updates
 *
 * This extension tracks the user's scroll position and restores it after
 * document changes, allowing users to freely scroll while code is being
 * generated in real-time.
 *
 * @returns CodeMirror Extension
 */
export const preserveScrollPosition = (): Extension => {
  let scrollPos: { top: number; left: number } | null = null

  return [
    EditorView.domEventHandlers({
      scroll(_event, view) {
        // ユーザーのスクロール操作を記録
        scrollPos = {
          top: view.scrollDOM.scrollTop,
          left: view.scrollDOM.scrollLeft
        }
        return false
      }
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && scrollPos) {
        // ドキュメント変更時にスクロール位置を復元
        requestAnimationFrame(() => {
          if (scrollPos) {
            update.view.scrollDOM.scrollTop = scrollPos.top
            update.view.scrollDOM.scrollLeft = scrollPos.left
          }
        })
      }
    })
  ]
}
