/**
 * ListFiles tool implementation with line range support
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, ListDirectoryOptions } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import {
  filterByLineRange,
  getLineRangeInfo,
  validateLineRange
} from '../../../lib/line-range-utils'
import GitignoreLikeMatcher from '../../../lib/gitignore-like-matcher'

/**
 * Input type for ListFilesTool
 */
interface ListFilesInput {
  type: 'listFiles'
  path: string
  options?: ListDirectoryOptions
}

/**
 * Tool for listing files and directories with line range support
 */
export class ListFilesTool extends BaseTool<ListFilesInput, string> {
  static readonly toolName = 'listFiles'
  static readonly toolDescription =
    'List the entire directory structure, including all subdirectories and files, in a hierarchical format with line range filtering support. Use maxDepth to limit directory depth and lines to filter output.\n\nList directory contents with optional filtering. Use to understand project structure before modifications.'

  readonly name = ListFilesTool.toolName
  readonly description = ListFilesTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: ListFilesTool.toolName,
    description: ListFilesTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The root path to start listing the directory structure from'
          },
          options: {
            type: 'object',
            description: 'Optional configurations for listing files',
            properties: {
              ignoreFiles: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of patterns to ignore when listing files (gitignore format)'
              },
              maxDepth: {
                type: 'number',
                description: 'Maximum depth of directory traversal (-1 for unlimited)'
              },
              recursive: {
                type: 'boolean',
                description: 'Whether to list files recursively'
              },
              lines: {
                type: 'object',
                description: 'Line range to display from the directory listing output',
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
        required: ['path']
      }
    }
  } as const

  /**
   * Validate input
   */
  protected validateInput(input: ListFilesInput): ValidationResult {
    const errors: string[] = []

    // Basic validation
    if (!input.path) {
      errors.push('Path is required')
    }

    if (typeof input.path !== 'string') {
      errors.push('Path must be a string')
    }

    // Options validation
    if (input.options) {
      // Line range validation
      if (input.options.lines) {
        const lineRangeErrors = validateLineRange(input.options.lines)
        errors.push(...lineRangeErrors)
      }

      // maxDepth validation
      if (input.options.maxDepth !== undefined) {
        if (typeof input.options.maxDepth !== 'number' || input.options.maxDepth < -1) {
          errors.push('maxDepth must be -1 or a non-negative number')
        }
      }

      // ignoreFiles validation
      if (input.options.ignoreFiles !== undefined && !Array.isArray(input.options.ignoreFiles)) {
        errors.push('ignoreFiles must be an array')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ListFilesInput): Promise<string> {
    const { path: dirPath, options } = input

    // Get default ignoreFiles from store if not provided
    const agentChatConfig = this.store.get('agentChatConfig') as
      | { ignoreFiles?: string[] }
      | undefined
    const defaultIgnoreFiles = agentChatConfig?.ignoreFiles || []

    const { ignoreFiles = defaultIgnoreFiles, maxDepth = -1 } = options || {}

    this.logger.debug(`Listing files in directory: ${dirPath}`, {
      options: JSON.stringify({
        maxDepth,
        ignoreFilesCount: ignoreFiles?.length || 0,
        hasLineRange: !!options?.lines
      })
    })

    try {
      // Build the file tree
      const fileTree = await this.buildFileTree(dirPath, '', ignoreFiles, 0, maxDepth)

      // Apply line range filtering
      const filteredContent = filterByLineRange(fileTree, options?.lines)

      // Generate line range info (if specified)
      const lines = fileTree.split('\n')
      const lineInfo = getLineRangeInfo(lines.length, options?.lines)

      this.logger.info(`Directory structure listed successfully`, {
        dirPath,
        totalLines: lines.length,
        hasLineRange: !!options?.lines
      })

      return `Directory Structure${lineInfo}:\n\n${filteredContent}`
    } catch (error) {
      this.logger.error(`Error listing directory structure: ${dirPath}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error listing directory structure: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Build file tree recursively
   */
  private async buildFileTree(
    dirPath: string,
    prefix: string = '',
    ignoreFiles?: string[],
    depth: number = 0,
    maxDepth: number = -1
  ): Promise<string> {
    this.logger.debug(`Building file tree for directory: ${dirPath}`, {
      depth,
      maxDepth,
      ignorePatterns: ignoreFiles?.length || 0
    })

    try {
      if (maxDepth !== -1 && depth > maxDepth) {
        this.logger.verbose(`Reached max depth (${maxDepth}) for directory: ${dirPath}`)
        return `${prefix}...\n`
      }

      const files = await fs.readdir(dirPath, { withFileTypes: true })
      const matcher = new GitignoreLikeMatcher(ignoreFiles ?? [])
      let result = ''

      this.logger.verbose(`Processing ${files.length} files/directories in ${dirPath}`)

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isLast = i === files.length - 1
        const currentPrefix = prefix + (isLast ? '└── ' : '├── ')
        const nextPrefix = prefix + (isLast ? '    ' : '│   ')
        const filePath = path.join(dirPath, file.name)
        const relativeFilePath = path.relative(process.cwd(), filePath)

        if (ignoreFiles && ignoreFiles.length && matcher.isIgnored(relativeFilePath)) {
          this.logger.verbose(`Ignoring file/directory: ${relativeFilePath}`)
          continue
        }

        if (file.isDirectory()) {
          result += `${currentPrefix}📁 ${file.name}\n`
          const subTree = await this.buildFileTree(
            filePath,
            nextPrefix,
            ignoreFiles,
            depth + 1,
            maxDepth
          )
          result += subTree
        } else {
          result += `${currentPrefix}📄 ${file.name}\n`
        }
      }

      this.logger.debug(`Completed file tree for directory: ${dirPath}`, {
        depth,
        processedItems: files.length
      })

      return result
    } catch (error) {
      this.logger.error(`Error building file tree for: ${dirPath}`, {
        error: error instanceof Error ? error.message : String(error),
        depth,
        maxDepth
      })

      throw new Error(
        `Error building file tree: ${error instanceof Error ? error.message : String(error)}`
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
