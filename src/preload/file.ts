import { dialog, ipcRenderer, OpenDialogOptions } from 'electron'

export async function handleFileOpen(options: OpenDialogOptions) {
  const { canceled, filePaths } = await dialog.showOpenDialog(options)
  if (!canceled) {
    return filePaths[0]
  }
  return undefined
}

export const file = {
  handleFileOpen: () => ipcRenderer.invoke('open-file'),
  handleFolderOpen: () => ipcRenderer.invoke('open-directory'),
  getLocalImage: (path: string) => ipcRenderer.invoke('get-local-image', path)
}

export type FileHandler = typeof file
