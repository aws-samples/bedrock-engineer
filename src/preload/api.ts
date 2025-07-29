import { Message, ToolConfiguration, ApplyGuardrailRequest } from '@aws-sdk/client-bedrock-runtime'
import { ipcRenderer } from 'electron'
import { store } from './store'
import { BedrockService } from '../main/api/bedrock'
import { McpServerConfig } from '../types/agent-chat'
import { getImageGenerationModelsForRegion } from '../main/api/bedrock/models'
import { BedrockSupportRegion } from '../types/llm'
import { CodeInterpreterTool } from './tools/handlers/interpreter/CodeInterpreterTool'
import { ToolMetadataCollector } from './tools/registry'
import { executeTool } from './tools'

export type CallConverseAPIProps = {
  modelId: string
  messages: Message[]
  system: [{ text: string }]
  toolConfig?: ToolConfiguration
}

export const api = {
  backgroundAgent: {
    chat: async (params: {
      sessionId: string
      config: {
        modelId: string
        systemPrompt?: string
        agentId?: string
        projectDirectory?: string
        tools?: any[]
      }
      userMessage: string
      options?: any
    }) => {
      return ipcRenderer.invoke('background-agent:chat', params)
    },
    // 通知イベントリスナー（拡張された詳細情報を含む）
    onTaskNotification: (
      callback: (params: {
        taskId: string
        taskName: string
        success: boolean
        error?: string
        aiMessage?: string
        executedAt: number
        executionTime?: number
        sessionId?: string
        messageCount?: number
        toolExecutions?: number
        runCount?: number
        nextRun?: number
      }) => void
    ) => {
      const handler = (_event: any, params: any) => callback(params)
      ipcRenderer.on('background-agent:task-notification', handler)

      // クリーンアップ関数を返す
      return () => {
        ipcRenderer.removeListener('background-agent:task-notification', handler)
      }
    },
    // 実行開始通知リスナー
    onTaskExecutionStart: (
      callback: (params: { taskId: string; taskName: string; executedAt: number }) => void
    ) => {
      const handler = (_event: any, params: any) => callback(params)
      ipcRenderer.on('background-agent:task-execution-start', handler)

      // クリーンアップ関数を返す
      return () => {
        ipcRenderer.removeListener('background-agent:task-execution-start', handler)
      }
    },
    // タスクスキップ通知リスナー（重複実行防止など）
    onTaskSkipped: (
      callback: (params: {
        taskId: string
        taskName: string
        reason: string
        executionTime?: number
      }) => void
    ) => {
      const handler = (_event: any, params: any) => callback(params)
      ipcRenderer.on('background-agent:task-skipped', handler)

      // クリーンアップ関数を返す
      return () => {
        ipcRenderer.removeListener('background-agent:task-skipped', handler)
      }
    },
    createSession: async (
      sessionId: string,
      options?: {
        projectDirectory?: string
        agentId?: string
        modelId?: string
      }
    ) => {
      return ipcRenderer.invoke('background-agent:create-session', { sessionId, options })
    },
    deleteSession: async (sessionId: string) => {
      return ipcRenderer.invoke('background-agent:delete-session', { sessionId })
    },
    listSessions: async () => {
      return ipcRenderer.invoke('background-agent:list-sessions')
    },
    getSessionHistory: async (sessionId: string) => {
      return ipcRenderer.invoke('background-agent:get-session-history', { sessionId })
    },
    getSessionStats: async (sessionId: string) => {
      return ipcRenderer.invoke('background-agent:get-session-stats', { sessionId })
    },
    getAllSessionsMetadata: async () => {
      return ipcRenderer.invoke('background-agent:get-all-sessions-metadata')
    },
    getSessionsByProject: async (projectDirectory: string) => {
      return ipcRenderer.invoke('background-agent:get-sessions-by-project', { projectDirectory })
    },
    getSessionsByAgent: async (agentId: string) => {
      return ipcRenderer.invoke('background-agent:get-sessions-by-agent', { agentId })
    },
    // スケジューリング機能
    scheduleTask: async (config: any) => {
      return ipcRenderer.invoke('background-agent:schedule-task', { config })
    },
    updateTask: async (taskId: string, config: any) => {
      return ipcRenderer.invoke('background-agent:update-task', { taskId, config })
    },
    cancelTask: async (taskId: string) => {
      return ipcRenderer.invoke('background-agent:cancel-task', { taskId })
    },
    toggleTask: async (taskId: string, enabled: boolean) => {
      return ipcRenderer.invoke('background-agent:toggle-task', { taskId, enabled })
    },
    listTasks: async () => {
      return ipcRenderer.invoke('background-agent:list-tasks')
    },
    getTask: async (taskId: string) => {
      return ipcRenderer.invoke('background-agent:get-task', { taskId })
    },
    getTaskExecutionHistory: async (taskId: string) => {
      return ipcRenderer.invoke('background-agent:get-task-execution-history', { taskId })
    },
    executeTaskManually: async (taskId: string) => {
      return ipcRenderer.invoke('background-agent:execute-task-manually', { taskId })
    },
    getSchedulerStats: async () => {
      return ipcRenderer.invoke('background-agent:get-scheduler-stats')
    },
    continueSession: async (params: {
      sessionId: string
      taskId: string
      userMessage: string
      options?: {
        enableToolExecution?: boolean
        maxToolExecutions?: number
        timeoutMs?: number
      }
    }) => {
      return ipcRenderer.invoke('background-agent:continue-session', params)
    },
    getTaskSystemPrompt: async (taskId: string) => {
      return ipcRenderer.invoke('background-agent:get-task-system-prompt', { taskId })
    }
  },
  bedrock: {
    executeTool: (toolInput: any, context?: any) => executeTool(toolInput, context),
    applyGuardrail: async (request: ApplyGuardrailRequest) => {
      const bedrock = new BedrockService({ store })
      const res = await bedrock.applyGuardrail(request)
      return res
    },
    getImageGenerationModelsForRegion: (region: BedrockSupportRegion) => {
      return getImageGenerationModelsForRegion(region)
    },
    listApplicationInferenceProfiles: async () => {
      const bedrock = new BedrockService({ store })
      return bedrock.listApplicationInferenceProfiles()
    },
    convertInferenceProfileToLLM: (profile: any) => {
      const bedrock = new BedrockService({ store })
      return bedrock.convertInferenceProfileToLLM(profile)
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
    },
    getModelMaxTokens: async (modelId: string) => {
      return ipcRenderer.invoke('bedrock:getModelMaxTokens', { modelId })
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
  openDirectory: async () => {
    return ipcRenderer.invoke('open-directory')
  },
  readProjectIgnore: async (projectPath: string) => {
    return ipcRenderer.invoke('read-project-ignore', { projectPath })
  },
  writeProjectIgnore: async (projectPath: string, content: string) => {
    return ipcRenderer.invoke('write-project-ignore', { projectPath, content })
  },
  mcp: {
    // MCP初期化
    init: async (mcpServers: McpServerConfig[]) => {
      const result = await ipcRenderer.invoke('mcp:init', mcpServers)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    // ツール取得
    getToolSpecs: async (mcpServers: McpServerConfig[]) => {
      const result = await ipcRenderer.invoke('mcp:getTools', mcpServers)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.tools
    },
    // ツール実行
    executeTool: async (toolName: string, input: any, mcpServers: McpServerConfig[]) => {
      return ipcRenderer.invoke('mcp:executeTool', toolName, input, mcpServers)
    },
    // 接続テスト関連の関数
    testConnection: async (mcpServer: McpServerConfig) => {
      return ipcRenderer.invoke('mcp:testConnection', mcpServer)
    },
    testAllConnections: async (mcpServers: McpServerConfig[]) => {
      const result = await ipcRenderer.invoke('mcp:testAllConnections', mcpServers)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.results
    },
    // クリーンアップ
    cleanup: async () => {
      const result = await ipcRenderer.invoke('mcp:cleanup')
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
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
    }
  },
  pubsub: {
    subscribe: (channel: string, callback: (data: any) => void) => {
      // Listen for messages on the channel
      const handler = (_event: any, data: any) => callback(data)
      ipcRenderer.on(channel, handler)

      // Register subscription with main process
      ipcRenderer.invoke('pubsub:subscribe', { channel })

      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, handler)
        ipcRenderer.invoke('pubsub:unsubscribe', { channel })
      }
    },
    unsubscribe: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
      return ipcRenderer.invoke('pubsub:unsubscribe', { channel })
    },
    publish: (channel: string, data: any) => {
      return ipcRenderer.invoke('pubsub:publish', { channel, data })
    },
    stats: () => {
      return ipcRenderer.invoke('pubsub:stats')
    }
  },
  window: {
    isFocused: async () => {
      return ipcRenderer.invoke('window:isFocused')
    },
    openTaskHistory: async (taskId: string) => {
      return ipcRenderer.invoke('window:openTaskHistory', taskId)
    }
  },
  todo: {
    getTodoList: async (params?: { sessionId?: string }) => {
      return ipcRenderer.invoke('get-todo-list', params)
    },
    initTodoList: async (params: { sessionId: string; items: string[] }) => {
      return ipcRenderer.invoke('todo-init', params)
    },
    updateTodoList: async (params: {
      sessionId: string
      updates: Array<{
        id: string
        status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
        description?: string
      }>
    }) => {
      return ipcRenderer.invoke('todo-update', params)
    },
    deleteTodoList: async (params: { sessionId: string }) => {
      return ipcRenderer.invoke('delete-todo-list', params)
    },
    getRecentTodos: async () => {
      return ipcRenderer.invoke('get-recent-todos')
    },
    getAllTodoMetadata: async () => {
      return ipcRenderer.invoke('get-all-todo-metadata')
    },
    setActiveTodoList: async (params: { sessionId?: string }) => {
      return ipcRenderer.invoke('set-active-todo-list', params)
    },
    getActiveTodoListId: async () => {
      return ipcRenderer.invoke('get-active-todo-list-id')
    }
  },
  strandsConverter: {
    convertAndSave: async (agentId: string, outputDirectory: string) => {
      return ipcRenderer.invoke('convert-agent-to-strands', agentId, outputDirectory)
    }
  }
}

export type API = typeof api
