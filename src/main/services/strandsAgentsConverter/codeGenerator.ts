import { CustomAgent } from '../../../types/agent-chat'
import { ToolName, isBuiltInTool } from '../../../types/tools'
import { StrandsAgentOutput, ToolMappingResult, AgentConfig, CodeGenerationParams } from './types'
import { TOOL_MAPPING, generateSpecialSetupCode, generateImportStatement } from './toolMapper'
import {
  PYTHON_AGENT_TEMPLATE,
  REQUIREMENTS_TEMPLATE,
  CONFIG_TEMPLATE,
  README_TEMPLATE,
  renderTemplate,
  generateToolsSetupCode,
  combineSpecialSetupCode,
  generateYamlList,
  generateEnvironmentSetup
} from './templateEngine'

export class CodeGenerator {
  // Tool analysis and mapping
  analyzeAndMapTools(tools: ToolName[]): ToolMappingResult {
    const supportedTools: ToolMappingResult['supportedTools'] = []
    const unsupportedTools: ToolMappingResult['unsupportedTools'] = []
    const imports = new Set<string>()
    const specialSetup: ToolMappingResult['specialSetup'] = []

    for (const toolName of tools) {
      // Skip MCP tools (currently not supported)
      if (!isBuiltInTool(toolName)) {
        unsupportedTools.push({
          originalName: toolName,
          reason: 'MCP tools are currently not supported'
        })
        continue
      }

      const strandsTool = TOOL_MAPPING[toolName]

      if (strandsTool.supported) {
        supportedTools.push({
          originalName: toolName,
          strandsTool
        })

        // Collect import information
        if (strandsTool.providerClass) {
          imports.add(`from ${strandsTool.importPath} import ${strandsTool.providerClass}`)
        } else {
          imports.add(strandsTool.strandsName)
        }

        // When special configuration is required
        const setupCode = generateSpecialSetupCode(toolName, strandsTool)
        if (setupCode) {
          specialSetup.push({
            toolName,
            setupCode
          })
        }
      } else {
        unsupportedTools.push({
          originalName: toolName,
          reason: strandsTool.reason || 'Not supported'
        })
      }
    }

    return {
      supportedTools,
      unsupportedTools,
      imports,
      specialSetup
    }
  }

  // System prompt processing
  processSystemPrompt(systemPrompt: string): string {
    // Basic escape processing
    return systemPrompt
      .replace(/\\/g, '\\\\')
      .replace(/"""/g, '\\"\\"\\"')
      .replace(/\n/g, '\\n')
      .trim()
  }

  // Python code generation
  generatePythonCode(params: CodeGenerationParams): string {
    const { agent, toolMapping, processedPrompt } = params

    // Generate import statements
    const supportedStrandsTools = toolMapping.supportedTools.map((t) => t.strandsTool)
    const imports = generateImportStatement(supportedStrandsTools)

    // Generate basic tools list (remove duplicates)
    const basicTools = [
      ...new Set(
        supportedStrandsTools.filter((tool) => !tool.providerClass).map((tool) => tool.strandsName)
      )
    ]

    // Generate tools setup code
    const toolsSetup = generateToolsSetupCode(basicTools)

    // Combine special setup code
    const specialSetupCode = combineSpecialSetupCode(
      toolMapping.specialSetup.map((s) => s.setupCode)
    )

    // Template variables
    const variables: Record<string, string> = {
      agentName: agent.name,
      agentDescription: agent.description,
      systemPrompt: processedPrompt,
      imports: imports.join('\n'),
      toolsSetup,
      specialSetupCode,
      awsRegion: 'us-east-1' // Default region
    }

    return renderTemplate(PYTHON_AGENT_TEMPLATE, variables)
  }

  // Configuration file generation
  generateConfig(agent: CustomAgent, toolMapping: ToolMappingResult): AgentConfig {
    const supportedTools = toolMapping.supportedTools.map((t) => t.originalName)
    const unsupportedTools = toolMapping.unsupportedTools.map((t) => t.originalName)

    // Basic environment variables
    const environment: Record<string, string> = {
      AWS_REGION: 'us-west-2'
    }

    // When AWS-related tools are included
    const hasAwsTools = toolMapping.supportedTools.some((t) =>
      ['use_aws', 'retrieve', 'generate_image_stability'].includes(t.strandsTool.strandsName)
    )

    if (hasAwsTools) {
      environment.AWS_PROFILE = 'default'
    }

    return {
      name: agent.name,
      description: agent.description,
      modelProvider: 'bedrock', // Default
      toolsUsed: supportedTools,
      unsupportedTools,
      environment
    }
  }

  // requirements.txt generation
  generateRequirements(toolMapping: ToolMappingResult): string {
    const additionalDeps: string[] = []

    // Determine additional dependencies based on tools used
    const toolNames = toolMapping.supportedTools.map((t) => t.strandsTool.strandsName)

    if (toolNames.includes('use_aws')) {
      additionalDeps.push('# AWS CLI operations')
    }

    if (toolNames.includes('generate_image_stability')) {
      additionalDeps.push('# Stability AI image generation')
    }

    if (toolNames.includes('code_interpreter')) {
      additionalDeps.push('# Code interpreter functionality')
    }

    const variables = {
      additionalDependencies: additionalDeps.join('\n')
    }

    return renderTemplate(REQUIREMENTS_TEMPLATE, variables)
  }

  // README file generation
  generateReadme(agent: CustomAgent, toolMapping: ToolMappingResult, config: AgentConfig): string {
    const supportedToolsList = toolMapping.supportedTools
      .map((t) => `- **${t.originalName}** → ${t.strandsTool.strandsName}`)
      .join('\n')

    const unsupportedToolsList = toolMapping.unsupportedTools
      .map((t) => `- **${t.originalName}**: ${t.reason}`)
      .join('\n')

    const environmentSetup = generateEnvironmentSetup(config.environment)

    const variables = {
      agentName: agent.name,
      agentDescription: agent.description,
      toolsList: supportedToolsList || '(None)',
      unsupportedToolsList: unsupportedToolsList || '(None)',
      environmentSetup,
      conversionDate: new Date().toISOString(),
      supportedToolsCount: toolMapping.supportedTools.length.toString(),
      totalToolsCount: (
        toolMapping.supportedTools.length + toolMapping.unsupportedTools.length
      ).toString()
    }

    return renderTemplate(README_TEMPLATE, variables)
  }

  // YAML configuration file generation
  generateYamlConfig(config: AgentConfig, toolMapping: ToolMappingResult): string {
    const supportedTools = generateYamlList(config.toolsUsed)
    const unsupportedTools = generateYamlList(
      toolMapping.unsupportedTools.map((t) => `${t.originalName}: ${t.reason}`)
    )
    const environmentVars = generateYamlList(
      Object.entries(config.environment).map(([k, v]) => `${k}: "${v}"`)
    )

    const variables = {
      agentName: config.name,
      agentDescription: config.description,
      modelProvider: config.modelProvider,
      supportedTools,
      unsupportedTools,
      environmentVars
    }

    return renderTemplate(CONFIG_TEMPLATE, variables)
  }

  // Complete agent conversion
  generateStrandsAgent(agent: CustomAgent): StrandsAgentOutput {
    // 1. Tool analysis
    const toolMapping = this.analyzeAndMapTools(agent.tools || [])

    // 2. System prompt processing
    const processedPrompt = this.processSystemPrompt(agent.system)

    // 3. Code generation
    const pythonCode = this.generatePythonCode({
      agent,
      toolMapping,
      processedPrompt
    })

    // 4. Configuration generation
    const config = this.generateConfig(agent, toolMapping)

    // 5. requirements.txt generation
    const requirementsText = this.generateRequirements(toolMapping)

    // 6. README.md generation
    const readmeText = this.generateReadme(agent, toolMapping, config)

    // 7. config.yaml generation
    const configYamlText = this.generateYamlConfig(config, toolMapping)

    return {
      pythonCode,
      config,
      toolMapping,
      warnings: toolMapping.unsupportedTools,
      requirementsText,
      readmeText,
      configYamlText
    }
  }
}
