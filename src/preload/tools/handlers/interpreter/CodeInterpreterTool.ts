/**
 * CodeInterpreter tool implementation with async execution support
 * Execute Python code in secure Docker environment with both sync and async modes
 */

import * as path from 'path'
import * as os from 'os'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import {
  CodeInterpreterInput,
  CodeInterpreterResult,
  AsyncTaskResult,
  TaskListResult,
  TaskStatus,
  WorkspaceConfig,
  ExecutionConfig,
  PythonEnvironment,
  TaskManagerConfig
} from './types'
import { DockerExecutor } from './DockerExecutor'
import { FileManager } from './FileManager'
import { SecurityManager } from './SecurityManager'
import { TaskManager } from './TaskManager'

/**
 * CodeInterpreter tool with async execution support
 */
export class CodeInterpreterTool extends BaseTool<
  CodeInterpreterInput,
  CodeInterpreterResult | AsyncTaskResult | TaskListResult
> {
  static readonly toolName = 'codeInterpreter'
  static readonly toolDescription =
    'Execute Python code in a secure Docker environment or manage async tasks. Supports multiple operations: execute (run code), status (check task), cancel (stop task), list (show tasks). No internet access for security.'

  readonly name = CodeInterpreterTool.toolName
  readonly description = CodeInterpreterTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: CodeInterpreterTool.toolName,
    description: CodeInterpreterTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: `Python code to execute in a secure Docker container with no internet access.

REQUIRED ONLY for operation="execute" (or when operation is omitted).
NOT needed for operations: "status", "cancel", "list".

CRITICAL FILE HANDLING RULES:
- Input files: Mounted at /data/ directory (READ-ONLY). Access via inputFiles parameter.
- Output files: MUST be created in current working directory (/workspace) to persist on host.
- NEVER attempt to write to /data/ - it will fail with permission error.
- Only files in /workspace are automatically detected and made available on host system.

ENVIRONMENT-SPECIFIC LIBRARIES:
Basic Environment:
- Core: numpy==1.26.2, pandas==2.1.4
- Visualization: matplotlib==3.8.2
- Web: requests==2.31.0
- System: gcc, libffi-dev

Data Science Environment (recommended for analysis):
- Scientific: numpy==1.26.2, pandas==2.1.4, scipy==1.11.4
- Visualization: matplotlib==3.8.2, seaborn==0.13.0, plotly==5.17.0
- ML/Stats: scikit-learn==1.3.2, statsmodels==0.14.0
- Data Processing: openpyxl==3.1.2, beautifulsoup4==4.12.2, lxml==4.9.3
- Image: pillow==10.1.0
- Utils: ipython==8.18.1, requests==2.31.0
- System: gcc, g++, image processing libraries

ENVIRONMENT VARIABLES SET:
- MPLBACKEND='Agg' (for headless plotting)
- PYTHONUNBUFFERED='1' (immediate output)

BEST PRACTICES:
- Use specific library versions as listed above
- Save outputs with descriptive names: 'analysis_results.csv', 'visualization.png'
- Include error handling for file operations
- Create summary reports when performing complex analysis
- Use matplotlib with Agg backend for plot generation

RECOMMENDED OUTPUT PATTERNS:
# Data analysis results
df_results.to_csv('analysis_summary.csv', index=False)

# Visualizations
plt.figure(figsize=(10, 6))
# ... plotting code ...
plt.savefig('chart_analysis.png', dpi=300, bbox_inches='tight')
plt.close()

# Statistical reports
with open('statistical_report.txt', 'w') as f:
    f.write(f"Analysis Summary:\\n{summary_text}")

# Processed datasets
cleaned_data.to_excel('processed_data.xlsx', index=False)`
          },
          environment: {
            type: 'string',
            description: `Python environment selection:
- "basic": Lightweight environment with core libraries (numpy, pandas, matplotlib, requests)
- "datascience": Full data science stack with ML, statistics, and advanced visualization libraries
Default: "datascience" (recommended for most analytical tasks)`,
            enum: ['basic', 'datascience']
          },
          inputFiles: {
            type: 'array',
            description: `Input files to mount in the container at /data/ directory (READ-ONLY access).
Perfect for analyzing existing datasets without risk of modification.
Supported formats: CSV, Excel (.xlsx, .xls), JSON, images, text files, etc.`,
            items: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: `Absolute path to input file on host system.
Example: "/Users/user/data/sales.csv" becomes "/data/sales.csv" in container.
File will be READ-ONLY - use pandas.read_csv('/data/sales.csv') to access.`
                }
              },
              required: ['path']
            }
          },
          async: {
            type: 'boolean',
            description: `Enable asynchronous execution mode. When true, the tool returns immediately with a taskId for monitoring.
- false (default): Synchronous execution - waits for completion
- true: Asynchronous execution - returns taskId immediately for long-running tasks`
          },
          operation: {
            type: 'string',
            description: `Operation type for task management:
- "execute" (default): Execute code (sync or async based on async parameter)
- "status": Check status of an async task (requires taskId)
- "cancel": Cancel a running async task (requires taskId)
- "list": List all tasks with optional status filtering`,
            enum: ['execute', 'status', 'cancel', 'list']
          },
          taskId: {
            type: 'string',
            description: `Task identifier for async operations. Required when operation is "status" or "cancel".
Obtained from the response when starting an async execution.`
          },
          statusFilter: {
            type: 'string',
            description: `Filter tasks by status (for "list" operation only).
Optional parameter to show only tasks with specific status.`,
            enum: ['pending', 'running', 'completed', 'failed', 'cancelled']
          }
        },
        required: []
      }
    }
  } as const

  private dockerExecutor: DockerExecutor
  private fileManager: FileManager
  private taskManager: TaskManager

  // Static property to store current workspace path for UI access
  private static currentWorkspacePath: string | null = null
  private securityManager: SecurityManager
  private workspaceConfig: WorkspaceConfig

  /**
   * Get execution configuration based on user settings and environment
   */
  private getExecutionConfig(environment?: string): ExecutionConfig {
    const pythonEnvironment = this.validateEnvironment(environment)

    // Get user configuration from store
    const userConfig = this.storeManager.get('codeInterpreterTool')

    // Use user configuration or fall back to defaults
    const config = {
      timeout: 30,
      memoryLimit: pythonEnvironment === 'datascience' ? '256m' : '128m',
      cpuLimit: 0.5,
      environment: pythonEnvironment
    }

    // Apply user configuration if available
    if (userConfig && typeof userConfig === 'object') {
      if ('timeout' in userConfig && typeof userConfig.timeout === 'number') {
        config.timeout = userConfig.timeout
      }
      if ('memoryLimit' in userConfig && typeof userConfig.memoryLimit === 'string') {
        config.memoryLimit = userConfig.memoryLimit
      }
      if ('cpuLimit' in userConfig && typeof userConfig.cpuLimit === 'number') {
        config.cpuLimit = userConfig.cpuLimit
      }
    }

    return config
  }

  /**
   * Validate and normalize environment parameter
   */
  private validateEnvironment(environment?: string): PythonEnvironment {
    if (!environment) return 'datascience' // Default to data science environment

    if (environment === 'basic' || environment === 'datascience') {
      return environment as PythonEnvironment
    }

    this.logger.warn('Invalid environment specified, using default', {
      requested: environment,
      fallback: 'datascience'
    })
    return 'datascience'
  }

  constructor(dependencies: any) {
    super(dependencies)

    // Initialize simplified workspace configuration
    this.workspaceConfig = {
      basePath: this.storeManager.get('projectPath') ?? os.homedir(),
      sessionId: this.generateSessionId(),
      maxFiles: 20,
      maxFileSize: 1024 * 1024, // 1MB
      cleanupOnExit: true
    }

    // Initialize components
    this.securityManager = new SecurityManager(this.logger)
    this.fileManager = new FileManager(this.logger, this.securityManager, this.workspaceConfig)
    this.dockerExecutor = new DockerExecutor(this.logger, this.securityManager)

    // Initialize task manager with configuration from store
    const taskManagerConfig: Partial<TaskManagerConfig> =
      this.storeManager.get('taskManagerConfig') || {}
    this.taskManager = new TaskManager(this.logger, taskManagerConfig)
  }

  /**
   * Get current workspace path for UI access
   */
  static getCurrentWorkspacePath(): string | null {
    return CodeInterpreterTool.currentWorkspacePath
  }

  /**
   * Enhanced input validation with async operation support
   */
  protected validateInput(input: CodeInterpreterInput): ValidationResult {
    const errors: string[] = []

    // Validate operation type for async tasks
    if (input.operation && !['execute', 'status', 'cancel', 'list'].includes(input.operation)) {
      errors.push('Invalid operation. Must be "execute", "status", "cancel", or "list"')
    }

    // For status and cancel operations, taskId is required
    if ((input.operation === 'status' || input.operation === 'cancel') && !input.taskId) {
      errors.push('taskId is required for status and cancel operations')
    }

    // For execute operations, code is required
    if (!input.operation || input.operation === 'execute') {
      if (!input.code) {
        errors.push('Code is required for execute operations')
        return { isValid: false, errors }
      }

      if (typeof input.code !== 'string') {
        errors.push('Code must be a string')
        return { isValid: false, errors }
      }

      if (input.code.trim().length === 0) {
        errors.push('Code cannot be empty')
      }
    }

    // Validate input files if provided
    if (input.inputFiles) {
      if (!Array.isArray(input.inputFiles)) {
        errors.push('inputFiles must be an array')
      } else {
        input.inputFiles.forEach((file, index) => {
          if (!file.path || typeof file.path !== 'string') {
            errors.push(`inputFiles[${index}].path is required and must be a string`)
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Main execution method with async operation support
   */
  protected async executeInternal(
    input: CodeInterpreterInput
  ): Promise<CodeInterpreterResult | AsyncTaskResult | TaskListResult> {
    const operation = input.operation || 'execute'

    this.logger.info('CodeInterpreter operation requested', {
      operation,
      async: input.async,
      taskId: input.taskId,
      codeLength: input.code?.length || 0
    })

    switch (operation) {
      case 'execute':
        return input.async ? await this.executeAsync(input) : await this.executeSync(input)
      case 'status':
        return this.getTaskStatus(input.taskId!)
      case 'cancel':
        return this.cancelTask(input.taskId!)
      case 'list':
        return this.listTasks(input.statusFilter)
      default:
        throw new ExecutionError(`Unknown operation: ${operation}`, this.name)
    }
  }

  /**
   * Synchronous execution (original behavior)
   */
  private async executeSync(input: CodeInterpreterInput): Promise<CodeInterpreterResult> {
    this.logger.info('Executing Python code synchronously', {
      codeLength: input.code.length,
      sessionId: this.workspaceConfig.sessionId
    })

    try {
      // Check Docker availability
      const dockerCheck = await this.dockerExecutor.checkDockerAvailability()
      if (!dockerCheck.available) {
        throw new ExecutionError(`Docker is not available: ${dockerCheck.error}`, this.name)
      }

      // Initialize workspace
      await this.fileManager.initializeWorkspace()

      // Get workspace path for execution
      const workspacePath = this.fileManager.getWorkspacePath()

      // Store workspace path for UI access
      CodeInterpreterTool.currentWorkspacePath = workspacePath

      // Clean up old workspaces (older than 24 hours) in background
      this.fileManager.cleanupOldWorkspaces(24).catch((error) => {
        this.logger.warn('Background cleanup of old workspaces failed', {
          error: error instanceof Error ? error.message : String(error)
        })
      })

      // Preprocess code for matplotlib Japanese font support
      const processedCode = this.addMatplotlibJapaneseFontSupport(input.code)

      // Execute code with environment-specific configuration
      const config = this.getExecutionConfig(input.environment)
      const execution = await this.dockerExecutor.executeCode(
        processedCode,
        'python',
        workspacePath,
        config,
        input.inputFiles
      )

      // Get list of generated files from workspace
      const filesList = await this.fileManager.listFiles()
      const generatedFiles =
        filesList.listedFiles
          ?.filter((f) => f.type === 'file' && !f.name.startsWith('temp_'))
          .map((f) => path.join(workspacePath, f.name)) || []

      // Create combined output with file information
      let combinedOutput = execution.stdout

      // Add input files information
      if (input.inputFiles && input.inputFiles.length > 0) {
        const inputFileNames = input.inputFiles
          .map((f) => `/data/${path.basename(f.path)}`)
          .join(', ')
        combinedOutput += `\n[Input files mounted: ${inputFileNames}]`
      }

      if (generatedFiles.length > 0) {
        // Show only filenames in output for readability, but store full paths in results
        const fileNames = generatedFiles.map((fullPath) => path.basename(fullPath))
        combinedOutput += `\n[Generated files: ${fileNames.join(', ')}]`
      }

      const isSuccess = execution.exitCode === 0
      const result: CodeInterpreterResult = {
        success: isSuccess,
        name: 'codeInterpreter',
        code: input.code, // Include the executed code in the result
        message: isSuccess ? 'Code executed successfully' : 'Code execution failed',
        output: combinedOutput,
        executionTime: execution.executionTime,
        result: {
          code: input.code, // Also include in result object for backward compatibility
          stdout: execution.stdout,
          stderr: execution.stderr,
          exitCode: execution.exitCode,
          files: generatedFiles
        }
      }

      // Add error field only if there's an error
      if (!isSuccess && execution.stderr) {
        result.error = execution.stderr
      }

      this.logger.info('Code execution completed', {
        success: isSuccess,
        exitCode: execution.exitCode,
        executionTime: execution.executionTime,
        generatedFiles: generatedFiles.length
      })

      return result
    } catch (error) {
      this.logger.error('CodeInterpreter execution failed', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        name: 'codeInterpreter',
        code: input.code, // Include the executed code even in error cases
        message: 'Execution failed',
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0,
        result: {
          code: input.code, // Also include in result object for backward compatibility
          stdout: '',
          stderr: error instanceof Error ? error.message : String(error),
          exitCode: 1,
          files: []
        }
      }
    }
  }

  /**
   * Asynchronous execution - creates task and returns immediately
   */
  private async executeAsync(input: CodeInterpreterInput): Promise<AsyncTaskResult> {
    // Check if we can start a new task
    if (!this.taskManager.canStartNewTask()) {
      return {
        success: false,
        name: 'codeInterpreter',
        taskId: '',
        status: 'failed',
        message: 'Cannot start new task - concurrent limit reached',
        result: {
          taskId: '',
          status: 'failed',
          createdAt: new Date().toISOString()
        }
      }
    }

    // Create task
    const task = this.taskManager.createTask(
      input.code,
      this.validateEnvironment(input.environment),
      input.inputFiles
    )

    // Start execution in background
    this.executeTaskInBackground(task.taskId).catch((error) => {
      this.logger.error('Background task execution failed', {
        taskId: task.taskId,
        error: error instanceof Error ? error.message : String(error)
      })
      this.taskManager.setTaskError(
        task.taskId,
        error instanceof Error ? error.message : String(error)
      )
    })

    return {
      success: true,
      name: 'codeInterpreter',
      taskId: task.taskId,
      status: task.status,
      message: 'Task created and started',
      result: {
        taskId: task.taskId,
        status: task.status,
        createdAt: task.createdAt.toISOString()
      }
    }
  }

  /**
   * Execute task in background
   */
  private async executeTaskInBackground(taskId: string): Promise<void> {
    const task = this.taskManager.getTask(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    try {
      // Update status to running
      this.taskManager.updateTaskStatus(taskId, 'running', 10)

      // Execute the code synchronously in background
      const syncInput: CodeInterpreterInput = {
        type: 'codeInterpreter',
        code: task.code,
        environment: task.environment,
        inputFiles: task.inputFiles
      }

      const result = await this.executeSync(syncInput)

      // Set task result
      this.taskManager.setTaskResult(taskId, result)
    } catch (error) {
      this.taskManager.setTaskError(taskId, error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Get task status
   */
  private getTaskStatus(taskId: string): AsyncTaskResult {
    const task = this.taskManager.getTask(taskId)
    if (!task) {
      return {
        success: false,
        name: 'codeInterpreter',
        taskId,
        status: 'failed',
        message: 'Task not found',
        result: {
          taskId,
          status: 'failed',
          createdAt: new Date().toISOString()
        }
      }
    }

    return {
      success: true,
      name: 'codeInterpreter',
      taskId: task.taskId,
      status: task.status,
      message: `Task status: ${task.status}`,
      progress: task.progress,
      result: {
        taskId: task.taskId,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        startedAt: task.startedAt?.toISOString(),
        completedAt: task.completedAt?.toISOString(),
        executionResult: task.result
      }
    }
  }

  /**
   * Cancel task
   */
  private cancelTask(taskId: string): AsyncTaskResult {
    const cancelled = this.taskManager.cancelTask(taskId)
    const task = this.taskManager.getTask(taskId)

    return {
      success: cancelled,
      name: 'codeInterpreter',
      taskId,
      status: task?.status || 'failed',
      message: cancelled ? 'Task cancelled' : 'Failed to cancel task',
      result: {
        taskId,
        status: task?.status || 'failed',
        createdAt: task?.createdAt.toISOString() || new Date().toISOString()
      }
    }
  }

  /**
   * List tasks with optional status filter
   */
  private listTasks(statusFilter?: TaskStatus): TaskListResult {
    this.logger.info('Listing tasks', { statusFilter })

    try {
      // Get tasks from task manager
      const tasks = this.taskManager.getAllTasks(statusFilter)
      const summary = this.taskManager.getTaskStats()

      return {
        success: true,
        name: 'codeInterpreter',
        operation: 'list',
        tasks,
        summary,
        message: statusFilter
          ? `Found ${tasks.length} tasks with status '${statusFilter}'`
          : `Found ${tasks.length} total tasks`,
        result: {
          tasks,
          summary,
          statusFilter
        }
      }
    } catch (error) {
      this.logger.error('Failed to list tasks', {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        name: 'codeInterpreter',
        operation: 'list',
        tasks: [],
        summary: {
          total: 0,
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
          cancelled: 0
        },
        message: `Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`,
        result: {
          tasks: [],
          summary: {
            total: 0,
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            cancelled: 0
          },
          statusFilter
        }
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `session_${timestamp}_${random}`
  }

  /**
   * Add matplotlib Japanese font support to Python code
   */
  private addMatplotlibJapaneseFontSupport(code: string): string {
    // Check if code imports matplotlib
    if (!code.includes('matplotlib') && !code.includes('pyplot') && !code.includes('plt')) {
      return code
    }

    // Japanese font configuration code
    const fontConfigCode = `# Matplotlib Japanese font configuration\nimport matplotlib\nimport matplotlib.pyplot as plt\nimport os\n\n# Set Japanese font for matplotlib\nif os.path.exists('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'):\n    plt.rcParams['font.family'] = ['Noto Sans CJK JP', 'DejaVu Sans']\nelse:\n    # Fallback to DejaVu Sans\n    plt.rcParams['font.family'] = 'DejaVu Sans'\n\n# Disable font warnings\nimport warnings\nwarnings.filterwarnings('ignore', category=UserWarning, module='matplotlib')\n\n# User code starts here\n`

    return fontConfigCode + code
  }

  /**
   * Cleanup on tool disposal
   */
  async dispose(): Promise<void> {
    try {
      this.taskManager?.dispose()
      await this.dockerExecutor.stopAllContainers()
      await this.fileManager.cleanup()
    } catch (error) {
      this.logger.warn('Error during tool disposal', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Sanitize input for logging (truncate long code)
   */
  protected sanitizeInputForLogging(input: CodeInterpreterInput): any {
    return {
      type: input.type,
      operation: input.operation || 'execute',
      async: input.async,
      taskId: input.taskId,
      code: input.code ? this.truncateForLogging(input.code, 200) : '<no code>'
    }
  }
}
