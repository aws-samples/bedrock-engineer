/**
 * ExecuteCommand tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError, PermissionDeniedError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'
import { CommandService } from '../../../../main/api/command/commandService'
import {
  CommandInput,
  CommandStdinInput,
  ProcessInfo,
  CommandConfig,
  CommandPatternConfig
} from '../../../../main/api/command/types'
import { findAgentById } from '../../../helpers/agent-helpers'

/**
 * Input type for ExecuteCommandTool
 */
type ExecuteCommandInput = {
  type: 'executeCommand'
  _agentId?: string // BackgroundAgentService用のメタデータ
} & (CommandInput | CommandStdinInput)

/**
 * Result type for ExecuteCommandTool
 */
interface ExecuteCommandResult extends ToolResult {
  name: 'executeCommand'
  stdout: string
  stderr: string
  exitCode: number
  processInfo?: ProcessInfo
  requiresInput?: boolean
  prompt?: string
}

/**
 * Command service state management
 */
interface CommandServiceState {
  service: CommandService
  config: CommandConfig
}

let commandServiceState: CommandServiceState | null = null

/**
 * Tool for executing system commands
 */
export class ExecuteCommandTool extends BaseTool<ExecuteCommandInput, ExecuteCommandResult> {
  static readonly toolName = 'executeCommand'
  static readonly toolDescription =
    'Execute a command or send input to a running process. First execute the command to get a PID, then use that PID to send input if needed. Usage: 1) First call with command and cwd to start process, 2) If input is required, call again with pid and stdin.\n\nRun system commands with user permission. Only use commands from allowed list: {{allowedCommands}}.'

  readonly name = ExecuteCommandTool.toolName
  readonly description = ExecuteCommandTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: ExecuteCommandTool.toolName,
    description: ExecuteCommandTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The command to execute (used when starting a new process)'
          },
          cwd: {
            type: 'string',
            description: 'The working directory for the command execution (used with command)'
          },
          pid: {
            type: 'number',
            description: 'Process ID to send input to (used when sending input to existing process)'
          },
          stdin: {
            type: 'string',
            description: 'Standard input to send to the process (used with pid)'
          }
        }
      }
    }
  } as const

  /**
   * Get or create command service instance
   */
  private getCommandService(config: CommandConfig): CommandService {
    // Check if we need to create a new instance
    if (
      !commandServiceState ||
      JSON.stringify(commandServiceState.config) !== JSON.stringify(config)
    ) {
      commandServiceState = {
        service: new CommandService(config),
        config
      }
    }
    return commandServiceState.service
  }

  /**
   * Validate input
   */
  protected validateInput(input: ExecuteCommandInput): ValidationResult {
    const errors: string[] = []

    // Check if it's stdin input
    if ('pid' in input && 'stdin' in input) {
      if (typeof input.pid !== 'number') {
        errors.push('PID must be a number')
      }
      if (input.stdin !== undefined && typeof input.stdin !== 'string') {
        errors.push('Stdin must be a string')
      }
    }
    // Check if it's command input
    else if ('command' in input && 'cwd' in input) {
      if (!input.command) {
        errors.push('Command is required')
      }
      if (typeof input.command !== 'string') {
        errors.push('Command must be a string')
      }
      if (!input.cwd) {
        errors.push('Working directory (cwd) is required')
      }
      if (typeof input.cwd !== 'string') {
        errors.push('Working directory must be a string')
      }
    } else {
      errors.push('Invalid input format: requires either (command, cwd) or (pid, stdin)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: ExecuteCommandInput): Promise<ExecuteCommandResult> {
    // Get command configuration
    const config = this.getCommandConfig(input)

    this.logger.debug('Executing command', {
      input: JSON.stringify(input),
      config: JSON.stringify({
        allowedCommands: config.allowedCommands?.length || 0
      })
    })

    try {
      const commandService = this.getCommandService(config)
      let result

      if ('stdin' in input && 'pid' in input) {
        // Send stdin to existing process
        this.logger.info('Sending stdin to process', {
          pid: input.pid,
          stdinLength: input.stdin?.length || 0
        })

        result = await commandService.sendInput(input)

        this.logger.debug('Process stdin result', {
          pid: input.pid,
          exitCode: result.exitCode,
          hasStdout: !!result.stdout.length,
          hasStderr: !!result.stderr.length
        })
      } else if ('command' in input && 'cwd' in input) {
        // Execute new command
        this.logger.info('Executing new command', {
          command: input.command,
          cwd: input.cwd
        })

        result = await commandService.executeCommand(input)

        this.logger.debug('Command execution result', {
          pid: result.processInfo?.pid,
          exitCode: result.exitCode,
          hasStdout: !!result.stdout.length,
          hasStderr: !!result.stderr.length,
          requiresInput: result.requiresInput
        })
      } else {
        const errorMsg = 'Invalid input format'
        this.logger.warn(errorMsg, { input: JSON.stringify(input) })
        throw new Error(errorMsg)
      }

      this.logger.info('Command execution completed', {
        exitCode: result.exitCode,
        success: result.exitCode === 0,
        requiresInput: result.requiresInput || false
      })

      return {
        success: true,
        name: 'executeCommand',
        message: `Command executed: ${JSON.stringify(input)}`,
        result: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          processInfo: result.processInfo,
          requiresInput: result.requiresInput,
          prompt: result.prompt
        },
        ...result
      }
    } catch (error) {
      this.logger.error('Error executing command', {
        error: error instanceof Error ? error.message : 'Unknown error',
        input: JSON.stringify(input)
      })

      // Check if it's a permission error
      if (error instanceof Error && error.message.includes('not allowed')) {
        throw new PermissionDeniedError(
          error.message,
          this.name,
          'command' in input ? input.command : 'stdin'
        )
      }

      throw new ExecutionError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        this.name,
        error instanceof Error ? error : undefined,
        { input }
      )
    }
  }

  /**
   * Get command configuration from store
   */
  private getCommandConfig(input?: ExecuteCommandInput): CommandConfig {
    // Get basic shell setting
    const shell = (this.store.get('shell') as string) || '/bin/bash'

    // Get agent ID - prioritize _agentId from BackgroundAgentService, fallback to selectedAgentId
    const agentId = input?._agentId || (this.store.get('selectedAgentId') as string | undefined)

    // Get agent-specific allowed commands
    let allowedCommands: CommandPatternConfig[] = []

    if (agentId) {
      // Find agent and get allowed commands
      const currentAgent = findAgentById(agentId)
      if (currentAgent && currentAgent.allowedCommands) {
        // Convert to CommandPatternConfig format
        allowedCommands = currentAgent.allowedCommands.map((cmd) => ({
          pattern: cmd.pattern,
          description: cmd.description || ''
        }))
      }

      this.logger.debug('Found agent configuration', {
        agentId,
        agentName: currentAgent?.name,
        allowedCommandsCount: allowedCommands.length,
        isFromBackgroundAgent: !!input?._agentId
      })
    } else {
      this.logger.warn('No agent ID found for command configuration', {
        hasInputAgentId: !!input?._agentId,
        hasSelectedAgentId: !!this.store.get('selectedAgentId')
      })
    }

    return {
      allowedCommands,
      shell
    }
  }

  /**
   * Override to return error as JSON string for compatibility
   */
  protected handleError(error: unknown): Error {
    const toolError = super.handleError(error) as Error

    // For this tool, we need to return a JSON string error
    return new Error(
      JSON.stringify({
        success: false,
        error: toolError.message
      })
    )
  }

  /**
   * Override to sanitize command for logging
   */
  protected sanitizeInputForLogging(input: ExecuteCommandInput): any {
    if ('command' in input) {
      return {
        ...input,
        command: this.truncateForLogging(input.command, 100)
      }
    }

    if ('stdin' in input) {
      return {
        ...input,
        stdin: input.stdin ? this.truncateForLogging(input.stdin, 50) : undefined
      }
    }

    return input
  }
}
