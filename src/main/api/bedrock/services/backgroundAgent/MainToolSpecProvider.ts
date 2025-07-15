import { v4 as uuidv4 } from 'uuid'
import { BrowserWindow, ipcMain } from 'electron'

export class MainToolSpecProvider {
  /**
   * IPC経由でpreloadツール仕様を取得
   */
  async getPreloadToolSpecs(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timeoutMs = 10000 // 10秒タイムアウト
      const requestId = uuidv4()

      const timeout = setTimeout(() => {
        ipcMain.removeAllListeners(`tool-specs-response-${requestId}`)
        reject(new Error('Tool specs request timeout'))
      }, timeoutMs)

      const responseHandler = (_event: any, specs: any[]) => {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-specs-response-${requestId}`, responseHandler)
        resolve(specs)
      }

      ipcMain.once(`tool-specs-response-${requestId}`, responseHandler)

      // 既存のBrowserWindowを取得
      const allWindows = BrowserWindow.getAllWindows()
      const mainWindow = allWindows.find((window) => !window.isDestroyed())

      if (!mainWindow || !mainWindow.webContents) {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-specs-response-${requestId}`, responseHandler)
        resolve([])
        return
      }

      try {
        mainWindow.webContents.send('get-tool-specs-request', { requestId })
      } catch (sendError: any) {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-specs-response-${requestId}`, responseHandler)
        reject(sendError)
      }
    })
  }
}
