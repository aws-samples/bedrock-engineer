/**
 * Unified chunk management for tools
 */

import { ContentChunk, ChunkManager as IChunkManager } from '../base/types'
import { ChunkIndexOutOfRangeError } from '../base/errors'

/**
 * Default maximum chunk size (approximately 50,000 characters)
 */
export const DEFAULT_MAX_CHUNK_SIZE = 50000

/**
 * Manages content chunking across different tools
 */
export class ChunkManager implements IChunkManager {
  private stores: {
    file: Map<string, ContentChunk[]>
    directory: Map<string, ContentChunk[]>
    web: Map<string, ContentChunk[]>
  }

  constructor() {
    this.stores = {
      file: new Map(),
      directory: new Map(),
      web: new Map()
    }
  }

  /**
   * Get or create chunks for a given key
   */
  async getOrCreate(
    type: 'file' | 'directory' | 'web',
    key: string,
    creator: () => Promise<ContentChunk[]>
  ): Promise<ContentChunk[]> {
    const store = this.stores[type]

    if (!store.has(key)) {
      const chunks = await creator()
      store.set(key, chunks)
    }

    return store.get(key)!
  }

  /**
   * Get a specific chunk by index
   */
  getChunk(chunks: ContentChunk[], index: number): ContentChunk {
    if (index < 1 || index > chunks.length) {
      throw new ChunkIndexOutOfRangeError(index, chunks.length, 'ChunkManager')
    }
    return chunks[index - 1]
  }

  /**
   * Create a summary of chunks
   */
  createChunkSummary(chunks: ContentChunk[]): string {
    const firstChunk = chunks[0]
    const metadata = firstChunk.metadata || {}

    const lines = [
      `Content has been split into ${chunks.length} chunks:`,
      metadata.url ? `URL: ${metadata.url}` : '',
      metadata.filePath ? `File: ${metadata.filePath}` : '',
      metadata.timestamp ? `Timestamp: ${new Date(metadata.timestamp).toISOString()}` : '',
      '',
      'To retrieve specific chunks, use the chunkIndex option:',
      `Total Chunks: ${chunks.length}`,
      'Example usage:',
      '```',
      `{ chunkIndex: 1 }`,
      '```'
    ]

    return lines.filter((line) => line !== '').join('\n')
  }

  /**
   * Clear chunks for a specific type and key
   */
  clear(type: 'file' | 'directory' | 'web', key: string): void {
    this.stores[type].delete(key)
  }

  /**
   * Clear all chunks for a specific type
   */
  clearAll(type: 'file' | 'directory' | 'web'): void {
    this.stores[type].clear()
  }

  /**
   * Get the size of a specific store
   */
  getStoreSize(type: 'file' | 'directory' | 'web'): number {
    return this.stores[type].size
  }

  /**
   * Create chunks from content
   */
  static createChunks(
    content: string,
    metadata: Record<string, any> = {},
    chunkSize: number = DEFAULT_MAX_CHUNK_SIZE
  ): ContentChunk[] {
    const chunks: ContentChunk[] = []
    const lines = content.split('\n')
    let currentChunk = ''
    let currentSize = 0

    for (const line of lines) {
      const lineWithBreak = line + '\n'
      const lineSize = lineWithBreak.length

      if (currentSize + lineSize > chunkSize && currentChunk) {
        chunks.push({
          content: currentChunk,
          index: chunks.length + 1,
          total: 0, // Will be updated later
          metadata: {
            ...metadata,
            timestamp: Date.now()
          }
        })
        currentChunk = ''
        currentSize = 0
      }

      currentChunk += lineWithBreak
      currentSize += lineSize
    }

    // Add the last chunk if there's content
    if (currentChunk) {
      chunks.push({
        content: currentChunk,
        index: chunks.length + 1,
        total: 0,
        metadata: {
          ...metadata,
          timestamp: Date.now()
        }
      })
    }

    // Update total count
    chunks.forEach((chunk) => {
      chunk.total = chunks.length
    })

    return chunks
  }

  /**
   * Create chunks for file content with headers
   */
  static createFileChunks(
    content: string,
    filePath: string,
    chunkSize: number = DEFAULT_MAX_CHUNK_SIZE
  ): ContentChunk[] {
    const chunks: ContentChunk[] = []
    const lines = content.split('\n')
    let currentChunk = ''
    let currentSize = 0

    // File header for the first chunk
    const fileHeader = `File: ${filePath}\n${'='.repeat(filePath.length + 6)}\n`

    for (const line of lines) {
      const lineWithBreak = line + '\n'
      const lineSize = lineWithBreak.length

      // If this is the first line, account for the header size
      const effectiveSize =
        currentChunk === '' && chunks.length === 0 ? lineSize + fileHeader.length : lineSize

      if (currentSize + effectiveSize > chunkSize && currentChunk) {
        chunks.push({
          content: currentChunk,
          index: chunks.length + 1,
          total: 0,
          metadata: {
            timestamp: Date.now(),
            filePath
          }
        })
        currentChunk = ''
        currentSize = 0
      }

      // Add header for the first chunk
      if (currentChunk === '' && chunks.length === 0) {
        currentChunk = fileHeader
        currentSize = fileHeader.length
      }

      currentChunk += lineWithBreak
      currentSize += lineSize
    }

    // Add the last chunk
    if (currentChunk) {
      chunks.push({
        content: currentChunk,
        index: chunks.length + 1,
        total: 0,
        metadata: {
          timestamp: Date.now(),
          filePath
        }
      })
    }

    // Update total count
    chunks.forEach((chunk) => {
      chunk.total = chunks.length
    })

    return chunks
  }

  /**
   * Create chunks for directory tree content
   */
  static createDirectoryChunks(
    treeContent: string,
    dirPath: string,
    chunkSize: number = DEFAULT_MAX_CHUNK_SIZE
  ): ContentChunk[] {
    return ChunkManager.createChunks(treeContent, { dirPath, type: 'directory' }, chunkSize)
  }

  /**
   * Format chunk output with metadata
   */
  static formatChunkOutput(chunk: ContentChunk, type: string = 'Content'): string {
    return `${type} (Chunk ${chunk.index}/${chunk.total}):\n\n${chunk.content}`
  }

  /**
   * Extract main content from HTML (basic implementation)
   */
  static extractMainContent(html: string): string {
    // Remove script and style tags
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Remove HTML tags
    content = content.replace(/<[^>]+>/g, ' ')

    // Decode HTML entities
    content = content
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim()

    return content
  }
}
