import { Message, ToolConfiguration, ApplyGuardrailRequest } from '@aws-sdk/client-bedrock-runtime'
import { ipcRenderer } from 'electron'
import { executeTool } from './tools'
import { store } from './store'
import { BedrockService } from '../main/api/bedrock'
import { getMcpToolSpecs, testMcpServerConnection, testAllMcpServerConnections } from './mcp'
import { McpServerConfig } from '../types/agent-chat'
import { getImageGenerationModelsForRegion } from '../main/api/bedrock/models'
import { BedrockSupportRegion } from '../types/llm'
import { CodeInterpreterTool } from './tools/handlers/interpreter/CodeInterpreterTool'
import { ToolMetadataCollector } from './tools/registry'
import {
  getSystemPromptDescriptions,
  getToolUsageDescription
} from './tools/common/ToolMetadataHelper'

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
    },
    getImageGenerationModelsForRegion: (region: BedrockSupportRegion) => {
      return getImageGenerationModelsForRegion(region)
    },
    translateText: async (params: {
      text: string
      sourceLanguage?: string
      targetLanguage: string
      cacheKey?: string
    }) => {
      return ipcRenderer.invoke('bedrock:translateText', params)
    },
    translateBatch: async (
      texts: Array<{
        text: string
        sourceLanguage?: string
        targetLanguage: string
      }>
    ) => {
      return ipcRenderer.invoke('bedrock:translateBatch', { texts })
    },
    getCachedTranslation: async (params: {
      text: string
      sourceLanguage: string
      targetLanguage: string
    }) => {
      return ipcRenderer.invoke('bedrock:getTranslationCache', params)
    },
    clearTranslationCache: async () => {
      return ipcRenderer.invoke('bedrock:clearTranslationCache')
    },
    getTranslationCacheStats: async () => {
      return ipcRenderer.invoke('bedrock:getTranslationCacheStats')
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
  },
  codeInterpreter: {
    getCurrentWorkspacePath: () => {
      return CodeInterpreterTool.getCurrentWorkspacePath()
    },
    checkDockerAvailability: async () => {
      return ipcRenderer.invoke('check-docker-availability')
    }
  },
  screen: {
    listAvailableWindows: async () => {
      return ipcRenderer.invoke('screen:list-available-windows')
    }
  },
  camera: {
    saveCapturedImage: async (request: {
      base64Data: string
      deviceId: string
      deviceName: string
      width: number
      height: number
      format: string
      outputPath?: string
    }) => {
      return ipcRenderer.invoke('camera:save-captured-image', request)
    },
    showPreviewWindow: async (options?: {
      size?: 'small' | 'medium' | 'large'
      opacity?: number
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      cameraIds?: string[]
      layout?: 'cascade' | 'grid' | 'single'
    }) => {
      return ipcRenderer.invoke('camera:show-preview-window', options)
    },
    hidePreviewWindow: async () => {
      return ipcRenderer.invoke('camera:hide-preview-window')
    },
    closePreviewWindow: async (deviceId: string) => {
      return ipcRenderer.invoke('camera:close-preview-window', deviceId)
    },
    updatePreviewSettings: async (options: {
      size?: 'small' | 'medium' | 'large'
      opacity?: number
      position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    }) => {
      return ipcRenderer.invoke('camera:update-preview-settings', options)
    },
    getPreviewStatus: async () => {
      return ipcRenderer.invoke('camera:get-preview-status')
    }
  },
  tools: {
    getToolSpecs: () => {
      return ToolMetadataCollector.getToolSpecs()
    },
    getSystemPromptDescriptions: () => {
      return getSystemPromptDescriptions()
    },
    getToolUsageDescription: (toolName: string) => {
      return getToolUsageDescription(toolName)
    },
    getAllToolMetadata: () => {
      return ToolMetadataCollector.getAllToolMetadata()
    }
  }
}

export type API = typeof api
