import { McpServerConfig } from '@/types/agent-chat'

/**
 * 接続テスト結果の型定義
 */
export interface ConnectionTestResult {
  success: boolean
  message: string
  testedAt: number
  details?: {
    toolCount?: number
    toolNames?: string[]
    error?: string
    errorDetails?: string
    startupTime?: number
  }
}

/**
 * 接続テスト結果のマップ型
 */
export type ConnectionResultsMap = Record<string, ConnectionTestResult>

/**
 * サーバー設定のパース結果
 */
export interface ParsedServerConfig {
  success: boolean
  servers?: McpServerConfig[]
  error?: string
  newlyAddedServer?: McpServerConfig
}

/**
 * サーバー設定の検証結果
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * 接続テスト結果のサマリー
 */
export interface ConnectionSummary {
  total: number
  success: number
  failed: number
  notTested: number
}
