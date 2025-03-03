interface Window {
  appWindow: {
    isFocused: () => Promise<boolean>
  }
}
