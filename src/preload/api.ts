import { Message, ToolConfiguration, ApplyGuardrailRequest } from '@aws-sdk/client-bedrock-runtime'
import { ipcRenderer } from 'electron'
import { executeTool } from './tools/tools'
import { store } from './store'
import { BedrockService } from '../main/api/bedrock'
import { getMcpToolSpecs, testMcpServerConnection, testAllMcpServerConnections } from './mcp'
import { McpServerConfig } from '../types/agent-chat'

export type CallConverseAPIProps = {
  modelId: string
  messages: Message[]
  system: [{ text: string }]
  toolConfig?: ToolConfiguration
}

export const api = {
  bedrock: {
    executeTool,
    applyGuardrail: async (request: ApplyGuardrailRequest) => {
      const bedrock = new BedrockService({ store })
      const res = await bedrock.applyGuardrail(request)
      return res
    }
  },
  contextMenu: {
    onContextMenuCommand: (callback: (command: string) => void) => {
      ipcRenderer.on('context-menu-command', (_event, command) => {
        callback(command)
      })
    }
  },
  images: {
    getLocalImage: (path: string) => ipcRenderer.invoke('get-local-image', path)
  },
  mcp: {
    getToolSpecs: async (mcpServers?: any) => {
      return getMcpToolSpecs(mcpServers)
    },
    // 接続テスト関連の関数を追加
    testConnection: async (mcpServer: McpServerConfig) => {
      return testMcpServerConnection(mcpServer)
    },
    testAllConnections: async (mcpServers: McpServerConfig[]) => {
      return testAllMcpServerConnections(mcpServers)
    }
  }
}

export type API = typeof api
