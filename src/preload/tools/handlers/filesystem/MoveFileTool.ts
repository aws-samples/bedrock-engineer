/**
 * MoveFile tool implementation
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'

/**
 * Input type for MoveFileTool
 */
interface MoveFileInput {
  type: 'moveFile'
  source: string
  destination: string
}

/**
 * Tool for moving files
 */
export class MoveFileTool extends BaseTool<MoveFileInput, string> {
  readonly name = 'moveFile'
  readonly description = 'Move a file from source to destination'

  /**
   * Validate input
   */
  protected validateInput(input: MoveFileInput): ValidationResult {
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
  protected async executeInternal(input: MoveFileInput): Promise<string> {
    const { source, destination } = input

    this.logger.debug(`Moving file from ${source} to ${destination}`)

    try {
      // Ensure the destination directory exists
      const destDir = path.dirname(destination)
      await fs.mkdir(destDir, { recursive: true })

      // Move the file
      await fs.rename(source, destination)

      this.logger.info(`File moved successfully`, {
        source,
        destination
      })

      return `File moved: ${source} to ${destination}`
    } catch (error) {
      this.logger.error(`Failed to move file`, {
        source,
        destination,
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error moving file: ${error instanceof Error ? error.message : String(error)}`,
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
