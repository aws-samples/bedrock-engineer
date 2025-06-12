import { ToolCategory } from '../types'

/**
 * 利用可能なツールカテゴリの定義
 */
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'file-system',
    name: 'File System',
    description: 'Tools for managing files and directories',
    tools: [
      'createFolder',
      'writeToFile',
      'readFiles',
      'listFiles',
      'moveFile',
      'copyFile',
      'applyDiffEdit'
    ]
  },
  {
    id: 'web-interaction',
    name: 'Web & Search',
    description: 'Tools for interacting with web resources',
    tools: ['tavilySearch', 'fetchWebsite']
  },
  {
    id: 'ai-services',
    name: 'AI Services',
    description: 'Tools that utilize AWS AI services',
    tools: [
      'generateImage',
      'generateVideo',
      'recognizeImage',
      'retrieve',
      'invokeBedrockAgent',
      'invokeFlow'
    ]
  },
  {
    id: 'system',
    name: 'System',
    description: 'Tools for system interaction',
    tools: ['executeCommand', 'codeInterpreter', 'screenCapture', 'cameraCapture']
  },
  {
    id: 'thinking',
    name: 'Thinking',
    description: 'Tools for enhanced reasoning and complex problem solving',
    tools: ['think']
  },
  {
    id: 'mcp',
    name: 'MCP',
    description: 'Model Context Protocol Tools',
    // MCPツールは動的に取得するので空配列として定義
    tools: [],
    isMcpCategory: true
  }
]
