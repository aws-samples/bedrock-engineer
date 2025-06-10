/**
 * WriteToFile tool implementation
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for WriteToFileTool
 */
interface WriteToFileInput {
  type: 'writeToFile'
  path: string
  content: string
}

/**
 * Result type for WriteToFileTool
 */
interface WriteToFileResult extends ToolResult {
  name: 'writeToFile'
  result: {
    path: string
    contentLength: number
    content: string
  }
}

/**
 * Tool for writing content to files
 */
export class WriteToFileTool extends BaseTool<WriteToFileInput, WriteToFileResult> {
  static readonly toolName = 'writeToFile'
  static readonly toolDescription =
    'Write content to an existing file at the specified path. Use this when you need to add or update content in an existing file.'

  readonly name = WriteToFileTool.toolName
  readonly description = WriteToFileTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: WriteToFileTool.toolName,
    description: WriteToFileTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path of the file to write to'
          },
          content: {
            type: 'string',
            description: 'The content to write to the file'
          }
        },
        required: ['path', 'content']
      }
    }
  } as const

  /**
   * System prompt description
   */
  static readonly systemPromptDescription =
    'Write content to files in your project.\nAlways provide complete file content.'

  /**
   * Validate input
   */
  protected validateInput(input: WriteToFileInput): ValidationResult {
    const errors: string[] = []

    if (!input.path) {
      errors.push('Path is required')
    }

    if (typeof input.path !== 'string') {
      errors.push('Path must be a string')
    }

    if (input.content === undefined || input.content === null) {
      errors.push('Content is required')
    }

    if (typeof input.content !== 'string') {
      errors.push('Content must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: WriteToFileInput): Promise<WriteToFileResult> {
    const { path: filePath, content } = input

    this.logger.debug(`Writing to file: ${filePath}`, {
      contentLength: content.length
    })

    try {
      // Ensure the directory exists
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })

      // Write the file
      await fs.writeFile(filePath, content, 'utf-8')

      this.logger.info(`Content written to file: ${filePath}`, {
        contentLength: content.length
      })

      return {
        success: true,
        name: 'writeToFile',
        message: `Content written to file: ${filePath}`,
        result: {
          path: filePath,
          contentLength: content.length,
          content
        }
      }
    } catch (error) {
      this.logger.error(`Failed to write to file: ${filePath}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error writing to file: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize content for logging
   */
  protected sanitizeInputForLogging(input: WriteToFileInput): any {
    return {
      ...input,
      content: this.truncateForLogging(input.content, 200)
    }
  }
}
