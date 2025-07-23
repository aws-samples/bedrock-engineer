import { CustomAgent, McpServerConfig } from '../../../types/agent-chat'
import { ToolName } from '../../../types/tools'

// Strands Agents tool information
export interface StrandsTool {
  strandsName: string
  importPath: string
  supported: boolean
  providerClass?: string // For tools requiring special initialization
  initParams?: Record<string, any> // Initialization parameters
  reason?: string // Reason for not being supported
}

// Tool mapping result
export interface ToolMappingResult {
  supportedTools: Array<{
    originalName: ToolName
    strandsTool: StrandsTool
  }>
  unsupportedTools: Array<{
    originalName: ToolName
    reason: string
  }>
  imports: Set<string> // Required import statements
  specialSetup: Array<{
    toolName: string
    setupCode: string
  }> // Tools requiring special initialization
}

// MCP server mapping result
export interface McpServerMappingResult {
  servers: Array<{
    original: McpServerConfig
    strandsCode: string
    clientVarName: string
  }>
  imports: Set<string>
  requiresContextManager: boolean
}

// Code generation parameters
export interface CodeGenerationParams {
  agent: CustomAgent
  toolMapping: ToolMappingResult
  processedPrompt: string
  mcpServerMapping?: McpServerMappingResult
}

// Agent configuration
export interface AgentConfig {
  name: string
  description: string
  modelProvider: string
  toolsUsed: string[]
  unsupportedTools: string[]
  environment: Record<string, string>
  mcpServers?: string[] // MCP server names
}

// Conversion result
export interface StrandsAgentOutput {
  pythonCode: string
  config: AgentConfig
  toolMapping: ToolMappingResult
  mcpServerMapping?: McpServerMappingResult
  warnings: Array<{
    originalName: ToolName
    reason: string
  }>
  requirementsText: string // Contents of requirements.txt
  readmeText: string // Contents of README.md
  configYamlText: string // Contents of config.yaml
}

// File save options
export interface SaveOptions {
  outputDirectory: string // Output directory
  agentFileName?: string // agent.py filename (default: 'agent.py')
  includeConfig?: boolean // Whether to include config.yaml (default: false)
  overwrite?: boolean // Whether to overwrite existing files (default: false)
}

// File save result
export interface SaveResult {
  success: boolean
  outputDirectory: string
  savedFiles: string[] // List of saved file paths
  errors?: Array<{
    file: string
    error: string
  }>
}

// Template variables
export interface TemplateVariables {
  systemPrompt: string
  imports: string[]
  toolsSetup: string
  agentName: string
  agentDescription: string
  specialSetupCode: string[]
}
