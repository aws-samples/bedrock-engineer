#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('ben')
  .description('Bedrock Engineer CLI - Autonomous AI development assistant')
  .version('1.15.3')

// Simple test command
program
  .command('test')
  .description('Test CLI functionality')
  .action(() => {
    console.log(chalk.green('✓ Ben CLI is working!'))
    console.log('Version:', program.version())
    console.log('Available commands will be added soon.')
  })

// Hello command for testing
program
  .command('hello')
  .description('Say hello')
  .option('-n, --name <name>', 'Name to greet', 'World')
  .action((options) => {
    console.log(chalk.blue(`Hello, ${options.name}!`))
  })

// Agent list command (mock)
program
  .command('agent')
  .description('Agent management commands')
  .action(() => {
    console.log(chalk.cyan('🤖 Available Agents:'))
    console.log('  - Software Developer')
    console.log('  - Programming Mentor')
    console.log('  - Product Designer')
    console.log('')
    console.log(chalk.yellow('Note: Full agent management coming soon!'))
    console.log('Use "ben agent --help" for more options.')
  })

// Config command (mock)
program
  .command('config')
  .description('Configuration management')
  .action(() => {
    console.log(chalk.magenta('⚙️ Configuration Management'))
    console.log('Commands:')
    console.log('  - init    Initialize configuration')
    console.log('  - show    Show current configuration')
    console.log('  - setup   Run setup wizard')
    console.log('')
    console.log(chalk.yellow('Note: Full configuration management coming soon!'))
  })

// Help improvements
program.on('--help', () => {
  console.log('')
  console.log('Examples:')
  console.log('  $ ben test                    # Test CLI functionality')
  console.log('  $ ben hello -n "Developer"    # Say hello')
  console.log('  $ ben agent                   # List agents')
  console.log('  $ ben config                  # Show config options')
  console.log('')
  console.log(chalk.green('🚀 More features coming soon!'))
})

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`))
  console.log('Use "ben --help" to see available commands')
  process.exit(1)
})

// Global error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught exception:'), error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled rejection:'), reason)
  process.exit(1)
})

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nGracefully shutting down...'))
  process.exit(0)
})

// Parse arguments and execute
if (require.main === module) {
  program.parse(process.argv)
}

export { program }
export default program