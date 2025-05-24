/**
 * ListFiles tool implementation
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, ListDirectoryOptions } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ChunkManager } from '../../common/ChunkManager'
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
 * Tool for listing files and directories
 */
export class ListFilesTool extends BaseTool<ListFilesInput, string> {
  readonly name = 'listFiles'
  readonly description = 'List files and directories with optional filtering and chunking'

  /**
   * Validate input
   */
  protected validateInput(input: ListFilesInput): ValidationResult {
    const errors: string[] = []

    if (!input.path) {
      errors.push('Path is required')
    }

    if (typeof input.path !== 'string') {
      errors.push('Path must be a string')
    }

    if (input.options) {
      if (input.options.chunkIndex !== undefined) {
        if (typeof input.options.chunkIndex !== 'number' || input.options.chunkIndex < 1) {
          errors.push('chunkIndex must be a positive number')
        }
      }

      if (input.options.chunkSize !== undefined) {
        if (typeof input.options.chunkSize !== 'number' || input.options.chunkSize < 1) {
          errors.push('chunkSize must be a positive number')
        }
      }

      if (input.options.maxDepth !== undefined) {
        if (typeof input.options.maxDepth !== 'number' || input.options.maxDepth < -1) {
          errors.push('maxDepth must be -1 or a non-negative number')
        }
      }

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
    const agentChatConfig = this.storeManager.get('agentChatConfig') as
      | { ignoreFiles?: string[] }
      | undefined
    const defaultIgnoreFiles = agentChatConfig?.ignoreFiles || []

    const {
      ignoreFiles = defaultIgnoreFiles,
      chunkIndex,
      maxDepth = -1,
      chunkSize,
      recursive
    } = options || {}

    this.logger.debug(`Listing files in directory: ${dirPath}`, {
      options: JSON.stringify({
        chunkIndex,
        maxDepth,
        ignoreFilesCount: ignoreFiles?.length || 0,
        recursive
      })
    })

    try {
      // Build the file tree
      const fileTreeResult = await this.buildFileTree(dirPath, '', ignoreFiles, 0, maxDepth)

      // Handle chunking
      if (chunkIndex !== undefined) {
        const cacheKey = `${dirPath}-${maxDepth}`
        const chunks = await this.chunkManager.getOrCreate('directory', cacheKey, async () =>
          ChunkManager.createDirectoryChunks(fileTreeResult.content, dirPath, chunkSize)
        )

        const chunk = this.chunkManager.getChunk(chunks, chunkIndex)

        this.logger.info(`Returning directory structure chunk ${chunk.index} of ${chunk.total}`, {
          dirPath,
          chunkIndex: chunk.index,
          totalChunks: chunk.total
        })

        return ChunkManager.formatChunkOutput(chunk, 'Directory Structure')
      }

      // Check if chunking is needed
      const chunks = ChunkManager.createDirectoryChunks(fileTreeResult.content, dirPath, chunkSize)

      if (chunks.length === 1) {
        this.logger.info(`Returning complete directory structure`, {
          dirPath,
          singleChunk: true
        })
        return `Directory Structure:\n\n${chunks[0].content}`
      }

      // Return summary for multiple chunks
      this.logger.info(`Returning directory structure summary with ${chunks.length} chunks`, {
        dirPath,
        chunkCount: chunks.length,
        hasMore: fileTreeResult.hasMore
      })

      return this.createChunkSummary(dirPath, chunks.length, maxDepth, fileTreeResult.hasMore)
    } catch (error) {
      this.logger.error(`Error listing directory structure: ${dirPath}`, {
        error: error instanceof Error ? error.message : String(error),
        options: JSON.stringify(options)
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
  ): Promise<{ content: string; hasMore: boolean }> {
    this.logger.debug(`Building file tree for directory: ${dirPath}`, {
      depth,
      maxDepth,
      ignorePatterns: ignoreFiles?.length || 0
    })

    try {
      if (maxDepth !== -1 && depth > maxDepth) {
        this.logger.verbose(`Reached max depth (${maxDepth}) for directory: ${dirPath}`)
        return { content: `${prefix}...\n`, hasMore: true }
      }

      const files = await fs.readdir(dirPath, { withFileTypes: true })
      const matcher = new GitignoreLikeMatcher(ignoreFiles ?? [])
      let result = ''
      let hasMore = false

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
          result += subTree.content
          hasMore = hasMore || subTree.hasMore
        } else {
          result += `${currentPrefix}📄 ${file.name}\n`
        }
      }

      this.logger.debug(`Completed file tree for directory: ${dirPath}`, {
        depth,
        hasMore,
        processedItems: files.length
      })

      return { content: result, hasMore }
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
   * Create chunk summary
   */
  private createChunkSummary(
    dirPath: string,
    totalChunks: number,
    maxDepth: number,
    hasMore: boolean
  ): string {
    const lines = [
      'Directory structure has been split into multiple chunks:',
      `Total Chunks: ${totalChunks}`,
      `Max Depth: ${maxDepth === -1 ? 'unlimited' : maxDepth}`,
      hasMore ? '\nNote: Some directories are truncated due to depth limit.' : '',
      '\nTo retrieve specific chunks, use the listFiles tool with chunkIndex option:',
      'Example usage:',
      '```',
      `listFiles("${dirPath}", { chunkIndex: 1, maxDepth: ${maxDepth} })`,
      '```\n'
    ]

    return lines.filter((line) => line !== '').join('\n')
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
