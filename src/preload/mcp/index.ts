import { z } from 'zod'
import { MCPClient } from './mcp-client'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { McpServerConfig } from '../../types/agent-chat'

const configSchema = z.object({
  mcpServers: z.record(
    z.string(),
    z.object({
      command: z.string(),
      args: z.array(z.string()),
      env: z.record(z.string(), z.string()).optional()
    })
  )
})

let clients: { name: string; client: MCPClient }[] = []

// キャッシュ用の変数
let lastMcpServerConfigHash: string | null = null
let lastMcpServerLength: number = 0
let lastMcpServerNames: string[] = []
let initializationInProgress: Promise<void> | null = null

/**
 * サーバー設定の安定した比較用のハッシュ値を生成する
 * 構成の本質的な部分のみを考慮し、不要な変動要素を除外する
 */
const generateConfigHash = (servers: McpServerConfig[]): string => {
  if (!servers || servers.length === 0) {
    return 'empty'
  }

  // 名前で並べ替えて安定した順序にする
  const sortedServers = [...servers].sort((a, b) => a.name.localeCompare(b.name))

  // 本質的な設定のみを含むオブジェクトの配列を作成
  const essentialConfigs = sortedServers.map((server) => ({
    name: server.name,
    command: server.command,
    args: [...server.args], // 配列のコピーを作成して安定させる
    // 環境変数がある場合のみ含める
    ...(server.env && Object.keys(server.env).length > 0 ? { env: { ...server.env } } : {})
  }))

  return JSON.stringify(essentialConfigs)
}

/**
 * サーバー設定が実質的に変更されたかどうかをチェック
 * 名前のリストと設定ハッシュの両方を確認
 */
const hasConfigChanged = (servers: McpServerConfig[] = []): boolean => {
  // サーバー数が変わった場合は明らかに変更
  if (servers.length !== lastMcpServerLength) {
    console.log(`MCP server count changed: ${lastMcpServerLength} -> ${servers.length}`)
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
    console.log(`MCP server names changed`)
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
  console.log(`Updated MCP config cache with ${servers.length} server(s)`)
}

// エージェントからMCPサーバー設定を受け取る関数
export const initMcpFromAgentConfig = async (mcpServers: McpServerConfig[] = []) => {
  // 明示的なデバッグ情報の表示
  console.log(`initMcpFromAgentConfig called with ${mcpServers.length} server(s)`)

  // 変更があるかどうか確認
  if (!hasConfigChanged(mcpServers)) {
    console.log('MCP configuration unchanged, skipping initialization')
    return
  }

  // 初期化が進行中なら待機
  if (initializationInProgress) {
    console.log('MCP initialization already in progress, waiting...')
    try {
      await initializationInProgress
      console.log('Finished waiting for previous MCP initialization')

      // 待機中に他のプロセスが同じ構成で初期化を完了した場合はスキップ
      if (!hasConfigChanged(mcpServers)) {
        console.log('MCP already initialized with same configuration during wait')
        return
      }
    } catch (error) {
      console.log('Previous MCP initialization failed:', error)
      // エラーがあっても継続して新しい初期化を開始
    }
  }

  console.log(`Starting MCP initialization with ${mcpServers.length} server(s)...`)

  // 初期化処理を開始
  try {
    initializationInProgress = (async () => {
      // 既存のクライアントをクリーンアップ
      console.log(`Cleaning up ${clients.length} existing MCP clients...`)
      await Promise.all(
        clients.map(async ({ client }) => {
          try {
            await client.cleanup()
          } catch (e) {
            console.log(`Failed to clean up MCP client: ${e}`)
          }
        })
      )
      clients = []

      // 新しいクライアントを作成
      if (mcpServers.length === 0) {
        console.log('No MCP servers configured for this agent')
        updateConfigCache(mcpServers)
        return
      }

      // McpServerConfig[] 形式から configSchema 用のフォーマットに変換
      const configData = {
        mcpServers: mcpServers.reduce(
          (acc, server) => {
            acc[server.name] = {
              command: server.command,
              args: server.args,
              env: server.env || {}
            }
            return acc
          },
          {} as Record<string, { command: string; args: string[]; env?: Record<string, string> }>
        )
      }

      // configSchema によるバリデーション
      const { success, error } = configSchema.safeParse(configData)
      if (!success) {
        console.error('Invalid MCP server configuration:', error)
        throw new Error('Invalid MCP server configuration')
      }

      console.log(`Creating ${mcpServers.length} new MCP clients...`)
      clients = (
        await Promise.all(
          mcpServers.map(async (serverConfig) => {
            try {
              console.log(`Starting MCP server: ${serverConfig.name}`)
              const client = await MCPClient.fromCommand(
                serverConfig.command,
                serverConfig.args,
                serverConfig.env
              )
              return { name: serverConfig.name, client }
            } catch (e) {
              console.log(
                `MCP server ${serverConfig.name} failed to start: ${e}. Ignoring the server...`
              )
              return undefined
            }
          })
        )
      ).filter((c): c is { name: string; client: MCPClient } => c != null)

      // 初期化が完了したら構成ハッシュを更新
      updateConfigCache(mcpServers)
      console.log(`MCP initialization complete with ${clients.length} server(s)`)
    })()

    await initializationInProgress
  } catch (error) {
    console.error('Error during MCP initialization:', error)
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
  // MCPサーバー設定がない場合は空配列を返す
  if (!mcpServers || mcpServers.length === 0) {
    return []
  }

  // エージェント固有のMCPサーバー設定を使用する
  await initMcpFromAgentConfig(mcpServers)

  return clients.flatMap(({ client }) => {
    // ツールをそのまま返す（プリフィックスなし）
    return client.tools.map((tool) => {
      // ディープコピーして元のオブジェクトを変更しないようにする
      const clonedTool = JSON.parse(JSON.stringify(tool))
      // ツール名はそのまま使用（プリフィックスなし）
      return clonedTool
    })
  })
}

export const tryExecuteMcpTool = async (
  toolName: string,
  input: any,
  mcpServers?: McpServerConfig[]
) => {
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

    return {
      found: true,
      success: true,
      name: toolName,
      message: `MCP tool execution successful: ${toolName}`,
      result: res
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

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
  console.log(`Testing connection to MCP server: ${mcpServer.name}`)
  const startTime = Date.now()

  try {
    // 単一サーバー用の一時的なクライアントを作成
    const client = await MCPClient.fromCommand(mcpServer.command, mcpServer.args, mcpServer.env)

    // ツール情報を取得
    const tools = client.tools || []
    // 型エラー修正: undefined を除外して string[] に変換
    const toolNames = tools
      .map((t) => t.toolSpec?.name)
      .filter((name): name is string => Boolean(name))

    // クライアントのクリーンアップ
    await client.cleanup()

    const endTime = Date.now()
    return {
      success: true,
      message: `Successfully connected to MCP server "${mcpServer.name}"`,
      details: {
        toolCount: tools.length,
        toolNames,
        startupTime: endTime - startTime
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    // 未使用変数を削除
    // const errorStack = error instanceof Error ? error.stack : undefined

    // 詳細なエラー分析
    const errorAnalysis = analyzeServerError(errorMessage)

    return {
      success: false,
      message: `Failed to connect to MCP server "${mcpServer.name}"`,
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

  return 'Please make sure your command and arguments are correct.'
}
