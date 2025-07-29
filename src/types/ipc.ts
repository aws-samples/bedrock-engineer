import { ToolInput, ToolResult } from './tools'

// IPC通信の型定義を一元管理
export interface IPCChannelDefinitions {
  // Bedrock関連
  'bedrock:generateImage': {
    params: {
      modelId: string
      prompt: string
      negativePrompt?: string
      aspect_ratio?: string
      seed?: number
      output_format?: 'png' | 'jpeg' | 'webp'
    }
    result: {
      seeds?: number[]
      finish_reasons?: string[]
      images: string[]
    }
  }
  'bedrock:recognizeImage': {
    params: {
      imagePaths: string[]
      prompt?: string
      modelId?: string
    }
    result: string
  }
  'bedrock:retrieve': {
    params: {
      knowledgeBaseId: string
      query: string
      retrievalConfiguration?: any
    }
    result: any // AWS SDKの型に合わせる
  }
  'bedrock:invokeAgent': {
    params: {
      agentId: string
      agentAliasId: string
      sessionId?: string
      inputText: string
    }
    result: any // AWS SDKの型に合わせる
  }
  'bedrock:invokeFlow': {
    params: {
      flowIdentifier: string
      flowAliasIdentifier: string
      inputs?: any[]
      input?: any
      enableTrace?: boolean
    }
    result: any // 適切な戻り値の型
  }
  'bedrock:startVideoGeneration': {
    params: {
      prompt: string
      durationSeconds: number
      outputPath?: string
      seed?: number
      s3Uri: string
      inputImages?: string[]
      prompts?: string[]
    }
    result: {
      invocationArn: string
      status?: {
        invocationArn: string
        modelId: string
        status: 'InProgress' | 'Completed' | 'Failed'
        submitTime: Date
        endTime?: Date
        outputDataConfig?: {
          s3OutputDataConfig: {
            s3Uri: string
          }
        }
        failureMessage?: string
      }
    }
  }
  'bedrock:checkVideoStatus': {
    params: {
      invocationArn: string
    }
    result: {
      invocationArn: string
      modelId: string
      status: 'InProgress' | 'Completed' | 'Failed'
      submitTime: Date
      endTime?: Date
      outputDataConfig?: {
        s3OutputDataConfig: {
          s3Uri: string
        }
      }
      failureMessage?: string
    }
  }
  'bedrock:downloadVideo': {
    params: {
      s3Uri: string
      localPath: string
    }
    result: {
      downloadedPath: string
      fileSize: number
    }
  }
  'bedrock:translateText': {
    params: {
      text: string
      sourceLanguage: string
      targetLanguage: string
      cacheKey?: string
    }
    result: {
      originalText: string
      translatedText: string
      sourceLanguage: string
      targetLanguage: string
    }
  }
  'bedrock:translateBatch': {
    params: {
      texts: Array<{
        text: string
        sourceLanguage: string
        targetLanguage: string
      }>
    }
    result: Array<{
      originalText: string
      translatedText: string
      sourceLanguage: string
      targetLanguage: string
    }>
  }
  'bedrock:getTranslationCache': {
    params: {
      text: string
      sourceLanguage: string
      targetLanguage: string
    }
    result: {
      originalText: string
      translatedText: string
      sourceLanguage: string
      targetLanguage: string
    } | null
  }
  'bedrock:clearTranslationCache': {
    params: void
    result: { success: boolean }
  }
  'bedrock:getTranslationCacheStats': {
    params: void
    result: { size: number; maxSize: number; hitRate?: number }
  }

  // Preloadツール実行関連（IPC経由 - 新しいパターン）
  'preload-tool-request': {
    params: {
      requestId: string
      toolInput: ToolInput
    }
    result: void
  }
  'preload-tool-response': {
    params: {
      requestId: string
      result: ToolResult
    }
    result: void
  }

  // 背景エージェント関連
  'background-agent:chat': {
    params: {
      sessionId: string
      config: {
        modelId: string
        systemPrompt?: string
        agentId?: string
        tools?: any[]
      }
      userMessage: string
    }
    result: {
      response: {
        id: string
        role: string
        content: any[]
        timestamp: number
      }
      toolExecutions?: Array<{
        toolName: string
        input: any
        output: any
        success: boolean
        error?: string
      }>
    }
  }
  'background-agent:task-notification': {
    params: {
      taskId: string
      taskName: string
      success: boolean
      error?: string
      aiMessage?: string
      executedAt: number
    }
    result: void
  }
  'background-agent:create-session': {
    params: {
      sessionId: string
    }
    result: {
      success: boolean
      sessionId: string
    }
  }
  'background-agent:delete-session': {
    params: {
      sessionId: string
    }
    result: {
      success: boolean
      sessionId: string
    }
  }
  'background-agent:list-sessions': {
    params: void
    result: {
      sessions: string[]
    }
  }
  'background-agent:get-session-history': {
    params: {
      sessionId: string
    }
    result: {
      history: Array<{
        id: string
        role: string
        content: any[]
        timestamp: number
      }>
    }
  }
  'background-agent:get-session-stats': {
    params: {
      sessionId: string
    }
    result: {
      exists: boolean
      messageCount: number
      userMessages: number
      assistantMessages: number
    }
  }
  'background-agent:continue-session': {
    params: {
      sessionId: string
      taskId: string
      userMessage: string
      options?: {
        enableToolExecution?: boolean
        maxToolExecutions?: number
        timeoutMs?: number
      }
    }
    result: {
      response: {
        id: string
        role: string
        content: any[]
        timestamp: number
      }
      toolExecutions?: Array<{
        toolName: string
        input: any
        output: any
        success: boolean
        error?: string
      }>
    }
  }

  // ファイル操作関連
  'open-file': {
    params: void
    result: string | null
  }
  'open-directory': {
    params: void
    result: string | null
  }
  'get-local-image': {
    params: string // ファイルパス
    result: string // base64画像
  }
  'read-project-ignore': {
    params: { projectPath: string }
    result: { content: string; exists: boolean }
  }
  'write-project-ignore': {
    params: { projectPath: string; content: string }
    result: { success: boolean }
  }

  // PDF操作関連
  'pdf-extract-text': {
    params: {
      filePath: string
      lineRange?: {
        from?: number
        to?: number
      }
    }
    result: string
  }
  'pdf-extract-metadata': {
    params: {
      filePath: string
    }
    result: {
      text: string
      totalLines: number
      metadata: {
        pages: number
        title?: string
        author?: string
        creationDate?: Date
        creator?: string
        producer?: string
      }
    }
  }
  'pdf-get-info': {
    params: {
      filePath: string
    }
    result: {
      pages: number
      title?: string
      author?: string
    }
  }
  'pdf-is-pdf-file': {
    params: {
      filePath: string
    }
    result: boolean
  }

  // DOCX操作関連
  'docx-extract-text': {
    params: {
      filePath: string
      lineRange?: {
        from?: number
        to?: number
      }
    }
    result: string
  }
  'docx-extract-metadata': {
    params: {
      filePath: string
    }
    result: {
      text: string
      totalLines: number
      metadata: {
        title?: string
        author?: string
        creationDate?: Date
        modifiedDate?: Date
        wordCount?: number
        characterCount?: number
      }
    }
  }
  'docx-get-info': {
    params: {
      filePath: string
    }
    result: {
      title?: string
      author?: string
      wordCount?: number
    }
  }
  'docx-is-docx-file': {
    params: {
      filePath: string
    }
    result: boolean
  }

  // ウィンドウ関連
  'window:isFocused': {
    params: void
    result: boolean
  }

  // ユーティリティ
  'get-app-path': {
    params: void
    result: string
  }
  'fetch-website': {
    params: [string, any?] // url, options
    result: {
      status: number
      headers: Record<string, string>
      data: any
    }
  }
  'save-website-content': {
    params: {
      content: string
      url: string
      filename?: string
      directory?: string
      format: 'html' | 'txt'
    }
    result: {
      success: boolean
      filePath?: string
      error?: string
    }
  }
  'check-docker-availability': {
    params: void
    result: {
      available: boolean
      version?: string
      error?: string
      lastChecked: Date
    }
  }
  'get-todo-list': {
    params?: { sessionId?: string }
    result: any | null // TodoList | null
  }

  // TODO管理関連
  'todo-init': {
    params: { sessionId: string; items: string[] }
    result: {
      success: boolean
      result?: any // TodoList
      message?: string
      error?: string
    }
  }
  'todo-update': {
    params: {
      sessionId: string
      updates: Array<{
        id: string
        status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
        description?: string
      }>
    }
    result: {
      success: boolean
      updatedList?: any // TodoList
      currentList?: any // TodoList
      error?: string
    }
  }
  'delete-todo-list': {
    params: { sessionId: string }
    result: { success: boolean; error?: string }
  }
  'get-recent-todos': {
    params: void
    result: any[] // TodoMetadata[]
  }
  'get-all-todo-metadata': {
    params: void
    result: any[] // TodoMetadata[]
  }
  'set-active-todo-list': {
    params: { sessionId?: string }
    result: { success: boolean; error?: string }
  }
  'get-active-todo-list-id': {
    params: void
    result: string | null
  }

  // エージェント関連
  'read-shared-agents': {
    params: void
    result: {
      agents: any[]
      error: string | null
    }
  }
  'save-shared-agent': {
    params: [any, { format?: 'json' | 'yaml' }?] // agent, options
    result: {
      success: boolean
      filePath?: string
      format?: string
      error?: string
    }
  }

  // ログ関連
  'logger:log': {
    params: {
      level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'
      message: string
      process?: string
      category?: string
      [key: string]: any
    }
    result: void
  }

  // Pub-Sub システム関連
  'pubsub:subscribe': {
    params: {
      channel: string
    }
    result: void
  }
  'pubsub:unsubscribe': {
    params: {
      channel: string
    }
    result: void
  }
  'pubsub:publish': {
    params: {
      channel: string
      data: any
    }
    result: void
  }
  'pubsub:stats': {
    params: void
    result: {
      totalChannels: number
      totalSubscribers: number
      channels: Array<{ channel: string; subscriberCount: number }>
    }
  }

  // 画面キャプチャ関連
  'screen:capture': {
    params: {
      format?: 'png' | 'jpeg'
      quality?: number
      outputPath?: string
      windowTarget?: string
    }
    result: {
      success: boolean
      filePath: string
      metadata: {
        width: number
        height: number
        format: string
        fileSize: number
        timestamp: string
      }
    }
  }
  'screen:list-available-windows': {
    params: void
    result: Array<{
      id: string
      name: string
      enabled: boolean
      thumbnail: string
      dimensions: { width: number; height: number }
    }>
  }
  'screen:check-permissions': {
    params: void
    result: {
      hasPermission: boolean
      platform: string
      message: string
    }
  }

  // カメラキャプチャ関連
  'camera:save-captured-image': {
    params: {
      base64Data: string
      deviceId: string
      deviceName: string
      width: number
      height: number
      format: string
      outputPath?: string
    }
    result: {
      success: boolean
      filePath: string
      metadata: {
        width: number
        height: number
        format: string
        fileSize: number
        timestamp: string
        deviceId: string
        deviceName: string
      }
    }
  }

  // MCP関連
  'mcp:init': {
    params: any[] // McpServerConfig[]
    result: { success: boolean; error?: string }
  }
  'mcp:getTools': {
    params: any[] // McpServerConfig[]
    result: { success: boolean; tools?: any[]; error?: string }
  }
  'mcp:executeTool': {
    params: [string, any, any[]] // toolName, input, mcpServers
    result: {
      found: boolean
      success: boolean
      name: string
      error?: string
      message?: string
      result?: any
    }
  }
  'mcp:testConnection': {
    params: any // McpServerConfig
    result: {
      success: boolean
      message: string
      details?: {
        toolCount?: number
        toolNames?: string[]
        error?: string
        errorDetails?: string
        startupTime?: number
      }
    }
  }
  'mcp:testAllConnections': {
    params: any[] // McpServerConfig[]
    result: {
      success: boolean
      results?: Record<string, any>
      error?: string
    }
  }
  'mcp:cleanup': {
    params: void
    result: { success: boolean; error?: string }
  }

  // プロキシ関連
  'proxy:test-connection': {
    params: any // ProxyConfiguration
    result: { success: boolean; connected?: boolean; error?: string }
  }
  'proxy:update-settings': {
    params: void
    result: { success: boolean; error?: string }
  }
}

// 型ヘルパー
export type IPCChannels = keyof IPCChannelDefinitions
export type IPCParams<C extends IPCChannels> = IPCChannelDefinitions[C]['params']
export type IPCResult<C extends IPCChannels> = IPCChannelDefinitions[C]['result']
