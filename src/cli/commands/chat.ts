import { Command } from 'commander'
import { ConfigService } from '../services/ConfigService'
import { AgentManager } from '../core/AgentManager'
import { HeadlessAgentChat } from '../core/HeadlessAgentChat'
import { ChatCommandOptions } from '../types/commands'
import { logger } from '../utils/logger'

export const chatCommand = new Command('chat')
  .description('Send a message to an AI agent')
  .option('-a, --agent <name>', 'Agent name or ID to use')
  .option('-p, --prompt <text>', 'Message to send to the agent')
  .option('-o, --output <format>', 'Output format (text|json)', 'text')
  .option('-v, --verbose', 'Verbose logging', false)
  .option('-c, --config <path>', 'Configuration file path')
  .option('-s, --session-id <id>', 'Session ID for conversation continuity')
  .option('-t, --tools <tools>', 'Comma-separated list of tools to enable')
  .option('-m, --model <model>', 'Model ID to use')
  .action(async (options: ChatCommandOptions) => {
    try {
      // Initialize services
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      // Set up logging
      if (options.verbose) {
        logger.setVerbose(true)
      }

      // Load configuration
      const config = await configService.load()
      logger.debug('Configuration loaded')

      // Initialize agent manager
      await agentManager.initialize()

      // Validate required options
      if (!options.prompt) {
        logger.error('Prompt is required. Use -p or --prompt to specify a message.')
        process.exit(1)
      }

      // Get agent
      const agentIdOrName = options.agent || config.agents?.defaultAgentId || 'Software Developer'
      const agent = await agentManager.getAgent(agentIdOrName)

      if (!agent) {
        logger.error(`Agent not found: ${agentIdOrName}`)
        const agents = await agentManager.listAgents()
        logger.info('Available agents:')
        agents.forEach((a) => logger.info(`  - ${a.name} (${a.id})`))
        process.exit(1)
      }

      // Get model
      const modelId =
        options.model ||
        config.model?.defaultModel?.id ||
        'anthropic.claude-3-5-sonnet-20241022-v2:0'

      logger.debug(`Using agent: ${agent.name}`)
      logger.debug(`Using model: ${modelId}`)

      // Show progress
      logger.printHeader(`Chatting with ${agent.name}`)
      logger.printUserMessage(options.prompt)

      const stopSpinner = logger.startSpinner('Thinking...')

      try {
        // Initialize chat
        const chat = new HeadlessAgentChat({
          agent,
          modelId,
          config,
          sessionId: options.sessionId,
          enableHistory: !!options.sessionId,
          onMessage: (_text) => {
            // Handle streaming text if needed
          },
          onToolUse: (toolName, input) => {
            logger.printToolExecution(toolName, input)
          },
          onToolResult: (toolName, result) => {
            const success = !result.toString().toLowerCase().includes('error')
            logger.printToolResult(toolName, success, result)
          },
          onError: (error) => {
            logger.error('Chat error:', error)
          }
        })

        // Send message
        const response = await chat.sendMessage(options.prompt)

        stopSpinner()

        // Output response
        if (options.output === 'json') {
          console.log(
            JSON.stringify(
              {
                agent: {
                  id: agent.id,
                  name: agent.name
                },
                message: response.message,
                toolUses: response.toolUses,
                toolResults: response.toolResults,
                metadata: response.metadata
              },
              null,
              2
            )
          )
        } else {
          logger.printSeparator()
          logger.printAgentMessage(response.message)

          // Show metadata if verbose
          if (options.verbose && response.metadata) {
            logger.printSeparator()
            logger.info('Metadata:')
            logger.info(`  Model: ${response.metadata.modelId}`)
            if (response.metadata.inputTokens) {
              logger.info(`  Input tokens: ${response.metadata.inputTokens}`)
            }
            if (response.metadata.outputTokens) {
              logger.info(`  Output tokens: ${response.metadata.outputTokens}`)
            }
            if (response.metadata.cost) {
              logger.info(`  Estimated cost: $${response.metadata.cost.toFixed(6)}`)
            }
          }

          // Show tool usage if any
          if (response.toolUses && response.toolUses.length > 0) {
            logger.printSeparator()
            logger.info(`Used ${response.toolUses.length} tool(s):`)
            response.toolUses.forEach((tool) => {
              logger.info(`  - ${tool.name}`)
            })
          }
        }

        // Save session ID for future reference
        if (options.sessionId) {
          logger.debug(`Session ID: ${options.sessionId}`)
        }
      } catch (error) {
        stopSpinner()
        throw error
      }
    } catch (error) {
      logger.error('Chat command failed:', error)
      process.exit(1)
    }
  })
