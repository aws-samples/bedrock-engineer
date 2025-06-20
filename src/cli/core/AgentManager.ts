import { CustomAgent } from '../../types/agent-chat'
import { ValidationResult } from '../types/config'
import { ConfigService } from '../services/ConfigService'
import { logger } from '../utils/logger'
import { DEFAULT_AGENTS } from '../../renderer/src/pages/ChatPage/constants/DEFAULT_AGENTS'
import { promises as fs } from 'fs'
import { resolve } from 'path'
import yaml from 'js-yaml'

export class AgentManager {
  private configService: ConfigService
  private customAgents: CustomAgent[] = []
  private sharedAgents: CustomAgent[] = []
  private directoryAgents: CustomAgent[] = []

  constructor(configService: ConfigService) {
    this.configService = configService
  }

  async initialize(): Promise<void> {
    await this.loadAllAgents()
  }

  async listAgents(): Promise<CustomAgent[]> {
    return [...DEFAULT_AGENTS, ...this.customAgents, ...this.sharedAgents, ...this.directoryAgents]
  }

  async getAgent(idOrName: string): Promise<CustomAgent | null> {
    const agents = await this.listAgents()

    // Try to find by ID first
    let agent = agents.find((a) => a.id === idOrName)

    // If not found by ID, try to find by name (case-insensitive)
    if (!agent) {
      agent = agents.find((a) => a.name.toLowerCase() === idOrName.toLowerCase())
    }

    return agent || null
  }

  async createAgent(config: {
    name: string
    description: string
    system: string
    category?: string
    icon?: string
    iconColor?: string
    tags?: string[]
    tools?: string[]
  }): Promise<CustomAgent> {
    const agent: CustomAgent = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: config.name,
      description: config.description,
      system: config.system,
      scenarios: [],
      isCustom: true,
      category: (config.category as any) || 'custom',
      icon: (config.icon as any) || 'robot',
      iconColor: config.iconColor || '#3B82F6',
      tags: config.tags || [],
      tools: (config.tools as any) || []
    }

    // Validate the agent
    const validation = await this.validateAgent(agent)
    if (!validation.isValid) {
      throw new Error(`Invalid agent configuration: ${validation.errors.join(', ')}`)
    }

    // Add to custom agents
    this.customAgents.push(agent)

    // Save to config
    await this.saveCustomAgents()

    logger.success(`Created agent: ${agent.name}`)
    return agent
  }

  async updateAgent(id: string, updates: Partial<CustomAgent>): Promise<CustomAgent> {
    const agentIndex = this.customAgents.findIndex((a) => a.id === id)
    if (agentIndex === -1) {
      throw new Error(`Agent not found: ${id}`)
    }

    const updatedAgent = { ...this.customAgents[agentIndex], ...updates }

    // Validate the updated agent
    const validation = await this.validateAgent(updatedAgent)
    if (!validation.isValid) {
      throw new Error(`Invalid agent configuration: ${validation.errors.join(', ')}`)
    }

    this.customAgents[agentIndex] = updatedAgent
    await this.saveCustomAgents()

    logger.success(`Updated agent: ${updatedAgent.name}`)
    return updatedAgent
  }

  async deleteAgent(id: string): Promise<boolean> {
    const agentIndex = this.customAgents.findIndex((a) => a.id === id)
    if (agentIndex === -1) {
      return false
    }

    const agent = this.customAgents[agentIndex]
    this.customAgents.splice(agentIndex, 1)
    await this.saveCustomAgents()

    logger.success(`Deleted agent: ${agent.name}`)
    return true
  }

  async validateAgent(agent: CustomAgent): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!agent.id) {
      errors.push('Agent ID is required')
    }
    if (!agent.name || agent.name.trim().length === 0) {
      errors.push('Agent name is required')
    }
    if (!agent.description || agent.description.trim().length === 0) {
      errors.push('Agent description is required')
    }
    if (!agent.system || agent.system.trim().length === 0) {
      errors.push('Agent system prompt is required')
    }

    // Validate system prompt length
    if (agent.system && agent.system.length > 100000) {
      warnings.push('System prompt is very long and may cause issues')
    }

    // Validate tools if specified
    if (agent.tools && agent.tools.length > 0) {
      // Here we could validate that the tools exist in the system
      // For now, just warn about unknown tools
      const knownTools = [
        'createFolder',
        'writeToFile',
        'readFiles',
        'listFiles',
        'moveFile',
        'copyFile',
        'tavilySearch',
        'fetchWebsite',
        'generateImage',
        'recognizeImage',
        'executeCommand',
        'codeInterpreter',
        'screenCapture',
        'cameraCapture',
        'retrieve',
        'invokeBedrockAgent',
        'invokeFlow',
        'generateVideo',
        'checkVideoStatus',
        'downloadVideo'
      ]

      const unknownTools = agent.tools.filter((tool) => !knownTools.includes(tool))
      if (unknownTools.length > 0) {
        warnings.push(`Unknown tools specified: ${unknownTools.join(', ')}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  async exportAgent(id: string, format: 'json' | 'yaml' = 'yaml'): Promise<string> {
    const agent = await this.getAgent(id)
    if (!agent) {
      throw new Error(`Agent not found: ${id}`)
    }

    // Remove runtime-only properties
    const exportAgent = {
      ...agent,
      isCustom: undefined,
      isShared: undefined,
      directoryOnly: undefined,
      mcpTools: undefined // Will be regenerated
    }

    if (format === 'json') {
      return JSON.stringify(exportAgent, null, 2)
    } else {
      return yaml.dump(exportAgent, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false
      })
    }
  }

  async importAgent(data: string, format: 'json' | 'yaml' = 'yaml'): Promise<CustomAgent> {
    let agentData: any

    try {
      if (format === 'json') {
        agentData = JSON.parse(data)
      } else {
        agentData = yaml.load(data)
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format.toUpperCase()}: ${error}`)
    }

    // Generate new ID for imported agent
    agentData.id = `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    agentData.isCustom = true

    const agent = agentData as CustomAgent
    const validation = await this.validateAgent(agent)

    if (!validation.isValid) {
      throw new Error(`Invalid agent data: ${validation.errors.join(', ')}`)
    }

    this.customAgents.push(agent)
    await this.saveCustomAgents()

    logger.success(`Imported agent: ${agent.name}`)
    return agent
  }

  private async loadAllAgents(): Promise<void> {
    await Promise.all([
      this.loadCustomAgents(),
      this.loadSharedAgents(),
      this.loadDirectoryAgents()
    ])
  }

  private async loadCustomAgents(): Promise<void> {
    try {
      const config = await this.configService.load()
      this.customAgents = config.agents?.customAgents || []
      logger.debug(`Loaded ${this.customAgents.length} custom agents`)
    } catch (error) {
      logger.debug('Failed to load custom agents:', error)
      this.customAgents = []
    }
  }

  private async loadSharedAgents(): Promise<void> {
    try {
      const config = await this.configService.load()
      const projectPath = config.project?.path

      if (!projectPath) {
        this.sharedAgents = []
        return
      }

      const agentsDir = resolve(projectPath, '.bedrock-engineer/agents')

      try {
        await fs.access(agentsDir)
      } catch {
        this.sharedAgents = []
        return
      }

      const files = (await fs.readdir(agentsDir)).filter(
        (file) => file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')
      )

      const agents: CustomAgent[] = []

      for (const file of files) {
        try {
          const filePath = resolve(agentsDir, file)
          const content = await fs.readFile(filePath, 'utf-8')

          let agent: CustomAgent
          if (file.endsWith('.json')) {
            agent = JSON.parse(content)
          } else {
            agent = yaml.load(content) as CustomAgent
          }

          // Ensure unique ID
          if (!agent.id || !agent.id.startsWith('shared-')) {
            const safeName = file.replace(/\.(json|ya?ml)$/, '').toLowerCase()
            agent.id = `shared-${safeName}-${Math.random().toString(36).substring(2, 9)}`
          }

          agent.isShared = true
          delete agent.mcpTools // Will be regenerated

          agents.push(agent)
        } catch (error) {
          logger.warn(`Failed to load shared agent from ${file}:`, error)
        }
      }

      this.sharedAgents = agents
      logger.debug(`Loaded ${this.sharedAgents.length} shared agents`)
    } catch (error) {
      logger.debug('Failed to load shared agents:', error)
      this.sharedAgents = []
    }
  }

  private async loadDirectoryAgents(): Promise<void> {
    // TODO: Implement directory agents loading from remote source
    this.directoryAgents = []
  }

  private async saveCustomAgents(): Promise<void> {
    const config = await this.configService.load()
    config.agents = config.agents || {}
    config.agents.customAgents = this.customAgents
    await this.configService.save(config)
  }
}
