import { spawn } from 'child_process'
import {
  CommandConfig,
  CommandExecutionResult,
  CommandInput,
  CommandPattern,
  CommandStdinInput,
  DetachedProcessInfo,
  InputDetectionPattern,
  ProcessState,
  CommandPatternConfig
} from './types'

export class CommandService {
  private config: CommandConfig
  private runningProcesses: Map<number, DetachedProcessInfo> = new Map()
  private processStates: Map<number, ProcessState> = new Map()

  // 入力待ち状態を検出するパターン
  private inputDetectionPatterns: InputDetectionPattern[] = [
    {
      pattern: /\? .+\?.*$/m, // inquirer形式の質問
      promptExtractor: (output) => {
        const match = output.match(/\? (.+\?.*$)/m)
        return match ? match[1] : output
      }
    },
    {
      pattern: /[^:]+: $/m, // 基本的なプロンプト（例: "Enter name: "）
      promptExtractor: (output) => {
        const lines = output.split('\n')
        return lines[lines.length - 1]
      }
    }
  ]

  // サーバー起動状態を示すパターン
  private serverReadyPatterns = [
    'listening',
    'ready',
    'started',
    'running',
    'live',
    'compiled successfully',
    'compiled',
    'waiting for file changes',
    'development server running'
  ]

  // エラーを示すパターン
  private errorPatterns = [
    'EADDRINUSE',
    'Error:',
    'error:',
    'ERR!',
    'app crashed',
    'Cannot find module',
    'command not found',
    'Failed to compile',
    'Syntax error:',
    'TypeError:',
    // Windows固有のエラーパターン
    'The system cannot find the file specified',
    'Access is denied',
    'The filename, directory name, or volume label syntax is incorrect',
    'is not recognized as an internal or external command',
    'The process cannot access the file because it is being used by another process',
    'ENOENT',
    'EACCES'
  ]

  constructor(config: CommandConfig) {
    this.config = config
  }

  /**
   * Electron環境で適切な環境変数を取得
   * Windows特有のPATH問題を解決
   */
  private getEnhancedEnvironment(isWindows: boolean): NodeJS.ProcessEnv {
    const env = { ...process.env }

    if (isWindows) {
      // Windows固有の環境変数とPATHの強化
      const systemPaths = [
        'C:\\Windows\\System32',
        'C:\\Windows',
        'C:\\Windows\\System32\\Wbem',
        'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\',
        'C:\\Program Files\\Amazon\\AWSCLIV2', // AWS CLI v2
        'C:\\Program Files (x86)\\Amazon\\AWSCLIV2',
        'C:\\Program Files\\Git\\cmd', // Git
        'C:\\Program Files\\nodejs', // Node.js
        'C:\\Users\\Public\\chocolatey\\bin', // Chocolatey
        'C:\\ProgramData\\chocolatey\\bin'
      ]

      // 既存のPATHに追加
      const currentPath = env.PATH || env.Path || ''
      const enhancedPath = [currentPath, ...systemPaths].filter(Boolean).join(';')

      env.PATH = enhancedPath
      env.Path = enhancedPath // Windowsでは両方設定

      // Windows固有の環境変数
      env.COMSPEC = env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe'
      env.PATHEXT = env.PATHEXT || '.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC'
      env.SYSTEMROOT = env.SYSTEMROOT || 'C:\\Windows'
      env.WINDIR = env.WINDIR || 'C:\\Windows'
    } else {
      // Unix系の場合
      const systemPaths = [
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
        '/usr/sbin',
        '/sbin',
        '/opt/homebrew/bin', // macOS Homebrew (Apple Silicon)
        '/usr/local/aws-cli/v2/current/bin' // AWS CLI v2
      ]

      const currentPath = env.PATH || ''
      const enhancedPath = [currentPath, ...systemPaths].filter(Boolean).join(':')

      env.PATH = enhancedPath
    }

    return env
  }

  private parseCommandPattern(commandStr: string): CommandPattern {
    const parts = commandStr.split(' ')
    const hasWildcard = parts.some((part) => part === '*')

    return {
      command: parts[0],
      args: parts.slice(1),
      wildcard: hasWildcard
    }
  }

  private isCommandAllowed(commandToExecute: string): boolean {
    const executeParts = this.parseCommandPattern(commandToExecute)

    // allowedCommands が未定義の場合は空の配列として処理
    const allowedCommands = this.config.allowedCommands || []

    return allowedCommands.some((allowedCmd) => {
      const allowedParts = this.parseCommandPattern(allowedCmd.pattern)

      if (allowedParts.command !== executeParts.command) {
        return false
      }

      if (allowedParts.wildcard) {
        return true
      }

      if (allowedParts.args.length !== executeParts.args.length) {
        return false
      }

      return allowedParts.args.every((arg, index) => {
        if (arg === '*') {
          return true
        }
        return arg === executeParts.args[index]
      })
    })
  }

  // 入力待ち状態かどうかを判定
  private isWaitingForInput(output: string): { isWaiting: boolean; prompt?: string } {
    for (const pattern of this.inputDetectionPatterns) {
      if (output.match(pattern.pattern)) {
        const prompt = pattern.promptExtractor ? pattern.promptExtractor(output) : output
        return { isWaiting: true, prompt }
      }
    }
    return { isWaiting: false }
  }

  private initializeProcessState(pid: number): void {
    this.processStates.set(pid, {
      isRunning: true,
      hasError: false,
      output: {
        stdout: '',
        stderr: '',
        code: null
      }
    })
  }

  private updateProcessState(pid: number, updates: Partial<ProcessState>): void {
    const currentState = this.processStates.get(pid)
    if (currentState) {
      this.processStates.set(pid, { ...currentState, ...updates })
    }
  }

  // サーバーが正常に起動しているかチェック
  private isServerReady(output: string): boolean {
    return this.serverReadyPatterns.some((pattern) =>
      output.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  // エラーチェック
  private checkForErrors(stdout: string, stderr: string): boolean {
    // エラーパターンのチェック
    if (
      this.errorPatterns.some((pattern) => stdout.includes(pattern) || stderr.includes(pattern))
    ) {
      return true
    }

    // クラッシュ状態のチェック
    if (stdout.includes('app crashed') && !stdout.includes('waiting for file changes')) {
      return true
    }

    return false
  }

  async executeCommand(input: CommandInput): Promise<CommandExecutionResult> {
    return new Promise((resolve, reject) => {
      // 入力値の事前検証
      if (!input.command || typeof input.command !== 'string' || input.command.trim() === '') {
        reject(new Error('Invalid command: Command cannot be empty'))
        return
      }

      if (!input.cwd || typeof input.cwd !== 'string') {
        reject(new Error('Invalid working directory: cwd must be a valid string'))
        return
      }

      // シェルの存在確認（Windows環境での追加チェック）
      if (!this.config.shell) {
        reject(new Error('Shell configuration is missing'))
        return
      }

      if (!this.isCommandAllowed(input.command)) {
        reject(new Error(`Command not allowed: ${input.command}`))
        return
      }

      // プラットフォーム別の設定
      const isWindows = process.platform === 'win32'

      // Electron特有の環境変数問題を解決
      const spawnEnv = this.getEnhancedEnvironment(isWindows)

      let childProcess

      if (isWindows) {
        // Windows: shell=trueを使用してコマンドを直接実行
        // Node.js公式推奨方法: spawn(command, {shell: true})
        childProcess = spawn(input.command, {
          cwd: input.cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true, // Windowsでは必須
          env: spawnEnv,
          windowsHide: true // コンソールウィンドウを隠す
        })
      } else {
        // Unix系: 従来通りシェルに引数を渡す
        childProcess = spawn(this.config.shell, ['-ic', input.command], {
          cwd: input.cwd,
          detached: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: spawnEnv
        })
      }

      if (typeof childProcess.pid === 'undefined') {
        const errorMessage = `Failed to start process: PID is undefined
Platform: ${process.platform}
Shell: ${this.config.shell}
Command: ${input.command}
Working Directory: ${input.cwd}
Spawn Method: ${isWindows ? 'shell=true' : 'shell+args'}`
        console.error('Process spawn failed:', {
          platform: process.platform,
          shell: this.config.shell,
          command: input.command,
          cwd: input.cwd,
          spawnMethod: isWindows ? 'shell=true' : 'shell+args',
          spawnfile: childProcess.spawnfile,
          spawnargs: childProcess.spawnargs
        })
        reject(new Error(errorMessage))
        return
      }

      const pid = childProcess.pid

      // プロセス情報を初期化
      this.initializeProcessState(pid)
      this.runningProcesses.set(pid, {
        pid,
        command: input.command,
        timestamp: Date.now()
      })

      // プロセスの状態を保存
      this.updateProcessState(pid, { process: childProcess })

      let currentOutput = ''
      let currentError = ''
      let isCompleted = false

      const cleanup = () => {
        this.runningProcesses.delete(pid)
        this.processStates.delete(pid)
      }

      const completeWithError = (error: string) => {
        if (!isCompleted) {
          isCompleted = true
          cleanup()
          reject(new Error(error))
        }
      }

      const completeWithSuccess = () => {
        if (!isCompleted) {
          const state = this.processStates.get(pid)
          if (!state) {
            reject(new Error('Process state not found'))
            return
          }

          // 入力待ち状態のチェック
          const { isWaiting, prompt } = this.isWaitingForInput(currentOutput)
          if (isWaiting) {
            resolve({
              stdout: currentOutput,
              stderr: currentError,
              exitCode: 0,
              processInfo: {
                pid,
                command: input.command,
                detached: true
              },
              requiresInput: true,
              prompt
            })
            return
          }

          // 開発サーバーの状態チェック
          if (this.isServerReady(currentOutput)) {
            resolve({
              stdout: currentOutput,
              stderr: currentError,
              exitCode: 0,
              processInfo: {
                pid,
                command: input.command,
                detached: true
              }
            })
            return
          }

          // 通常のコマンド完了
          isCompleted = true
          cleanup()
          resolve({
            stdout: currentOutput,
            stderr: currentError,
            exitCode: state.output.code || 0,
            processInfo: {
              pid,
              command: input.command,
              detached: true
            }
          })
        }
      }

      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString()
        currentOutput += chunk

        const state = this.processStates.get(pid)
        if (state) {
          this.updateProcessState(pid, {
            output: { ...state.output, stdout: currentOutput }
          })

          // エラーチェック
          if (this.checkForErrors(chunk, '')) {
            this.updateProcessState(pid, { hasError: true })
            completeWithError(`Command failed: \n${currentOutput}\n${currentError}`)
            return
          }

          // 入力待ち状態または開発サーバーの状態をチェック
          const { isWaiting } = this.isWaitingForInput(currentOutput)
          if (isWaiting || this.isServerReady(currentOutput)) {
            completeWithSuccess()
          }
        }
      })

      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString()
        currentError += chunk

        const state = this.processStates.get(pid)
        if (state) {
          this.updateProcessState(pid, {
            output: { ...state.output, stderr: currentError }
          })

          // エラーチェック
          if (this.checkForErrors('', chunk)) {
            this.updateProcessState(pid, { hasError: true })
            completeWithError(`Command failed: \n${currentOutput}\n${currentError}`)
          }
        }
      })

      childProcess.on('error', (error) => {
        let errorMessage = `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`

        // Windows固有のエラーの詳細情報を追加
        if (process.platform === 'win32' && error instanceof Error) {
          if (error.message.includes('ENOENT')) {
            errorMessage +=
              '\nHint: The command or shell may not be found. Please check if the command exists and the shell path is correct.'
          } else if (error.message.includes('EACCES')) {
            errorMessage +=
              '\nHint: Permission denied. Please check if you have the necessary permissions to execute this command.'
          }
        }

        completeWithError(errorMessage)
      })

      childProcess.on('exit', (code) => {
        const state = this.processStates.get(pid)
        if (state) {
          this.updateProcessState(pid, {
            isRunning: false,
            output: { ...state.output, code: code || 0 }
          })

          if (!this.checkForErrors(currentOutput, currentError) && code === 0) {
            completeWithSuccess()
          } else if (!isCompleted) {
            completeWithError(`Process exited with code ${code}\n${currentOutput}\n${currentError}`)
          }
        }
      })

      const TIMEOUT = 60000 * 5 // 5分
      // タイムアウト処理
      setTimeout(() => {
        if (!isCompleted) {
          const state = this.processStates.get(pid)
          if (!state) return

          if (state.hasError) {
            completeWithError(`Command failed to start: \n${currentError}`)
          } else {
            // 開発サーバーの状態チェック
            if (
              this.isServerReady(currentOutput) ||
              currentOutput.includes('waiting for file changes')
            ) {
              completeWithSuccess()
            } else {
              completeWithError('Command timed out')
            }
          }
        }
      }, TIMEOUT) // Multi-Agent 的な処理を見据えて長めに設定する
    })
  }

  async sendInput(input: CommandStdinInput): Promise<CommandExecutionResult> {
    const state = this.processStates.get(input.pid)
    if (!state || !state.process) {
      throw new Error(`No running process found with PID: ${input.pid}`)
    }

    return new Promise((resolve, reject) => {
      const { process: childProcess } = state
      let currentOutput = state.output.stdout
      let currentError = state.output.stderr
      let isCompleted = false

      // 既存のリスナーを削除
      childProcess.stdout.removeAllListeners('data')
      childProcess.stderr.removeAllListeners('data')
      childProcess.removeAllListeners('error')
      childProcess.removeAllListeners('exit')

      const completeWithError = (error: string) => {
        if (!isCompleted) {
          isCompleted = true
          reject(new Error(error))
        }
      }

      const completeWithSuccess = () => {
        if (!isCompleted) {
          isCompleted = true

          // 入力待ち状態のチェック
          const { isWaiting, prompt } = this.isWaitingForInput(currentOutput)

          resolve({
            stdout: currentOutput,
            stderr: currentError,
            exitCode: 0,
            processInfo: {
              pid: input.pid,
              command: childProcess.spawnargs.join(' '),
              detached: true
            },
            requiresInput: isWaiting,
            prompt: isWaiting ? prompt : undefined
          })
        }
      }

      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString()
        currentOutput += chunk

        this.updateProcessState(input.pid, {
          output: { ...state.output, stdout: currentOutput }
        })

        // エラーチェック
        if (this.checkForErrors(chunk, '')) {
          this.updateProcessState(input.pid, { hasError: true })
          completeWithError(`Command failed: \n${currentOutput}\n${currentError}`)
          return
        }

        // 入力待ち状態または開発サーバーの状態をチェック
        const { isWaiting } = this.isWaitingForInput(currentOutput)
        if (isWaiting || this.isServerReady(currentOutput)) {
          completeWithSuccess()
        }
      })

      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString()
        currentError += chunk

        this.updateProcessState(input.pid, {
          output: { ...state.output, stderr: currentError }
        })

        if (this.checkForErrors('', chunk)) {
          this.updateProcessState(input.pid, { hasError: true })
          completeWithError(`Command failed: \n${currentOutput}\n${currentError}`)
        }
      })

      childProcess.on('error', (error) => {
        completeWithError(
          `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      })

      childProcess.on('exit', (code) => {
        this.updateProcessState(input.pid, {
          isRunning: false,
          output: { ...state.output, code: code || 0 }
        })

        if (!this.checkForErrors(currentOutput, currentError) && code === 0) {
          completeWithSuccess()
        } else if (!isCompleted) {
          completeWithError(`Process exited with code ${code}\n${currentOutput}\n${currentError}`)
        }

        // プロセスが終了したらクリーンアップ
        this.runningProcesses.delete(input.pid)
        this.processStates.delete(input.pid)
      })

      // 標準入力を送信
      childProcess.stdin.write(input.stdin + '\n')

      // タイムアウト処理
      setTimeout(() => {
        if (!isCompleted) {
          const currentState = this.processStates.get(input.pid)
          if (!currentState) return

          if (currentState.hasError) {
            completeWithError(`Command failed: \n${currentError}`)
          } else if (
            this.isServerReady(currentOutput) ||
            currentOutput.includes('waiting for file changes')
          ) {
            completeWithSuccess()
          } else {
            completeWithError('Command timed out waiting for response')
          }
        }
      }, 5000)
    })
  }

  async stopProcess(pid: number): Promise<void> {
    const processInfo = this.runningProcesses.get(pid)
    if (processInfo) {
      try {
        process.kill(-pid) // プロセスグループ全体を終了
        this.runningProcesses.delete(pid)
        this.processStates.delete(pid)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to stop process ${pid}: ${errorMessage}`)
      }
    }
  }

  getRunningProcesses(): DetachedProcessInfo[] {
    return Array.from(this.runningProcesses.values())
  }

  getAllowedCommands(): CommandPatternConfig[] {
    return [...(this.config.allowedCommands || [])]
  }

  updateConfig(newConfig: CommandConfig): void {
    this.config = newConfig
  }
}
