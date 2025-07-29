import { McpServerConfig } from '@/types/agent-chat'
import { ParsedServerConfig } from '../types/mcpServer.types'
import { validateMcpServerConfig } from '@/common/mcp/schemas'
import { inferConnectionType } from '@/common/mcp/utils'

/**
 * JSON文字列からMCPサーバー設定を解析する
 * 共通スキーマを使用してURL形式とコマンド形式の両方をサポート
 * @param jsonString JSON形式の文字列
 * @param existingServers 既存のサーバー設定（重複チェック用）
 * @returns {ParsedServerConfig} 解析結果
 */
export function parseServerConfigJson(
  jsonString: string,
  existingServers: McpServerConfig[] = []
): ParsedServerConfig {
  try {
    const parsedConfig = JSON.parse(jsonString)
    const existingNames = existingServers.map((server) => server.name)
    const newServers: McpServerConfig[] = []
    let newlyAddedServer: McpServerConfig | undefined

    // claude_desktop_config.json互換形式の処理
    if (parsedConfig.mcpServers && typeof parsedConfig.mcpServers === 'object') {
      const validation = validateMcpServerConfig(parsedConfig)

      if (!validation.success) {
        return {
          success: false,
          error: validation.error || 'Invalid server configuration'
        }
      }

      const errorMessages: string[] = []

      Object.entries(validation.data!.mcpServers).forEach(([name, config]) => {
        // 既存のサーバー名との重複チェック
        if (existingNames.includes(name)) {
          errorMessages.push(`Server "${name}" already exists`)
          return
        }

        let newServer: McpServerConfig

        if ('command' in config) {
          // コマンド形式のサーバー
          newServer = {
            name,
            description: name, // デフォルトでは名前と同じ
            connectionType: 'command',
            command: config.command,
            args: config.args,
            env: config.env || {}
          }
        } else {
          // URL形式のサーバー
          newServer = {
            name,
            description: name, // デフォルトでは名前と同じ
            connectionType: 'url',
            url: config.url
          }
        }

        newServers.push(newServer)

        // 最初に追加したサーバーを記録
        if (!newlyAddedServer) {
          newlyAddedServer = newServer
        }
      })

      if (errorMessages.length > 0) {
        return {
          success: false,
          error: `Some servers could not be added: \n${errorMessages.join('\n')}`
        }
      }

      if (newServers.length === 0) {
        return { success: false, error: 'No valid server configurations found' }
      }

      return { success: true, servers: newServers, newlyAddedServer }
    }

    // mcpServers フィールドが存在しない場合は無効なフォーマット
    return {
      success: false,
      error: 'Invalid JSON format. Expected "mcpServers" field with server configurations.'
    }
  } catch (error) {
    return { success: false, error: 'Invalid JSON format.' }
  }
}

/**
 * サーバー設定を編集する際のJSONを生成する
 * URL形式とコマンド形式の両方をサポート（後方互換性あり）
 * @param server 編集対象のサーバー設定（単一サーバー）
 * @param servers 編集対象のサーバー設定（複数サーバー）
 * @returns {string} JSON文字列
 */
export function generateEditJson(server?: McpServerConfig, servers?: McpServerConfig[]): string {
  const serversToProcess = servers || (server ? [server] : [])
  const mcpServers: Record<string, any> = {}

  serversToProcess.forEach((srv) => {
    // connectionTypeを自動推測（後方互換性）
    const connectionType = inferConnectionType(srv)

    if (connectionType === 'command') {
      mcpServers[srv.name] = {
        command: srv.command,
        args: srv.args,
        ...(srv.env && Object.keys(srv.env).length > 0 ? { env: srv.env } : {})
      }
    } else if (connectionType === 'url') {
      mcpServers[srv.name] = {
        url: srv.url,
        enabled: true
      }
    }
  })

  return JSON.stringify({ mcpServers }, null, 2)
}

/**
 * サンプルのMCPサーバー設定JSONを生成する
 * URL形式のサンプルも含む
 * @param type 生成するJSONのタイプ
 * @returns {string} サンプルJSON文字列
 */
export function generateSampleJson(): string {
  return JSON.stringify(
    {
      mcpServers: {
        fetch: {
          command: 'uvx',
          args: ['mcp-server-fetch']
        },
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '~/']
        },
        DeepWiki: {
          url: 'https://mcp.deepwiki.com/sse'
        }
      }
    },
    null,
    2
  )
}
