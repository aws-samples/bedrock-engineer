import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { McpServerConfig } from '@/types/agent-chat'
import { isMcpTool } from '@/types/tools'

/**
 * ツール情報の表示に関連するフォーマット関数を提供するカスタムフック
 */
export function useToolsFormatter(mcpServers: McpServerConfig[] = []) {
  const { t } = useTranslation()

  /**
   * 選択されたツールの詳細情報を取得
   */
  const getToolDescription = useMemo(
    () =>
      (toolName: string | null): string => {
        if (!toolName || !isMcpTool(toolName)) return ''

        // MCP ツールの場合のみ説明を返す
        return t('MCP tool from Model Context Protocol server')
      },
    [t]
  )

  /**
   * MCP ツールのサーバー情報を取得
   */
  const getMcpServerInfo = useMemo(
    () =>
      (toolName: string | null): string => {
        if (!toolName || !isMcpTool(toolName) || !mcpServers || mcpServers.length === 0) return ''

        // 元のツール名をそのまま使用する新形式では、どのサーバーからのツールかを特定する必要がある
        // 複数のサーバーに同じ名前のツールがある場合は、最初に見つかったものを使用
        const server = mcpServers.find((_s) => {
          // サーバーからツールリストを取得できる場合の判定ロジックは後で実装
          // 現在は設定されたサーバーがあれば表示する
          return true
        })

        return server
          ? `${t('From')}: ${server.name} (${server.description || 'MCP Server'})`
          : `${t('From')}: MCP Server`
      },
    [mcpServers, t]
  )

  return {
    getToolDescription,
    getMcpServerInfo
  }
}
