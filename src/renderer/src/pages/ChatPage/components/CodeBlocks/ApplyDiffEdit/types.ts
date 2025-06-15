/**
 * Props for the DiffViewer component
 */
export interface DiffViewerProps {
  originalText: string
  updatedText: string
  filePath: string
  language?: string
}

/**
 * Props for ApplyDiffEditResult component
 */
export interface ApplyDiffEditResultProps {
  response: {
    success: boolean
    error?: string
    result?: {
      path: string
      originalText: string
      updatedText: string
    }
  }
}
