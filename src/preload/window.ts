import { ipcRenderer } from 'electron'

export const window = {
  isFocused: (): Promise<boolean> => ipcRenderer.invoke('window:isFocused')
}
