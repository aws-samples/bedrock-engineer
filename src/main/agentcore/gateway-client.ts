import axios, { AxiosInstance } from 'axios'
import { aws4Interceptor } from 'aws4-axios'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { Tool } from '@aws-sdk/client-bedrock-runtime'

/**
 * Gateway configuration
 */
export interface GatewayConfig {
  endpoint: string
  region?: string
  profile?: string
}

/**
 * MCP request/response types
 */
interface MCPRequest {
  jsonrpc: '2.0'
  id: string
  method: string
  params?: Record<string, any>
}

interface MCPResponse {
  jsonrpc: '2.0'
  id: string
  result?: MCPResult
  error?: MCPError
}

interface MCPError {
  code: number
  message: string
  data?: any
}

interface MCPResult {
  tools?: MCPTool[]
  nextCursor?: string
  content?: ToolContent[]
  isError?: boolean
  [key: string]: any
}

interface MCPTool {
  name: string
  description: string
  inputSchema: ToolInputSchema
}

interface ToolInputSchema {
  type: string
  properties?: Record<string, ToolProperty>
  required?: string[]
  [key: string]: any
}

interface ToolProperty {
  type: string
  description?: string
  enum?: string[]
  [key: string]: any
}

export interface ToolContent {
  type: string
  text?: string
  [key: string]: any
}

interface ListToolsParams {
  cursor?: string
}

interface ListToolsResponse {
  tools: MCPTool[]
  nextCursor?: string
}

interface CallToolResponse {
  content: ToolContent[]
  isError?: boolean
}

/**
 * AgentCore Gateway Client
 * Communicates with Bedrock AgentCore Gateway using AWS Signature V4 authentication
 */
export class AgentCoreGatewayClient {
  private config: GatewayConfig
  private axiosInstance: AxiosInstance
  private isInterceptorConfigured = false

  constructor(config: GatewayConfig) {
    this.config = config
    this.axiosInstance = axios.create({
      baseURL: config.endpoint,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })
  }

  /**
   * Setup AWS Signature V4 interceptor for axios
   */
  private async setupAxiosInterceptor(): Promise<void> {
    if (this.isInterceptorConfigured) {
      return
    }

    try {
      const credentialsProvider = fromNodeProviderChain({
        profile: this.config.profile || 'default'
      })
      const credentials = await credentialsProvider()

      const interceptor = aws4Interceptor({
        options: {
          region: this.config.region || 'us-east-1',
          service: 'bedrock-agentcore'
        },
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken
        }
      })

      this.axiosInstance.interceptors.request.use(interceptor)
      this.isInterceptorConfigured = true
    } catch (error) {
      throw new Error(
        `Failed to get AWS credentials: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Make MCP request to the gateway with AWS IAM authentication
   */
  private async makeRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      await this.setupAxiosInterceptor()

      const response = await this.axiosInstance.post<MCPResponse>('', request)

      if (response.data.error) {
        throw new Error(
          `MCP Error: ${response.data.error.message} (code: ${response.data.error.code})`
        )
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message
        throw new Error(`HTTP ${error.response?.status || 'Error'}: ${errorMessage}`)
      }
      throw error
    }
  }

  /**
   * List all available tools in the gateway
   * Supports pagination using cursor
   */
  async listTools(params?: ListToolsParams): Promise<ListToolsResponse> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: `list-tools-${Date.now()}`,
      method: 'tools/list',
      ...(params?.cursor && { params: { cursor: params.cursor } })
    }

    const response = await this.makeRequest(request)

    if (!response.result) {
      throw new Error('No result in response')
    }

    return {
      tools: response.result.tools || [],
      nextCursor: response.result.nextCursor
    }
  }

  /**
   * List all tools with automatic pagination
   */
  async listAllTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = []
    let cursor: string | undefined

    do {
      const response = await this.listTools(cursor ? { cursor } : undefined)
      allTools.push(...response.tools)
      cursor = response.nextCursor
    } while (cursor)

    return allTools
  }

  /**
   * Call a specific tool with arguments
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<CallToolResponse> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: `call-tool-${Date.now()}`,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }

    const response = await this.makeRequest(request)

    if (!response.result) {
      throw new Error('No result in response')
    }

    return {
      content: response.result.content || [],
      isError: response.result.isError
    }
  }

  /**
   * Convert MCP tools to Bedrock Tool format
   */
  convertToBedrockTools(mcpTools: MCPTool[]): Tool[] {
    return mcpTools.map((tool) => ({
      toolSpec: {
        name: tool.name,
        description: tool.description,
        inputSchema: { json: JSON.parse(JSON.stringify(tool.inputSchema)) }
      }
    }))
  }

  /**
   * Get gateway endpoint URL
   */
  getEndpoint(): string {
    return this.config.endpoint
  }
}
