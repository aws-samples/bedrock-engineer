// Add a preload type declaration for ipcRenderer
import { IpcRenderer } from 'electron'

declare global {
  interface Window {
    ipcRenderer?: {
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
      removeListener: (channel: string, listener: (...args: any[]) => void) => void
    }
    appWindow?: {
      isFocused: () => Promise<boolean>
    }
  }
}
