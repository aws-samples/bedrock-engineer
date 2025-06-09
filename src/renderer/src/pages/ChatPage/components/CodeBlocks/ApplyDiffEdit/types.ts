/**
 * Types for ApplyDiffEdit tool result visualization
 */

export interface ApplyDiffEditToolResult {
  name: 'applyDiffEdit'
  success: boolean
  message?: string
  error?: string
  result: {
    path: string
    originalText: string
    updatedText: string
  } | null
}

export interface DiffViewerProps {
  originalText: string
  updatedText: string
  filePath: string
  language?: string
}

export interface ApplyDiffEditResultProps {
  result: ApplyDiffEditToolResult
}
