/**
 * CLI用のツール型定義
 */
import { ToolName, ToolInput, ToolResult } from '../../types/tools'

/**
 * CLIツールのインターフェース
 */
export interface CliTool {
  name: ToolName
  description: string
  execute: (input: any) => Promise<ToolResult>
}

/**
 * ツール実行の結果
 */
export interface ToolExecutionResult {
  toolName: ToolName
  success: boolean
  result?: any
  error?: string
}

/**
 * CLIで利用可能なツールカテゴリ
 */
export type CliToolCategory = 
  | 'filesystem'  // ファイル操作系
  | 'web'         // Web検索・取得
  | 'bedrock'     // Bedrock関連
  | 'utility'     // ユーティリティ
  | 'system'      // システム操作