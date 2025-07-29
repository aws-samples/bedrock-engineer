import { ipcMain } from 'electron'
import { McpServerConfig } from '../../types/agent-chat'
import {
  initMcpFromAgentConfig,
  getMcpToolSpecs,
  tryExecuteMcpTool,
  testMcpServerConnection,
  testAllMcpServerConnections,
  cleanupMcpClients
} from '../mcp/index'

/**
 * MCP関連のIPCハンドラー定義
 */
export const mcpHandlers = {
  // MCP初期化
  'mcp:init': async (_, mcpServers: McpServerConfig[]) => {
    try {
      console.log(`[Main Process] IPC: mcp:init called with ${mcpServers.length} servers`)
      await initMcpFromAgentConfig(mcpServers)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Main Process] IPC: mcp:init error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  // ツール取得
  'mcp:getTools': async (_, mcpServers: McpServerConfig[]) => {
    try {
      console.log(`[Main Process] IPC: mcp:getTools called with ${mcpServers.length} servers`)
      const tools = await getMcpToolSpecs(mcpServers)
      console.log(`[Main Process] IPC: mcp:getTools returning ${tools.length} tools`)
      return { success: true, tools }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Main Process] IPC: mcp:getTools error:', errorMessage)
      return { success: false, error: errorMessage, tools: [] }
    }
  },

  // ツール実行
  'mcp:executeTool': async (_, toolName: string, input: any, mcpServers: McpServerConfig[]) => {
    try {
      console.log(`[Main Process] IPC: mcp:executeTool called for tool: ${toolName}`)
      const result = await tryExecuteMcpTool(toolName, input, mcpServers)
      console.log(`[Main Process] IPC: mcp:executeTool result for ${toolName}:`, result.success)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[Main Process] IPC: mcp:executeTool error for ${toolName}:`, errorMessage)
      return {
        found: false,
        success: false,
        name: toolName,
        error: errorMessage,
        message: `Error executing MCP tool "${toolName}": ${errorMessage}`,
        result: null
      }
    }
  },

  // 単一サーバー接続テスト
  'mcp:testConnection': async (_, mcpServer: McpServerConfig) => {
    try {
      console.log(`[Main Process] IPC: mcp:testConnection called for server: ${mcpServer.name}`)
      const result = await testMcpServerConnection(mcpServer)
      console.log(
        `[Main Process] IPC: mcp:testConnection result for ${mcpServer.name}:`,
        result.success
      )
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(
        `[Main Process] IPC: mcp:testConnection error for ${mcpServer.name}:`,
        errorMessage
      )
      return {
        success: false,
        message: `Failed to test MCP server "${mcpServer.name}": ${errorMessage}`,
        details: {
          error: errorMessage,
          errorDetails: 'An unexpected error occurred during connection testing'
        }
      }
    }
  },

  // 複数サーバー接続テスト
  'mcp:testAllConnections': async (_, mcpServers: McpServerConfig[]) => {
    try {
      console.log(
        `[Main Process] IPC: mcp:testAllConnections called with ${mcpServers.length} servers`
      )
      const results = await testAllMcpServerConnections(mcpServers)
      console.log(`[Main Process] IPC: mcp:testAllConnections completed`)
      return { success: true, results }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Main Process] IPC: mcp:testAllConnections error:', errorMessage)
      return { success: false, error: errorMessage, results: {} }
    }
  },

  // MCPクライアントクリーンアップ
  'mcp:cleanup': async () => {
    try {
      console.log('[Main Process] IPC: mcp:cleanup called')
      await cleanupMcpClients()
      console.log('[Main Process] IPC: mcp:cleanup completed')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Main Process] IPC: mcp:cleanup error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}

/**
 * MCP関連のIPCハンドラーをクリーンアップする
 */
export const cleanupMcpHandlers = () => {
  console.log('[Main Process] Cleaning up MCP IPC handlers')

  // すべてのMCP関連ハンドラーを削除
  ipcMain.removeAllListeners('mcp:init')
  ipcMain.removeAllListeners('mcp:getTools')
  ipcMain.removeAllListeners('mcp:executeTool')
  ipcMain.removeAllListeners('mcp:testConnection')
  ipcMain.removeAllListeners('mcp:testAllConnections')
  ipcMain.removeAllListeners('mcp:cleanup')

  console.log('[Main Process] MCP IPC handlers cleanup completed')
}
