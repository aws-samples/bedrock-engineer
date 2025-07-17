/**
 * CreateFolder tool implementation
 */

import * as fs from 'fs/promises'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
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
  static readonly toolName = 'createFolder'
  static readonly toolDescription =
    'Create a new folder at the specified path. Use this when you need to create a new directory in the project structure.\n\nCreate directories in your project. Use absolute paths starting from {{projectPath}}.'

  readonly name = CreateFolderTool.toolName
  readonly description = CreateFolderTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: CreateFolderTool.toolName,
    description: CreateFolderTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path where the folder should be created'
          }
        },
        required: ['path']
      }
    }
  } as const

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
