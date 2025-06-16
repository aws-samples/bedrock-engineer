import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { z } from 'zod'
import { resolveCommand } from './command-resolver'
import { McpServerConfig } from '../../types/agent-chat'

// https://github.com/modelcontextprotocol/quickstart-resources/blob/main/mcp-client-typescript/index.ts
export class MCPClient {
  private mcp: Client
  private transport: StdioClientTransport | StreamableHTTPClientTransport | null = null
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
      console.log(`Using resolved command path: ${resolvedCommand} (original: ${command})`)
    }
    await client.connectToStdioServer(resolvedCommand, args, env ?? {})
    return client
  }

  static async fromHttp(serverConfig: McpServerConfig) {
    const client = new MCPClient()
    await client.connectToHttpServer(serverConfig)
    return client
  }

  public get tools() {
    return this._tools
  }

  async connectToStdioServer(command: string, args: string[], env: Record<string, string>) {
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
      await this.mcp.connect(this.transport)
      await this.loadTools()
      console.log(
        'Connected to stdio server with tools:',
        this._tools.map(({ toolSpec }) => toolSpec!.name)
      )
    } catch (e) {
      console.log('Failed to connect to stdio MCP server: ', e)
      throw e
    }
  }

  async connectToHttpServer(serverConfig: McpServerConfig) {
    try {
      if (!serverConfig.url) {
        throw new Error('URL is required for HTTP transport')
      }

      // Prepare HTTP transport options
      const transportOptions: any = {}
      
      if (serverConfig.headers) {
        transportOptions.requestInit = {
          headers: serverConfig.headers
        }
      }

      if (serverConfig.timeout) {
        transportOptions.requestInit = {
          ...transportOptions.requestInit,
          signal: AbortSignal.timeout(serverConfig.timeout)
        }
      }

      // Handle authentication
      if (serverConfig.auth) {
        const headers = transportOptions.requestInit?.headers || {}
        
        if (serverConfig.auth.type === 'bearer' && serverConfig.auth.token) {
          headers['Authorization'] = `Bearer ${serverConfig.auth.token}`
        } else if (serverConfig.auth.type === 'basic' && serverConfig.auth.username && serverConfig.auth.password) {
          const credentials = btoa(`${serverConfig.auth.username}:${serverConfig.auth.password}`)
          headers['Authorization'] = `Basic ${credentials}`
        }
        
        transportOptions.requestInit = {
          ...transportOptions.requestInit,
          headers
        }
      }

      // Initialize HTTP transport and connect to server
      this.transport = new StreamableHTTPClientTransport(new URL(serverConfig.url), transportOptions)
      await this.mcp.connect(this.transport)
      await this.loadTools()
      console.log(
        'Connected to HTTP server with tools:',
        this._tools.map(({ toolSpec }) => toolSpec!.name)
      )
    } catch (e) {
      console.log('Failed to connect to HTTP MCP server: ', e)
      throw e
    }
  }

  private async loadTools() {
    // List available tools
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
    try {
      if (this.transport instanceof StreamableHTTPClientTransport) {
        await this.transport.terminateSession()
      }
    } catch (e) {
      console.log('Failed to terminate HTTP session:', e)
    }
    
    await this.mcp.close()
  }
}

// MCPClient.fromCommand('npx', ['-y', '@modelcontextprotocol/server-aws-kb-retrieval'], { aa: 'aa' });
