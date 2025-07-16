/**
 * CopyFile tool implementation
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'

/**
 * Input type for CopyFileTool
 */
interface CopyFileInput {
  type: 'copyFile'
  source: string
  destination: string
}

/**
 * Tool for copying files
 */
export class CopyFileTool extends BaseTool<CopyFileInput, string> {
  static readonly toolName = 'copyFile'
  static readonly toolDescription =
    'Copy a file from one location to another. Use this when you need to duplicate a file in the project structure.\n\nCopy files to new locations. Preserves original file content.'

  readonly name = CopyFileTool.toolName
  readonly description = CopyFileTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: CopyFileTool.toolName,
    description: CopyFileTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            description: 'The path of the file to copy'
          },
          destination: {
            type: 'string',
            description: 'The new path for the copied file'
          }
        },
        required: ['source', 'destination']
      }
    }
  } as const

  /**
   * Validate input
   */
  protected validateInput(input: CopyFileInput): ValidationResult {
    const errors: string[] = []

    if (!input.source) {
      errors.push('Source path is required')
    }

    if (typeof input.source !== 'string') {
      errors.push('Source path must be a string')
    }

    if (!input.destination) {
      errors.push('Destination path is required')
    }

    if (typeof input.destination !== 'string') {
      errors.push('Destination path must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: CopyFileInput): Promise<string> {
    const { source, destination } = input

    this.logger.debug(`Copying file from ${source} to ${destination}`)

    try {
      // Ensure the destination directory exists
      const destDir = path.dirname(destination)
      await fs.mkdir(destDir, { recursive: true })

      // Copy the file
      await fs.copyFile(source, destination)

      this.logger.info(`File copied successfully`, {
        source,
        destination
      })

      return `File copied: ${source} to ${destination}`
    } catch (error) {
      this.logger.error(`Failed to copy file`, {
        source,
        destination,
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error copying file: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        { source, destination }
      )
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
