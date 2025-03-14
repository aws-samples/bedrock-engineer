import { ipcRenderer } from 'electron'

export const appWindow = {
  isFocused: (): Promise<boolean> => ipcRenderer.invoke('window:isFocused')
}
