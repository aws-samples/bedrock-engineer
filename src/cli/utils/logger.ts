import chalk from 'chalk'
import { createLogger, format, transports, Logger } from 'winston'
import { join } from 'path'
import { homedir } from 'os'

export class CLILogger {
  private logger: Logger
  private verbose: boolean = false
  private colorOutput: boolean = true

  constructor(options: { verbose?: boolean; colorOutput?: boolean; logFile?: string } = {}) {
    this.verbose = options.verbose ?? false
    this.colorOutput = options.colorOutput ?? true

    const logFile = options.logFile ?? join(homedir(), '.ben', 'logs', 'cli.log')

    this.logger = createLogger({
      level: this.verbose ? 'debug' : 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({ filename: logFile })
      ]
    })
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose
    this.logger.level = verbose ? 'debug' : 'info'
  }

  setColorOutput(colorOutput: boolean): void {
    this.colorOutput = colorOutput
  }

  info(message: string, meta?: any): void {
    const prefix = this.colorOutput ? chalk.blue('ℹ') : 'ℹ'
    console.log(prefix, message)
    this.logger.info(message, meta)
  }

  success(message: string, meta?: any): void {
    const prefix = this.colorOutput ? chalk.green('✓') : '✓'
    console.log(prefix, message)
    this.logger.info(message, meta)
  }

  warn(message: string, meta?: any): void {
    const prefix = this.colorOutput ? chalk.yellow('⚠') : '⚠'
    console.log(prefix, message)
    this.logger.warn(message, meta)
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const prefix = this.colorOutput ? chalk.red('✗') : '✗'
    console.error(prefix, message)
    if (error && this.verbose) {
      console.error(error.stack || error)
    }
    this.logger.error(message, { error: error?.message || error, stack: error?.stack, ...meta })
  }

  debug(message: string, meta?: any): void {
    if (this.verbose) {
      const prefix = this.colorOutput ? chalk.gray('🔍') : '🔍'
      console.log(prefix, message)
    }
    this.logger.debug(message, meta)
  }

  startSpinner(message: string): () => void {
    if (!this.colorOutput) {
      console.log(`🔄 ${message}`)
      return () => {}
    }

    const ora = require('ora')
    const spinner = ora(message).start()
    
    return () => {
      spinner.stop()
    }
  }

  printHeader(title: string): void {
    if (this.colorOutput) {
      console.log(chalk.cyan.bold(`\n🤖 ${title}\n`))
    } else {
      console.log(`\n🤖 ${title}\n`)
    }
  }

  printSeparator(): void {
    if (this.colorOutput) {
      console.log(chalk.gray('─'.repeat(50)))
    } else {
      console.log('─'.repeat(50))
    }
  }

  printAgentMessage(message: string): void {
    if (this.colorOutput) {
      console.log(chalk.green('🤖:'), message)
    } else {
      console.log('🤖:', message)
    }
  }

  printUserMessage(message: string): void {
    if (this.colorOutput) {
      console.log(chalk.blue('👤:'), message)
    } else {
      console.log('👤:', message)
    }
  }

  printToolExecution(toolName: string, input?: any): void {
    if (this.verbose) {
      const inputStr = input ? ` (${JSON.stringify(input)})` : ''
      this.debug(`Executing tool: ${toolName}${inputStr}`)
    }
  }

  printToolResult(toolName: string, success: boolean, result?: any): void {
    if (this.verbose) {
      const status = success ? chalk.green('✓') : chalk.red('✗')
      const resultStr = result ? ` - ${typeof result === 'string' ? result.substring(0, 100) : JSON.stringify(result).substring(0, 100)}` : ''
      console.log(this.colorOutput ? `${status} Tool ${toolName} completed${resultStr}` : `${success ? '✓' : '✗'} Tool ${toolName} completed${resultStr}`)
    }
  }
}

// Global logger instance
export const logger = new CLILogger()