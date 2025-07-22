import { CustomAgent } from '../../../types/agent-chat'
import { StrandsAgentOutput, SaveOptions, SaveResult } from './types'
import { CodeGenerator } from './codeGenerator'
import { TOOL_MAPPING } from './toolMapper'
import { promises as fs } from 'fs'
import * as path from 'path'

// Simple logger
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || '')
}

/**
 * Service to convert Bedrock Engineer's CustomAgent to Strands Agents code
 */
export class StrandsAgentsConverter {
  private codeGenerator: CodeGenerator

  constructor() {
    this.codeGenerator = new CodeGenerator()
  }

  /**
   * Convert CustomAgent to Strands Agents Python code
   * @param agent CustomAgent to convert
   * @returns Conversion result
   */
  async convertAgent(agent: CustomAgent): Promise<StrandsAgentOutput> {
    try {
      logger.info(`Converting agent: ${agent.name}`)

      // Input validation
      this.validateAgent(agent)

      // Execute conversion
      const output = this.codeGenerator.generateStrandsAgent(agent)

      logger.info(`Successfully converted agent: ${agent.name}`)
      logger.info(`Supported tools: ${output.toolMapping.supportedTools}`)
      logger.info(`Unsupported tools: ${output.toolMapping.unsupportedTools}`)

      return output
    } catch (error) {
      logger.error(`Failed to convert agent: ${agent.name}`, error)
      throw error
    }
  }

  /**
   * Batch convert multiple agents
   * @param agents List of CustomAgent to convert
   * @returns List of conversion results
   */
  async convertMultipleAgents(agents: CustomAgent[]): Promise<
    Array<{
      agent: CustomAgent
      output?: StrandsAgentOutput
      error?: Error
    }>
  > {
    const results: Array<{
      agent: CustomAgent
      output?: StrandsAgentOutput
      error?: Error
    }> = []

    for (const agent of agents) {
      try {
        const output = await this.convertAgent(agent)
        results.push({ agent, output })
      } catch (error) {
        results.push({ agent, error: error as Error })
      }
    }

    return results
  }

  /**
   * Get conversion statistics
   * @param agents List of target CustomAgent
   * @returns Statistics information
   */
  async getConversionStats(agents: CustomAgent[]): Promise<{
    totalAgents: number
    toolsStats: {
      [toolName: string]: {
        supportedCount: number
        unsupportedCount: number
        totalCount: number
      }
    }
    supportedToolsOverall: number
    unsupportedToolsOverall: number
  }> {
    const stats = {
      totalAgents: agents.length,
      toolsStats: {} as Record<
        string,
        {
          supportedCount: number
          unsupportedCount: number
          totalCount: number
        }
      >,
      supportedToolsOverall: 0,
      unsupportedToolsOverall: 0
    }

    for (const agent of agents) {
      try {
        const output = this.codeGenerator.generateStrandsAgent(agent)

        // Supported tools statistics
        output.toolMapping.supportedTools.forEach((tool) => {
          const toolName = tool.originalName
          if (!stats.toolsStats[toolName]) {
            stats.toolsStats[toolName] = { supportedCount: 0, unsupportedCount: 0, totalCount: 0 }
          }
          stats.toolsStats[toolName].supportedCount++
          stats.toolsStats[toolName].totalCount++
          stats.supportedToolsOverall++
        })

        // Unsupported tools statistics
        output.toolMapping.unsupportedTools.forEach((tool) => {
          const toolName = tool.originalName
          if (!stats.toolsStats[toolName]) {
            stats.toolsStats[toolName] = { supportedCount: 0, unsupportedCount: 0, totalCount: 0 }
          }
          stats.toolsStats[toolName].unsupportedCount++
          stats.toolsStats[toolName].totalCount++
          stats.unsupportedToolsOverall++
        })
      } catch (error) {
        logger.warn(`Failed to analyze agent ${agent.name} for stats: ${error}`)
      }
    }

    return stats
  }

  /**
   * Validate agent input
   * @param agent CustomAgent to validate
   */
  private validateAgent(agent: CustomAgent): void {
    if (!agent.name || agent.name.trim() === '') {
      throw new Error('Agent name is required')
    }

    if (!agent.system || agent.system.trim() === '') {
      throw new Error('Agent system prompt is required')
    }

    if (!agent.description) {
      logger.warn(`Agent ${agent.name} has no description`)
    }

    // Tool validity check
    if (agent.tools && agent.tools.length > 0) {
      const uniqueTools = new Set(agent.tools)
      if (uniqueTools.size !== agent.tools.length) {
        logger.warn(`Agent ${agent.name} has duplicate tools`)
      }
    }
  }

  /**
   * Get list of supported tools
   * @returns Array of supported BuiltInToolName
   */
  getSupportedTools(): string[] {
    return Object.entries(TOOL_MAPPING)
      .filter(([, tool]) => tool.supported)
      .map(([toolName]) => toolName)
  }

  /**
   * Get list of unsupported tools
   * @returns Pairs of unsupported BuiltInToolName and reason
   */
  getUnsupportedTools(): Array<{ toolName: string; reason: string }> {
    return Object.entries(TOOL_MAPPING)
      .filter(([, tool]) => !tool.supported)
      .map(([toolName, tool]) => ({
        toolName,
        reason: tool.reason || 'Unknown reason'
      }))
  }

  /**
   * Convert CustomAgent and save as file
   * @param agent CustomAgent to convert
   * @param options Save options
   * @returns Save result
   */
  async convertAndSaveAgent(agent: CustomAgent, options: SaveOptions): Promise<SaveResult> {
    try {
      logger.info(`Converting and saving agent: ${agent.name}`)

      // Execute conversion
      const output = await this.convertAgent(agent)

      // Save file
      return await this.saveAgentToDirectory(output, options)
    } catch (error) {
      logger.error(`Failed to convert and save agent: ${agent.name}`, error)
      return {
        success: false,
        outputDirectory: options.outputDirectory,
        savedFiles: [],
        errors: [
          {
            file: 'conversion',
            error: error instanceof Error ? error.message : String(error)
          }
        ]
      }
    }
  }

  /**
   * Save converted agent output to directory
   * @param output Conversion result
   * @param options Save options
   * @returns Save result
   */
  async saveAgentToDirectory(
    output: StrandsAgentOutput,
    options: SaveOptions
  ): Promise<SaveResult> {
    const result: SaveResult = {
      success: false,
      outputDirectory: options.outputDirectory,
      savedFiles: [],
      errors: []
    }

    try {
      // Validate save options
      this.validateSaveOptions(options)

      logger.info(`Saving agent files to: ${options.outputDirectory}`)

      // Create directory
      await fs.mkdir(options.outputDirectory, { recursive: true })

      // List of files to save
      const filesToSave = [
        {
          name: options.agentFileName || 'agent.py',
          content: output.pythonCode,
          description: 'Python agent code'
        },
        {
          name: 'requirements.txt',
          content: output.requirementsText,
          description: 'Python dependencies'
        },
        {
          name: 'README.md',
          content: output.readmeText,
          description: 'Usage documentation'
        }
      ]

      // When including config.yaml
      if (options.includeConfig === true) {
        filesToSave.push({
          name: 'config.yaml',
          content: output.configYamlText,
          description: 'Agent configuration'
        })
      }

      // Save each file
      for (const file of filesToSave) {
        try {
          const filePath = path.join(options.outputDirectory, file.name)

          // Overwrite confirmation
          if (!options.overwrite) {
            try {
              await fs.access(filePath)
              // When file exists
              const error = `File already exists: ${file.name} (use overwrite: true to replace)`
              logger.warn(error)
              result.errors?.push({
                file: file.name,
                error
              })
              continue
            } catch {
              // Continue if file doesn't exist
            }
          }

          // File writing
          await fs.writeFile(filePath, file.content, 'utf-8')
          result.savedFiles.push(filePath)
          logger.info(`Saved ${file.description}: ${file.name}`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.error(`Failed to save ${file.name}: ${errorMessage}`)
          result.errors?.push({
            file: file.name,
            error: errorMessage
          })
        }
      }

      // Success determination
      result.success = result.savedFiles.length > 0 && (result.errors?.length || 0) === 0

      if (result.success) {
        logger.info(
          `Successfully saved ${result.savedFiles.length} files to ${options.outputDirectory}`
        )
      } else {
        logger.warn(
          `Partial success: saved ${result.savedFiles.length} files with ${result.errors?.length || 0} errors`
        )
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to save agent files: ${errorMessage}`)

      result.errors?.push({
        file: 'directory',
        error: errorMessage
      })

      return result
    }
  }

  /**
   * Validate save options
   * @param options Save options
   */
  private validateSaveOptions(options: SaveOptions): void {
    if (!options.outputDirectory || options.outputDirectory.trim() === '') {
      throw new Error('Output directory is required')
    }

    if (options.agentFileName && !options.agentFileName.endsWith('.py')) {
      throw new Error('Agent file name must end with .py')
    }
  }
}
