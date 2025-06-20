import { Command } from 'commander'
import { ConfigService } from '../services/ConfigService'
import { AgentManager } from '../core/AgentManager'
import { AgentCommandOptions } from '../types/commands'
import { logger } from '../utils/logger'
import inquirer from 'inquirer'
import chalk from 'chalk'

export const agentCommand = new Command('agent').description('Manage AI agents')

// List agents command
agentCommand
  .command('list')
  .alias('ls')
  .description('List all available agents')
  .option('-f, --format <format>', 'Output format (text|json|yaml)', 'text')
  .option('-v, --verbose', 'Show detailed information', false)
  .action(async (options: AgentCommandOptions) => {
    try {
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      if (options.verbose) {
        logger.setVerbose(true)
      }

      await agentManager.initialize()
      const agents = await agentManager.listAgents()

      if (options.format === 'json') {
        console.log(JSON.stringify(agents, null, 2))
      } else if (options.format === 'yaml') {
        const yaml = require('js-yaml')
        console.log(yaml.dump(agents, { indent: 2 }))
      } else {
        logger.printHeader(`Available Agents (${agents.length})`)

        // Group agents by type
        const defaultAgents = agents.filter((a) => !a.isCustom && !a.isShared)
        const customAgents = agents.filter((a) => a.isCustom)
        const sharedAgents = agents.filter((a) => a.isShared)

        if (defaultAgents.length > 0) {
          logger.info(chalk.bold('Default Agents:'))
          defaultAgents.forEach((agent) => {
            const icon = agent.icon ? `${agent.icon} ` : '🤖 '
            const tools = agent.tools ? ` (${agent.tools.length} tools)` : ''
            logger.info(`  ${icon}${chalk.cyan(agent.name)}${tools}`)
            if (options.verbose) {
              logger.info(`    ${chalk.gray(agent.description)}`)
              logger.info(`    ${chalk.gray(`ID: ${agent.id}`)}`)
            }
          })
          logger.info('')
        }

        if (customAgents.length > 0) {
          logger.info(chalk.bold('Custom Agents:'))
          customAgents.forEach((agent) => {
            const icon = agent.icon ? `${agent.icon} ` : '⚙️ '
            const tools = agent.tools ? ` (${agent.tools.length} tools)` : ''
            logger.info(`  ${icon}${chalk.yellow(agent.name)}${tools}`)
            if (options.verbose) {
              logger.info(`    ${chalk.gray(agent.description)}`)
              logger.info(`    ${chalk.gray(`ID: ${agent.id}`)}`)
            }
          })
          logger.info('')
        }

        if (sharedAgents.length > 0) {
          logger.info(chalk.bold('Shared Agents:'))
          sharedAgents.forEach((agent) => {
            const icon = agent.icon ? `${agent.icon} ` : '📁 '
            const tools = agent.tools ? ` (${agent.tools.length} tools)` : ''
            logger.info(`  ${icon}${chalk.green(agent.name)}${tools}`)
            if (options.verbose) {
              logger.info(`    ${chalk.gray(agent.description)}`)
              logger.info(`    ${chalk.gray(`ID: ${agent.id}`)}`)
            }
          })
        }
      }
    } catch (error) {
      logger.error('Failed to list agents:', error)
      process.exit(1)
    }
  })

// Show agent command
agentCommand
  .command('show <agent>')
  .description('Show detailed information about an agent')
  .option('-f, --format <format>', 'Output format (text|json|yaml)', 'text')
  .action(async (agentIdOrName: string, options: AgentCommandOptions) => {
    try {
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      await agentManager.initialize()
      const agent = await agentManager.getAgent(agentIdOrName)

      if (!agent) {
        logger.error(`Agent not found: ${agentIdOrName}`)
        process.exit(1)
      }

      if (options.format === 'json') {
        console.log(JSON.stringify(agent, null, 2))
      } else if (options.format === 'yaml') {
        const yaml = require('js-yaml')
        console.log(yaml.dump(agent, { indent: 2 }))
      } else {
        const icon = agent.icon ? `${agent.icon} ` : '🤖 '
        logger.printHeader(`${icon}${agent.name}`)

        logger.info(chalk.bold('Description:'))
        logger.info(`  ${agent.description}`)
        logger.info('')

        logger.info(chalk.bold('Details:'))
        logger.info(`  ID: ${agent.id}`)
        logger.info(`  Category: ${agent.category || 'general'}`)
        logger.info(`  Type: ${agent.isCustom ? 'Custom' : agent.isShared ? 'Shared' : 'Default'}`)

        if (agent.tags && agent.tags.length > 0) {
          logger.info(`  Tags: ${agent.tags.join(', ')}`)
        }

        if (agent.author) {
          logger.info(`  Author: ${agent.author}`)
        }
        logger.info('')

        if (agent.tools && agent.tools.length > 0) {
          logger.info(chalk.bold('Available Tools:'))
          agent.tools.forEach((tool) => {
            logger.info(`  - ${tool}`)
          })
          logger.info('')
        }

        logger.info(chalk.bold('System Prompt:'))
        const systemLines = agent.system.split('\n')
        systemLines.forEach((line) => {
          logger.info(`  ${line}`)
        })

        if (agent.scenarios && agent.scenarios.length > 0) {
          logger.info('')
          logger.info(chalk.bold('Example Scenarios:'))
          agent.scenarios.forEach((scenario, index) => {
            logger.info(`  ${index + 1}. ${scenario.title}`)
            logger.info(`     ${chalk.gray(scenario.content)}`)
          })
        }
      }
    } catch (error) {
      logger.error('Failed to show agent:', error)
      process.exit(1)
    }
  })

// Create agent command
agentCommand
  .command('create')
  .description('Create a new custom agent')
  .option('-n, --name <name>', 'Agent name')
  .option('-d, --description <description>', 'Agent description')
  .option('-s, --system <prompt>', 'System prompt')
  .option('-c, --category <category>', 'Agent category')
  .option('-i, --icon <icon>', 'Agent icon')
  .option('--color <color>', 'Icon color')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('--tools <tools>', 'Comma-separated list of tools')
  .action(async (options: any) => {
    try {
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      await agentManager.initialize()

      // Interactive prompts for missing options
      const answers = await inquirer.prompt([
        {
          name: 'name',
          message: 'Agent name:',
          when: !options.name,
          validate: (input: string) => input.trim().length > 0 || 'Agent name is required'
        },
        {
          name: 'description',
          message: 'Agent description:',
          when: !options.description,
          validate: (input: string) => input.trim().length > 0 || 'Agent description is required'
        },
        {
          name: 'system',
          message: 'System prompt:',
          when: !options.system,
          validate: (input: string) => input.trim().length > 0 || 'System prompt is required'
        },
        {
          name: 'category',
          type: 'list',
          message: 'Agent category:',
          choices: ['general', 'coding', 'design', 'data', 'business', 'custom'],
          default: 'custom',
          when: !options.category
        },
        {
          name: 'icon',
          message: 'Agent icon (optional):',
          default: 'robot',
          when: !options.icon
        },
        {
          name: 'color',
          message: 'Icon color (optional):',
          default: '#3B82F6',
          when: !options.color
        },
        {
          name: 'tags',
          message: 'Tags (comma-separated, optional):',
          when: !options.tags
        },
        {
          name: 'tools',
          message: 'Tools (comma-separated, optional):',
          when: !options.tools
        }
      ])

      const config = {
        name: options.name || answers.name,
        description: options.description || answers.description,
        system: options.system || answers.system,
        category: options.category || answers.category,
        icon: options.icon || answers.icon,
        iconColor: options.color || answers.color,
        tags:
          (options.tags || answers.tags)
            ?.split(',')
            .map((t: string) => t.trim())
            .filter(Boolean) || [],
        tools:
          (options.tools || answers.tools)
            ?.split(',')
            .map((t: string) => t.trim())
            .filter(Boolean) || []
      }

      const agent = await agentManager.createAgent(config)

      logger.success(`Created agent: ${agent.name}`)
      logger.info(`Agent ID: ${agent.id}`)
    } catch (error) {
      logger.error('Failed to create agent:', error)
      process.exit(1)
    }
  })

// Export agent command
agentCommand
  .command('export <agent>')
  .description('Export an agent to a file')
  .option('-f, --format <format>', 'Export format (json|yaml)', 'yaml')
  .option('-o, --output <file>', 'Output file path')
  .action(async (agentIdOrName: string, options: any) => {
    try {
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      await agentManager.initialize()
      const agent = await agentManager.getAgent(agentIdOrName)

      if (!agent) {
        logger.error(`Agent not found: ${agentIdOrName}`)
        process.exit(1)
      }

      const exportData = await agentManager.exportAgent(agent.id, options.format)

      if (options.output) {
        const fs = require('fs').promises
        await fs.writeFile(options.output, exportData, 'utf-8')
        logger.success(`Agent exported to: ${options.output}`)
      } else {
        console.log(exportData)
      }
    } catch (error) {
      logger.error('Failed to export agent:', error)
      process.exit(1)
    }
  })

// Import agent command
agentCommand
  .command('import <file>')
  .description('Import an agent from a file')
  .option('-f, --format <format>', 'Import format (json|yaml)', 'yaml')
  .action(async (filePath: string, options: any) => {
    try {
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      await agentManager.initialize()

      const fs = require('fs').promises
      const data = await fs.readFile(filePath, 'utf-8')

      const agent = await agentManager.importAgent(data, options.format)

      logger.success(`Imported agent: ${agent.name}`)
      logger.info(`Agent ID: ${agent.id}`)
    } catch (error) {
      logger.error('Failed to import agent:', error)
      process.exit(1)
    }
  })

// Delete agent command
agentCommand
  .command('delete <agent>')
  .alias('rm')
  .description('Delete a custom agent')
  .option('-f, --force', 'Force deletion without confirmation')
  .action(async (agentIdOrName: string, options: any) => {
    try {
      const configService = new ConfigService()
      const agentManager = new AgentManager(configService)

      await agentManager.initialize()
      const agent = await agentManager.getAgent(agentIdOrName)

      if (!agent) {
        logger.error(`Agent not found: ${agentIdOrName}`)
        process.exit(1)
      }

      if (!agent.isCustom) {
        logger.error('Only custom agents can be deleted')
        process.exit(1)
      }

      // Confirm deletion
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete agent "${agent.name}"?`,
            default: false
          }
        ])

        if (!confirm) {
          logger.info('Deletion cancelled')
          return
        }
      }

      const deleted = await agentManager.deleteAgent(agent.id)

      if (deleted) {
        logger.success(`Deleted agent: ${agent.name}`)
      } else {
        logger.error('Failed to delete agent')
        process.exit(1)
      }
    } catch (error) {
      logger.error('Failed to delete agent:', error)
      process.exit(1)
    }
  })
