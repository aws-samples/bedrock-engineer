import { ipcMain } from 'electron'
import { AgentCoreGatewayClient, GatewayConfig } from '../agentcore/gateway-client'
import { AgentCoreGatewayConfigSchemaType } from '../../types/agent-chat.schema'

// Cache for gateway clients to reuse connections
const gatewayClients = new Map<string, AgentCoreGatewayClient>()

/**
 * Get or create a gateway client for the given config
 */
function getGatewayClient(config: AgentCoreGatewayConfigSchemaType): AgentCoreGatewayClient {
  const cacheKey = `${config.endpoint}:${config.region || 'us-east-1'}:${config.profile || 'default'}`

  if (!gatewayClients.has(cacheKey)) {
    const gatewayConfig: GatewayConfig = {
      endpoint: config.endpoint,
      region: config.region,
      profile: config.profile
    }
    const client = new AgentCoreGatewayClient(gatewayConfig)
    gatewayClients.set(cacheKey, client)
  }

  return gatewayClients.get(cacheKey)!
}

/**
 * Clear all cached gateway clients
 */
export function clearGatewayClients(): void {
  gatewayClients.clear()
}

/**
 * AgentCore Gateway関連のIPCハンドラー定義
 */
export const agentCoreHandlers = {
  // ツール一覧取得
  'agentcore:getTools': async (_: any, config: AgentCoreGatewayConfigSchemaType) => {
    try {
      console.log(`[Main Process] IPC: agentcore:getTools called for endpoint: ${config.endpoint}`)

      const client = getGatewayClient(config)
      const tools = await client.listAllTools()
      const bedrockTools = client.convertToBedrockTools(tools)

      console.log(`[Main Process] IPC: agentcore:getTools returning ${bedrockTools.length} tools`)

      return {
        success: true,
        tools: bedrockTools
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Main Process] IPC: agentcore:getTools error:', errorMessage)
      return {
        success: false,
        error: errorMessage,
        tools: []
      }
    }
  },

  // ツール実行
  'agentcore:executeTool': async (
    _: any,
    config: AgentCoreGatewayConfigSchemaType,
    toolName: string,
    input: any
  ) => {
    try {
      console.log(`[Main Process] IPC: agentcore:executeTool called for tool: ${toolName}`)

      const client = getGatewayClient(config)
      const result = await client.callTool(toolName, input)

      console.log(
        `[Main Process] IPC: agentcore:executeTool result for ${toolName}:`,
        !result.isError
      )

      return {
        success: !result.isError,
        content: result.content,
        isError: result.isError
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(
        `[Main Process] IPC: agentcore:executeTool error for ${toolName}:`,
        errorMessage
      )
      return {
        success: false,
        error: errorMessage,
        content: [
          {
            type: 'text',
            text: `Error executing AgentCore Gateway tool "${toolName}": ${errorMessage}`
          }
        ],
        isError: true
      }
    }
  },

  // 接続テスト
  'agentcore:testConnection': async (_: any, config: AgentCoreGatewayConfigSchemaType) => {
    try {
      console.log(
        `[Main Process] IPC: agentcore:testConnection called for endpoint: ${config.endpoint}`
      )

      const client = getGatewayClient(config)

      // Try to list tools as a connection test
      const response = await client.listTools()

      const toolCount = response.tools.length
      const hasMore = !!response.nextCursor

      console.log(
        `[Main Process] IPC: agentcore:testConnection successful - ${toolCount} tools found`
      )

      return {
        success: true,
        message: `Successfully connected to AgentCore Gateway. Found ${toolCount} tool${toolCount !== 1 ? 's' : ''}${hasMore ? ' (more available)' : ''}.`,
        details: {
          endpoint: config.endpoint,
          region: config.region || 'us-east-1',
          toolCount: toolCount,
          hasMore: hasMore
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(
        `[Main Process] IPC: agentcore:testConnection error for ${config.endpoint}:`,
        errorMessage
      )
      return {
        success: false,
        message: `Failed to connect to AgentCore Gateway: ${errorMessage}`,
        details: {
          endpoint: config.endpoint,
          error: errorMessage
        }
      }
    }
  },

  // キャッシュクリア
  'agentcore:clearCache': async () => {
    try {
      console.log('[Main Process] IPC: agentcore:clearCache called')
      clearGatewayClients()
      console.log('[Main Process] IPC: agentcore:clearCache completed')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[Main Process] IPC: agentcore:clearCache error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }
}

/**
 * AgentCore Gateway関連のIPCハンドラーをクリーンアップする
 */
export const cleanupAgentCoreHandlers = () => {
  console.log('[Main Process] Cleaning up AgentCore Gateway IPC handlers')

  // すべてのAgentCore関連ハンドラーを削除
  ipcMain.removeAllListeners('agentcore:getTools')
  ipcMain.removeAllListeners('agentcore:executeTool')
  ipcMain.removeAllListeners('agentcore:testConnection')
  ipcMain.removeAllListeners('agentcore:clearCache')

  // キャッシュもクリア
  clearGatewayClients()

  console.log('[Main Process] AgentCore Gateway IPC handlers cleanup completed')
}
