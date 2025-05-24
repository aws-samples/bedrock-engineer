/**
 * ReadFiles tool implementation
 */

import * as fs from 'fs/promises'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult, ReadFileOptions } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ChunkManager } from '../../common/ChunkManager'

/**
 * Input type for ReadFilesTool
 */
interface ReadFilesInput {
  type: 'readFiles'
  paths: string[]
  options?: ReadFileOptions
}

/**
 * Tool for reading file contents
 */
export class ReadFilesTool extends BaseTool<ReadFilesInput, string> {
  readonly name = 'readFiles'
  readonly description = 'Read contents of specified files with optional chunking support'

  /**
   * Validate input
   */
  protected validateInput(input: ReadFilesInput): ValidationResult {
    const errors: string[] = []

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
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ReadFilesInput): Promise<string> {
    const { paths, options } = input
    const { chunkIndex, chunkSize } = options || {}

    this.logger.debug(`Reading files`, {
      fileCount: paths.length,
      chunkIndex,
      chunkSize
    })

    // Single file handling
    if (paths.length === 1) {
      return this.readSingleFile(paths[0], options)
    }

    // Multiple files handling
    return this.readMultipleFiles(paths, options)
  }

  /**
   * Read a single file with optional chunking
   */
  private async readSingleFile(filePath: string, options?: ReadFileOptions): Promise<string> {
    this.logger.debug(`Reading single file: ${filePath}`)

    try {
      const content = await fs.readFile(filePath, options?.encoding || 'utf-8')

      this.logger.debug(`File read successfully: ${filePath}`, {
        contentLength: content.length
      })

      // Handle chunking if requested
      if (options?.chunkIndex) {
        const chunks = await this.chunkManager.getOrCreate('file', filePath, async () =>
          ChunkManager.createFileChunks(content, filePath, options.chunkSize)
        )

        const chunk = this.chunkManager.getChunk(chunks, options.chunkIndex)

        this.logger.info(`Returning file chunk ${chunk.index}/${chunk.total} for ${filePath}`)
        return ChunkManager.formatChunkOutput(chunk, 'File Content')
      }

      // Check if chunking is needed
      const chunks = ChunkManager.createFileChunks(content, filePath, options?.chunkSize)

      if (chunks.length === 1) {
        this.logger.info(`Returning complete file content for ${filePath}`)
        return chunks[0].content
      }

      // Return summary for multiple chunks
      const totalLines = content.split('\n').length
      this.logger.info(`Returning file summary with ${chunks.length} chunks`, {
        filePath,
        totalLines,
        totalChunks: chunks.length
      })

      return this.createChunkSummary(filePath, chunks.length, totalLines)
    } catch (error) {
      this.logger.error(`Error reading file: ${filePath}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Read multiple files
   */
  private async readMultipleFiles(paths: string[], options?: ReadFileOptions): Promise<string> {
    this.logger.debug(`Reading multiple files: ${paths.length} files`)

    const fileContents: string[] = []

    // Read each file
    for (const filePath of paths) {
      try {
        this.logger.verbose(`Reading file: ${filePath}`)
        const content = await fs.readFile(filePath, options?.encoding || 'utf-8')
        const fileHeader = `## File: ${filePath}\n${'='.repeat(filePath.length + 6)}\n`
        fileContents.push(fileHeader + content)

        this.logger.verbose(`File read successfully: ${filePath}`, {
          contentLength: content.length
        })
      } catch (error) {
        this.logger.error(`Error reading file: ${filePath}`, {
          error: error instanceof Error ? error.message : String(error)
        })
        fileContents.push(
          `## Error reading file: ${filePath}\nError: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    }

    // Combine content
    const combinedContent = fileContents.join('\n\n')
    this.logger.debug(`Combined ${paths.length} files`, {
      totalLength: combinedContent.length
    })

    // Handle chunking if requested
    if (options?.chunkIndex) {
      const cacheKey = paths.join('||')
      const chunks = await this.chunkManager.getOrCreate('file', cacheKey, async () =>
        ChunkManager.createChunks(combinedContent, { files: paths }, options.chunkSize)
      )

      const chunk = this.chunkManager.getChunk(chunks, options.chunkIndex)

      this.logger.info(`Returning multiple files chunk ${chunk.index}/${chunk.total}`, {
        fileCount: paths.length
      })

      return ChunkManager.formatChunkOutput(chunk, 'Files Content')
    }

    // Check if chunking is needed
    const chunks = ChunkManager.createChunks(combinedContent, { files: paths }, options?.chunkSize)

    if (chunks.length === 1) {
      this.logger.info(`Returning complete content for ${paths.length} files`)
      return chunks[0].content
    }

    // Return summary for multiple chunks
    this.logger.info(`Returning multiple files summary with ${chunks.length} chunks`, {
      fileCount: paths.length,
      totalChunks: chunks.length
    })

    return this.createMultipleFilesChunkSummary(paths, chunks.length)
  }

  /**
   * Create chunk summary for a single file
   */
  private createChunkSummary(filePath: string, totalChunks: number, totalLines: number): string {
    return [
      'File content has been split into multiple chunks:',
      `File: ${filePath}`,
      `Total Chunks: ${totalChunks}`,
      `Total Lines: ${totalLines}`,
      '\nTo retrieve specific chunks, use the readFiles tool with chunkIndex option:',
      'Example usage:',
      '```',
      `readFiles(["${filePath}"], { chunkIndex: 1 })`,
      '```\n'
    ].join('\n')
  }

  /**
   * Create chunk summary for multiple files
   */
  private createMultipleFilesChunkSummary(paths: string[], totalChunks: number): string {
    return [
      'Files content has been split into multiple chunks:',
      `Files: ${paths.length} files`,
      `Total Chunks: ${totalChunks}`,
      '\nTo retrieve specific chunks, use the readFiles tool with chunkIndex option:',
      'Example usage:',
      '```',
      `readFiles(${JSON.stringify(paths)}, { chunkIndex: 1 })`,
      '```\n'
    ].join('\n')
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
