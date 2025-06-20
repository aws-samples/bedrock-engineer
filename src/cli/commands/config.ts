import { Command } from 'commander'
import { ConfigService } from '../services/ConfigService'
import { ConfigCommandOptions } from '../types/commands'
import { logger } from '../utils/logger'
import inquirer from 'inquirer'
import chalk from 'chalk'

export const configCommand = new Command('config').description('Manage CLI configuration')

// Initialize config command
configCommand
  .command('init')
  .description('Initialize configuration')
  .option('-g, --global', 'Initialize global configuration', false)
  .action(async (_options: ConfigCommandOptions) => {
    try {
      const configService = new ConfigService()

      await configService.init()
      logger.success('Configuration initialized')

      const paths = configService.getPaths()
      logger.info(`Global config: ${paths.globalConfig}`)
      logger.info(`Local config: ${paths.localConfig}`)
      logger.info(`Data directory: ${paths.userDataDir}`)
    } catch (error) {
      logger.error('Failed to initialize configuration:', error)
      process.exit(1)
    }
  })

// Show config command
configCommand
  .command('show')
  .description('Show current configuration')
  .option('-g, --global', 'Show only global configuration', false)
  .action(async (_options: ConfigCommandOptions) => {
    try {
      const configService = new ConfigService()
      const config = await configService.load()

      logger.printHeader('Current Configuration')
      console.log(JSON.stringify(config, null, 2))

      const paths = configService.getPaths()
      logger.info('')
      logger.info(chalk.bold('Configuration Paths:'))
      logger.info(`  Global: ${paths.globalConfig}`)
      logger.info(`  Local: ${paths.localConfig}`)
      logger.info(`  Data: ${paths.userDataDir}`)
      logger.info(`  Cache: ${paths.cacheDir}`)
      logger.info(`  Logs: ${paths.logsDir}`)
    } catch (error) {
      logger.error('Failed to show configuration:', error)
      process.exit(1)
    }
  })

// Get config value command
configCommand
  .command('get <key>')
  .description('Get a configuration value')
  .action(async (key: string) => {
    try {
      const configService = new ConfigService()
      const value = await configService.get(key)

      if (value !== undefined) {
        if (typeof value === 'object') {
          console.log(JSON.stringify(value, null, 2))
        } else {
          console.log(value)
        }
      } else {
        logger.warn(`Configuration key not found: ${key}`)
        process.exit(1)
      }
    } catch (error) {
      logger.error('Failed to get configuration value:', error)
      process.exit(1)
    }
  })

// Set config value command
configCommand
  .command('set <key> <value>')
  .description('Set a configuration value')
  .option('-g, --global', 'Set in global configuration', true)
  .action(async (key: string, value: string, options: ConfigCommandOptions) => {
    try {
      const configService = new ConfigService()

      // Try to parse value as JSON, fallback to string
      let parsedValue: any = value
      try {
        parsedValue = JSON.parse(value)
      } catch {
        // Keep as string if not valid JSON
      }

      await configService.set(key, parsedValue, options.global)
      logger.success(`Set ${key} = ${value}`)
    } catch (error) {
      logger.error('Failed to set configuration value:', error)
      process.exit(1)
    }
  })

// Setup wizard command
configCommand
  .command('setup')
  .description('Run configuration setup wizard')
  .action(async () => {
    try {
      const configService = new ConfigService()
      const currentConfig = await configService.load()

      logger.printHeader('Configuration Setup Wizard')
      logger.info('This wizard will help you configure Ben CLI for first-time use.')
      logger.info('Press Enter to keep current values or type new ones.')
      logger.printSeparator()

      const answers = await inquirer.prompt([
        {
          name: 'awsRegion',
          message: 'AWS Region:',
          default: currentConfig.aws?.region || 'us-east-1',
          validate: (input: string) => input.trim().length > 0 || 'AWS region is required'
        },
        {
          type: 'confirm',
          name: 'useAwsProfile',
          message: 'Use AWS profile for authentication?',
          default: currentConfig.aws?.useProfile || false
        },
        {
          name: 'awsProfile',
          message: 'AWS Profile name:',
          default: currentConfig.aws?.profile || 'default',
          when: (answers: any) => answers.useAwsProfile,
          validate: (input: string) => input.trim().length > 0 || 'AWS profile name is required'
        },
        {
          name: 'awsAccessKeyId',
          message: 'AWS Access Key ID:',
          default: currentConfig.aws?.accessKeyId || '',
          when: (answers: any) => !answers.useAwsProfile
        },
        {
          name: 'awsSecretAccessKey',
          message: 'AWS Secret Access Key:',
          type: 'password',
          mask: '*',
          default: currentConfig.aws?.secretAccessKey || '',
          when: (answers: any) => !answers.useAwsProfile
        },
        {
          name: 'projectPath',
          message: 'Default project path (optional):',
          default: currentConfig.project?.path || process.cwd()
        },
        {
          name: 'defaultModel',
          type: 'list',
          message: 'Default model:',
          choices: [
            'anthropic.claude-3-5-sonnet-20241022-v2:0',
            'anthropic.claude-3-5-haiku-20241022-v1:0',
            'anthropic.claude-3-opus-20240229-v1:0',
            'amazon.nova-pro-v1:0',
            'amazon.nova-lite-v1:0',
            'amazon.nova-micro-v1:0'
          ],
          default:
            currentConfig.model?.defaultModel?.id || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
        },
        {
          name: 'tavilyApiKey',
          message: 'Tavily Search API Key (optional, for web search):',
          default: currentConfig.tools?.tavilyApiKey || ''
        },
        {
          type: 'confirm',
          name: 'enableVerbose',
          message: 'Enable verbose logging by default?',
          default: currentConfig.cli?.verboseLogging || false
        },
        {
          type: 'confirm',
          name: 'enableColors',
          message: 'Enable colored output?',
          default: currentConfig.cli?.colorOutput !== false
        }
      ])

      // Update configuration
      const updatedConfig = {
        ...currentConfig,
        aws: {
          ...currentConfig.aws,
          region: answers.awsRegion,
          useProfile: answers.useAwsProfile,
          profile: answers.useAwsProfile ? answers.awsProfile : undefined,
          accessKeyId: !answers.useAwsProfile ? answers.awsAccessKeyId : undefined,
          secretAccessKey: !answers.useAwsProfile ? answers.awsSecretAccessKey : undefined
        },
        project: {
          ...currentConfig.project,
          path: answers.projectPath || undefined
        },
        model: {
          ...currentConfig.model,
          defaultModel: {
            id: answers.defaultModel,
            name: answers.defaultModel
          }
        },
        tools: {
          ...currentConfig.tools,
          tavilyApiKey: answers.tavilyApiKey || undefined
        },
        cli: {
          ...currentConfig.cli,
          verboseLogging: answers.enableVerbose,
          colorOutput: answers.enableColors
        }
      }

      await configService.save(updatedConfig, true)

      logger.printSeparator()
      logger.success('Configuration saved successfully!')

      // Validate configuration
      const validation = await configService.validate(updatedConfig)
      if (validation.warnings.length > 0) {
        logger.info('')
        logger.warn('Configuration warnings:')
        validation.warnings.forEach((warning) => logger.warn(`  - ${warning}`))
      }

      if (validation.errors.length > 0) {
        logger.info('')
        logger.error('Configuration errors:')
        validation.errors.forEach((error) => logger.error(`  - ${error}`))
      }

      logger.info('')
      logger.info('You can now use Ben CLI! Try:')
      logger.info('  ben agent list          - List available agents')
      logger.info('  ben chat -p "Hello"     - Quick chat')
      logger.info('  ben interactive         - Start interactive mode')
    } catch (error) {
      logger.error('Setup wizard failed:', error)
      process.exit(1)
    }
  })

// Validate config command
configCommand
  .command('validate')
  .description('Validate current configuration')
  .action(async () => {
    try {
      const configService = new ConfigService()
      const config = await configService.load()
      const validation = await configService.validate(config)

      if (validation.isValid) {
        logger.success('Configuration is valid')
      } else {
        logger.error('Configuration validation failed:')
        validation.errors.forEach((error) => logger.error(`  - ${error}`))
      }

      if (validation.warnings.length > 0) {
        logger.warn('Configuration warnings:')
        validation.warnings.forEach((warning) => logger.warn(`  - ${warning}`))
      }

      if (!validation.isValid) {
        process.exit(1)
      }
    } catch (error) {
      logger.error('Failed to validate configuration:', error)
      process.exit(1)
    }
  })

// Reset config command
configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .option('-g, --global', 'Reset global configuration', false)
  .option('-f, --force', 'Force reset without confirmation', false)
  .action(async (options: ConfigCommandOptions & { force?: boolean }) => {
    try {
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to reset configuration to defaults?',
            default: false
          }
        ])

        if (!confirm) {
          logger.info('Reset cancelled')
          return
        }
      }

      const configService = new ConfigService()
      await configService.init() // This will create default config

      logger.success('Configuration reset to defaults')
    } catch (error) {
      logger.error('Failed to reset configuration:', error)
      process.exit(1)
    }
  })
