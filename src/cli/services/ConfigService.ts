import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import { CLIConfig, ValidationResult, ConfigPaths } from '../types/config'
import { logger } from '../utils/logger'

export class ConfigService {
  private paths: ConfigPaths

  constructor() {
    this.paths = this.initializePaths()
  }

  private initializePaths(): ConfigPaths {
    const userHome = homedir()
    const userDataDir = join(userHome, '.ben')
    
    return {
      globalConfig: join(userDataDir, 'config.json'),
      localConfig: join(process.cwd(), '.ben.config.json'),
      userDataDir,
      cacheDir: join(userDataDir, 'cache'),
      logsDir: join(userDataDir, 'logs')
    }
  }

  async ensureDirectories(): Promise<void> {
    const dirs = [
      this.paths.userDataDir,
      this.paths.cacheDir, 
      this.paths.logsDir,
      dirname(this.paths.globalConfig)
    ]

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch (error) {
        logger.debug(`Failed to create directory ${dir}:`, error)
      }
    }
  }

  async load(): Promise<CLIConfig> {
    await this.ensureDirectories()

    // Load global config first
    let config: CLIConfig = this.getDefaultConfig()
    
    try {
      const globalConfigData = await fs.readFile(this.paths.globalConfig, 'utf-8')
      const globalConfig = JSON.parse(globalConfigData) as CLIConfig
      config = this.mergeConfigs(config, globalConfig)
    } catch (error) {
      logger.debug('Global config not found or invalid, using defaults')
    }

    // Override with local config if exists
    try {
      const localConfigData = await fs.readFile(this.paths.localConfig, 'utf-8')
      const localConfig = JSON.parse(localConfigData) as CLIConfig
      config = this.mergeConfigs(config, localConfig)
    } catch (error) {
      logger.debug('Local config not found or invalid')
    }

    return config
  }

  async save(config: CLIConfig, global: boolean = true): Promise<void> {
    await this.ensureDirectories()
    
    const configPath = global ? this.paths.globalConfig : this.paths.localConfig
    const configData = JSON.stringify(config, null, 2)
    
    try {
      await fs.writeFile(configPath, configData, 'utf-8')
      logger.debug(`Config saved to ${configPath}`)
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`)
    }
  }

  async init(): Promise<void> {
    await this.ensureDirectories()
    
    const defaultConfig = this.getDefaultConfig()
    
    // Check if global config already exists
    try {
      await fs.access(this.paths.globalConfig)
      logger.info('Configuration already exists')
      return
    } catch {
      // Config doesn't exist, create it
    }

    await this.save(defaultConfig, true)
    logger.success(`Configuration initialized at ${this.paths.globalConfig}`)
  }

  async validate(config: CLIConfig): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate version
    if (!config.version) {
      warnings.push('Config version is missing')
    }

    // Validate AWS config
    if (config.aws) {
      if (config.aws.useProfile && !config.aws.profile) {
        errors.push('AWS profile name is required when useProfile is true')
      }
      
      if (!config.aws.useProfile && !config.aws.region) {
        warnings.push('AWS region is not specified')
      }
    }

    // Validate project path
    if (config.project?.path) {
      try {
        await fs.access(config.project.path)
      } catch {
        warnings.push(`Project path does not exist: ${config.project.path}`)
      }
    }

    // Validate model settings
    if (config.model?.inferenceParams) {
      const params = config.model.inferenceParams
      if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 1)) {
        errors.push('Temperature must be between 0 and 1')
      }
      if (params.topP !== undefined && (params.topP < 0 || params.topP > 1)) {
        errors.push('TopP must be between 0 and 1')
      }
      if (params.maxTokens !== undefined && params.maxTokens < 1) {
        errors.push('MaxTokens must be greater than 0')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const config = await this.load()
    return this.getNestedValue(config, key)
  }

  async set(key: string, value: any, global: boolean = true): Promise<void> {
    const config = await this.load()
    this.setNestedValue(config, key, value)
    await this.save(config, global)
  }

  getPaths(): ConfigPaths {
    return { ...this.paths }
  }

  private getDefaultConfig(): CLIConfig {
    return {
      version: '1.0.0',
      cli: {
        defaultOutput: 'text',
        verboseLogging: false,
        colorOutput: true,
        showProgress: true
      },
      model: {
        inferenceParams: {
          maxTokens: 4096,
          temperature: 0.5,
          topP: 0.9
        }
      },
      cache: {
        enablePromptCache: false,
        contextLength: 200000
      },
      aws: {
        region: 'us-east-1',
        useProfile: false
      }
    }
  }

  private mergeConfigs(base: CLIConfig, override: CLIConfig): CLIConfig {
    return {
      ...base,
      ...override,
      aws: { ...base.aws, ...override.aws },
      project: { ...base.project, ...override.project },
      agents: { ...base.agents, ...override.agents },
      model: { 
        ...base.model, 
        ...override.model,
        inferenceParams: { ...base.model?.inferenceParams, ...override.model?.inferenceParams }
      },
      tools: { ...base.tools, ...override.tools },
      cli: { ...base.cli, ...override.cli },
      cache: { ...base.cache, ...override.cache },
      guardrail: { ...base.guardrail, ...override.guardrail }
    }
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.')
    let current = obj
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
        current[k] = {}
      }
      current = current[k]
    }
    
    current[keys[keys.length - 1]] = value
  }
}