/**
 * DOCX handlers for main process
 */

import { IpcMainInvokeEvent } from 'electron'
import * as path from 'path'
import mammoth from 'mammoth'
import { log } from '../../common/logger'

export interface LineRange {
  from?: number
  to?: number
}

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
 * Clean up extracted DOCX text
 * - Normalize line endings
 * - Remove excessive empty lines
 * - Trim whitespace
 */
function cleanupText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize Windows line endings
    .replace(/\r/g, '\n') // Normalize Mac line endings
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive empty lines to 2
    .replace(/[ \t]+$/gm, '') // Remove trailing whitespace from lines
    .trim() // Remove leading/trailing whitespace
}

/**
 * Apply line range filtering to text content
 */
function filterByLineRange(content: string, lineRange?: LineRange): string {
  if (!lineRange) return content

  const lines = content.split('\n')
  const from = Math.max(1, lineRange.from || 1)
  const to = Math.min(lines.length, lineRange.to || lines.length)

  // Convert 1-based to 0-based array indices and slice
  return lines.slice(from - 1, to).join('\n')
}

/**
 * Check if the file is a DOCX based on file extension
 */
function isDocxFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return ext === '.docx'
}

/**
 * Validate DOCX file path
 */
function validateDocxFile(filePath: string): void {
  if (!isDocxFile(filePath)) {
    throw new Error(`File ${filePath} is not a DOCX file`)
  }
}

/**
 * Calculate basic statistics from text
 */
function calculateTextStatistics(text: string): { wordCount: number; characterCount: number } {
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
  const characterCount = text.length
  return { wordCount, characterCount }
}

export const docxHandlers = {
  /**
   * Extract text from DOCX file with optional line range filtering
   */
  'docx-extract-text': async (
    _event: IpcMainInvokeEvent,
    { filePath, lineRange }: { filePath: string; lineRange?: LineRange }
  ): Promise<string> => {
    log.info('Extracting text from DOCX', { filePath, hasLineRange: !!lineRange })

    try {
      validateDocxFile(filePath)

      const result = await mammoth.extractRawText({ path: filePath })

      if (result.messages.length > 0) {
        log.warn('DOCX extraction warnings', {
          filePath,
          warnings: result.messages.map((m) => m.message)
        })
      }

      const cleanedText = cleanupText(result.value)
      const filteredResult = filterByLineRange(cleanedText, lineRange)

      log.info('DOCX text extraction successful', {
        filePath,
        originalLength: cleanedText.length,
        filteredLength: filteredResult.length,
        warningCount: result.messages.length
      })

      return filteredResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error('DOCX text extraction failed', {
        filePath,
        error: errorMessage
      })
      throw new Error(`Failed to extract text from DOCX ${filePath}: ${errorMessage}`)
    }
  },

  /**
   * Extract text with metadata from DOCX file
   */
  'docx-extract-metadata': async (
    _event: IpcMainInvokeEvent,
    { filePath }: { filePath: string }
  ): Promise<DocxContent> => {
    log.info('Extracting DOCX metadata', { filePath })

    try {
      validateDocxFile(filePath)

      const result = await mammoth.extractRawText({ path: filePath })
      const cleanedText = cleanupText(result.value)
      const lines = cleanedText.split('\n')

      // Calculate basic statistics
      const { wordCount, characterCount } = calculateTextStatistics(cleanedText)

      const docxContent: DocxContent = {
        text: cleanedText,
        totalLines: lines.length,
        metadata: {
          wordCount,
          characterCount
          // Note: mammoth has limited metadata extraction capabilities
          // For more comprehensive metadata (title, author, dates),
          // we would need additional libraries like officegen-docx
        }
      }

      log.info('DOCX metadata extraction successful', {
        filePath,
        totalLines: docxContent.totalLines,
        wordCount: docxContent.metadata.wordCount,
        characterCount: docxContent.metadata.characterCount
      })

      return docxContent
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error('DOCX metadata extraction failed', {
        filePath,
        error: errorMessage
      })
      throw new Error(`Failed to parse DOCX file ${filePath}: ${errorMessage}`)
    }
  },

  /**
   * Get basic DOCX information without extracting full text
   */
  'docx-get-info': async (
    _event: IpcMainInvokeEvent,
    { filePath }: { filePath: string }
  ): Promise<{ title?: string; author?: string; wordCount?: number }> => {
    log.info('Getting DOCX info', { filePath })

    try {
      validateDocxFile(filePath)

      // Extract only a portion of text for estimation to avoid processing large files
      const result = await mammoth.extractRawText({ path: filePath })
      const text = cleanupText(result.value)

      // Estimate word count from the first 2000 characters
      const sampleText = text.substring(0, 2000)
      const sampleWordCount = sampleText.split(/\s+/).filter((word) => word.length > 0).length

      // Estimate total word count based on the ratio
      const estimatedWordCount = Math.round((sampleWordCount * text.length) / sampleText.length)

      const info = {
        wordCount: estimatedWordCount
        // Note: title and author extraction would require additional parsing
        // mammoth focuses on content extraction rather than document properties
      }

      log.info('DOCX info extraction successful', {
        filePath,
        estimatedWordCount
      })

      return info
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error('DOCX info extraction failed', {
        filePath,
        error: errorMessage
      })
      throw new Error(`Failed to get DOCX info for ${filePath}: ${errorMessage}`)
    }
  },

  /**
   * Check if file is a DOCX
   */
  'docx-is-docx-file': async (
    _event: IpcMainInvokeEvent,
    { filePath }: { filePath: string }
  ): Promise<boolean> => {
    return isDocxFile(filePath)
  }
} as const
