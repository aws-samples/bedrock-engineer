/**
 * CreateFolder tool implementation
 */

import * as fs from 'fs/promises'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'

/**
 * Input type for CreateFolderTool
 */
interface CreateFolderInput {
  type: 'createFolder'
  path: string
}

/**
 * Tool for creating folders
 */
export class CreateFolderTool extends BaseTool<CreateFolderInput, string> {
  readonly name = 'createFolder'
  readonly description = 'Create a new folder at the specified path'

  /**
   * Validate input
   */
  protected validateInput(input: CreateFolderInput): ValidationResult {
    const errors: string[] = []

    if (!input.path) {
      errors.push('Path is required')
    }

    if (typeof input.path !== 'string') {
      errors.push('Path must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: CreateFolderInput): Promise<string> {
    const { path } = input

    this.logger.debug(`Creating folder: ${path}`)

    try {
      // Create the folder with recursive option to create parent directories if needed
      await fs.mkdir(path, { recursive: true })

      this.logger.info(`Folder created successfully: ${path}`)
      return `Folder created: ${path}`
    } catch (error) {
      this.logger.error(`Failed to create folder: ${path}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error creating folder: ${error instanceof Error ? error.message : String(error)}`,
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
}
