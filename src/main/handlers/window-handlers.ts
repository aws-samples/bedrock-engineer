import { IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

// グローバルなタスク履歴ウィンドウの参照
let taskHistoryWindow: BrowserWindow | null = null

/**
 * タスク履歴ウィンドウを強制終了する
 * アプリケーション終了時に呼び出される
 */
export const forceCloseTaskHistoryWindow = (): void => {
  console.log('Force closing task history window...')

  if (taskHistoryWindow && !taskHistoryWindow.isDestroyed()) {
    try {
      // closeイベントリスナーを削除してデフォルトの閉じる動作を復元
      taskHistoryWindow.removeAllListeners('close')

      // ウィンドウを強制終了
      taskHistoryWindow.close()

      console.log('Task history window force closed successfully')
    } catch (error) {
      console.error('Failed to force close task history window:', error)

      // エラーが発生した場合はdestroy()で強制破棄
      try {
        taskHistoryWindow.destroy()
        console.log('Task history window destroyed as fallback')
      } catch (destroyError) {
        console.error('Failed to destroy task history window:', destroyError)
      }
    }

    taskHistoryWindow = null
  } else {
    console.log('No task history window to close')
  }
}

/**
 * タスク履歴ウィンドウをプリロードする
 * アプリ起動時に非表示で事前作成しておく
 */
export const preloadTaskHistoryWindow = async (): Promise<void> => {
  console.log('Preloading task history window...')

  try {
    // すでにプリロード済みの場合はスキップ
    if (taskHistoryWindow && !taskHistoryWindow.isDestroyed()) {
      console.log('Task history window already preloaded')
      return
    }

    // プリロード用のウィンドウを作成（非表示）
    taskHistoryWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      parent: undefined,
      modal: false,
      show: false, // 非表示で作成
      alwaysOnTop: false,
      skipTaskbar: true, // プリロード中はタスクバーに表示しない
      autoHideMenuBar: true,
      title: 'Task Execution History',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        devTools: true
      }
    })

    // ダミーURLでページを読み込み（React アプリケーションの初期化）
    const dummyUrl =
      is.dev && process.env['ELECTRON_RENDERER_URL']
        ? `${process.env['ELECTRON_RENDERER_URL']}#/background-agent/task-history/preload`
        : `file://${join(__dirname, '../renderer/index.html')}#/background-agent/task-history/preload`

    await taskHistoryWindow.loadURL(dummyUrl)

    // ウィンドウが閉じられる時の処理（隠すのみ）
    taskHistoryWindow.on('close', (event) => {
      console.log('Task history window close requested - hiding instead')
      event.preventDefault() // デフォルトの閉じる動作をキャンセル
      taskHistoryWindow!.hide()
      taskHistoryWindow!.setSkipTaskbar(true) // タスクバーからも隠す
    })

    // ウィンドウが実際に破棄された時の処理
    taskHistoryWindow.on('closed', () => {
      console.log('Task history window actually destroyed')
      taskHistoryWindow = null
    })

    // プリロード完了のログ
    taskHistoryWindow.webContents.once('did-finish-load', () => {
      console.log('Task history window preload completed')
    })

    console.log('Task history window preload initiated')
  } catch (error) {
    console.error('Failed to preload task history window:', error)
    if (taskHistoryWindow) {
      taskHistoryWindow.destroy()
      taskHistoryWindow = null
    }
  }
}

export const windowHandlers = {
  'window:isFocused': async (event: IpcMainInvokeEvent) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isFocused() ?? false
  },

  'window:openTaskHistory': async (_event: IpcMainInvokeEvent, taskId: string) => {
    console.log('Opening task history window for taskId:', taskId)

    // Build URL for the task history page
    const taskHistoryUrl =
      is.dev && process.env['ELECTRON_RENDERER_URL']
        ? `${process.env['ELECTRON_RENDERER_URL']}#/background-agent/task-history/${taskId}`
        : `file://${join(__dirname, '../renderer/index.html')}#/background-agent/task-history/${taskId}`

    console.log('Target URL:', taskHistoryUrl)

    // Check if task history window already exists and is not destroyed
    if (taskHistoryWindow && !taskHistoryWindow.isDestroyed()) {
      console.log('Using preloaded/existing task history window')

      try {
        // If window was preloaded and hidden, enable taskbar display before showing
        if (!taskHistoryWindow.isVisible()) {
          taskHistoryWindow.setSkipTaskbar(false)
        }

        // Update URL to show new task (much faster than creating new window)
        await taskHistoryWindow.loadURL(taskHistoryUrl)

        // Show and focus the window
        taskHistoryWindow.show()
        taskHistoryWindow.focus()

        console.log('Preloaded window updated with new task:', taskId)
        return { success: true, windowId: taskHistoryWindow.id, reused: true, preloaded: true }
      } catch (error) {
        console.error('Failed to update preloaded window:', error)
        // If update fails, destroy the old window and create a new one
        taskHistoryWindow.destroy()
        taskHistoryWindow = null
      }
    }

    // Create new task history window (fallback if preload failed)
    console.log('Creating new task history window (preload not available)')

    taskHistoryWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      parent: undefined,
      modal: false,
      show: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      autoHideMenuBar: true,
      title: 'Task Execution History',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        devTools: true
      }
    })

    try {
      await taskHistoryWindow.loadURL(taskHistoryUrl)
      console.log('URL loaded successfully')
    } catch (error) {
      console.error('Failed to load URL:', error)
      taskHistoryWindow.destroy()
      taskHistoryWindow = null
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    // Open DevTools in development mode for debugging
    if (is.dev) {
      taskHistoryWindow.webContents.openDevTools({ mode: 'right' })
    }

    // Show window immediately since preload wasn't available
    taskHistoryWindow.show()

    // ウィンドウが閉じられる時の処理（隠すのみ）
    taskHistoryWindow.on('close', (event) => {
      console.log('Task history window close requested - hiding instead')
      event.preventDefault() // デフォルトの閉じる動作をキャンセル
      taskHistoryWindow!.hide()
      taskHistoryWindow!.setSkipTaskbar(true) // タスクバーからも隠す
    })

    // ウィンドウが実際に破棄された時の処理
    taskHistoryWindow.on('closed', () => {
      console.log('Task history window actually destroyed')
      taskHistoryWindow = null

      // Preload a new window for next time (background task)
      setTimeout(() => {
        preloadTaskHistoryWindow().catch((err) => {
          console.error('Failed to preload task history window after close:', err)
        })
      }, 2000) // 2秒後にプリロード
    })

    // Log when window is actually shown
    taskHistoryWindow.on('show', () => {
      console.log('Task history window is now visible')
    })

    return { success: true, windowId: taskHistoryWindow.id, reused: false, preloaded: false }
  }
} as const
