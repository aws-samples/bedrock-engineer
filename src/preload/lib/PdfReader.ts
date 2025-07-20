/**
 * PDF Reader implementation for extracting text from PDF files
 * Uses IPC to delegate PDF processing to main process
 */

import * as path from 'path'
import { ipcRenderer } from 'electron'
import { LineRange } from './line-range-utils'

/**
 * PDF content with metadata
 */
export interface PdfContent {
  text: string
  totalLines: number
  metadata: {
    pages: number
    title?: string
    author?: string
    creationDate?: Date
    creator?: string
    producer?: string
  }
}

/**
 * PDF reading options
 */
export interface PdfReadOptions {
  lineRange?: LineRange
  cleanupText?: boolean
}

/**
 * PDF Reader class for handling PDF file operations via IPC
 */
export class PdfReader {
  /**
   * Check if the file is a PDF based on file extension
   */
  static isPdfFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    return ext === '.pdf'
  }

  /**
   * Extract text from PDF file with optional line range filtering
   */
  static async extractText(filePath: string, lineRange?: LineRange): Promise<string> {
    // Delegate to main process via IPC
    return await ipcRenderer.invoke('pdf-extract-text', { filePath, lineRange })
  }

  /**
   * Extract text with metadata information
   */
  static async extractTextWithMetadata(filePath: string): Promise<PdfContent> {
    // Delegate to main process via IPC
    return await ipcRenderer.invoke('pdf-extract-metadata', { filePath })
  }

  /**
   * Get basic PDF information without extracting full text
   */
  static async getPdfInfo(
    filePath: string
  ): Promise<{ pages: number; title?: string; author?: string }> {
    // Delegate to main process via IPC
    return await ipcRenderer.invoke('pdf-get-info', { filePath })
  }

  /**
   * Suggest appropriate line range for large PDFs based on token limits
   */
  static suggestLineRange(
    totalLines: number,
    maxTokens: number = 4000
  ): LineRange & { warning?: string } {
    // Estimate approximately 10 tokens per line
    const estimatedTokensPerLine = 10
    const maxLines = Math.floor(maxTokens / estimatedTokensPerLine)

    if (totalLines <= maxLines) {
      return {} // Return entire content
    }

    return {
      from: 1,
      to: maxLines,
      warning: `PDF contains ${totalLines} lines. Showing first ${maxLines} lines. Use 'lines' option to specify different range.`
    }
  }
}
