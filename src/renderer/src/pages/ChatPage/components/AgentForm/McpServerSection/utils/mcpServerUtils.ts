import { McpServerConfig } from '@/types/agent-chat'
import { ParsedServerConfig, ValidationResult } from '../types/mcpServer.types'

/**
 * JSONフォーマットのMCPサーバー設定を検証する
 * @param jsonConfig パースされたJSON設定オブジェクト
 * @returns {ValidationResult} 検証結果
 */
export function validateServerConfig(jsonConfig: any): ValidationResult {
  // 単一サーバー形式の検証
  if (jsonConfig.name && jsonConfig.command) {
    // 必須フィールドの検証
    if (!jsonConfig.description || !Array.isArray(jsonConfig.args)) {
      return {
        isValid: false,
        error: 'Required fields are missing or invalid. Check the JSON format.'
      }
    }

    // envが指定されている場合はオブジェクト型であることを確認
    if (jsonConfig.env && typeof jsonConfig.env !== 'object') {
      return {
        isValid: false,
        error: 'The "env" field must be an object.'
      }
    }

    return { isValid: true }
  }

  // claude_desktop_config.json互換形式の検証
  if (jsonConfig.mcpServers && typeof jsonConfig.mcpServers === 'object') {
    const errorMessages: string[] = []
    let hasValidServer = false

    Object.entries(jsonConfig.mcpServers).forEach(([name, config]) => {
      const serverConfig = config as any

      // 必須フィールドの検証
      if (!serverConfig.command || !Array.isArray(serverConfig.args)) {
        errorMessages.push(`Server "${name}": missing required fields`)
        return
      }

      // envが指定されている場合はオブジェクト型であることを確認
      if (serverConfig.env && typeof serverConfig.env !== 'object') {
        errorMessages.push(`Server "${name}": "env" field must be an object`)
        return
      }

      hasValidServer = true
    })

    if (!hasValidServer) {
      return { isValid: false, error: 'No valid server configurations found' }
    }

    if (errorMessages.length > 0) {
      return {
        isValid: false,
        error: `Some servers could not be added: \n${errorMessages.join('\n')}`
      }
    }

    return { isValid: true }
  }

  return { isValid: false, error: 'Invalid JSON format.' }
}

/**
 * JSON文字列からMCPサーバー設定を解析する
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
      const errorMessages: string[] = []

      Object.entries(parsedConfig.mcpServers).forEach(([name, config]) => {
        const serverConfig = config as any

        // 必須フィールドの検証
        if (!serverConfig.command || !Array.isArray(serverConfig.args)) {
          errorMessages.push(`Server "${name}": missing required fields`)
          return
        }

        // envが指定されている場合はオブジェクト型であることを確認
        if (serverConfig.env && typeof serverConfig.env !== 'object') {
          errorMessages.push(`Server "${name}": "env" field must be an object`)
          return
        }

        // 既存のサーバー名との重複チェック
        if (existingNames.includes(name)) {
          errorMessages.push(`Server "${name}" already exists`)
          return
        }

        const newServer = {
          name,
          description: name, // デフォルトでは名前と同じ
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env || {}
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

    // 従来の単一サーバー形式の処理
    const serverConfig = parsedConfig

    // 必須フィールドの検証
    if (
      !serverConfig.name ||
      !serverConfig.description ||
      !serverConfig.command ||
      !Array.isArray(serverConfig.args)
    ) {
      return {
        success: false,
        error: 'Required fields are missing or invalid. Check the JSON format.'
      }
    }

    // envが指定されている場合はオブジェクト型であることを確認
    if (serverConfig.env && typeof serverConfig.env !== 'object') {
      return { success: false, error: 'The "env" field must be an object.' }
    }

    // 既存のサーバー名との重複チェック
    if (existingNames.includes(serverConfig.name)) {
      return { success: false, error: 'A server with this name already exists.' }
    }

    return {
      success: true,
      servers: [serverConfig],
      newlyAddedServer: serverConfig
    }
  } catch (error) {
    return { success: false, error: 'Invalid JSON format.' }
  }
}

/**
 * サーバー設定を編集する際のJSONを生成する
 * @param server 編集対象のサーバー設定
 * @returns {string} JSON文字列
 */
export function generateEditJson(server: McpServerConfig): string {
  const serverConfig = {
    name: server.name,
    description: server.description,
    command: server.command,
    args: server.args,
    env: server.env || {}
  }

  return JSON.stringify(serverConfig, null, 2)
}

/**
 * サンプルのMCPサーバー設定JSONを生成する
 * @param type 生成するJSONのタイプ
 * @returns {string} サンプルJSON文字列
 */
export function generateSampleJson(type: 'simple' | 'multiple' = 'multiple'): string {
  if (type === 'simple') {
    return JSON.stringify(
      {
        name: 'fetch',
        description: 'Fetch MCP Server',
        command: 'uvx',
        args: ['mcp-server-fetch'],
        env: {}
      },
      null,
      2
    )
  }

  return JSON.stringify(
    {
      mcpServers: {
        fetch: {
          command: 'uvx',
          args: ['mcp-server-fetch']
        },
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', './data']
        }
      }
    },
    null,
    2
  )
}
