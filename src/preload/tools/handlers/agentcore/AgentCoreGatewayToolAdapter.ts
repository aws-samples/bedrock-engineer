/**
 * AgentCore Gateway Tool Adapter implementation
 */

import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'
import { AgentCoreGatewayConfigSchemaType } from '../../../../types/agent-chat.schema'
import { ipcRenderer } from 'electron'

/**
 * Input type for AgentCoreGatewayToolAdapter
 */
interface AgentCoreGatewayToolInput {
  type: string // Gateway tool type (e.g., 'agentcore_get_weather')
  gatewayToolName?: string // Original Gateway tool name passed from registry
  [key: string]: any // Allow any additional parameters
}

/**
 * Result type for AgentCoreGatewayToolAdapter
 */
interface AgentCoreGatewayToolResult extends ToolResult {
  name: 'agentcore'
  result: any
}

/**
 * Adapter for AgentCore Gateway tools
 */
export class AgentCoreGatewayToolAdapter extends BaseTool<
  AgentCoreGatewayToolInput,
  AgentCoreGatewayToolResult
> {
  readonly name = 'agentcore' as const
  readonly description = 'Execute tools provided by Bedrock AgentCore Gateway'

  /**
   * Validate input
   */
  protected validateInput(input: AgentCoreGatewayToolInput): ValidationResult {
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
  protected async executeInternal(
    input: AgentCoreGatewayToolInput
  ): Promise<AgentCoreGatewayToolResult> {
    // ツール名をそのまま使用（プレフィックスなし）
    const toolName = input.gatewayToolName || input.type

    // Extract arguments (exclude type, gatewayToolName, and internal metadata)
    const { type, gatewayToolName: _gatewayToolName, _agentId, _gatewayConfig, ...args } = input

    this.logger.debug(`Executing AgentCore Gateway tool: ${toolName}`, {
      originalType: type,
      toolName,
      hasArgs: Object.keys(args).length > 0,
      hasBackgroundAgentContext: !!_agentId
    })

    try {
      this.logger.info(`Calling AgentCore Gateway tool: ${toolName}`)

      let gatewayConfig: AgentCoreGatewayConfigSchemaType | undefined
      let agentId: string | undefined
      let agentName: string | undefined

      // Check if this is called from BackgroundAgentService (priority)
      if (_agentId && _gatewayConfig) {
        this.logger.debug('Using BackgroundAgentService context', {
          agentId: _agentId,
          gatewayEndpoint: _gatewayConfig.endpoint
        })

        agentId = _agentId
        gatewayConfig = _gatewayConfig
        agentName = `BackgroundAgent-${_agentId}`
      } else {
        // Fallback to frontend store (original behavior)
        this.logger.debug('Using frontend store context')

        const selectedAgentId = this.store.get('selectedAgentId') as string | undefined
        const customAgents = (this.store.get('customAgents') as any[] | undefined) || []

        if (!selectedAgentId) {
          throw new ExecutionError(
            'No agent selected. Please select an agent to use AgentCore Gateway tools.',
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

        agentId = selectedAgentId
        const agentCoreGateways = currentAgent.agentCoreGateways as
          | AgentCoreGatewayConfigSchemaType[]
          | undefined
        agentName = currentAgent.name

        // For now, use the first gateway configuration
        // In the future, we could support multiple gateways and select based on tool name
        if (!agentCoreGateways || agentCoreGateways.length === 0) {
          throw new ExecutionError(
            'No AgentCore Gateway configured for this agent. Please configure a gateway in agent settings.',
            this.name,
            undefined,
            { toolName, agentId }
          )
        }

        gatewayConfig = agentCoreGateways[0]
      }

      if (!gatewayConfig) {
        throw new ExecutionError(
          'No AgentCore Gateway configuration found.',
          this.name,
          undefined,
          { toolName, agentId }
        )
      }

      this.logger.debug(`Using AgentCore Gateway for agent: ${agentName}`, {
        agentId,
        agentName,
        endpoint: gatewayConfig.endpoint,
        region: gatewayConfig.region || 'us-east-1'
      })

      // Execute the tool via direct IPC to Main Process
      const result = await ipcRenderer.invoke(
        'agentcore:executeTool',
        gatewayConfig,
        toolName,
        args
      )

      this.logger.info(`AgentCore Gateway tool execution completed`, {
        toolName,
        success: result.success,
        isError: result.isError,
        contentLength: result.content?.length
      })

      // Check if execution was successful
      if (!result.success || result.isError) {
        const errorMessage =
          result.error ||
          (result.content && result.content[0]?.text) ||
          'AgentCore Gateway tool execution failed'

        throw new ExecutionError(errorMessage, this.name, undefined, { toolName, args })
      }

      // Format the result
      let formattedResult: any = result.content

      // If content is an array with a single text item, extract it
      if (
        Array.isArray(result.content) &&
        result.content.length === 1 &&
        result.content[0].type === 'text'
      ) {
        formattedResult = result.content[0].text
      }

      return {
        success: true,
        name: 'agentcore',
        message: `Executed AgentCore Gateway tool: ${toolName}`,
        result: formattedResult
      }
    } catch (error) {
      // If it's already an ExecutionError, re-throw it
      if (error instanceof ExecutionError) {
        throw error
      }

      this.logger.error(`Error executing AgentCore Gateway tool: ${toolName}`, {
        error: error instanceof Error ? error.message : String(error),
        toolName,
        args: JSON.stringify(args)
      })

      throw new ExecutionError(
        `Error executing AgentCore Gateway tool ${toolName}: ${
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
  protected sanitizeInputForLogging(input: AgentCoreGatewayToolInput): any {
    const { type, gatewayToolName, ...args } = input

    return {
      type,
      gatewayToolName,
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
