import { ToolService } from './toolService'
import { store } from '../store'
import { BedrockService } from '../../main/api/bedrock'
import { ToolInput, ToolResult, isMcpTool, getOriginalMcpToolName } from '../../types/tools'
import { createPreloadCategoryLogger } from '../logger'
import { CommandPatternConfig } from '../../main/api/command/types'
import { tryExecuteMcpTool } from '../mcp'
import { findAgentById } from '../helpers/agent-helpers'

// Create logger for tools module
const logger = createPreloadCategoryLogger('tools')

export const executeTool = async (input: ToolInput): Promise<string | ToolResult> => {
  const toolService = new ToolService()
  const bedrock = new BedrockService({ store })

  logger.info(`Executing tool: ${input.type}`, {
    toolName: input.type,
    toolParams: JSON.stringify(input)
  })

  try {
    // MCPツールの場合は専用処理へ
    if (typeof input.type === 'string' && isMcpTool(input.type)) {
      // 現在選択されているエージェントIDを取得
      const selectedAgentId = store.get('selectedAgentId')

      // エージェント固有のMCPサーバー設定を取得
      let mcpServers: any[] | undefined = undefined
      if (selectedAgentId) {
        // カスタムエージェントからMCPサーバー設定を取得
        const customAgents = store.get('customAgents') || []
        const currentAgent = customAgents.find((agent) => agent.id === selectedAgentId)
        if (currentAgent && currentAgent.mcpServers && currentAgent.mcpServers.length > 0) {
          mcpServers = currentAgent.mcpServers
          logger.info(`Using agent-specific MCP servers for tool ${input.type}`, {
            agentId: selectedAgentId,
            mcpServersCount: mcpServers?.length || 0
          })
        } else {
          logger.warn(
            `Agent ${selectedAgentId} has no MCP servers configured for tool ${input.type}`
          )
        }
      }

      const originalToolName = getOriginalMcpToolName(input.type)
      return tryExecuteMcpTool(originalToolName, input, mcpServers)
    }

    switch (input.type) {
      case 'createFolder':
        return toolService.createFolder(input.path)

      case 'readFiles':
        return toolService.readFiles(input.paths, input.options)

      case 'writeToFile':
        return toolService.writeToFile(input.path, input.content)

      case 'applyDiffEdit':
        return toolService.applyDiffEdit(input.path, input.originalText, input.updatedText)

      case 'listFiles': {
        const defaultIgnoreFiles = store.get('agentChatConfig')?.ignoreFiles
        const options = {
          ...input.options,
          ignoreFiles: input.options?.ignoreFiles || defaultIgnoreFiles
        }
        return toolService.listFiles(input.path, options)
      }

      case 'moveFile':
        return toolService.moveFile(input.source, input.destination)

      case 'copyFile':
        return toolService.copyFile(input.source, input.destination)

      case 'tavilySearch': {
        const apiKey = store.get('tavilySearch').apikey
        return toolService.tavilySearch(input.query, apiKey, input.option)
      }

      case 'fetchWebsite':
        return toolService.fetchWebsite(input.url, input.options)

      case 'generateImage':
        return toolService.generateImage(bedrock, {
          prompt: input.prompt,
          outputPath: input.outputPath,
          modelId: input.modelId,
          negativePrompt: input.negativePrompt,
          aspect_ratio: input.aspect_ratio,
          seed: input.seed,
          output_format: input.output_format
        })

      case 'retrieve':
        return toolService.retrieve(bedrock, {
          knowledgeBaseId: input.knowledgeBaseId,
          query: input.query
        })

      case 'invokeBedrockAgent': {
        const projectPath = store.get('projectPath')!
        return toolService.invokeBedrockAgent(bedrock, projectPath, {
          agentId: input.agentId,
          agentAliasId: input.agentAliasId,
          sessionId: input.sessionId,
          inputText: input.inputText,
          file: input.file
        })
      }

      case 'executeCommand': {
        // 基本的なシェル設定を取得
        const shell = store.get('shell')

        // 現在選択されているエージェントIDを取得
        const selectedAgentId = store.get('selectedAgentId')

        // エージェント固有の許可コマンドを取得
        let allowedCommands: CommandPatternConfig[] = []
        if (selectedAgentId) {
          // カスタムエージェントおよび共有エージェントから許可コマンドを取得
          const currentAgent = findAgentById(selectedAgentId)
          if (currentAgent && currentAgent.allowedCommands) {
            allowedCommands = currentAgent.allowedCommands
          }
        }

        const commandConfig = {
          allowedCommands,
          shell
        }

        if ('pid' in input && 'stdin' in input && input?.pid && input?.stdin) {
          return toolService.executeCommand(
            {
              pid: input.pid,
              stdin: input.stdin
            },
            commandConfig
          )
        } else if ('command' in input && 'cwd' in input && input?.command && input?.cwd) {
          return toolService.executeCommand(
            {
              command: input.command,
              cwd: input.cwd
            },
            commandConfig
          )
        }

        const errorMessage =
          'Invalid input format for executeCommand: requires either (command, cwd) or (pid, stdin)'
        logger.error(errorMessage)
        throw new Error(errorMessage)
      }

      case 'think':
        return toolService.think(input.thought)

      case 'recognizeImage': {
        // ストアから設定されたモデルIDを取得（設定がない場合はデフォルトを使用）
        const recognizeImageSettings = store.get('recognizeImageTool') || {}
        const modelId =
          typeof recognizeImageSettings === 'object' && 'modelId' in recognizeImageSettings
            ? (recognizeImageSettings.modelId as string)
            : 'anthropic.claude-3-sonnet-20240229-v1:0'

        return toolService.recognizeImage(
          bedrock,
          {
            imagePaths: input.imagePaths,
            prompt: input.prompt
          },
          modelId // 設定から取得したモデルIDを直接渡す
        )
      }

      default: {
        // 未知のツール名の場合はエラー
        const unknownToolError = `Unknown tool type: ${input.type}`
        logger.error(unknownToolError)
        throw new Error(unknownToolError)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Error executing tool: ${input.type}`, { error: errorMessage })
    throw error
  }
}
