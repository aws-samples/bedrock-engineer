import { useEffect, useMemo, useRef } from 'react'
import { ToolState, McpServerConfig } from '@/types/agent-chat'
import { isMcpTool } from '@/types/tools'

/**
 * MCPツール統合に関連するロジックを扱うカスタムフック
 */
export function useMcpToolsIntegration(
  tools: ToolState[],
  mcpServers: McpServerConfig[] = [],
  tempMcpTools: ToolState[] = [],
  selectedAgentId: string = '',
  getAgentMcpTools?: (agentId: string) => ToolState[],
  onChange?: (tools: ToolState[]) => void
) {
  // エージェント固有のMCPツールを取得
  // サーバーが0件の場合は常に空配列を返す（整合性保証のため）
  // それ以外の場合：一時的なMCPツールが提供されている場合はそちらを優先し、なければエージェント固有のツールを使用
  const agentMcpTools = useMemo(() => {
    // MCPサーバーがない場合は常に空配列
    if (!mcpServers || mcpServers.length === 0) {
      return []
    }

    // 一時的なツールがあればそちらを優先
    if (tempMcpTools.length > 0) {
      return tempMcpTools
    }

    // エージェント固有のMCPツールを取得する関数があれば使用
    if (getAgentMcpTools && selectedAgentId) {
      return getAgentMcpTools(selectedAgentId)
    }

    // それ以外の場合は空配列を返す
    return []
  }, [mcpServers, tempMcpTools, getAgentMcpTools, selectedAgentId])

  // 前回の統合結果を保存するためのref
  const prevMergedToolsRef = useRef<string>('')

  // 統合済みフラグ(初期統合のみを行うためのフラグ)
  const initialIntegrationDoneRef = useRef<boolean>(false)

  // デバッグ用カウンター
  const integrationCountRef = useRef<number>(0)

  // MCPツールとエージェントツールの統合
  useEffect(() => {
    // 基本条件チェック - MCPツールがあり、かつchangeハンドラがある場合
    if (agentMcpTools && agentMcpTools.length > 0 && onChange) {
      // 既存のツールからMCPツール(mcp:のプレフィックスを持つツール)を除外
      const nonMcpTools = tools.filter(
        (tool) => !tool.toolSpec?.name || !isMcpTool(tool.toolSpec.name)
      )

      // 統合したツールセット（MCPツールは常に有効）
      const mcpToolsWithState = agentMcpTools.map((tool) => ({
        ...tool,
        // MCP ツールは常に有効
        enabled: true
      }))

      const mergedTools = [...nonMcpTools, ...mcpToolsWithState]

      // 前回と今回の結果を比較するための文字列化（簡易的な深い比較）
      // ツールの名前と有効/無効状態のみを比較対象とする
      const mergedToolsKey = JSON.stringify(
        mergedTools.map((t) => ({
          name: t.toolSpec?.name,
          enabled: t.enabled
        }))
      )

      // 前回と異なる場合または初回の場合のみ更新
      if (mergedToolsKey !== prevMergedToolsRef.current || !initialIntegrationDoneRef.current) {
        // デバッグカウンター増加
        integrationCountRef.current += 1

        console.log(
          'Integrating MCP tools into agent tools:',
          agentMcpTools.length,
          '(count:',
          integrationCountRef.current,
          ')'
        )

        // 最新の結果を保存
        prevMergedToolsRef.current = mergedToolsKey
        initialIntegrationDoneRef.current = true

        // 親コンポーネントに通知（タイマーで非同期に実行）
        setTimeout(() => {
          onChange(mergedTools)
        }, 0)
      } else {
        // 変更なしの場合はログ出力
        console.log('Skipping redundant MCP tools integration (no changes detected)')
      }
    }
  }, [agentMcpTools, tools, onChange])

  return {
    agentMcpTools,
    hasMcpTools: agentMcpTools.length > 0,
    hasMcpServers: mcpServers && mcpServers.length > 0
  }
}
