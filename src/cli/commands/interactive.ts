import { Command } from 'commander'
import { ConfigService } from '../services/ConfigService'
import { AgentManager } from '../core/AgentManager'
import { HeadlessAgentChat } from '../core/HeadlessAgentChat'
import { InteractiveCommandOptions } from '../types/commands'
import { logger } from '../utils/logger'
import inquirer from 'inquirer'
import chalk from 'chalk'

export const interactiveCommand = new Command('interactive')
  .alias('i')
  .description('Start an interactive chat session with an AI agent')
  .option('-a, --agent <name>', 'Agent name or ID to use')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-v, --verbose', 'Verbose logging', false)
  .option('-m, --model <model>', 'Model ID to use')
  .action(async (options: InteractiveCommandOptions) => {
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
      
      // Get agent
      let agent
      if (options.agent) {
        agent = await agentManager.getAgent(options.agent)
        if (!agent) {
          logger.error(`Agent not found: ${options.agent}`)
          const agents = await agentManager.listAgents()
          logger.info('Available agents:')
          agents.forEach(a => logger.info(`  - ${a.name} (${a.id})`))
          process.exit(1)
        }
      } else {
        // Let user select agent
        const agents = await agentManager.listAgents()
        const { selectedAgent } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedAgent',
            message: 'Select an agent:',
            choices: agents.map(a => ({
              name: `${a.name} - ${a.description}`,
              value: a.id
            }))
          }
        ])
        
        agent = await agentManager.getAgent(selectedAgent)
        if (!agent) {
          logger.error('Failed to load selected agent')
          process.exit(1)
        }
      }
      
      // Get model
      const modelId = options.model || config.model?.defaultModel?.id || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
      
      logger.debug(`Using agent: ${agent.name}`)
      logger.debug(`Using model: ${modelId}`)
      
      // Start interactive session
      const sessionId = `session-${Date.now()}`
      
      logger.printHeader(`Interactive Chat with ${agent.name}`)
      logger.info('Type your messages and press Enter. Use special commands:')
      logger.info('  /help     - Show help')
      logger.info('  /agents   - List available agents')
      logger.info('  /switch   - Switch to another agent')
      logger.info('  /tools    - Show available tools')
      logger.info('  /history  - Show conversation history')
      logger.info('  /clear    - Clear conversation history')
      logger.info('  /exit     - Exit interactive mode')
      logger.printSeparator()
      
      // Initialize chat
      const chat = new HeadlessAgentChat({
        agent,
        modelId,
        config,
        sessionId,
        enableHistory: true,
        onMessage: (text) => {
          // Handle streaming text - print as it comes
          process.stdout.write(text)
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
      
      // Interactive loop
      let running = true
      while (running) {
        try {
          const { input } = await inquirer.prompt([
            {
              type: 'input',
              name: 'input',
              message: chalk.blue('You:'),
              validate: (input: string) => {
                if (!input.trim()) {
                  return 'Please enter a message or command'
                }
                return true
              }
            }
          ])
          
          const trimmedInput = input.trim()
          
          // Handle special commands
          if (trimmedInput.startsWith('/')) {
            const command = trimmedInput.toLowerCase()
            
            switch (command) {
              case '/help':
                logger.info('Available commands:')
                logger.info('  /help     - Show this help message')
                logger.info('  /agents   - List all available agents')
                logger.info('  /switch   - Switch to another agent')
                logger.info('  /tools    - Show tools available to current agent')
                logger.info('  /history  - Show conversation history')
                logger.info('  /clear    - Clear conversation history')
                logger.info('  /exit     - Exit interactive mode')
                break
                
              case '/agents':
                const agents = await agentManager.listAgents()
                logger.info('Available agents:')
                agents.forEach(a => {
                  const current = a.id === agent.id ? ' (current)' : ''
                  logger.info(`  - ${a.name}${current} - ${a.description}`)
                })
                break
                
              case '/switch':
                const allAgents = await agentManager.listAgents()
                const { newAgent } = await inquirer.prompt([
                  {
                    type: 'list',
                    name: 'newAgent',
                    message: 'Select a new agent:',
                    choices: allAgents
                      .filter(a => a.id !== agent.id)
                      .map(a => ({
                        name: `${a.name} - ${a.description}`,
                        value: a.id
                      }))
                  }
                ])
                
                const selectedAgent = await agentManager.getAgent(newAgent)
                if (selectedAgent) {
                  agent = selectedAgent
                  // Create new chat instance with new agent
                  const newChat = new HeadlessAgentChat({
                    agent,
                    modelId,
                    config,
                    sessionId: `session-${Date.now()}`,
                    enableHistory: true,
                    onMessage: chat.onMessage,
                    onToolUse: chat.onToolUse,
                    onToolResult: chat.onToolResult,
                    onError: chat.onError
                  })
                  // Replace current chat
                  Object.assign(chat, newChat)
                  logger.success(`Switched to agent: ${agent.name}`)
                  logger.printSeparator()
                }
                break
                
              case '/tools':
                const tools = chat.getTools()
                if (tools.length > 0) {
                  logger.info(`Available tools for ${agent.name}:`)
                  tools.forEach(tool => logger.info(`  - ${tool}`))
                } else {
                  logger.info('No tools available for this agent')
                }
                break
                
              case '/history':
                const messages = chat.getMessages()
                if (messages.length === 0) {
                  logger.info('No conversation history')
                } else {
                  logger.info('Conversation history:')
                  messages.forEach((msg, index) => {
                    const role = msg.role === 'user' ? '👤' : '🤖'
                    const content = msg.content?.map(c => 'text' in c ? c.text : '[tool]').join(' ') || ''
                    logger.info(`  ${index + 1}. ${role}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`)
                  })
                }
                break
                
              case '/clear':
                chat.clearMessages()
                logger.success('Conversation history cleared')
                break
                
              case '/exit':
                running = false
                logger.success('Goodbye!')
                break
                
              default:
                logger.warn(`Unknown command: ${command}`)
                logger.info('Type /help for available commands')
            }
            
            continue
          }
          
          // Send regular message
          logger.printUserMessage(trimmedInput)
          
          const stopSpinner = logger.startSpinner('Thinking...')
          
          try {
            process.stdout.write(chalk.green('🤖: '))
            
            // Use streaming for better UX
            let responseText = ''
            for await (const delta of chat.streamMessage(trimmedInput)) {
              if (delta.type === 'text') {
                responseText += delta.content
                // Text is already printed via onMessage callback
              }
            }
            
            process.stdout.write('\n')
            stopSpinner()
            
            logger.printSeparator()
            
          } catch (error) {
            stopSpinner()
            logger.error('Failed to get response:', error)
          }
          
        } catch (error) {
          if (error.name === 'ExitPromptError') {
            // User cancelled with Ctrl+C
            running = false
            logger.info('\nGoodbye!')
          } else {
            logger.error('Error in interactive session:', error)
          }
        }
      }
      
    } catch (error) {
      logger.error('Interactive command failed:', error)
      process.exit(1)
    }
  })