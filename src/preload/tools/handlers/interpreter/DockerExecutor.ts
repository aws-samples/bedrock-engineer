/**
 * Docker executor for CodeInterpreter
 * Handles Docker container execution with security constraints
 */

import { spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import {
  CodeExecutionResult,
  ExecutionConfig,
  SupportedLanguage,
  PythonEnvironment,
  DockerImageConfig,
  DockerBuildResult,
  InputFile
} from './types'
import { ToolLogger } from '../../base/types'
import { SecurityManager } from './SecurityManager'

/**
 * Docker executor class
 */
export class DockerExecutor {
  private logger: ToolLogger
  private securityManager: SecurityManager
  private runningContainers: Map<string, ChildProcess> = new Map()
  private builtImages: Set<string> = new Set() // Track built images

  constructor(logger: ToolLogger, securityManager: SecurityManager) {
    this.logger = logger
    this.securityManager = securityManager
  }

  /**
   * Generate compact datetime string for folder names
   * Format: YYYYMMDD_HHMMSS
   */
  private generateDateTimeString(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}_${hours}${minutes}${seconds}`
  }

  /**
   * Execute code in Docker container
   */
  async executeCode(
    code: string,
    language: SupportedLanguage,
    executionPath: string,
    config?: ExecutionConfig,
    inputFiles?: InputFile[]
  ): Promise<CodeExecutionResult> {
    const startTime = Date.now()

    this.logger.info('Starting code execution', {
      language,
      codeLength: code.length,
      executionPath,
      inputFileCount: inputFiles?.length || 0
    })

    try {
      // Validate execution config
      const validation = this.securityManager.validateExecutionConfig(config)
      if (!validation.isValid) {
        throw new Error(`Invalid execution config: ${validation.errors.join(', ')}`)
      }

      // Validate and prepare input files
      const validatedInputFiles = inputFiles
        ? await this.validateAndPrepareInputFiles(inputFiles)
        : []

      // Sanitize code
      const { sanitizedCode, warnings } = this.securityManager.sanitizeCode(code, language)
      if (warnings.length > 0) {
        this.logger.warn('Code security warnings', { warnings })
      }

      // Create temporary code file
      const codeFilename = await this.createCodeFile(sanitizedCode, language, executionPath)

      // Execute in Docker
      const result = await this.runInDocker(
        codeFilename,
        language,
        executionPath,
        validation.sanitizedConfig,
        validatedInputFiles
      )

      const executionTime = Date.now() - startTime
      this.logger.info('Code execution completed', {
        executionTime,
        exitCode: result.exitCode,
        hasOutput: result.stdout.length > 0
      })

      return {
        ...result,
        executionTime
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.logger.error('Code execution failed', {
        executionTime,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime
      }
    }
  }

  /**
   * Create temporary code file
   */
  private async createCodeFile(
    code: string,
    language: SupportedLanguage,
    executionPath: string
  ): Promise<string> {
    const extension = this.getFileExtension(language)
    const filename = `temp_${this.generateDateTimeString()}${extension}`
    const filePath = path.join(executionPath, filename)

    await fs.writeFile(filePath, code, 'utf8')

    this.logger.debug('Code file created', { filename, filePath })
    return filename
  }

  /**
   * Run code in Docker container
   */
  private async runInDocker(
    filename: string,
    language: SupportedLanguage,
    executionPath: string,
    config: ExecutionConfig,
    inputFiles?: InputFile[]
  ): Promise<Omit<CodeExecutionResult, 'executionTime'>> {
    // Generate Docker arguments
    const dockerArgs = await this.buildDockerArgs(
      language,
      executionPath,
      filename,
      config,
      inputFiles
    )

    return new Promise((resolve, reject) => {
      this.logger.info('Starting Docker container', {
        args: dockerArgs.join(' '),
        timeout: config.timeout
      })

      // Start Docker process
      const dockerProcess = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''
      let isTimedOut = false

      // Set up timeout
      const timeoutId = setTimeout(
        () => {
          isTimedOut = true
          this.logger.warn('Docker execution timed out', { timeout: config.timeout })

          // Try to kill the container gracefully
          dockerProcess.kill('SIGTERM')

          // Force kill after 2 seconds if still running
          setTimeout(() => {
            if (!dockerProcess.killed) {
              dockerProcess.kill('SIGKILL')
            }
          }, 2000)
        },
        (config.timeout || 30) * 1000
      )

      // Handle stdout
      dockerProcess.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      // Handle stderr
      dockerProcess.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      // Handle process completion
      dockerProcess.on('close', (code) => {
        clearTimeout(timeoutId)

        if (isTimedOut) {
          resolve({
            stdout,
            stderr: stderr + '\n[Execution timed out]',
            exitCode: 124 // Standard timeout exit code
          })
        } else {
          resolve({
            stdout,
            stderr,
            exitCode: code || 0
          })
        }
      })

      // Handle process error
      dockerProcess.on('error', (error) => {
        clearTimeout(timeoutId)
        this.logger.error('Docker process error', { error: error.message })
        reject(error)
      })

      // Store process reference
      const containerId = `${Date.now()}-${Math.random()}`
      this.runningContainers.set(containerId, dockerProcess)

      // Clean up reference when done
      dockerProcess.on('close', () => {
        this.runningContainers.delete(containerId)
      })
    })
  }

  /**
   * Build Docker run arguments with dynamic image building
   */
  private async buildDockerArgs(
    language: SupportedLanguage,
    executionPath: string,
    filename: string,
    config: ExecutionConfig,
    inputFiles?: InputFile[]
  ): Promise<string[]> {
    const args = ['run']

    // Add security constraints
    const securityArgs = this.securityManager.generateDockerSecurityArgs(config)
    args.push(...securityArgs)

    // Mount execution directory
    args.push('-v', `${executionPath}:/workspace`)
    args.push('-w', '/workspace')

    // Create and mount data directory for output files
    const dataPath = await this.ensureDataDirectory(executionPath)
    args.push('-v', `${dataPath}:/data`)

    // Mount input files if provided
    if (inputFiles && inputFiles.length > 0) {
      const volumeMounts = this.generateFileVolumeMounts(inputFiles)
      args.push(...volumeMounts)
    }

    // Ensure Docker image is available (build if necessary)
    const environment = config.environment || 'datascience'
    const image = await this.ensureDockerImage(environment)

    args.push(image)

    // Add execution command
    const command = this.getExecutionCommand(language, filename)
    args.push(...command)

    return args
  }

  /**
   * Ensure data directory exists for output files
   */
  private async ensureDataDirectory(executionPath: string): Promise<string> {
    const dataPath = path.join(executionPath, 'data')

    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(dataPath, { recursive: true })

      this.logger.debug('Data directory ensured', {
        dataPath,
        executionPath
      })

      return dataPath
    } catch (error) {
      this.logger.error('Failed to create data directory', {
        dataPath,
        error: error instanceof Error ? error.message : String(error)
      })
      throw new Error(
        `Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Check if custom Docker image is available
   */
  async checkCustomImageAvailability(imageName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['images', '-q', imageName], { stdio: 'pipe' })

      let output = ''
      dockerProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      dockerProcess.on('close', (code) => {
        // If image exists, output will contain the image ID
        resolve(code === 0 && output.trim().length > 0)
      })

      dockerProcess.on('error', () => {
        resolve(false)
      })

      // Timeout after 3 seconds
      setTimeout(() => {
        dockerProcess.kill()
        resolve(false)
      }, 3000)
    })
  }

  /**
   * Get execution command for language
   */
  private getExecutionCommand(language: SupportedLanguage, filename: string): string[] {
    const commands = {
      python: ['python', filename]
    }
    return commands[language]
  }

  /**
   * Get file extension for language
   */
  private getFileExtension(language: SupportedLanguage): string {
    const extensions = {
      python: '.py'
    }
    return extensions[language]
  }

  /**
   * Stop all running containers
   */
  async stopAllContainers(): Promise<void> {
    const containers = Array.from(this.runningContainers.values())

    this.logger.info('Stopping all running containers', {
      count: containers.length
    })

    for (const container of containers) {
      try {
        container.kill('SIGTERM')
      } catch (error) {
        this.logger.warn('Failed to stop container', {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    this.runningContainers.clear()
  }

  /**
   * Clean up built images
   */
  async cleanupBuiltImages(): Promise<void> {
    this.logger.info('Cleaning up built images', {
      count: this.builtImages.size
    })

    for (const imageName of this.builtImages) {
      try {
        await this.removeDockerImage(imageName)
      } catch (error) {
        this.logger.warn('Failed to remove image', {
          imageName,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    this.builtImages.clear()
  }

  /**
   * Remove Docker image
   */
  private async removeDockerImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dockerProcess = spawn('docker', ['rmi', '-f', imageName], { stdio: 'pipe' })

      dockerProcess.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Failed to remove image ${imageName}`))
        }
      })

      dockerProcess.on('error', (error) => {
        reject(error)
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        dockerProcess.kill()
        reject(new Error(`Image removal timed out: ${imageName}`))
      }, 30000)
    })
  }

  /**
   * Get image configuration for environment
   */
  private getImageConfig(environment: PythonEnvironment): DockerImageConfig {
    const configs: Record<PythonEnvironment, DockerImageConfig> = {
      basic: {
        name: 'bedrock-python-basic',
        tag: 'latest',
        environment: 'basic',
        libraries: ['numpy==1.26.2', 'pandas==2.1.4', 'matplotlib==3.8.2', 'requests==2.31.0'],
        systemPackages: ['gcc', 'libffi-dev'],
        environmentVariables: {
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1',
          MPLBACKEND: 'Agg'
        }
      },
      datascience: {
        name: 'bedrock-python-datascience',
        tag: 'latest',
        environment: 'datascience',
        libraries: [
          // Core scientific computing
          'numpy==1.26.2',
          'pandas==2.1.4',
          'scipy==1.11.4',
          // Visualization
          'matplotlib==3.8.2',
          'seaborn==0.13.0',
          'plotly==5.17.0',
          // Machine learning
          'scikit-learn==1.3.2',
          // Jupyter and IPython utilities
          'ipython==8.18.1',
          // Utility libraries
          'requests==2.31.0',
          'beautifulsoup4==4.12.2',
          'lxml==4.9.3',
          'openpyxl==3.1.2',
          // Image processing
          'pillow==10.1.0',
          // Statistical analysis
          'statsmodels==0.14.0'
        ],
        systemPackages: [
          'gcc',
          'g++',
          'libffi-dev',
          'libssl-dev',
          'libjpeg-dev',
          'libpng-dev',
          'libfreetype6-dev',
          'pkg-config',
          'fonts-noto-cjk',
          'fonts-dejavu-core'
        ],
        environmentVariables: {
          PYTHONUNBUFFERED: '1',
          PYTHONDONTWRITEBYTECODE: '1',
          DEBIAN_FRONTEND: 'noninteractive',
          MPLBACKEND: 'Agg'
        }
      }
    }

    return configs[environment]
  }

  /**
   * Generate Dockerfile content
   */
  private generateDockerfile(config: DockerImageConfig): string {
    const envVarsStr = Object.entries(config.environmentVariables || {})
      .map(([key, value]) => `ENV ${key}=${value}`)
      .join('\n')

    const systemPackagesStr = config.systemPackages?.length
      ? `# Install system dependencies
RUN apt-get update && apt-get install -y \\
    ${config.systemPackages.join(' \\\n    ')} \\
    && rm -rf /var/lib/apt/lists/*`
      : ''

    const librariesStr = config.libraries.length
      ? `# Install Python libraries
RUN pip install --no-cache-dir \\
    ${config.libraries.join(' \\\n    ')}`
      : ''

    return `# Auto-generated Dockerfile for CodeInterpreter
# Environment: ${config.environment}
# Generated at: ${new Date().toISOString()}

FROM python:3.11-slim

# Set environment variables
${envVarsStr}

${systemPackagesStr}

# Upgrade pip
RUN pip install --upgrade pip setuptools wheel

${librariesStr}

# Create workspace and data directories
RUN mkdir -p /workspace /data
WORKDIR /workspace

# Set proper permissions
RUN chmod 755 /workspace /data

# Create non-root user for security
RUN useradd -m -u 1000 coderunner && \\
    chown -R coderunner:coderunner /workspace /data

# Switch to non-root user
USER coderunner

# Verify installation (basic check)
RUN python -c "import sys; print(f'Python {sys.version}')"

# Default command
CMD ["python"]
`
  }

  /**
   * Build Docker image dynamically
   */
  async buildDockerImage(environment: PythonEnvironment): Promise<DockerBuildResult> {
    const startTime = Date.now()
    const config = this.getImageConfig(environment)
    const imageName = `${config.name}:${config.tag}`

    this.logger.info('Building Docker image', {
      imageName,
      environment,
      libraryCount: config.libraries.length
    })

    try {
      const buildDir = path.join(tmpdir(), `docker-build-${Date.now()}`)

      // Create temporary build directory
      await fs.mkdir(buildDir, { recursive: true })

      // Generate and write Dockerfile
      const dockerfileContent = this.generateDockerfile(config)
      const dockerfilePath = path.join(buildDir, 'Dockerfile')
      await fs.writeFile(dockerfilePath, dockerfileContent, 'utf8')

      this.logger.debug('Generated Dockerfile', {
        path: dockerfilePath,
        size: dockerfileContent.length
      })

      // Build the image
      const buildResult = await this.runDockerBuild(buildDir, imageName)

      // Clean up temporary directory
      await fs.rm(buildDir, { recursive: true, force: true }).catch(() => {
        // Ignore cleanup errors
      })

      const buildTime = Date.now() - startTime

      if (buildResult.success) {
        this.builtImages.add(imageName)
        this.logger.info('Docker image built successfully', {
          imageName,
          buildTime,
          environment
        })
      }

      return {
        ...buildResult,
        buildTime
      }
    } catch (error) {
      const buildTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.logger.error('Docker image build failed', {
        imageName,
        buildTime,
        error: errorMessage
      })

      return {
        success: false,
        imageName,
        buildTime,
        error: errorMessage
      }
    }
  }

  /**
   * Execute docker build command
   */
  private async runDockerBuild(
    buildDir: string,
    imageName: string
  ): Promise<Omit<DockerBuildResult, 'buildTime'>> {
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['build', '-t', imageName, '.'], {
        cwd: buildDir,
        stdio: 'pipe'
      })

      let stdout = ''
      let stderr = ''

      dockerProcess.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      dockerProcess.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      dockerProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            imageName
          })
        } else {
          resolve({
            success: false,
            imageName,
            error: stderr || stdout || `Build failed with exit code ${code}`
          })
        }
      })

      dockerProcess.on('error', (error) => {
        resolve({
          success: false,
          imageName,
          error: error.message
        })
      })

      // Timeout after 5 minutes
      setTimeout(
        () => {
          dockerProcess.kill()
          resolve({
            success: false,
            imageName,
            error: 'Docker build timed out (5 minutes)'
          })
        },
        5 * 60 * 1000
      )
    })
  }

  /**
   * Ensure Docker image is available (build if necessary)
   */
  async ensureDockerImage(environment: PythonEnvironment): Promise<string> {
    const config = this.getImageConfig(environment)
    const imageName = `${config.name}:${config.tag}`

    // Check if image already exists
    const imageExists = await this.checkCustomImageAvailability(imageName)

    if (imageExists) {
      this.logger.debug('Docker image already exists', { imageName })
      return imageName
    }

    // Build the image
    this.logger.info('Docker image not found, building...', { imageName })
    const buildResult = await this.buildDockerImage(environment)

    if (buildResult.success) {
      return imageName
    } else {
      this.logger.warn('Failed to build custom image, using fallback', {
        imageName,
        error: buildResult.error
      })
      return 'python:3.11-slim' // Fallback to official image
    }
  }

  /**
   * Validate and prepare input files for Docker execution
   */
  private async validateAndPrepareInputFiles(inputFiles: InputFile[]): Promise<InputFile[]> {
    const validatedFiles: InputFile[] = []

    for (const inputFile of inputFiles) {
      try {
        // Check if file exists
        const stats = await fs.stat(inputFile.path)

        if (!stats.isFile()) {
          this.logger.warn('Input path is not a file, skipping', { path: inputFile.path })
          continue
        }

        // Security validation: prevent path traversal
        const resolvedPath = path.resolve(inputFile.path)
        if (!resolvedPath.startsWith(path.resolve('/'))) {
          this.logger.warn('Invalid file path detected, skipping', { path: inputFile.path })
          continue
        }

        // Check file size (limit to 10MB)
        const maxFileSize = 10 * 1024 * 1024 // 10MB
        if (stats.size > maxFileSize) {
          this.logger.warn('File too large, skipping', {
            path: inputFile.path,
            size: stats.size,
            maxSize: maxFileSize
          })
          continue
        }

        validatedFiles.push({
          path: resolvedPath
        })

        this.logger.debug('Input file validated', {
          path: resolvedPath,
          size: stats.size
        })
      } catch (error) {
        this.logger.warn('Failed to validate input file', {
          path: inputFile.path,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    this.logger.info('Input files validation completed', {
      requested: inputFiles.length,
      validated: validatedFiles.length
    })

    return validatedFiles
  }

  /**
   * Generate Docker volume mount arguments for input files
   */
  private generateFileVolumeMounts(inputFiles: InputFile[]): string[] {
    const volumeArgs: string[] = []

    inputFiles.forEach((inputFile, index) => {
      const filename = path.basename(inputFile.path)
      const containerPath = `/data/${filename}`

      // Add volume mount: host_path:container_path
      volumeArgs.push('-v', `${inputFile.path}:${containerPath}`)

      this.logger.debug('Added file volume mount', {
        hostPath: inputFile.path,
        containerPath,
        index
      })
    })

    // Create /data directory in container if we have files to mount
    if (inputFiles.length > 0) {
      // This will be handled by the Docker image setup
      this.logger.debug('Input files will be mounted to /data directory', {
        fileCount: inputFiles.length
      })
    }

    return volumeArgs
  }

  /**
   * Check if Docker is available
   */
  async checkDockerAvailability(): Promise<{ available: boolean; error?: string }> {
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['--version'], { stdio: 'pipe' })

      let output = ''
      dockerProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      dockerProcess.on('close', (code) => {
        if (code === 0 && output.includes('Docker version')) {
          resolve({ available: true })
        } else {
          resolve({
            available: false,
            error: 'Docker not found or not running'
          })
        }
      })

      dockerProcess.on('error', (error) => {
        resolve({
          available: false,
          error: error.message
        })
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        dockerProcess.kill()
        resolve({
          available: false,
          error: 'Docker check timed out'
        })
      }, 5000)
    })
  }
}
