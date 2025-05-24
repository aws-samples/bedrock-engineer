/**
 * Base types for tool system
 */

import { ToolInput, ToolResult } from '../../../types/tools'
import { BedrockService } from '../../../main/api/bedrock'
import type ElectronStore from 'electron-store'

/**
 * Dependencies injected into tools
 */
export interface ToolDependencies {
  logger: ToolLogger
  storeManager: StoreManager
  chunkManager: ChunkManager
  bedrock?: BedrockService
}

/**
 * Logger interface for tools
 */
export interface ToolLogger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, meta?: Record<string, any>): void
  verbose(message: string, meta?: Record<string, any>): void
}

/**
 * Store manager interface
 */
export interface StoreManager {
  get<T = any>(key: string): T | undefined
  set<T = any>(key: string, value: T): void
  has(key: string): boolean
  delete(key: string): void
  getStore(): ElectronStore
}

/**
 * Chunk manager interface
 */
export interface ChunkManager {
  getOrCreate(
    type: 'file' | 'directory' | 'web',
    key: string,
    creator: () => Promise<ContentChunk[]>
  ): Promise<ContentChunk[]>
  getChunk(chunks: ContentChunk[], index: number): ContentChunk
  createChunkSummary(chunks: ContentChunk[]): string
}

/**
 * Content chunk structure
 */
export interface ContentChunk {
  content: string
  index: number
  total: number
  metadata?: {
    timestamp?: number
    filePath?: string
    url?: string
    [key: string]: any
  }
}

/**
 * Base tool interface
 */
export interface ITool<TInput extends ToolInput = ToolInput, TResult = ToolResult | string> {
  readonly name: string
  readonly description: string
  execute(input: TInput): Promise<TResult>
}

/**
 * Tool registration info
 */
export interface ToolRegistration {
  tool: ITool
  category: ToolCategory
}

/**
 * Tool categories for organization
 */
export type ToolCategory = 'filesystem' | 'bedrock' | 'web' | 'command' | 'thinking' | 'mcp'

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  toolName: string
  startTime: number
  input: ToolInput
  dependencies: ToolDependencies
}

/**
 * Tool validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Chunk options for file/directory operations
 */
export interface ChunkOptions {
  chunkIndex?: number
  chunkSize?: number
  maxDepth?: number
}

/**
 * File read options
 */
export interface ReadFileOptions extends ChunkOptions {
  encoding?: BufferEncoding
}

/**
 * Directory list options
 */
export interface ListDirectoryOptions extends ChunkOptions {
  ignoreFiles?: string[]
  recursive?: boolean
}

/**
 * Web fetch options
 */
export interface FetchWebsiteOptions extends RequestInit, ChunkOptions {
  cleaning?: boolean
}

/**
 * Command execution configuration
 */
export interface CommandConfig {
  allowedCommands?: Array<{
    pattern: string
    description?: string
  }>
  shell: string
}

/**
 * Tool error types
 */
export enum ToolErrorType {
  VALIDATION = 'VALIDATION',
  EXECUTION = 'EXECUTION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CHUNK_INDEX_OUT_OF_RANGE = 'CHUNK_INDEX_OUT_OF_RANGE',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Tool error metadata
 */
export interface ToolErrorMetadata {
  toolName: string
  input?: any
  cause?: Error
  [key: string]: any
}
