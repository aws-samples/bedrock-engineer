import {
  BedrockRuntimeClient,
  BedrockRuntimeClientConfig,
  InvokeModelWithBidirectionalStreamCommand,
  InvokeModelWithBidirectionalStreamInput
} from '@aws-sdk/client-bedrock-runtime'
import { NodeHttp2Handler, NodeHttp2HandlerOptions } from '@smithy/node-http-handler'
import { Provider } from '@smithy/types'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { InferenceConfig } from './types'
import { Subject } from 'rxjs'
import * as path from 'path'
import { store } from '../../../preload/store'
import { take } from 'rxjs/operators'
import { firstValueFrom } from 'rxjs'
import {
  DefaultAudioInputConfiguration,
  DefaultSystemPrompt,
  DefaultTextConfiguration,
  getAudioOutputConfiguration
} from './consts'
import { SonicToolExecutor } from './tool-executor'
import { ToolInput } from '../../../types/tools'
import { ProxyConfiguration } from '../bedrock/types'
import { createSonicHttpOptions } from '../../lib/proxy-utils'

export interface NovaSonicBidirectionalStreamClientConfig {
  requestHandlerConfig?: NodeHttp2HandlerOptions | Provider<NodeHttp2HandlerOptions | void>
  clientConfig: Partial<BedrockRuntimeClientConfig>
  inferenceConfig?: InferenceConfig
  proxyConfig?: ProxyConfiguration
}

export class StreamSession {
  private audioBufferQueue: Buffer[] = []
  private maxQueueSize = 200 // Maximum number of audio chunks to queue
  private isProcessingAudio = false
  private isActive = true

  constructor(
    private sessionId: string,
    private client: NovaSonicBidirectionalStreamClient
  ) {}

  // Register event handlers for this specific session
  public onEvent(eventType: string, handler: (data: any) => void): StreamSession {
    this.client.registerEventHandler(this.sessionId, eventType, handler)
    return this // For chaining
  }

  public async setupPromptStart(tools?: any[], voiceId?: string): Promise<void> {
    this.client.setupPromptStartEvent(this.sessionId, tools, voiceId)
  }

  public async setupSystemPrompt(
    textConfig: typeof DefaultTextConfiguration = DefaultTextConfiguration,
    systemPromptContent: string = DefaultSystemPrompt
  ): Promise<void> {
    this.client.setupSystemPromptEvent(this.sessionId, textConfig, systemPromptContent)
  }

  public async setupStartAudio(
    audioConfig: typeof DefaultAudioInputConfiguration = DefaultAudioInputConfiguration
  ): Promise<void> {
    this.client.setupStartAudioEvent(this.sessionId, audioConfig)
  }

  // Stream audio for this session
  public async streamAudio(audioData: Buffer): Promise<void> {
    // Check queue size to avoid memory issues
    if (this.audioBufferQueue.length >= this.maxQueueSize) {
      // Queue is full, drop oldest chunk
      this.audioBufferQueue.shift()
    }

    // Queue the audio chunk for streaming
    this.audioBufferQueue.push(audioData)
    this.processAudioQueue()
  }

  // Process audio queue for continuous streaming
  private async processAudioQueue() {
    if (this.isProcessingAudio || this.audioBufferQueue.length === 0 || !this.isActive) return

    this.isProcessingAudio = true
    try {
      // Process all chunks in the queue, up to a reasonable limit
      let processedChunks = 0
      const maxChunksPerBatch = 5 // Process max 5 chunks at a time to avoid overload

      while (
        this.audioBufferQueue.length > 0 &&
        processedChunks < maxChunksPerBatch &&
        this.isActive
      ) {
        const audioChunk = this.audioBufferQueue.shift()
        if (audioChunk) {
          await this.client.streamAudioChunk(this.sessionId, audioChunk)
          processedChunks++
        }
      }
    } finally {
      this.isProcessingAudio = false

      // If there are still items in the queue, schedule the next processing using setTimeout
      if (this.audioBufferQueue.length > 0 && this.isActive) {
        setTimeout(() => this.processAudioQueue(), 0)
      }
    }
  }
  // Get session ID
  public getSessionId(): string {
    return this.sessionId
  }

  public async endAudioContent(): Promise<void> {
    if (!this.isActive) return
    await this.client.sendContentEnd(this.sessionId)
  }

  public async endPrompt(): Promise<void> {
    if (!this.isActive) return
    await this.client.sendPromptEnd(this.sessionId)
  }

  public async close(): Promise<void> {
    if (!this.isActive) return

    this.isActive = false
    this.audioBufferQueue = [] // Clear any pending audio

    await this.client.sendSessionEnd(this.sessionId)
    console.log(`Session ${this.sessionId} close completed`)
  }
}

// Session data type
interface SessionData {
  queue: Array<any>
  queueSignal: Subject<void>
  closeSignal: Subject<void>
  responseSubject: Subject<any>
  toolUseContent: any
  toolUseId: string
  toolName: string
  responseHandlers: Map<string, (data: any) => void>
  promptName: string
  inferenceConfig: InferenceConfig
  isActive: boolean
  isPromptStartSent: boolean
  isAudioContentStartSent: boolean
  audioContentId: string
}

export class NovaSonicBidirectionalStreamClient {
  private bedrockRuntimeClient: BedrockRuntimeClient
  private inferenceConfig: InferenceConfig
  private activeSessions: Map<string, SessionData> = new Map()
  private sessionLastActivity: Map<string, number> = new Map()
  private sessionCleanupInProgress = new Set<string>()
  private toolExecutor?: SonicToolExecutor

  constructor(config: NovaSonicBidirectionalStreamClientConfig) {
    // Create proxy configuration if provided
    const httpOptions = createSonicHttpOptions(config.proxyConfig)

    const nodeHttp2Handler = new NodeHttp2Handler({
      requestTimeout: 300000,
      sessionTimeout: 300000,
      disableConcurrentStreams: false,
      maxConcurrentStreams: 20,
      ...httpOptions,
      ...config.requestHandlerConfig
    })

    if (!config.clientConfig.credentials) {
      throw new Error('No credentials provided')
    }

    this.bedrockRuntimeClient = new BedrockRuntimeClient({
      ...config.clientConfig,
      credentials: config.clientConfig.credentials,
      region: config.clientConfig.region || 'us-east-1',
      requestHandler: nodeHttp2Handler
    })

    this.inferenceConfig = config.inferenceConfig ?? {
      maxTokens: 1024,
      topP: 0.9,
      temperature: 0.7
    }
  }

  public isSessionActive(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId)
    return !!session && session.isActive
  }

  public getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys())
  }

  public getLastActivityTime(sessionId: string): number {
    return this.sessionLastActivity.get(sessionId) || 0
  }

  private updateSessionActivity(sessionId: string): void {
    this.sessionLastActivity.set(sessionId, Date.now())
  }

  public isCleanupInProgress(sessionId: string): boolean {
    return this.sessionCleanupInProgress.has(sessionId)
  }

  /**
   * Set the tool executor for this client
   */
  public setToolExecutor(toolExecutor: SonicToolExecutor): void {
    this.toolExecutor = toolExecutor
  }

  // Create a new streaming session
  public createStreamSession(
    sessionId: string = randomUUID(),
    config?: NovaSonicBidirectionalStreamClientConfig
  ): StreamSession {
    if (this.activeSessions.has(sessionId)) {
      throw new Error(`Stream session with ID ${sessionId} already exists`)
    }

    const session: SessionData = {
      queue: [],
      queueSignal: new Subject<void>(),
      closeSignal: new Subject<void>(),
      responseSubject: new Subject<any>(),
      toolUseContent: null,
      toolUseId: '',
      toolName: '',
      responseHandlers: new Map(),
      promptName: randomUUID(),
      inferenceConfig: config?.inferenceConfig ?? this.inferenceConfig,
      isActive: true,
      isPromptStartSent: false,
      isAudioContentStartSent: false,
      audioContentId: randomUUID()
    }

    this.activeSessions.set(sessionId, session)

    return new StreamSession(sessionId, this)
  }

  private async processToolUse(toolName: string, toolUseContent: object): Promise<object> {
    console.log(`Processing tool use: ${toolName}`, {
      toolName,
      hasToolExecutor: !!this.toolExecutor,
      contentPreview: JSON.stringify(toolUseContent).substring(0, 100) + '...'
    })

    // Ensure tool executor is available
    if (!this.toolExecutor) {
      const errorMessage = `Tool executor not available. Please ensure frontend connection is active.`
      console.error(errorMessage, { toolName })

      return {
        error: true,
        message: errorMessage,
        details: {
          toolName,
          timestamp: new Date().toISOString(),
          reason: 'No tool executor available'
        }
      }
    }

    try {
      console.log(`Converting tool input for ${toolName}...`)
      let toolInput = this.convertToToolInput(toolName, toolUseContent)

      // Apply default values for tools that need them
      toolInput = this.applyDefaultValuesForTool(toolName, toolInput)

      console.log(`Executing tool via preload system:`, {
        toolInput
      })

      const result = await this.toolExecutor.executeToolViaSocket(toolInput)
      console.log(`Tool executed successfully:`, {
        toolName,
        resultType: typeof result,
        resultPreview:
          typeof result === 'string'
            ? result.substring(0, 100) + '...'
            : JSON.stringify(result).substring(0, 100) + '...'
      })

      // Handle different result types
      let parsedResult
      try {
        parsedResult = typeof result === 'string' ? JSON.parse(result) : result
      } catch (parseError) {
        console.warn(`Failed to parse tool result as JSON, using as string:`, parseError)
        parsedResult = { result: result }
      }

      return parsedResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Tool execution failed for ${toolName}:`, {
        toolName,
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      })

      // Return structured error response
      return {
        error: true,
        message: `Tool execution failed: ${errorMessage}`,
        details: {
          toolName,
          originalError: errorMessage,
          timestamp: new Date().toISOString(),
          reason: 'Tool execution error'
        }
      }
    }
  }

  /**
   * Convert Nova Sonic tool format to preload tool format
   */
  private convertToToolInput(toolName: string, toolUseContent: any): ToolInput {
    // console.log({ toolUseContent })
    // {
    //   toolUseContent: {
    //     completionId: '92186f21-5211-40cd-a258-592d3ad20e48',
    //     content: '{"query":"what is amazon bedrock"}',
    //     contentId: 'b9eac6f4-2b51-4528-9009-4c270296ac23',
    //     promptName: '27a9a6cb-5023-48c3-904c-8706328e5d8f',
    //     role: 'TOOL',
    //     sessionId: 'f2c9d046-cb6b-4f88-b8bb-cb7e1a3009f6',
    //     toolName: 'tavilySearch',
    //     toolUseId: '8a688273-2a9a-486e-9c20-50dd4bda4924'
    //   }
    // }
    try {
      // Parse the content if it's a string
      const content =
        typeof toolUseContent.content === 'string'
          ? JSON.parse(toolUseContent.content)
          : toolUseContent.content || {}

      const toolInput = {
        type: toolName,
        ...content
      }

      return toolInput
    } catch (error) {
      console.error(`Error converting tool input for ${toolName}:`, error)
      throw new Error(`Failed to convert tool input for ${toolName}: ${error}`)
    }
  }

  /**
   * Apply default values for tools based on current project directory
   */
  private applyDefaultValuesForTool(toolName: string, toolInput: ToolInput): ToolInput {
    try {
      // Get project path from store - we'll need to import this
      const projectPath = this.getProjectPath()
      if (!projectPath) {
        console.warn('Project path not available, skipping default value application')
        return toolInput
      }

      console.log(`Applying default values for tool ${toolName}`, {
        toolName,
        projectPath,
        originalInput: this.sanitizeInputForLogging(toolInput)
      })

      const updatedInput = { ...toolInput }

      switch (toolName) {
        case 'generateImage':
          this.applyGenerateImageDefaults(updatedInput, projectPath)
          break

        case 'writeToFile':
        case 'readFiles':
        case 'applyDiffEdit':
          this.applyFilePathDefaults(updatedInput, projectPath)
          break

        case 'createFolder':
        case 'listFiles':
          this.applyDirectoryPathDefaults(updatedInput, projectPath)
          break

        case 'moveFile':
        case 'copyFile':
          this.applySourceDestinationDefaults(updatedInput, projectPath)
          break

        case 'executeCommand':
          this.applyExecuteCommandDefaults(updatedInput, projectPath)
          break

        default:
          // No default values needed for this tool
          break
      }

      console.log(`Default values applied for ${toolName}`, {
        toolName,
        hasChanges: JSON.stringify(updatedInput) !== JSON.stringify(toolInput),
        updatedInput: this.sanitizeInputForLogging(updatedInput)
      })

      return updatedInput
    } catch (error) {
      console.error(`Error applying default values for ${toolName}:`, error)
      // Return original input if error occurs
      return toolInput
    }
  }

  /**
   * Get project path from store
   */
  private getProjectPath(): string | undefined {
    try {
      const projectPath = store.get('projectPath')
      if (projectPath && typeof projectPath === 'string') {
        return projectPath
      }

      // Fallback to user home directory
      const homeDir = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
      console.warn('No project path in store, using home directory:', homeDir)
      return homeDir
    } catch (error) {
      console.error('Error getting project path from store:', error)
      // Fallback to user home directory
      return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
    }
  }

  /**
   * Apply defaults for generateImage tool
   */
  private applyGenerateImageDefaults(toolInput: any, projectPath: string): void {
    // Handle both outputPath and output_path (Nova Sonic sometimes uses underscore format)
    const currentOutputPath = toolInput.outputPath || toolInput.output_path

    if (
      !currentOutputPath ||
      typeof currentOutputPath !== 'string' ||
      currentOutputPath.trim() === ''
    ) {
      const timestamp = Date.now()
      const defaultFileName = `generated_image_${timestamp}.png`
      const defaultPath = path.join(projectPath, defaultFileName)

      // Set both formats to ensure compatibility
      toolInput.outputPath = defaultPath
      toolInput.output_path = defaultPath

      console.log(`Applied default outputPath for generateImage: ${defaultPath}`)
    } else if (!path.isAbsolute(currentOutputPath)) {
      // Convert relative path to absolute
      const absolutePath = path.resolve(projectPath, currentOutputPath)

      // Set both formats to ensure compatibility
      toolInput.outputPath = absolutePath
      toolInput.output_path = absolutePath

      console.log(`Converted relative outputPath to absolute: ${absolutePath}`)
    } else {
      // Ensure both formats are set with the absolute path
      toolInput.outputPath = currentOutputPath
      toolInput.output_path = currentOutputPath
    }
  }

  /**
   * Apply defaults for file path tools (writeToFile, readFiles, applyDiffEdit)
   */
  private applyFilePathDefaults(toolInput: any, projectPath: string): void {
    // Handle single path
    if (toolInput.path && typeof toolInput.path === 'string' && !path.isAbsolute(toolInput.path)) {
      toolInput.path = path.resolve(projectPath, toolInput.path)
      console.log(`Converted relative path to absolute: ${toolInput.path}`)
    }

    // Handle paths array (for readFiles)
    if (toolInput.paths && Array.isArray(toolInput.paths)) {
      toolInput.paths = toolInput.paths.map((p: string) => {
        if (typeof p === 'string' && !path.isAbsolute(p)) {
          const absolutePath = path.resolve(projectPath, p)
          console.log(`Converted relative path to absolute: ${p} -> ${absolutePath}`)
          return absolutePath
        }
        return p
      })
    }
  }

  /**
   * Apply defaults for directory path tools (createFolder, listFiles)
   */
  private applyDirectoryPathDefaults(toolInput: any, projectPath: string): void {
    if (!toolInput.path || typeof toolInput.path !== 'string') {
      // For listFiles, default to project directory
      if (toolInput.type === 'listFiles') {
        toolInput.path = projectPath
        console.log(`Applied default path for listFiles: ${toolInput.path}`)
      }
    } else if (!path.isAbsolute(toolInput.path)) {
      // Convert relative path to absolute
      toolInput.path = path.resolve(projectPath, toolInput.path)
      console.log(`Converted relative path to absolute: ${toolInput.path}`)
    }
  }

  /**
   * Apply defaults for tools with source/destination (moveFile, copyFile)
   */
  private applySourceDestinationDefaults(toolInput: any, projectPath: string): void {
    if (
      toolInput.source &&
      typeof toolInput.source === 'string' &&
      !path.isAbsolute(toolInput.source)
    ) {
      toolInput.source = path.resolve(projectPath, toolInput.source)
      console.log(`Converted relative source path to absolute: ${toolInput.source}`)
    }

    if (
      toolInput.destination &&
      typeof toolInput.destination === 'string' &&
      !path.isAbsolute(toolInput.destination)
    ) {
      toolInput.destination = path.resolve(projectPath, toolInput.destination)
      console.log(`Converted relative destination path to absolute: ${toolInput.destination}`)
    }
  }

  /**
   * Apply defaults for executeCommand tool
   */
  private applyExecuteCommandDefaults(toolInput: any, projectPath: string): void {
    if (!toolInput.cwd || typeof toolInput.cwd !== 'string') {
      toolInput.cwd = projectPath
      console.log(`Applied default cwd for executeCommand: ${toolInput.cwd}`)
    } else if (!path.isAbsolute(toolInput.cwd)) {
      toolInput.cwd = path.resolve(projectPath, toolInput.cwd)
      console.log(`Converted relative cwd to absolute: ${toolInput.cwd}`)
    }
  }

  /**
   * Sanitize input for logging (remove sensitive data, truncate long strings)
   */
  private sanitizeInputForLogging(input: any): any {
    if (typeof input !== 'object' || input === null) {
      return input
    }

    const sanitized = { ...input }

    // Truncate long strings
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
        sanitized[key] = sanitized[key].substring(0, 200) + '...'
      }
    })

    return sanitized
  }

  // Stream audio for a specific session
  public async initiateSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Stream session ${sessionId} not found`)
    }

    try {
      // Rebuild queue to ensure SessionStart is the first event
      this.rebuildQueueWithSessionStart(sessionId)

      // Create the bidirectional stream with session-specific async iterator
      const asyncIterable = this.createSessionAsyncIterable(sessionId)

      const response = await this.bedrockRuntimeClient.send(
        new InvokeModelWithBidirectionalStreamCommand({
          modelId: 'amazon.nova-2-sonic-v1:0',
          body: asyncIterable
        })
      )

      // Process responses for this session
      await this.processResponseStream(sessionId, response)
    } catch (error) {
      console.error(`Error in session ${sessionId}: `, error)
      this.dispatchEventForSession(sessionId, 'error', {
        source: 'bidirectionalStream',
        error
      })

      // Make sure to clean up if there's an error
      if (session.isActive) {
        this.closeSession(sessionId)
      }
    }
  }

  // Dispatch events to handlers for a specific session
  private dispatchEventForSession(sessionId: string, eventType: string, data: any): void {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    const handler = session.responseHandlers.get(eventType)
    if (handler) {
      try {
        handler(data)
      } catch (e) {
        console.error(`Error in ${eventType} handler for session ${sessionId}: `, e)
      }
    }

    // Also dispatch to "any" handlers
    const anyHandler = session.responseHandlers.get('any')
    if (anyHandler) {
      try {
        anyHandler({ type: eventType, data })
      } catch (e) {
        console.error(`Error in 'any' handler for session ${sessionId}: `, e)
      }
    }
  }

  private createSessionAsyncIterable(
    sessionId: string
  ): AsyncIterable<InvokeModelWithBidirectionalStreamInput> {
    if (!this.isSessionActive(sessionId)) {
      console.log(`Cannot create async iterable: Session ${sessionId} not active`)
      return {
        [Symbol.asyncIterator]: () => ({
          next: async () => ({ value: undefined, done: true })
        })
      }
    }

    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Cannot create async iterable: Session ${sessionId} not found`)
    }

    let _eventCount = 0

    return {
      [Symbol.asyncIterator]: () => {
        console.log(`AsyncIterable iterator requested for session ${sessionId}`)

        return {
          next: async (): Promise<IteratorResult<InvokeModelWithBidirectionalStreamInput>> => {
            try {
              // Check if session is still active
              if (!session.isActive || !this.activeSessions.has(sessionId)) {
                console.log(`Iterator closing for session ${sessionId}, done = true`)
                return { value: undefined, done: true }
              }
              // Wait for items in the queue or close signal
              if (session.queue.length === 0) {
                try {
                  await Promise.race([
                    firstValueFrom(session.queueSignal.pipe(take(1))),
                    firstValueFrom(session.closeSignal.pipe(take(1))).then(() => {
                      throw new Error('Stream closed')
                    })
                  ])
                } catch (error) {
                  if (error instanceof Error) {
                    if (error.message === 'Stream closed' || !session.isActive) {
                      // This is an expected condition when closing the session
                      if (this.activeSessions.has(sessionId)) {
                        console.log(`Session \${ sessionId } closed during wait`)
                      }
                      return { value: undefined, done: true }
                    }
                  } else {
                    console.error(`Error on event close`, error)
                  }
                }
              }

              // If queue is still empty or session is inactive, we're done
              if (session.queue.length === 0 || !session.isActive) {
                console.log(`Queue empty or session inactive: ${sessionId} `)
                return { value: undefined, done: true }
              }

              // Get next item from the session's queue
              const nextEvent = session.queue.shift()
              _eventCount++

              //console.log(`Sending event #${ _eventCount } for session ${ sessionId }: ${ JSON.stringify(nextEvent).substring(0, 100) }...`);

              return {
                value: {
                  chunk: {
                    bytes: new TextEncoder().encode(JSON.stringify(nextEvent))
                  }
                },
                done: false
              }
            } catch (error) {
              console.error(`Error in session ${sessionId} iterator: `, error)
              session.isActive = false
              return { value: undefined, done: true }
            }
          },

          return: async (): Promise<IteratorResult<InvokeModelWithBidirectionalStreamInput>> => {
            console.log(`Iterator return () called for session ${sessionId}`)
            session.isActive = false
            return { value: undefined, done: true }
          },

          throw: async (
            error: any
          ): Promise<IteratorResult<InvokeModelWithBidirectionalStreamInput>> => {
            console.log(`Iterator throw () called for session ${sessionId} with error: `, error)
            session.isActive = false
            throw error
          }
        }
      }
    }
  }

  // Process the response stream from AWS Bedrock
  private async processResponseStream(sessionId: string, response: any): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    try {
      for await (const event of response.body) {
        if (!session.isActive) {
          console.log(`Session ${sessionId} is no longer active, stopping response processing`)
          break
        }
        if (event.chunk?.bytes) {
          try {
            this.updateSessionActivity(sessionId)
            const textResponse = new TextDecoder().decode(event.chunk.bytes)

            try {
              const jsonResponse = JSON.parse(textResponse)
              if (jsonResponse.event?.contentStart) {
                this.dispatchEvent(sessionId, 'contentStart', jsonResponse.event.contentStart)
              } else if (jsonResponse.event?.textOutput) {
                this.dispatchEvent(sessionId, 'textOutput', jsonResponse.event.textOutput)
              } else if (jsonResponse.event?.audioOutput) {
                this.dispatchEvent(sessionId, 'audioOutput', jsonResponse.event.audioOutput)
              } else if (jsonResponse.event?.toolUse) {
                this.dispatchEvent(sessionId, 'toolUse', jsonResponse.event.toolUse)

                // Store tool use information for later
                session.toolUseContent = jsonResponse.event.toolUse
                session.toolUseId = jsonResponse.event.toolUse.toolUseId
                session.toolName = jsonResponse.event.toolUse.toolName
              } else if (
                jsonResponse.event?.contentEnd &&
                jsonResponse.event?.contentEnd?.type === 'TOOL'
              ) {
                // Process tool use
                console.log(`Processing tool use for session ${sessionId}`)
                this.dispatchEvent(sessionId, 'toolEnd', {
                  toolUseContent: session.toolUseContent,
                  toolUseId: session.toolUseId,
                  toolName: session.toolName
                })

                console.log('calling tooluse')
                console.log('tool use content : ', session.toolUseContent)
                // function calling
                const toolResult = await this.processToolUse(
                  session.toolName,
                  session.toolUseContent
                )

                // Send tool result
                this.sendToolResult(sessionId, session.toolUseId, toolResult)

                // Also dispatch event about tool result
                this.dispatchEvent(sessionId, 'toolResult', {
                  toolUseId: session.toolUseId,
                  result: toolResult
                })
              } else if (jsonResponse.event?.contentEnd) {
                this.dispatchEvent(sessionId, 'contentEnd', jsonResponse.event.contentEnd)
              } else {
                // Handle other events
                const eventKeys = Object.keys(jsonResponse.event || {})
                console.log(`Event keys for session ${sessionId}: `, eventKeys)
                console.log(`Handling other events`)
                if (eventKeys.length > 0) {
                  this.dispatchEvent(sessionId, eventKeys[0], jsonResponse.event)
                } else if (Object.keys(jsonResponse).length > 0) {
                  this.dispatchEvent(sessionId, 'unknown', jsonResponse)
                }
              }
            } catch (e) {
              console.log(`Raw text response for session ${sessionId}(parse error): `, textResponse)
            }
          } catch (e) {
            console.error(`Error processing response chunk for session ${sessionId}: `, e)
          }
        } else if (event.modelStreamErrorException) {
          console.error(
            `Model stream error for session ${sessionId}: `,
            event.modelStreamErrorException
          )
          this.dispatchEvent(sessionId, 'error', {
            type: 'modelStreamErrorException',
            details: event.modelStreamErrorException
          })
        } else if (event.internalServerException) {
          console.error(
            `Internal server error for session ${sessionId}: `,
            event.internalServerException
          )
          this.dispatchEvent(sessionId, 'error', {
            type: 'internalServerException',
            details: event.internalServerException
          })
        }
      }

      console.log(`Response stream processing complete for session ${sessionId}`)
      this.dispatchEvent(sessionId, 'streamComplete', {
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error(`Error processing response stream for session ${sessionId}: `, error)
      this.dispatchEvent(sessionId, 'error', {
        source: 'responseStream',
        message: 'Error processing response stream',
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Add an event to a session's queue
  private addEventToSessionQueue(sessionId: string, event: any): void {
    const session = this.activeSessions.get(sessionId)
    if (!session || !session.isActive) return

    this.updateSessionActivity(sessionId)
    session.queue.push(event)
    session.queueSignal.next()
  }

  // Rebuild queue with SessionStart as the first event
  private rebuildQueueWithSessionStart(sessionId: string): void {
    console.log(`Rebuilding queue with SessionStart first for session ${sessionId}...`)
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // Create SessionStart event
    const sessionStartEvent = {
      event: {
        sessionStart: {
          inferenceConfiguration: session.inferenceConfig
        }
      }
    }

    // Save existing queue
    const existingQueue = [...session.queue]

    // Clear queue and rebuild with SessionStart first
    session.queue = [sessionStartEvent, ...existingQueue]

    this.updateSessionActivity(sessionId)
    session.queueSignal.next()
  }
  /**
   * Convert ToolState[] from frontend to Nova Sonic tool format
   */
  private convertToolsToNovaSonicFormat(tools: any[] = []): any[] {
    console.log('convertToolsToNovaSonicFormat called with tools:', tools?.length || 0)

    console.log(
      'Processing tools:',
      tools.map((t) => ({
        enabled: t.enabled,
        hasToolSpec: !!t.toolSpec,
        toolName: t.toolSpec?.name
      }))
    )

    const filteredTools = tools.filter((tool) => tool.enabled && tool.toolSpec)
    console.log('Filtered tools:', filteredTools.length)

    const convertedTools = filteredTools.map((tool) => {
      console.log('Converting tool:', {
        name: tool.toolSpec.name,
        inputSchema: tool.toolSpec.inputSchema
      })

      // フロントエンドから送られてくるinputSchemaはすでに { json: {...} } 形式
      // Nova Sonic APIが期待するのは { json: "JSON文字列" } なので、
      // tool.toolSpec.inputSchema.json を文字列化する
      const inputSchemaJson = tool.toolSpec.inputSchema?.json
        ? JSON.stringify(tool.toolSpec.inputSchema.json)
        : JSON.stringify(tool.toolSpec.inputSchema)

      const converted = {
        toolSpec: {
          name: tool.toolSpec.name,
          description: tool.toolSpec.description,
          inputSchema: {
            json: inputSchemaJson
          }
        }
      }

      console.log('Converted tool inputSchema.json:', converted.toolSpec.inputSchema.json)
      return converted
    })

    console.log('Final converted tools count:', convertedTools.length)
    return convertedTools
  }

  public setupPromptStartEvent(sessionId: string, tools?: any[], voiceId?: string): void {
    console.log(`Setting up prompt start event for session ${sessionId}...`)
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    // ツール設定を動的に生成
    const novaSonicTools = this.convertToolsToNovaSonicFormat(tools)
    console.log(`Configured ${novaSonicTools.length} tools for Nova Sonic session ${sessionId}`)

    // 音声設定を動的に取得
    const audioOutputConfig = getAudioOutputConfiguration(voiceId)
    console.log(`Using voice: ${audioOutputConfig.voiceId} for session ${sessionId}`)

    // Prompt start event
    this.addEventToSessionQueue(sessionId, {
      event: {
        promptStart: {
          promptName: session.promptName,
          textOutputConfiguration: {
            mediaType: 'text/plain'
          },
          audioOutputConfiguration: audioOutputConfig,
          toolUseOutputConfiguration: {
            mediaType: 'application/json'
          },
          toolConfiguration: {
            tools: novaSonicTools
          }
        }
      }
    })
    session.isPromptStartSent = true
  }

  public setupSystemPromptEvent(
    sessionId: string,
    textConfig: typeof DefaultTextConfiguration = DefaultTextConfiguration,
    systemPromptContent: string = DefaultSystemPrompt
  ): void {
    console.log(`Setting up systemPrompt events for session ${sessionId}...`)
    const session = this.activeSessions.get(sessionId)
    if (!session) return
    // Text content start
    const textPromptID = randomUUID()
    this.addEventToSessionQueue(sessionId, {
      event: {
        contentStart: {
          promptName: session.promptName,
          contentName: textPromptID,
          type: 'TEXT',
          interactive: true,
          role: 'SYSTEM',
          textInputConfiguration: textConfig
        }
      }
    })

    // Text input content
    this.addEventToSessionQueue(sessionId, {
      event: {
        textInput: {
          promptName: session.promptName,
          contentName: textPromptID,
          content: systemPromptContent
        }
      }
    })

    // Text content end
    this.addEventToSessionQueue(sessionId, {
      event: {
        contentEnd: {
          promptName: session.promptName,
          contentName: textPromptID
        }
      }
    })
  }

  public setupStartAudioEvent(
    sessionId: string,
    audioConfig: typeof DefaultAudioInputConfiguration = DefaultAudioInputConfiguration
  ): void {
    console.log(`Setting up startAudioContent event for session ${sessionId}...`)
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    console.log(`Using audio content ID: ${session.audioContentId}`)
    // Audio content start
    this.addEventToSessionQueue(sessionId, {
      event: {
        contentStart: {
          promptName: session.promptName,
          contentName: session.audioContentId,
          type: 'AUDIO',
          interactive: true,
          role: 'USER',
          audioInputConfiguration: audioConfig
        }
      }
    })
    session.isAudioContentStartSent = true
    console.log(`Initial events setup complete for session ${sessionId}`)
  }

  // Stream an audio chunk for a session
  public async streamAudioChunk(sessionId: string, audioData: Buffer): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session || !session.isActive || !session.audioContentId) {
      throw new Error(`Invalid session ${sessionId} for audio streaming`)
    }
    // Convert audio to base64
    const base64Data = audioData.toString('base64')

    this.addEventToSessionQueue(sessionId, {
      event: {
        audioInput: {
          promptName: session.promptName,
          contentName: session.audioContentId,
          content: base64Data
        }
      }
    })
  }

  // Send tool result back to the model
  private async sendToolResult(sessionId: string, toolUseId: string, result: any): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    console.log('inside tool result')
    if (!session || !session.isActive) return

    console.log(`Sending tool result for session ${sessionId}, tool use ID: ${toolUseId}`)
    const contentId = randomUUID()

    // Tool content start
    this.addEventToSessionQueue(sessionId, {
      event: {
        contentStart: {
          promptName: session.promptName,
          contentName: contentId,
          interactive: false,
          type: 'TOOL',
          role: 'TOOL',
          toolResultInputConfiguration: {
            toolUseId: toolUseId,
            type: 'TEXT',
            textInputConfiguration: {
              mediaType: 'text/plain'
            }
          }
        }
      }
    })

    // Tool content input
    const resultContent = typeof result === 'string' ? result : JSON.stringify(result)
    this.addEventToSessionQueue(sessionId, {
      event: {
        toolResult: {
          promptName: session.promptName,
          contentName: contentId,
          content: resultContent
        }
      }
    })

    // Tool content end
    this.addEventToSessionQueue(sessionId, {
      event: {
        contentEnd: {
          promptName: session.promptName,
          contentName: contentId
        }
      }
    })

    console.log(`Tool result sent for session ${sessionId}`)
  }

  public async sendContentEnd(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session || !session.isAudioContentStartSent) return

    await this.addEventToSessionQueue(sessionId, {
      event: {
        contentEnd: {
          promptName: session.promptName,
          contentName: session.audioContentId
        }
      }
    })

    // Wait to ensure it's processed
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  public async sendPromptEnd(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session || !session.isPromptStartSent) return

    await this.addEventToSessionQueue(sessionId, {
      event: {
        promptEnd: {
          promptName: session.promptName
        }
      }
    })

    // Wait to ensure it's processed
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  public async sendSessionEnd(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    await this.addEventToSessionQueue(sessionId, {
      event: {
        sessionEnd: {}
      }
    })

    // Wait to ensure it's processed
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Now it's safe to clean up
    session.isActive = false
    session.closeSignal.next()
    session.closeSignal.complete()
    this.activeSessions.delete(sessionId)
    this.sessionLastActivity.delete(sessionId)
    console.log(`Session ${sessionId} closed and removed from active sessions`)
  }

  // Register an event handler for a session
  public registerEventHandler(
    sessionId: string,
    eventType: string,
    handler: (data: any) => void
  ): void {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }
    session.responseHandlers.set(eventType, handler)
  }

  // Dispatch an event to registered handlers
  private dispatchEvent(sessionId: string, eventType: string, data: any): void {
    const session = this.activeSessions.get(sessionId)
    if (!session) return

    const handler = session.responseHandlers.get(eventType)
    if (handler) {
      try {
        handler(data)
      } catch (e) {
        console.error(`Error in ${eventType} handler for session ${sessionId}:`, e)
      }
    }

    // Also dispatch to "any" handlers
    const anyHandler = session.responseHandlers.get('any')
    if (anyHandler) {
      try {
        anyHandler({ type: eventType, data })
      } catch (e) {
        console.error(`Error in 'any' handler for session ${sessionId}:`, e)
      }
    }
  }

  public async closeSession(sessionId: string): Promise<void> {
    if (this.sessionCleanupInProgress.has(sessionId)) {
      console.log(`Cleanup already in progress for session ${sessionId}, skipping`)
      return
    }
    this.sessionCleanupInProgress.add(sessionId)
    try {
      console.log(`Starting close process for session ${sessionId}`)
      await this.sendContentEnd(sessionId)
      await this.sendPromptEnd(sessionId)
      await this.sendSessionEnd(sessionId)
      console.log(`Session ${sessionId} cleanup complete`)
    } catch (error) {
      console.error(`Error during closing sequence for session ${sessionId}:`, error)

      // Ensure cleanup happens even if there's an error
      const session = this.activeSessions.get(sessionId)
      if (session) {
        session.isActive = false
        this.activeSessions.delete(sessionId)
        this.sessionLastActivity.delete(sessionId)
      }
    } finally {
      // Always clean up the tracking set
      this.sessionCleanupInProgress.delete(sessionId)
    }
  }

  // Same for forceCloseSession:
  public forceCloseSession(sessionId: string): void {
    if (this.sessionCleanupInProgress.has(sessionId) || !this.activeSessions.has(sessionId)) {
      console.log(`Session ${sessionId} already being cleaned up or not active`)
      return
    }

    this.sessionCleanupInProgress.add(sessionId)
    try {
      const session = this.activeSessions.get(sessionId)
      if (!session) return

      console.log(`Force closing session ${sessionId}`)

      // Immediately mark as inactive and clean up resources
      session.isActive = false
      session.closeSignal.next()
      session.closeSignal.complete()
      this.activeSessions.delete(sessionId)
      this.sessionLastActivity.delete(sessionId)

      console.log(`Session ${sessionId} force closed`)
    } finally {
      this.sessionCleanupInProgress.delete(sessionId)
    }
  }
}
