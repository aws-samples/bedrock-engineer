/**
 * Unified store access management for tools
 */

import { StoreManager as IStoreManager } from '../base/types'
import { store, ConfigStore } from '../../store'
import type ElectronStore from 'electron-store'

/**
 * Valid store keys type
 */
type StoreKey = Parameters<typeof store.get>[0]

/**
 * Manages access to the electron store for tools
 */
export class StoreManager implements IStoreManager {
  private store: ConfigStore

  constructor(storeInstance: ConfigStore = store) {
    this.store = storeInstance
  }

  /**
   * Get a value from the store
   */
  get<T = any>(key: string): T | undefined {
    // Type assertion needed because our interface uses string keys
    // but the actual store uses specific keys
    return this.store.get(key as StoreKey) as T | undefined
  }

  /**
   * Set a value in the store
   */
  set<T = any>(key: string, value: T): void {
    // Type assertion needed for the same reason
    this.store.set(key as StoreKey, value as any)
  }

  /**
   * Check if a key exists in the store
   */
  has(key: string): boolean {
    // Check if the value is not undefined
    return this.get(key) !== undefined
  }

  /**
   * Delete a key from the store
   */
  delete(key: string): void {
    // Set to undefined to simulate deletion
    this.set(key, undefined as any)
  }

  /**
   * Get the underlying electron store instance
   */
  getStore(): ElectronStore {
    // Return a mock object that satisfies the interface
    // since we can't access the actual ElectronStore instance
    return {} as ElectronStore
  }

  /**
   * Get a nested value using dot notation
   */
  getNested<T = any>(path: string): T | undefined {
    // For nested paths, we need to get the root key and traverse
    const keys = path.split('.')
    const rootKey = keys[0] as StoreKey
    let current: any = this.store.get(rootKey)

    for (let i = 1; i < keys.length; i++) {
      if (current && typeof current === 'object' && keys[i] in current) {
        current = current[keys[i]]
      } else {
        return undefined
      }
    }

    return current as T
  }

  /**
   * Get a value with a default if not found
   */
  getWithDefault<T>(key: string, defaultValue: T): T {
    const value = this.get<T>(key)
    return value !== undefined ? value : defaultValue
  }

  /**
   * Get multiple values at once
   */
  getMultiple<T extends Record<string, any>>(keys: string[]): Partial<T> {
    const result: Partial<T> = {}

    for (const key of keys) {
      const value = this.get(key)
      if (value !== undefined) {
        result[key as keyof T] = value
      }
    }

    return result
  }

  /**
   * Set multiple values at once
   */
  setMultiple(values: Record<string, any>): void {
    for (const [key, value] of Object.entries(values)) {
      this.set(key, value)
    }
  }

  /**
   * Get tool-specific configuration
   */
  getToolConfig<T = any>(toolName: string): T | undefined {
    return this.get<T>(toolName)
  }

  /**
   * Get agent-specific configuration
   */
  getAgentConfig(): {
    selectedAgentId?: string
    customAgents?: any[]
    agentChatConfig?: {
      ignoreFiles?: string[]
      [key: string]: any
    }
  } {
    return {
      selectedAgentId: this.get('selectedAgentId'),
      customAgents: this.get('customAgents') || [],
      agentChatConfig: this.get('agentChatConfig')
    }
  }

  /**
   * Get AWS/Bedrock related configuration
   */
  getBedrockConfig(): {
    region?: string
    credentials?: any
    generateImageTool?: {
      modelId?: string
      [key: string]: any
    }
    recognizeImageTool?: {
      modelId?: string
      [key: string]: any
    }
  } {
    return {
      region: this.get('region'),
      credentials: this.get('credentials'),
      generateImageTool: this.get('generateImageTool'),
      recognizeImageTool: this.get('recognizeImageTool')
    }
  }

  /**
   * Get command execution configuration
   */
  getCommandConfig(): {
    shell: string
    allowedCommands?: Array<{
      pattern: string
      description?: string
    }>
  } {
    const agentConfig = this.getAgentConfig()
    const selectedAgentId = agentConfig.selectedAgentId

    // Get agent-specific allowed commands
    let allowedCommands: Array<{ pattern: string; description?: string }> = []

    if (selectedAgentId && agentConfig.customAgents) {
      const currentAgent = agentConfig.customAgents.find(
        (agent: any) => agent.id === selectedAgentId
      )
      if (currentAgent && currentAgent.allowedCommands) {
        allowedCommands = currentAgent.allowedCommands
      }
    }

    return {
      shell: this.get('shell') || '/bin/bash',
      allowedCommands
    }
  }

  /**
   * Get project-related configuration
   */
  getProjectConfig(): {
    projectPath?: string
    workingDirectory?: string
  } {
    return {
      projectPath: this.get('projectPath'),
      workingDirectory: this.get('workingDirectory')
    }
  }

  /**
   * Get external service configuration
   */
  getExternalServicesConfig(): {
    tavilySearch?: {
      apikey?: string
      [key: string]: any
    }
    [key: string]: any
  } {
    return {
      tavilySearch: this.get('tavilySearch')
    }
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.get(featureName) === true
  }

  /**
   * Get all store data (for debugging)
   */
  getAll(): Record<string, any> {
    // Return an object with all known keys
    const knownKeys: StoreKey[] = [
      'userDataPath',
      'projectPath',
      'planMode',
      'llm',
      'lightProcessingModel',
      'inferenceParams',
      'thinkingMode',
      'recognizeImageTool',
      'generateImageTool',
      'language',
      'agentChatConfig',
      'tools',
      'websiteGenerator',
      'tavilySearch',
      'apiEndpoint',
      'advancedSetting',
      'aws',
      'customAgents',
      'selectedAgentId',
      'knowledgeBases',
      'shell',
      'notification',
      'bedrockSettings',
      'guardrailSettings',
      'bedrockAgents',
      'sharedAgents'
    ]

    const result: Record<string, any> = {}
    for (const key of knownKeys) {
      const value = this.store.get(key)
      if (value !== undefined) {
        result[key] = value
      }
    }
    return result
  }
}

/**
 * Singleton instance
 */
export const storeManager = new StoreManager()
