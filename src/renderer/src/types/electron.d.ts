interface Window {
  electron: ElectronAPI
  api: typeof api
  store: typeof store
  file: typeof file
  tools: typeof tools
  chatHistory: typeof chatHistory
  appWindow: {
    isFocused: () => Promise<boolean>
  }
}
