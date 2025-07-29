import { MCPClient } from './mcp-client'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { McpServerConfig } from '../../types/agent-chat'
import { mcpServerConfigSchema } from '../../common/mcp/schemas'
import { inferConnectionType } from '../../common/mcp/utils'

let clients: { name: string; client: MCPClient }[] = []

// キャッシュ用の変数
let lastMcpServerConfigHash: string | null = null
let lastMcpServerLength: number = 0
let lastMcpServerNames: string[] = []
let initializationInProgress: Promise<void> | null = null

/**
 * サーバー設定の安定した比較用のハッシュ値を生成する
 * 構成の本質的な部分のみを考慮し、不要な変動要素を除外する（後方互換性あり）
 */
const generateConfigHash = (servers: McpServerConfig[]): string => {
  if (!servers || servers.length === 0) {
    return 'empty'
  }

  // 名前で並べ替えて安定した順序にする
  const sortedServers = [...servers].sort((a, b) => a.name.localeCompare(b.name))

  // 本質的な設定のみを含むオブジェクトの配列を作成
  const essentialConfigs = sortedServers.map((server) => {
    const connectionType = inferConnectionType(server)

    return {
      name: server.name,
      connectionType,
      // コマンド形式の場合
      ...(connectionType === 'command' && server.command && server.args
        ? {
            command: server.command,
            args: [...server.args] // 配列のコピーを作成して安定させる
          }
        : {}),
      // URL形式の場合
      ...(connectionType === 'url' && server.url
        ? {
            url: server.url
          }
        : {}),
      // 環境変数がある場合のみ含める
      ...(server.env && Object.keys(server.env).length > 0 ? { env: { ...server.env } } : {})
    }
  })

  return JSON.stringify(essentialConfigs)
}

/**
 * サーバー設定が実質的に変更されたかどうかをチェック
 * 名前のリストと設定ハッシュの両方を確認
 */
const hasConfigChanged = (servers: McpServerConfig[] = []): boolean => {
  // サーバー数が変わった場合は明らかに変更
  if (servers.length !== lastMcpServerLength) {
    return true
  }

  // 空のリストなら変更なしと見なす
  if (servers.length === 0 && lastMcpServerLength === 0) {
    return false
  }

  // サーバー名のリストを作成して比較
  const currentNames = servers.map((s) => s.name).sort()
  const sameNames =
    currentNames.length === lastMcpServerNames.length &&
    currentNames.every((name, i) => name === lastMcpServerNames[i])

  if (!sameNames) {
    return true
  }

  // 詳細な設定内容のハッシュを比較
  const configHash = generateConfigHash(servers)
  return configHash !== lastMcpServerConfigHash
}

/**
 * 現在の設定情報をキャッシュに保存
 */
const updateConfigCache = (servers: McpServerConfig[] = []): void => {
  lastMcpServerConfigHash = generateConfigHash(servers)
  lastMcpServerLength = servers.length
  lastMcpServerNames = servers.map((s) => s.name).sort()
}

// エージェントからMCPサーバー設定を受け取る関数
export const initMcpFromAgentConfig = async (mcpServers: McpServerConfig[] = []) => {
  console.log('[Main Process] Initializing MCP servers:', mcpServers.length)

  // 変更があるかどうか確認
  if (!hasConfigChanged(mcpServers)) {
    console.log('[Main Process] No MCP server config changes detected')
    return
  }

  // 初期化が進行中なら待機
  if (initializationInProgress) {
    try {
      await initializationInProgress

      // 待機中に他のプロセスが同じ構成で初期化を完了した場合はスキップ
      if (!hasConfigChanged(mcpServers)) {
        return
      }
    } catch (error) {
      // エラーがあっても継続して新しい初期化を開始
    }
  }

  // 初期化処理を開始
  try {
    initializationInProgress = (async () => {
      // 既存のクライアントをクリーンアップ
      await Promise.all(
        clients.map(async ({ client }) => {
          try {
            await client.cleanup()
          } catch (e) {
            // クリーンアップエラーは無視
          }
        })
      )
      clients = []

      // 新しいクライアントを作成
      if (mcpServers.length === 0) {
        updateConfigCache(mcpServers)
        return
      }

      // コマンド形式とURL形式のサーバーを分別（後方互換性あり）
      const commandServers = mcpServers.filter(
        (server): server is McpServerConfig & { command: string; args: string[] } =>
          inferConnectionType(server) === 'command' && typeof server.command === 'string'
      )

      const urlServers = mcpServers.filter(
        (server): server is McpServerConfig & { url: string } =>
          inferConnectionType(server) === 'url' &&
          typeof server.url === 'string' &&
          server.url.length > 0
      )

      console.log('[Main Process] Command servers:', commandServers.length)
      console.log('[Main Process] URL servers:', urlServers.length)

      // McpServerConfig[] 形式から configSchema 用のフォーマットに変換
      const configData = {
        mcpServers: {
          ...commandServers.reduce(
            (acc, server) => {
              acc[server.name] = {
                command: server.command,
                args: server.args,
                env: server.env || {}
              }
              return acc
            },
            {} as Record<string, { command: string; args: string[]; env?: Record<string, string> }>
          ),
          ...urlServers.reduce(
            (acc, server) => {
              acc[server.name] = {
                url: server.url,
                enabled: true
              }
              return acc
            },
            {} as Record<string, { url: string; enabled?: boolean }>
          )
        }
      }

      // mcpServerConfigSchema によるバリデーション
      const { success, error } = mcpServerConfigSchema.safeParse(configData)
      if (!success) {
        console.error('[Main Process] Invalid MCP server configuration:', error)
        throw new Error('Invalid MCP server configuration')
      }

      // 両方の形式のサーバーに接続
      const allClients = await Promise.all([
        // コマンド形式のサーバー
        ...commandServers.map(async (serverConfig) => {
          try {
            console.log(`[Main Process] Connecting to command server: ${serverConfig.name}`)
            const client = await MCPClient.fromCommand(
              serverConfig.command,
              serverConfig.args,
              serverConfig.env
            )
            console.log(
              `[Main Process] Successfully connected to command server: ${serverConfig.name}`
            )
            return { name: serverConfig.name, client }
          } catch (e) {
            console.log(
              `[Main Process] Failed to connect to command server ${serverConfig.name}:`,
              e
            )
            return undefined
          }
        }),
        // URL形式のサーバー
        ...urlServers.map(async (serverConfig) => {
          try {
            console.log(
              `[Main Process] Connecting to URL server: ${serverConfig.name} (${serverConfig.url})`
            )
            const client = await MCPClient.fromUrl(serverConfig.url)
            console.log(`[Main Process] Successfully connected to URL server: ${serverConfig.name}`)
            return { name: serverConfig.name, client }
          } catch (e) {
            console.log(`[Main Process] Failed to connect to URL server ${serverConfig.name}:`, e)
            return undefined
          }
        })
      ])

      clients = allClients.filter((c): c is { name: string; client: MCPClient } => c != null)
      console.log(`[Main Process] Total connected clients: ${clients.length}`)

      // 初期化が完了したら構成ハッシュを更新
      updateConfigCache(mcpServers)
    })()

    await initializationInProgress
  } catch (error) {
    console.error('[Main Process] Error during MCP initialization:', error)
    // エラーが発生した場合はキャッシュをクリアして次回再試行できるようにする
    lastMcpServerConfigHash = null
    lastMcpServerLength = 0
    lastMcpServerNames = []
    throw error
  } finally {
    initializationInProgress = null
  }
}

export const getMcpToolSpecs = async (mcpServers?: McpServerConfig[]): Promise<Tool[]> => {
  console.log('[Main Process] Getting MCP tool specs')

  // MCPサーバー設定がない場合は空配列を返す
  if (!mcpServers || mcpServers.length === 0) {
    return []
  }

  // エージェント固有のMCPサーバー設定を使用する
  await initMcpFromAgentConfig(mcpServers)

  const tools = clients.flatMap(({ client }) => {
    // ツールをそのまま返す（プリフィックスなし）
    return client.tools.map((tool) => {
      // ディープコピーして元のオブジェクトを変更しないようにする
      const clonedTool = JSON.parse(JSON.stringify(tool))
      // ツール名はそのまま使用（プリフィックスなし）
      return clonedTool
    })
  })

  console.log(`[Main Process] Retrieved ${tools.length} tools from ${clients.length} clients`)
  return tools
}

export const tryExecuteMcpTool = async (
  toolName: string,
  input: any,
  mcpServers?: McpServerConfig[]
) => {
  console.log(`[Main Process] Executing MCP tool: ${toolName}`)

  // MCPサーバー設定がない場合はツールが見つからない旨を返す
  if (!mcpServers || mcpServers.length === 0) {
    return {
      found: false,
      success: false,
      name: toolName,
      error: `No MCP servers configured`,
      message: `This agent does not have any MCP servers configured. Please add MCP server configuration in agent settings.`,
      result: null
    }
  }

  // エージェント固有のMCPサーバー設定を使用する
  await initMcpFromAgentConfig(mcpServers)

  // ツール名をそのまま使用して適切なクライアントを検索
  const client = clients.find(({ client }) => {
    // ツールが存在するかチェック
    return client.tools.find((tool) => tool.toolSpec?.name === toolName)
  })

  if (client == null) {
    return {
      found: false,
      success: false,
      name: toolName,
      error: `MCP tool "${toolName}" not found`,
      message: `No MCP server provides tool "${toolName}"`,
      result: null
    }
  }

  try {
    // ツール名をそのまま使用してMCPツールを実行
    const params = { ...input }
    const res = await client.client.callTool(toolName, params)

    console.log(`[Main Process] Successfully executed MCP tool: ${toolName}`)
    return {
      found: true,
      success: true,
      name: toolName,
      message: `MCP tool execution successful: ${toolName}`,
      result: res
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Main Process] Error executing MCP tool ${toolName}:`, errorMessage)

    return {
      found: true,
      success: false,
      name: toolName,
      error: errorMessage,
      message: `Error executing MCP tool "${toolName}": ${errorMessage}`,
      result: null
    }
  }
}

/**
 * MCPサーバーに接続テストを行う関数
 * @param mcpServer テスト対象のサーバー設定
 * @return テスト結果のオブジェクト
 */
export const testMcpServerConnection = async (
  mcpServer: McpServerConfig
): Promise<{
  success: boolean
  message: string
  details?: {
    toolCount?: number
    toolNames?: string[]
    error?: string
    errorDetails?: string
    startupTime?: number
  }
}> => {
  console.log(`[Main Process] Testing MCP server connection: ${mcpServer.name}`)
  const startTime = Date.now()

  try {
    let client: MCPClient

    // 後方互換性のためconnectionTypeを自動推測
    const connectionType = inferConnectionType(mcpServer)

    if (connectionType === 'command') {
      // コマンド形式のサーバーの検証
      if (!mcpServer.command || !mcpServer.args) {
        return {
          success: false,
          message: `MCP server "${mcpServer.name}" is missing required command or args`,
          details: {
            error: 'Invalid server configuration',
            errorDetails: 'Command and args fields are required for command-type servers'
          }
        }
      }
      client = await MCPClient.fromCommand(mcpServer.command, mcpServer.args, mcpServer.env)
    } else if (connectionType === 'url') {
      // URL形式のサーバーの検証
      if (!mcpServer.url) {
        return {
          success: false,
          message: `MCP server "${mcpServer.name}" is missing required URL`,
          details: {
            error: 'Invalid server configuration',
            errorDetails: 'URL field is required for URL-type servers'
          }
        }
      }
      client = await MCPClient.fromUrl(mcpServer.url)
    } else {
      return {
        success: false,
        message: `MCP server "${mcpServer.name}" has unsupported connection type`,
        details: {
          error: 'Invalid server configuration',
          errorDetails: 'Connection type must be either "command" or "url"'
        }
      }
    }

    // ツール情報を取得
    const tools = client.tools || []
    // 型エラー修正: undefined を除外して string[] に変換
    const toolNames = tools
      .map((t) => t.toolSpec?.name)
      .filter((name): name is string => Boolean(name))

    // クライアントのクリーンアップ
    await client.cleanup()

    const endTime = Date.now()
    console.log(
      `[Main Process] Successfully tested MCP server: ${mcpServer.name} (${toolNames.length} tools)`
    )

    return {
      success: true,
      message: `Successfully connected to MCP server "${mcpServer.name}" via ${mcpServer.connectionType}`,
      details: {
        toolCount: tools.length,
        toolNames,
        startupTime: endTime - startTime
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Main Process] Failed to test MCP server ${mcpServer.name}:`, errorMessage)

    // 詳細なエラー分析
    const errorAnalysis = analyzeServerError(errorMessage)

    return {
      success: false,
      message: `Failed to connect to MCP server "${mcpServer.name}" via ${mcpServer.connectionType}`,
      details: {
        error: errorMessage,
        errorDetails: errorAnalysis
      }
    }
  }
}

/**
 * 複数のMCPサーバーに対して接続テストを行う関数
 * @param mcpServers テスト対象のサーバー設定配列
 * @return サーバー名をキーとしたテスト結果のオブジェクト
 */
export const testAllMcpServerConnections = async (
  mcpServers: McpServerConfig[]
): Promise<
  Record<
    string,
    {
      success: boolean
      message: string
      details?: {
        toolCount?: number
        toolNames?: string[]
        error?: string
        errorDetails?: string
        startupTime?: number
      }
    }
  >
> => {
  console.log(`[Main Process] Testing ${mcpServers.length} MCP server connections`)

  // MCPサーバー設定がない場合は空オブジェクトを返す
  if (!mcpServers || mcpServers.length === 0) {
    return {}
  }

  const results: Record<string, any> = {}

  // 逐次処理（直列）でテスト実行
  for (const server of mcpServers) {
    results[server.name] = await testMcpServerConnection(server)
  }

  return results
}

/**
 * エラーメッセージを分析して原因と対策を提示する
 */
function analyzeServerError(errorMessage: string): string {
  const lowerError = errorMessage.toLowerCase()

  if (lowerError.includes('enoent') || lowerError.includes('command not found')) {
    return 'Command not found. Please make sure the command is installed and the path is correct.'
  }

  if (lowerError.includes('timeout')) {
    return 'The response from the server timed out. Please check if the server is running properly.'
  }

  if (lowerError.includes('permission denied') || lowerError.includes('eacces')) {
    return 'A permission error occurred. Please make sure you have the execution permissions.'
  }

  if (lowerError.includes('port') && lowerError.includes('use')) {
    return 'The port is already in use. Please make sure that no other process is using the same port.'
  }

  if (lowerError.includes('cors') || lowerError.includes('access-control-allow-origin')) {
    return 'CORS policy blocked the request. This error should not occur in Main Process - please check the implementation.'
  }

  return 'Please make sure your command and arguments are correct.'
}

/**
 * MCPクライアントのクリーンアップ
 */
export const cleanupMcpClients = async (): Promise<void> => {
  console.log('[Main Process] Cleaning up MCP clients')

  await Promise.all(
    clients.map(async ({ client, name }) => {
      try {
        await client.cleanup()
        console.log(`[Main Process] Cleaned up MCP client: ${name}`)
      } catch (e) {
        console.error(`[Main Process] Error cleaning up MCP client ${name}:`, e)
      }
    })
  )

  clients = []
  lastMcpServerConfigHash = null
  lastMcpServerLength = 0
  lastMcpServerNames = []
}
