/**
 * InvokeBedrockAgent tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import * as fs from 'fs/promises'
import * as path from 'path'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ToolResult } from '../../../../types/tools'
import { store } from '../../../store'

/**
 * Input type for InvokeBedrockAgentTool - matches legacy implementation
 */
interface InvokeBedrockAgentInput {
  type: 'invokeBedrockAgent'
  agentId: string
  agentAliasId: string
  sessionId?: string
  inputText: string
  file?: {
    filePath?: string
    useCase?: 'CODE_INTERPRETER' | 'CHAT'
  }
}

/**
 * Legacy result structure from old implementation
 */
type InvokeAgentResultOmitFile = {
  $metadata: any
  contentType: string
  sessionId: string
  completion?: {
    message?: string
    files?: string[]
  }
}

/**
 * Result type for InvokeBedrockAgentTool - matches legacy implementation
 */
interface InvokeBedrockAgentResult extends ToolResult<InvokeAgentResultOmitFile> {
  name: 'invokeBedrockAgent'
}

/**
 * Tool for invoking AWS Bedrock Agents
 */
export class InvokeBedrockAgentTool extends BaseTool<
  InvokeBedrockAgentInput,
  InvokeBedrockAgentResult
> {
  static readonly toolName = 'invokeBedrockAgent'
  static readonly toolDescription =
    'Invoke an Amazon Bedrock Agent using the specified agent ID and alias ID. Use this when you need to interact with an agent.\n\nInteract with AWS Bedrock agents. Only use Bedrock Agents from allowed list: {{bedrockAgents}}'

  readonly name = InvokeBedrockAgentTool.toolName
  readonly description = InvokeBedrockAgentTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: InvokeBedrockAgentTool.toolName,
    description: InvokeBedrockAgentTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'The ID of the agent to invoke'
          },
          agentAliasId: {
            type: 'string',
            description: 'The alias ID of the agent to invoke'
          },
          sessionId: {
            type: 'string',
            description:
              'Optional. The session ID to use for the agent invocation. The session ID is issued when you execute invokeBedrockAgent for the first time and is included in the response. Specify it if you want to continue the conversation from the second time onwards.'
          },
          inputText: {
            type: 'string',
            description: 'The input text to send to the agent'
          },
          file: {
            type: 'object',
            description:
              'Optional. The file to send to the agent. Be sure to specify if you need to analyze files.',
            properties: {
              filePath: {
                type: 'string',
                description: 'The path of the file to send to the agent'
              },
              useCase: {
                type: 'string',
                description:
                  'The use case of the file. Specify "CODE_INTERPRETER" if Python code analysis is required. Otherwise, specify "CHAT".',
                enum: ['CODE_INTERPRETER', 'CHAT']
              }
            }
          }
        },
        required: ['agentId', 'agentAliasId', 'inputText']
      }
    }
  } as const

  /**
   * Validate input - matches legacy implementation
   */
  protected validateInput(input: InvokeBedrockAgentInput): ValidationResult {
    const errors: string[] = []

    if (!input.agentId) {
      errors.push('Agent ID is required')
    }

    if (typeof input.agentId !== 'string') {
      errors.push('Agent ID must be a string')
    }

    if (!input.agentAliasId) {
      errors.push('Agent alias ID is required')
    }

    if (typeof input.agentAliasId !== 'string') {
      errors.push('Agent alias ID must be a string')
    }

    if (!input.inputText) {
      errors.push('Input text is required')
    }

    if (typeof input.inputText !== 'string') {
      errors.push('Input text must be a string')
    }

    if (input.inputText && input.inputText.trim().length === 0) {
      errors.push('Input text cannot be empty')
    }

    if (input.sessionId !== undefined && typeof input.sessionId !== 'string') {
      errors.push('Session ID must be a string')
    }

    if (input.file) {
      if (input.file.filePath && typeof input.file.filePath !== 'string') {
        errors.push('File path must be a string')
      }
      if (input.file.useCase && !['CODE_INTERPRETER', 'CHAT'].includes(input.file.useCase)) {
        errors.push('File use case must be either CODE_INTERPRETER or CHAT')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool - following legacy implementation pattern
   */
  protected async executeInternal(
    input: InvokeBedrockAgentInput
  ): Promise<InvokeBedrockAgentResult> {
    const { agentId, agentAliasId, sessionId, inputText, file } = input

    // Get project path from store (following legacy implementation)
    const projectPath = store.get('projectPath') as string

    this.logger.debug('Invoking Bedrock Agent', {
      agentId,
      agentAliasId,
      sessionId: sessionId || 'new-session',
      hasFile: !!file,
      projectPath
    })

    try {
      // ファイル処理の修正 (following legacy implementation)
      let fileData: any = undefined
      if (file && file.filePath) {
        this.logger.debug('Processing file for agent invocation', {
          filePath: file.filePath,
          useCase: file.useCase
        })

        const fileContent = await fs.readFile(file.filePath)
        const filename = path.basename(file.filePath)
        const mimeType = this.getMimeType(file.filePath)

        this.logger.debug('File read successfully', {
          filename,
          mimeType,
          contentLength: fileContent.length
        })

        fileData = {
          files: [
            {
              name: filename,
              source: {
                sourceType: 'BYTE_CONTENT',
                byteContent: {
                  // CSVファイルの場合は text/csv を使用
                  mediaType: filename.endsWith('.csv') ? 'text/csv' : mimeType,
                  data: fileContent
                }
              },
              useCase: file.useCase
            }
          ]
        }
      }

      const command = {
        agentId,
        agentAliasId,
        sessionId,
        inputText,
        enableTrace: true,
        sessionState: fileData
      }

      this.logger.info('Calling Bedrock Agent service', {
        agentId,
        agentAliasId,
        inputTextLength: inputText.length,
        hasSessionId: !!sessionId,
        hasFileData: !!fileData
      })

      // Call the main process API using type-safe IPC
      const result = await ipc('bedrock:invokeAgent', command)

      this.logger.info('Agent invocation successful', {
        agentId,
        sessionId: result.sessionId,
        hasCompletion: !!result.completion
      })

      let filePaths: string[] = []

      if (result.completion?.files?.length) {
        this.logger.debug('Processing files from agent result', {
          fileCount: result.completion.files.length
        })

        filePaths = await Promise.all(
          result.completion.files.map(async (file: any) => {
            const filePath = path.join(projectPath, file.name)
            try {
              await fs.writeFile(filePath, file.content)
              this.logger.debug('Created file from agent result', {
                filePath,
                contentLength: file.content.length
              })
              return filePath
            } catch (err) {
              this.logger.error('Failed to write file from agent result', {
                filePath,
                error: err instanceof Error ? err.message : String(err)
              })
              return filePath
            }
          })
        )

        this.logger.info('Created files from agent result', { fileCount: filePaths.length })
      }

      return {
        success: true,
        name: 'invokeBedrockAgent',
        message: `Invoked agent ${agentId} with alias ${agentAliasId}`,
        result: {
          ...result,
          completion: {
            ...result.completion,
            files: filePaths
          }
        }
      }
    } catch (error: any) {
      this.logger.error('Error invoking Bedrock Agent', {
        agentId,
        agentAliasId,
        error: error.message,
        errorName: error.name
      })

      throw `Error invoking agent: ${JSON.stringify({
        success: false,
        name: 'invokeBedrockAgent',
        error: 'Failed to invoke agent',
        message: error.message
      })}`
    }
  }

  /**
   * Get MIME type for file (following legacy implementation)
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
      '.py': 'text/plain',
      '.md': 'text/plain'
    }

    return mimeTypes[ext] || 'text/plain'
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
