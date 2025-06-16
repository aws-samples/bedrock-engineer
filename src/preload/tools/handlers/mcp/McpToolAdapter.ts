/**
 * MCP Tool Adapter implementation
 */

import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'
import { tryExecuteMcpTool } from '../../../mcp'
import { McpServerConfig } from '../../../../types/agent-chat'

/**
 * Input type for McpToolAdapter
 */
interface McpToolInput {
  type: string // MCP tool type (e.g., 'mcp_search_documentation')
  mcpToolName?: string // Original MCP tool name passed from registry
  [key: string]: any // Allow any additional parameters
}

/**
 * Result type for McpToolAdapter
 */
interface McpToolResult extends ToolResult {
  name: 'mcp'
  result: any
}

/**
 * Adapter for MCP (Model Context Protocol) tools
 */
export class McpToolAdapter extends BaseTool<McpToolInput, McpToolResult> {
  readonly name = 'mcp' as const
  readonly description = 'Execute tools provided by MCP servers'

  /**
   * Validate input
   */
  protected validateInput(input: McpToolInput): ValidationResult {
    const errors: string[] = []

    if (!input.type) {
      errors.push('Tool type is required')
    }

    if (typeof input.type !== 'string') {
      errors.push('Tool type must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: McpToolInput): Promise<McpToolResult> {
    // Extract the actual tool name from mcpToolName or type
    const toolName = input.mcpToolName || input.type.replace(/^mcp_/, '')

    // Extract arguments (exclude type and mcpToolName)
    const { type, mcpToolName: _mcpToolName, ...args } = input

    this.logger.debug(`Executing MCP tool: ${toolName}`, {
      originalType: type,
      toolName,
      hasArgs: Object.keys(args).length > 0
    })

    try {
      this.logger.info(`Calling MCP tool: ${toolName}`)

      // Get agent configuration from store
      const selectedAgentId = this.storeManager.get('selectedAgentId') as string | undefined
      const customAgents = (this.storeManager.get('customAgents') as any[] | undefined) || []

      if (!selectedAgentId) {
        throw new ExecutionError(
          'No agent selected. Please select an agent to use MCP tools.',
          this.name,
          undefined,
          { toolName }
        )
      }

      // Find the current agent
      const currentAgent = customAgents.find((agent: any) => agent.id === selectedAgentId)

      if (!currentAgent) {
        throw new ExecutionError(
          `Agent not found: ${selectedAgentId}. Please check your agent configuration.`,
          this.name,
          undefined,
          { toolName, selectedAgentId }
        )
      }

      // Get MCP server configuration from the current agent
      const mcpServers = currentAgent.mcpServers as McpServerConfig[] | undefined

      if (!mcpServers || mcpServers.length === 0) {
        throw new ExecutionError(
          'No MCP servers configured for this agent. Please configure MCP servers in agent settings.',
          this.name,
          undefined,
          { toolName, agentId: selectedAgentId }
        )
      }

      this.logger.debug(`Found ${mcpServers.length} MCP servers for agent: ${currentAgent.name}`, {
        agentId: selectedAgentId,
        agentName: currentAgent.name,
        serverCount: mcpServers.length,
        serverNames: mcpServers.map((s) => s.name)
      })

      // Execute the MCP tool
      const result = await tryExecuteMcpTool(toolName, args, mcpServers)

      this.logger.info(`MCP tool execution completed`, {
        toolName,
        success: result.success,
        found: result.found,
        resultType: typeof result.result
      })

      // Check if the tool was found
      if (!result.found) {
        throw new ExecutionError(
          result.message ||
            `MCP tool not found: ${toolName}. Please check if the tool is available in your configured MCP servers.`,
          this.name,
          undefined,
          { toolName, availableServers: mcpServers.length }
        )
      }

      // Check if execution was successful
      if (!result.success) {
        throw new ExecutionError(
          result.message || result.error || 'MCP tool execution failed',
          this.name,
          undefined,
          { toolName, args }
        )
      }

      return {
        success: true,
        name: 'mcp',
        message: result.message || `Executed MCP tool: ${toolName}`,
        result: result.result
      }
    } catch (error) {
      // If it's already an ExecutionError, re-throw it
      if (error instanceof ExecutionError) {
        throw error
      }

      this.logger.error(`Error executing MCP tool: ${toolName}`, {
        error: error instanceof Error ? error.message : String(error),
        toolName,
        args: JSON.stringify(args)
      })

      throw new ExecutionError(
        `Error executing MCP tool ${toolName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.name,
        error instanceof Error ? error : undefined,
        { toolName, args }
      )
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize args for logging
   */
  protected sanitizeInputForLogging(input: McpToolInput): any {
    const { type, mcpToolName, ...args } = input

    return {
      type,
      mcpToolName,
      args: args ? this.sanitizeObject(args) : undefined
    }
  }

  /**
   * Sanitize object for logging
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      // Redact potentially sensitive keys
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')
      ) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = this.truncateForLogging(value, 100)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}
