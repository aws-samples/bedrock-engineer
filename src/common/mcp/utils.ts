/**
 * MCP関連の共通ユーティリティ関数
 */

import { McpServerConfig } from '../../types/agent-chat'

/**
 * ConnectionTypeを自動推測する関数（後方互換性用）
 * @param server MCPサーバー設定
 * @returns 推測されたconnectionType
 */
export function inferConnectionType(server: McpServerConfig): 'command' | 'url' {
  // connectionTypeが既に設定されている場合はそのまま使用
  if (server.connectionType) {
    return server.connectionType
  }

  // commandフィールドが存在する場合はcommand形式
  if (server.command) {
    return 'command'
  }

  // urlフィールドが存在する場合はurl形式
  if (server.url) {
    return 'url'
  }

  // デフォルトはcommand形式（旧形式との互換性）
  return 'command'
}
