import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { McpServerConfig } from '@/types/agent-chat'
import { isMcpTool, getOriginalMcpToolName } from '@/types/tools'

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

        const serverName = getOriginalMcpToolName(toolName)?.split('.')[0]
        const server = mcpServers.find((s) => s.name === serverName)

        return server
          ? `${t('From')}: ${server.name} (${server.description || 'MCP Server'})`
          : `${t('From')}: ${serverName || 'Unknown server'}`
      },
    [mcpServers, t]
  )

  return {
    getToolDescription,
    getMcpServerInfo
  }
}
