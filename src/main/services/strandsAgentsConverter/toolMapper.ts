import { BuiltInToolName } from '../../../types/tools'
import { StrandsTool } from './types'

export type { StrandsTool }

// Bedrock Engineer → Strands Agents tool mapping
export const TOOL_MAPPING: Record<BuiltInToolName, StrandsTool> = {
  // File system operations
  readFiles: {
    strandsName: 'file_read',
    importPath: 'strands_tools',
    supported: true
  },
  writeToFile: {
    strandsName: 'file_write',
    importPath: 'strands_tools',
    supported: true
  },
  listFiles: {
    strandsName: 'editor',
    importPath: 'strands_tools',
    supported: true
  },
  createFolder: {
    strandsName: 'shell',
    importPath: 'strands_tools',
    supported: true
  },
  moveFile: {
    strandsName: 'shell',
    importPath: 'strands_tools',
    supported: true
  },
  copyFile: {
    strandsName: 'shell',
    importPath: 'strands_tools',
    supported: true
  },

  // Web operations
  tavilySearch: {
    strandsName: 'http_request',
    importPath: 'strands_tools',
    supported: true
  },
  fetchWebsite: {
    strandsName: 'http_request',
    importPath: 'strands_tools',
    supported: true
  },

  // Command execution
  executeCommand: {
    strandsName: 'shell',
    importPath: 'strands_tools',
    supported: true
  },

  // AWS Bedrock integration
  generateImage: {
    strandsName: 'generate_image_stability',
    importPath: 'strands_tools',
    supported: true
  },
  generateVideo: {
    strandsName: 'shell', // Implemented via AWS CLI
    importPath: 'strands_tools',
    supported: true
  },
  checkVideoStatus: {
    strandsName: 'use_aws',
    importPath: 'strands_tools',
    supported: true
  },
  downloadVideo: {
    strandsName: 'use_aws',
    importPath: 'strands_tools',
    supported: true
  },
  retrieve: {
    strandsName: 'retrieve',
    importPath: 'strands_tools',
    supported: true
  },
  invokeBedrockAgent: {
    strandsName: 'use_aws',
    importPath: 'strands_tools',
    supported: true
  },
  recognizeImage: {
    strandsName: 'image_reader',
    importPath: 'strands_tools',
    supported: true
  },
  invokeFlow: {
    strandsName: 'use_aws',
    importPath: 'strands_tools',
    supported: true
  },

  // Code execution
  codeInterpreter: {
    strandsName: 'python_repl',
    importPath: 'strands_tools',
    supported: true
  },

  // Thinking and reasoning
  think: {
    strandsName: 'think',
    importPath: 'strands_tools',
    supported: true
  },

  // File editing
  applyDiffEdit: {
    strandsName: 'editor',
    importPath: 'strands_tools',
    supported: true
  },

  // MCP (Direct conversion is difficult, but possible via shell)
  mcp: {
    strandsName: 'shell',
    importPath: 'strands_tools',
    supported: true
  },

  // Unsupported tools
  screenCapture: {
    strandsName: '',
    importPath: '',
    supported: false,
    reason: 'No corresponding screen capture tool available in Strands Agents'
  },
  cameraCapture: {
    strandsName: '',
    importPath: '',
    supported: false,
    reason: 'No corresponding camera capture tool available in Strands Agents'
  },
  todo: {
    strandsName: '',
    importPath: '',
    supported: false,
    reason: 'TODO tools are excluded from conversion. Can be replaced with Workflow tools'
  },
  todoInit: {
    strandsName: '',
    importPath: '',
    supported: false,
    reason: 'TODO tools are excluded from conversion. Can be replaced with Workflow tools'
  },
  todoUpdate: {
    strandsName: '',
    importPath: '',
    supported: false,
    reason: 'TODO tools are excluded from conversion. Can be replaced with Workflow tools'
  }
}

// Generate special initialization code
export function generateSpecialSetupCode(toolName: string, _tool: StrandsTool): string {
  switch (toolName) {
    default:
      return ''
  }
}

// Generate import statements
export function generateImportStatement(tools: StrandsTool[]): string[] {
  const imports = new Set<string>()
  const specialImports = new Set<string>()

  for (const tool of tools) {
    if (!tool.supported) continue

    if (tool.providerClass) {
      // Special imports required
      specialImports.add(`from ${tool.importPath} import ${tool.providerClass}`)
    } else {
      // Regular tool imports
      imports.add(tool.strandsName)
    }
  }

  const result: string[] = []

  // Basic imports
  if (imports.size > 0) {
    result.push(`from strands_tools import ${Array.from(imports).join(', ')}`)
  }

  // Special imports
  result.push(...Array.from(specialImports))

  return result
}
