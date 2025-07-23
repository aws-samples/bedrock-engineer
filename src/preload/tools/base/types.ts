/**
 * Base types for tool system
 */

import { ToolInput, ToolResult } from '../../../types/tools'
import { BedrockService } from '../../../main/api/bedrock'
import { ConfigStore } from '../../store'
import { LineRange } from '../../lib/line-range-utils'

/**
 * Dependencies injected into tools
 */
export interface ToolDependencies {
  logger: ToolLogger
  store: ConfigStore
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
 * Base tool interface
 */
export interface ITool<TInput extends ToolInput = ToolInput, TResult = ToolResult | string> {
  readonly name: string
  readonly description: string
  execute(input: TInput, context?: any): Promise<TResult>
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
export type ToolCategory =
  | 'filesystem'
  | 'bedrock'
  | 'web'
  | 'command'
  | 'thinking'
  | 'mcp'
  | 'interpreter'
  | 'system'

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
 * File read options with line range support
 */
export interface ReadFileOptions {
  encoding?: BufferEncoding
  lines?: LineRange
}

/**
 * Directory list options with line range support
 */
export interface ListDirectoryOptions {
  maxDepth?: number
  ignoreFiles?: string[]
  lines?: LineRange
  recursive?: boolean
}

/**
 * Web fetch options with line range support
 */
export interface FetchWebsiteOptions extends RequestInit {
  cleaning?: boolean
  lines?: LineRange
  saveToFile?: {
    filename?: string
    directory?: string
    format?: 'original' | 'cleaned' | 'both'
  }
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
