import { IToolDescriptionProvider } from '../../../../../common/agents/toolDescriptionProvider'
import { v4 as uuidv4 } from 'uuid'
import { BrowserWindow, ipcMain } from 'electron'

export class MainToolDescriptionProvider implements IToolDescriptionProvider {
  descriptions = this.getPreloadToolDescriptions()

  async getToolDescription(toolName: string): Promise<string> {
    const descriptions = await this.descriptions
    return descriptions[toolName]
  }

  /**
   * IPC経由でpreloadツール説明を取得
   */
  private async getPreloadToolDescriptions(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      const timeoutMs = 10000 // 10秒タイムアウト
      const requestId = uuidv4()

      const timeout = setTimeout(() => {
        ipcMain.removeAllListeners(`tool-descriptions-response-${requestId}`)
        reject(new Error('Tool descriptions request timeout'))
      }, timeoutMs)

      const responseHandler = (_event: any, descriptions: Record<string, string>) => {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-descriptions-response-${requestId}`, responseHandler)
        resolve(descriptions)
      }

      ipcMain.once(`tool-descriptions-response-${requestId}`, responseHandler)

      // 既存のBrowserWindowを取得
      const allWindows = BrowserWindow.getAllWindows()
      const mainWindow = allWindows.find((window) => !window.isDestroyed())

      if (!mainWindow || !mainWindow.webContents) {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-descriptions-response-${requestId}`, responseHandler)
        resolve({})
        return
      }

      try {
        mainWindow.webContents.send('get-tool-descriptions-request', { requestId })
      } catch (sendError: any) {
        clearTimeout(timeout)
        ipcMain.removeListener(`tool-descriptions-response-${requestId}`, responseHandler)
        reject(sendError)
      }
    })
  }
}
