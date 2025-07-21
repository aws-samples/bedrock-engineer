/**
 * DOCX Reader implementation for extracting text from DOCX files
 * Uses IPC to delegate DOCX processing to main process
 */

import * as path from 'path'
import { ipcRenderer } from 'electron'
import { LineRange } from './line-range-utils'

/**
 * DOCX content with metadata
 */
export interface DocxContent {
  text: string
  totalLines: number
  metadata: {
    title?: string
    author?: string
    creationDate?: Date
    modifiedDate?: Date
    wordCount?: number
    characterCount?: number
  }
}

/**
 * DOCX reading options
 */
export interface DocxReadOptions {
  lineRange?: LineRange
  cleanupText?: boolean
}

/**
 * DOCX Reader class for handling DOCX file operations via IPC
 */
export class DocxReader {
  /**
   * Check if the file is a DOCX based on file extension
   */
  static isDocxFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    return ext === '.docx'
  }

  /**
   * Extract text from DOCX file with optional line range filtering
   */
  static async extractText(filePath: string, lineRange?: LineRange): Promise<string> {
    // Delegate to main process via IPC
    return await ipcRenderer.invoke('docx-extract-text', { filePath, lineRange })
  }

  /**
   * Extract text with metadata information
   */
  static async extractTextWithMetadata(filePath: string): Promise<DocxContent> {
    // Delegate to main process via IPC
    return await ipcRenderer.invoke('docx-extract-metadata', { filePath })
  }

  /**
   * Get basic DOCX information without extracting full text
   */
  static async getDocxInfo(
    filePath: string
  ): Promise<{ title?: string; author?: string; wordCount?: number }> {
    // Delegate to main process via IPC
    return await ipcRenderer.invoke('docx-get-info', { filePath })
  }

  /**
   * Suggest appropriate line range for large DOCX files based on token limits
   */
  static suggestLineRange(
    totalLines: number,
    maxTokens: number = 4000
  ): LineRange & { warning?: string } {
    // DOCXは通常PDFより密度が高いため、8トークン/行と仮定
    const estimatedTokensPerLine = 8
    const maxLines = Math.floor(maxTokens / estimatedTokensPerLine)

    if (totalLines <= maxLines) {
      return {} // Return entire content
    }

    return {
      from: 1,
      to: maxLines,
      warning: `DOCX contains ${totalLines} lines. Showing first ${maxLines} lines. Use 'lines' option to specify different range.`
    }
  }
}
