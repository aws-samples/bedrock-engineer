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
  type: 'mcpTool'
  serverName: string
  toolName: string
  args?: Record<string, any>
}

/**
 * Result type for McpToolAdapter
 */
interface McpToolResult extends ToolResult {
  name: 'mcpTool'
  result: any
}

/**
 * Adapter for MCP (Model Context Protocol) tools
 */
export class McpToolAdapter extends BaseTool<McpToolInput, McpToolResult> {
  readonly name = 'mcpTool'
  readonly description = 'Execute tools provided by MCP servers'

  /**
   * Validate input
   */
  protected validateInput(input: McpToolInput): ValidationResult {
    const errors: string[] = []

    if (!input.serverName) {
      errors.push('Server name is required')
    }

    if (typeof input.serverName !== 'string') {
      errors.push('Server name must be a string')
    }

    if (!input.toolName) {
      errors.push('Tool name is required')
    }

    if (typeof input.toolName !== 'string') {
      errors.push('Tool name must be a string')
    }

    if (input.args !== undefined && typeof input.args !== 'object') {
      errors.push('Args must be an object')
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
    const { serverName, toolName, args = {} } = input

    this.logger.debug(`Executing MCP tool: ${serverName}/${toolName}`, {
      serverName,
      toolName,
      hasArgs: Object.keys(args).length > 0
    })

    try {
      this.logger.info(`Calling MCP tool: ${toolName} on server: ${serverName}`)

      // Get MCP server configuration from store
      const mcpServers = this.storeManager.get('mcpServers') as McpServerConfig[] | undefined

      // Execute the MCP tool
      const result = await tryExecuteMcpTool(toolName, args, mcpServers)

      this.logger.info(`MCP tool execution completed`, {
        serverName,
        toolName,
        success: true,
        resultType: typeof result
      })

      // Check if the tool was found
      if (!result.found) {
        throw new ExecutionError(
          result.message || `MCP tool not found: ${toolName}`,
          this.name,
          undefined,
          { serverName, toolName }
        )
      }

      // Check if execution was successful
      if (!result.success) {
        throw new ExecutionError(
          result.message || result.error || 'MCP tool execution failed',
          this.name,
          undefined,
          { serverName, toolName, args }
        )
      }

      return {
        success: true,
        name: 'mcpTool',
        message: result.message || `Executed MCP tool: ${serverName}/${toolName}`,
        result: result.result
      }
    } catch (error) {
      this.logger.error(`Error executing MCP tool: ${serverName}/${toolName}`, {
        error: error instanceof Error ? error.message : String(error),
        serverName,
        toolName,
        args: JSON.stringify(args)
      })

      throw new ExecutionError(
        `Error executing MCP tool ${serverName}/${toolName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.name,
        error instanceof Error ? error : undefined,
        { serverName, toolName, args }
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
    return {
      ...input,
      args: input.args ? this.sanitizeObject(input.args) : undefined
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
