import { useState } from 'react'
import { McpServerConfig } from '@/types/agent-chat'
import { ConnectionResultsMap } from '../types/mcpServer.types'
import { formatConnectionResult } from '../utils/connectionTestUtils'
import toast from 'react-hot-toast'

/**
 * MCPサーバー設定の状態管理用フック
 */
export function useMcpServerState(
  initialServers: McpServerConfig[],
  onChange: (servers: McpServerConfig[]) => void
) {
  // フォーム関連の状態
  const [jsonInput, setJsonInput] = useState<string>('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<string | null>(null)

  // 接続テスト関連の状態
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [testingAll, setTestingAll] = useState(false)
  const [connectionResults, setConnectionResults] = useState<ConnectionResultsMap>({})

  // 自動テスト設定
  const [autoTestOnAdd] = useState(true)

  /**
   * サーバー削除
   */
  const handleDelete = (serverName: string) => {
    onChange(initialServers.filter((server) => server.name !== serverName))
  }

  /**
   * 単一のMCPサーバーに対して接続テストを実行
   */
  const testServerConnection = async (serverName: string, serverList = initialServers) => {
    const serverConfig = serverList.find((server) => server.name === serverName)
    if (!serverConfig) {
      toast.error(`Server "${serverName}" not found`)
      return
    }

    setTestingConnection(serverName)

    try {
      const result = await window.api.mcp.testConnection(serverConfig)

      // 結果を保存
      setConnectionResults((prev) => ({
        ...prev,
        [serverName]: formatConnectionResult(result)
      }))

      // 簡易なトースト通知
      if (result.success) {
        toast.success(`${result.message}`)
      } else {
        toast.error(`${result.message}`)
      }
    } catch (error) {
      console.error(`Error testing connection to ${serverName}:`, error)
      toast.error(`Error testing connection to ${serverName}`)
    } finally {
      setTestingConnection(null)
    }
  }

  /**
   * すべてのMCPサーバーに対して接続テストを実行（直列処理）
   */
  const testAllConnections = async () => {
    if (initialServers.length === 0) {
      toast(`No MCP servers configured`)
      return
    }

    setTestingAll(true)

    try {
      const startTime = Date.now()
      toast(`Testing ${initialServers.length} MCP servers...`)

      // 各サーバーを順番にテスト
      for (const server of initialServers) {
        await testServerConnection(server.name)
      }

      const totalTime = Date.now() - startTime
      toast.success(`Completed testing ${initialServers.length} servers in ${totalTime}ms`)
    } catch (error) {
      console.error('Error testing all connections:', error)
      toast.error(`Failed to test all connections: ${error}`)
    } finally {
      setTestingAll(false)
    }
  }

  /**
   * テスト結果をクリア
   */
  const clearConnectionResults = () => {
    setConnectionResults({})
  }

  return {
    // フォーム関連
    jsonInput,
    setJsonInput,
    jsonError,
    setJsonError,
    editMode,
    setEditMode,

    // 接続テスト関連
    testingConnection,
    testingAll,
    connectionResults,
    testServerConnection,
    testAllConnections,
    clearConnectionResults,

    // その他
    autoTestOnAdd,
    handleDelete
  }
}
