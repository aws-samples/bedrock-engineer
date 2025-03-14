import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ElectronAPI } from '@electron-toolkit/preload'
import { chatHistory } from '../preload/chat-history'
import { ConfigStore } from '../preload/store'
import { FileHandler } from '../preload/file'
import { API } from '../preload/api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
    store: ConfigStore
    file: FileHandler
    tools: Tool[]
    chatHistory: typeof chatHistory
    appWindow: {
      isFocused: () => Promise<boolean>
    }
  }
}
