/**
 * ReadFiles tool implementation with line range support
 */

import * as fs from 'fs/promises'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, ReadFileOptions } from '../../base/types'
import { filterByLineRange, validateLineRange, LineRange } from '../../../lib/line-range-utils'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for ReadFilesTool
 */
interface ReadFilesInput {
  type: 'readFiles'
  paths: string[]
  options?: ReadFileOptions
}

/**
 * Individual file read result
 */
interface FileReadResult {
  path: string
  content?: string
  error?: string
  lines?: number
  size?: number
  encoding?: string
  lineRange?: LineRange
}

/**
 * Summary of read operation
 */
interface ReadFilesSummary {
  totalFiles: number
  successfulFiles: number
  failedFiles: number
  totalLines?: number
  totalSize?: number
}

/**
 * Result type for ReadFilesTool
 */
interface ReadFilesResult extends ToolResult {
  name: 'readFiles'
  result: {
    files: FileReadResult[]
    summary: ReadFilesSummary
  }
}

/**
 * Tool for reading file contents with line range support
 */
export class ReadFilesTool extends BaseTool<ReadFilesInput, ReadFilesResult> {
  static readonly toolName = 'readFiles'
  static readonly toolDescription =
    'Read the content of multiple files at the specified paths with line range filtering support. For Excel files, the content is converted to CSV format.'

  readonly name = ReadFilesTool.toolName
  readonly description = ReadFilesTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: ReadFilesTool.toolName,
    description: ReadFilesTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          paths: {
            type: 'array',
            items: {
              type: 'string'
            },
            description:
              'Array of file paths to read. Supports text files and Excel files (.xlsx, .xls).'
          },
          options: {
            type: 'object',
            description: 'Optional configurations for reading files',
            properties: {
              encoding: {
                type: 'string',
                description: 'File encoding (default: utf-8)'
              },
              lines: {
                type: 'object',
                description: 'Line range to read from the file',
                properties: {
                  from: {
                    type: 'number',
                    description: 'Starting line number (1-based, inclusive)'
                  },
                  to: {
                    type: 'number',
                    description: 'Ending line number (1-based, inclusive)'
                  }
                }
              }
            }
          }
        },
        required: ['paths']
      }
    }
  } as const

  /**
   * System prompt description
   */
  static readonly systemPromptDescription =
    'Read content from multiple files simultaneously.\nSupports line range filtering and Excel conversion.'

  /**
   * Validate input
   */
  protected validateInput(input: ReadFilesInput): ValidationResult {
    const errors: string[] = []

    // Basic validation
    if (!input.paths) {
      errors.push('Paths array is required')
    }

    if (!Array.isArray(input.paths)) {
      errors.push('Paths must be an array')
    } else if (input.paths.length === 0) {
      errors.push('At least one path is required')
    } else {
      input.paths.forEach((path, index) => {
        if (typeof path !== 'string') {
          errors.push(`Path at index ${index} must be a string`)
        }
      })
    }

    // Line range validation
    if (input.options?.lines) {
      const lineRangeErrors = validateLineRange(input.options.lines)
      errors.push(...lineRangeErrors)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ReadFilesInput): Promise<ReadFilesResult> {
    const { paths, options } = input

    this.logger.debug(`Reading files`, {
      fileCount: paths.length,
      hasLineRange: !!options?.lines
    })

    const files: FileReadResult[] = []
    let successfulFiles = 0
    let failedFiles = 0
    let totalLines = 0
    let totalSize = 0

    // Read each file individually
    for (const filePath of paths) {
      try {
        this.logger.verbose(`Reading file: ${filePath}`)
        const content = await fs.readFile(filePath, options?.encoding || 'utf-8')
        const formattedContent = this.formatFileContent(content, options)
        const lines = formattedContent.split('\n').length

        files.push({
          path: filePath,
          content: formattedContent,
          lines,
          size: content.length,
          encoding: options?.encoding || 'utf-8',
          lineRange: options?.lines
        })

        successfulFiles++
        totalLines += lines
        totalSize += content.length

        this.logger.verbose(`File read successfully: ${filePath}`, {
          contentLength: content.length,
          lines
        })
      } catch (error) {
        this.logger.error(`Error reading file: ${filePath}`, {
          error: error instanceof Error ? error.message : String(error)
        })

        files.push({
          path: filePath,
          error: error instanceof Error ? error.message : String(error)
        })

        failedFiles++
      }
    }

    const summary: ReadFilesSummary = {
      totalFiles: paths.length,
      successfulFiles,
      failedFiles,
      totalLines: successfulFiles > 0 ? totalLines : undefined,
      totalSize: successfulFiles > 0 ? totalSize : undefined
    }

    this.logger.info(`Read operation completed`, {
      totalFiles: paths.length,
      successfulFiles,
      failedFiles
    })

    return {
      success: successfulFiles > 0,
      name: 'readFiles',
      message:
        failedFiles === 0
          ? `Successfully read ${successfulFiles} file(s)`
          : `Read ${successfulFiles} file(s) successfully, ${failedFiles} file(s) failed`,
      result: {
        files,
        summary
      }
    }
  }

  /**
   * Format file content with header and line range filtering
   */
  private formatFileContent(content: string, options?: ReadFileOptions): string {
    // Apply line range filtering
    const filteredContent = filterByLineRange(content, options?.lines)

    // // Generate line range info for header
    // const lines = content.split('\n')
    // const lineInfo = getLineRangeInfo(lines.length, options?.lines)
    // const header = `File: ${filePath}${lineInfo}\n${'='.repeat(filePath.length + lineInfo.length + 6)}\n`

    return filteredContent
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
