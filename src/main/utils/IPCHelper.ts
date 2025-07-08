import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { createCategoryLogger } from '../../common/logger'
import { windowManager } from './WindowManager'

const logger = createCategoryLogger('ipc-helper')

export interface IPCRequestOptions {
  timeoutMs?: number
  channel: string
  responseChannel?: string
  data?: any
}

export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * IPC通信の共通ユーティリティクラス
 * タイムアウト付きリクエスト/レスポンス処理を統合
 */
export class IPCHelper {
  private static instance: IPCHelper
  private pendingRequests: Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void; timeout: NodeJS.Timeout }
  > = new Map()

  private constructor() {
    // シングルトンパターン
  }

  public static getInstance(): IPCHelper {
    if (!IPCHelper.instance) {
      IPCHelper.instance = new IPCHelper()
    }
    return IPCHelper.instance
  }

  /**
   * タイムアウト付きIPC リクエスト送信
   * BackgroundAgentServiceで重複していたパターンを統合
   */
  public async sendRequest<T = any>(options: IPCRequestOptions): Promise<T> {
    const { timeoutMs = 10000, channel, responseChannel, data = {} } = options

    const requestId = uuidv4()
    const actualResponseChannel = responseChannel || `${channel}-response`

    return new Promise<T>((resolve, reject) => {
      // タイムアウト設定
      const timeout = setTimeout(() => {
        this.cleanupRequest(requestId)
        reject(new Error(`IPC request timeout after ${timeoutMs}ms for channel: ${channel}`))
      }, timeoutMs)

      // レスポンスハンドラー設定
      const responseHandler = (
        _event: any,
        response: { requestId: string; data: T; error?: string }
      ) => {
        if (response.requestId === requestId) {
          this.cleanupRequest(requestId)

          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response.data)
          }
        }
      }

      // リクエスト情報を保存
      this.pendingRequests.set(requestId, { resolve, reject, timeout })

      // レスポンスリスナー登録
      ipcMain.on(actualResponseChannel, responseHandler)

      // メインウィンドウにリクエスト送信
      const success = windowManager.sendToMainWindow(channel, {
        requestId,
        ...data
      })

      if (!success) {
        this.cleanupRequest(requestId)
        ipcMain.removeListener(actualResponseChannel, responseHandler)
        reject(new Error('No active window available for IPC request'))
      }

      logger.debug('IPC request sent', {
        requestId,
        channel,
        responseChannel: actualResponseChannel,
        timeoutMs
      })
    })
  }

  /**
   * リクエストのクリーンアップ
   */
  private cleanupRequest(_requestId: string): void {
    const request = this.pendingRequests.get(_requestId)
    if (request) {
      clearTimeout(request.timeout)
      this.pendingRequests.delete(_requestId)
    }
  }

  /**
   * 全ての保留中リクエストをキャンセル
   */
  public cancelAllRequests(): void {
    for (const [_requestId, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timeout)
      request.reject(new Error('IPC request cancelled'))
    }
    this.pendingRequests.clear()

    logger.info('All pending IPC requests cancelled')
  }

  /**
   * リソースクリーンアップ
   */
  public cleanup(): void {
    this.cancelAllRequests()
  }

  /**
   * 統計情報取得
   */
  public getStats() {
    return {
      pendingRequests: this.pendingRequests.size
    }
  }
}

// デフォルトインスタンスをエクスポート
export const ipcHelper = IPCHelper.getInstance()
