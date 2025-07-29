import { ipcRenderer } from 'electron'
import { IPCChannels, IPCParams, IPCResult } from '../types/ipc'

/**
 * 型安全なIPC呼び出し関数
 */
export function createIpcClient() {
  return {
    invoke: <C extends IPCChannels>(channel: C, ...args: any[]): Promise<IPCResult<C>> => {
      return ipcRenderer.invoke(channel, ...args)
    }
  }
}

/**
 * Preload用の型安全なIPC呼び出し関数
 * シンプルで使いやすいAPI
 */
export function ipc<C extends IPCChannels>(
  channel: C,
  params: IPCParams<C>
): Promise<IPCResult<C>> {
  return ipcRenderer.invoke(channel, params) as Promise<IPCResult<C>>
}

// renderer用に公開するAPIオブジェクト
export const ipcClient = createIpcClient()
