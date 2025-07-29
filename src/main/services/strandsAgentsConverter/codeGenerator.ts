import { CustomAgent, McpServerConfig } from '../../../types/agent-chat'
import { ToolName, isBuiltInTool } from '../../../types/tools'
import {
  StrandsAgentOutput,
  ToolMappingResult,
  AgentConfig,
  CodeGenerationParams,
  McpServerMappingResult
} from './types'
import { TOOL_MAPPING, generateSpecialSetupCode, generateImportStatement } from './toolMapper'
import {
  PYTHON_AGENT_TEMPLATE,
  MCP_INTEGRATED_TEMPLATE,
  REQUIREMENTS_TEMPLATE,
  CONFIG_TEMPLATE,
  README_TEMPLATE,
  renderTemplate,
  generateToolsSetupCode,
  combineSpecialSetupCode,
  generateYamlList,
  generateEnvironmentSetup,
  generateMcpClientSetup,
  generateMcpContextManager,
  generateMcpToolsCollection,
  generateMcpDependencies
} from './templateEngine'

export class CodeGenerator {
  // MCP server analysis and mapping
  analyzeMcpServers(mcpServers: McpServerConfig[]): McpServerMappingResult {
    const servers: Array<{
      original: McpServerConfig
      strandsCode: string
      clientVarName: string
    }> = []
    const imports = new Set<string>()

    if (mcpServers.length > 0) {
      imports.add('from mcp import stdio_client, StdioServerParameters')
      imports.add('from strands.tools.mcp import MCPClient')
    }

    for (const server of mcpServers) {
      const clientVarName = this.sanitizeVarName(server.name)
      const strandsCode = this.generateMcpClientCode(server, clientVarName)

      servers.push({
        original: server,
        strandsCode,
        clientVarName
      })
    }

    return {
      servers,
      imports,
      requiresContextManager: servers.length > 0
    }
  }

  // Generate MCP client code for a server
  private generateMcpClientCode(server: McpServerConfig, clientVarName: string): string {
    const envSetup = server.env
      ? `,\n        env=${JSON.stringify(server.env, null, 8).replace(/\n/g, '\n        ')}`
      : ''

    return `# ${server.description || server.name}
${clientVarName}_client = MCPClient(lambda: stdio_client(
    StdioServerParameters(
        command="${server.command}",
        args=${JSON.stringify(server.args)}${envSetup}
    )
))`
  }

  // Sanitize variable name for Python
  private sanitizeVarName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

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

  // MCP integrated Python code generation
  generateMcpIntegratedCode(params: CodeGenerationParams): string {
    const { agent, toolMapping, mcpServerMapping, processedPrompt } = params

    // Generate proper import statements using the toolMapper function
    const supportedStrandsTools = toolMapping.supportedTools.map((t) => t.strandsTool)
    const toolImports = generateImportStatement(supportedStrandsTools)

    // Base imports including MCP imports
    const baseImports = [
      'from strands import Agent',
      'import boto3',
      'from strands.models import BedrockModel'
    ]

    // Add MCP imports if any MCP servers are configured
    const mcpImports = mcpServerMapping ? Array.from(mcpServerMapping.imports) : []

    // Combine all imports
    const allImports = [...baseImports, ...toolImports, ...mcpImports]

    // Generate basic tools list
    const basicTools = [
      ...new Set(
        supportedStrandsTools.filter((tool) => !tool.providerClass).map((tool) => tool.strandsName)
      )
    ]

    // Generate basic tools setup code
    const basicToolsSetup = generateToolsSetupCode(basicTools)

    // Combine special setup code
    const specialSetupCode = combineSpecialSetupCode(
      toolMapping.specialSetup.map((s) => s.setupCode)
    )

    // MCP server setup
    const mcpClientSetup = mcpServerMapping
      ? generateMcpClientSetup(mcpServerMapping.servers)
      : '# No MCP server configuration'

    // MCP context manager
    const clientNames = mcpServerMapping
      ? mcpServerMapping.servers.map((server) => `${server.clientVarName}_client`)
      : []

    const mcpContextManager = generateMcpContextManager(clientNames)

    // MCP tools collection code
    const mcpToolsCollection = mcpServerMapping
      ? generateMcpToolsCollection(mcpServerMapping.servers)
      : '            # No MCP tools'

    // Template variables
    const variables: Record<string, string> = {
      agentName: agent.name,
      agentDescription: agent.description,
      imports: allImports.join('\n'),
      basicToolsSetup: basicToolsSetup,
      specialSetupCode: specialSetupCode,
      mcpClientSetup: mcpClientSetup,
      mcpContextManager: mcpContextManager,
      mcpToolsCollection: mcpToolsCollection,
      systemPrompt: processedPrompt,
      modelConfig: 'us.anthropic.claude-sonnet-4-20250514-v1:0', // Default model
      awsRegion: 'us-east-1', // Default region
      generationDate: new Date().toISOString()
    }

    return renderTemplate(MCP_INTEGRATED_TEMPLATE, variables)
  }

  // Python code generation (legacy method for backward compatibility)
  generatePythonCode(params: CodeGenerationParams): string {
    const { agent, toolMapping, processedPrompt } = params

    // Generate import statements using the toolMapper function
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

  // Configuration file generation (updated to include MCP servers)
  generateConfig(
    agent: CustomAgent,
    toolMapping: ToolMappingResult,
    mcpServerMapping?: McpServerMappingResult
  ): AgentConfig {
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

    const mcpServers = mcpServerMapping
      ? mcpServerMapping.servers.map((server) => server.original.name)
      : []

    return {
      name: agent.name,
      description: agent.description,
      modelProvider: 'bedrock', // Default
      toolsUsed: supportedTools,
      unsupportedTools,
      environment,
      mcpServers
    }
  }

  // requirements.txt generation (updated to include MCP dependencies)
  generateRequirements(
    toolMapping: ToolMappingResult,
    mcpServerMapping?: McpServerMappingResult
  ): string {
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

    const mcpDependencies = generateMcpDependencies(
      mcpServerMapping ? mcpServerMapping.servers.length > 0 : false
    )

    const variables = {
      mcpDependencies,
      additionalDependencies: additionalDeps.join('\n')
    }

    return renderTemplate(REQUIREMENTS_TEMPLATE, variables)
  }

  // README file generation (updated to include MCP server info)
  generateReadme(
    agent: CustomAgent,
    toolMapping: ToolMappingResult,
    mcpServerMapping: McpServerMappingResult | undefined,
    config: AgentConfig
  ): string {
    const supportedToolsList = toolMapping.supportedTools
      .map((t) => `- **${t.originalName}** → ${t.strandsTool.strandsName}`)
      .join('\n')

    const unsupportedToolsList = toolMapping.unsupportedTools
      .map((t) => `- **${t.originalName}**: ${t.reason}`)
      .join('\n')

    const environmentSetup = generateEnvironmentSetup(config.environment)

    // Add MCP server information
    let mcpServerInfo = ''
    if (mcpServerMapping && mcpServerMapping.servers.length > 0) {
      mcpServerInfo =
        '\n\n## MCP Servers\n\n' +
        mcpServerMapping.servers
          .map(
            (server) =>
              `- **${server.original.name}**: ${server.original.description || 'No description'}\n` +
              `  - Command: \`${server.original.command} ${server.original.args?.join(' ') || ''}\``
          )
          .join('\n')
    }

    const variables = {
      agentName: agent.name,
      agentDescription: agent.description + mcpServerInfo,
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

  // YAML configuration file generation (updated to include MCP servers)
  generateYamlConfig(
    config: AgentConfig,
    toolMapping: ToolMappingResult,
    mcpServerMapping?: McpServerMappingResult
  ): string {
    const supportedTools = generateYamlList(config.toolsUsed)
    const unsupportedTools = generateYamlList(
      toolMapping.unsupportedTools.map((t) => `${t.originalName}: ${t.reason}`)
    )
    const environmentVars = generateYamlList(
      Object.entries(config.environment).map(([k, v]) => `${k}: "${v}"`)
    )

    // Add MCP server configuration to YAML
    let mcpServersYaml = ''
    if (mcpServerMapping && mcpServerMapping.servers.length > 0) {
      mcpServersYaml =
        '\n\nmcp_servers:\n' +
        mcpServerMapping.servers
          .map(
            (server) =>
              `  - name: "${server.original.name}"\n` +
              `    command: "${server.original.command}"\n` +
              `    args: ${JSON.stringify(server.original.args)}`
          )
          .join('\n')
    }

    const variables = {
      agentName: config.name,
      agentDescription: config.description + mcpServersYaml,
      modelProvider: config.modelProvider,
      supportedTools,
      unsupportedTools,
      environmentVars
    }

    return renderTemplate(CONFIG_TEMPLATE, variables)
  }

  // Complete agent conversion (updated to include MCP server support)
  generateStrandsAgent(agent: CustomAgent): StrandsAgentOutput {
    // 1. Tool analysis
    const toolMapping = this.analyzeAndMapTools(agent.tools || [])

    // 2. MCP server analysis
    const mcpServerMapping = this.analyzeMcpServers(agent.mcpServers || [])

    // 3. System prompt processing
    const processedPrompt = this.processSystemPrompt(agent.system)

    // 4. Code generation (use MCP integrated template)
    const pythonCode = this.generateMcpIntegratedCode({
      agent,
      toolMapping,
      mcpServerMapping,
      processedPrompt
    })

    // 5. Configuration generation
    const config = this.generateConfig(agent, toolMapping, mcpServerMapping)

    // 6. requirements.txt generation
    const requirementsText = this.generateRequirements(toolMapping, mcpServerMapping)

    // 7. README.md generation
    const readmeText = this.generateReadme(agent, toolMapping, mcpServerMapping, config)

    // 8. config.yaml generation
    const configYamlText = this.generateYamlConfig(config, toolMapping, mcpServerMapping)

    return {
      pythonCode,
      config,
      toolMapping,
      mcpServerMapping,
      warnings: toolMapping.unsupportedTools,
      requirementsText,
      readmeText,
      configYamlText
    }
  }
}
