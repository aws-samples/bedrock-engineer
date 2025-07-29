import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { z } from 'zod'
import { resolveCommand } from './command-resolver'

type Transport = StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport

// https://github.com/modelcontextprotocol/quickstart-resources/blob/main/mcp-client-typescript/index.ts
export class MCPClient {
  private mcp: Client
  private transport: Transport | null = null
  private _tools: Tool[] = []

  private constructor() {
    this.mcp = new Client(
      { name: 'mcp-client-cli', version: '1.0.0' },
      {
        capabilities: {
          tools: {}
        }
      }
    )
  }

  static async fromCommand(command: string, args: string[], env?: Record<string, string>) {
    const client = new MCPClient()
    // コマンドパスを解決
    const resolvedCommand = resolveCommand(command)
    if (resolvedCommand !== command) {
      console.log(
        `[Main Process] Using resolved command path: ${resolvedCommand} (original: ${command})`
      )
    }
    await client.connectToServer(resolvedCommand, args, env ?? {})
    return client
  }

  static async fromUrl(url: string) {
    const baseUrl = new URL(url)
    try {
      const client = new MCPClient()
      client.transport = new StreamableHTTPClientTransport(baseUrl)
      await client.connectAndInitialize()
      console.log('[Main Process] Connected using Streamable HTTP transport')
      return client
    } catch (error) {
      console.log('[Main Process] Streamable HTTP connection failed, falling back to SSE transport')
      const client = new MCPClient()
      client.transport = new SSEClientTransport(baseUrl)
      await client.connectAndInitialize()
      console.log('[Main Process] Connected using SSE transport')
      return client
    }
  }

  public get tools() {
    return this._tools
  }

  private async connectAndInitialize() {
    if (!this.transport) throw new Error('Transport not initialized')
    await this.mcp.connect(this.transport)

    const toolsResult = await this.mcp.listTools()
    this._tools = toolsResult.tools.map((tool) => {
      return {
        toolSpec: {
          name: tool.name,
          description: tool.description,
          inputSchema: { json: JSON.parse(JSON.stringify(tool.inputSchema)) }
        }
      }
    })
    console.log(
      '[Main Process] Connected to server with tools:',
      this._tools.map(({ toolSpec }) => toolSpec!.name)
    )
  }

  async connectToServer(command: string, args: string[], env: Record<string, string>) {
    try {
      // Initialize transport and connect to server
      this.transport = new StdioClientTransport({
        command,
        args,
        env: {
          ...env,
          ...(process.env as Record<string, string>),
          // 明示的にPATHを設定して確実に現在の環境変数を使用
          PATH: process.env.PATH || ''
        }
      })
      await this.connectAndInitialize()
    } catch (e) {
      console.log('[Main Process] Failed to connect to MCP server: ', e)
      throw e
    }
  }

  async callTool(toolName: string, input: any) {
    const result = await this.mcp.callTool({
      name: toolName,
      arguments: input
    })
    // https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/#tool-result
    const contentSchema = z.array(
      z.union([
        z.object({ type: z.literal('text'), text: z.string() }),
        z.object({ type: z.literal('image'), data: z.string(), mimeType: z.string() })
      ])
    )
    const { success, data: content } = contentSchema.safeParse(result.content)
    if (!success) {
      return JSON.stringify(result)
    }
    return content
  }

  async cleanup() {
    /**
     * Clean up resources
     */
    await this.mcp.close()
  }
}
