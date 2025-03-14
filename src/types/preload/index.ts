import { FileHandler } from '../../preload/file'

declare global {
  interface Window {
    file: FileHandler
  }
}

export {}
