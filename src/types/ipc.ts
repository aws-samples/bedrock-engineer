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
}

// 型ヘルパー
export type IPCChannels = keyof IPCChannelDefinitions
export type IPCParams<C extends IPCChannels> = IPCChannelDefinitions[C]['params']
export type IPCResult<C extends IPCChannels> = IPCChannelDefinitions[C]['result']
