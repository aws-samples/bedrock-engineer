import { ConversationRole, ContentBlock, Message, ToolUseBlockStart, ImageFormat } from '@aws-sdk/client-bedrock-runtime'
import { CustomAgent, ToolState } from '../../types/agent-chat'
import { LLM } from '../../types/llm'
import { ChatMessage, ChatResponse, ChatDelta, ToolUse, ToolResult } from '../types/commands'
import { CLIConfig } from '../types/config'
import { logger } from '../utils/logger'
import { streamChatCompletion, StreamChatCompletionProps } from '../../renderer/lib/api'
import { ToolMetadataCollector } from '../../preload/tools/registry'
import { generateMessageId } from '../../types/chat/metadata'
import { limitContextLength } from '../../renderer/lib/contextLength'
import { calculateCost } from '../../renderer/lib/pricing/modelPricing'

export interface HeadlessAgentChatOptions {
  agent: CustomAgent
  modelId: string
  config: CLIConfig
  sessionId?: string
  enableHistory?: boolean
  onMessage?: (message: string) => void
  onToolUse?: (toolName: string, input: any) => void
  onToolResult?: (toolName: string, result: any) => void
  onError?: (error: Error) => void
}

export class HeadlessAgentChat {
  private agent: CustomAgent
  private modelId: string
  private config: CLIConfig
  private sessionId?: string
  private enableHistory: boolean
  private messages: Message[] = []
  private enabledTools: ToolState[] = []
  private abortController: AbortController | null = null
  private toolRegistry: any = null
  private onMessage?: (message: string) => void
  private onToolUse?: (toolName: string, input: any) => void
  private onToolResult?: (toolName: string, result: any) => void
  private onError?: (error: Error) => void

  constructor(options: HeadlessAgentChatOptions) {
    this.agent = options.agent
    this.modelId = options.modelId
    this.config = options.config
    this.sessionId = options.sessionId
    this.enableHistory = options.enableHistory ?? true
    this.onMessage = options.onMessage
    this.onToolUse = options.onToolUse
    this.onToolResult = options.onToolResult
    this.onError = options.onError
    
    this.initializeTools()
  }

  private initializeTools(): void {
    // Get available tools from the tool registry
    const allToolSpecs = ToolMetadataCollector.getToolSpecs()
    
    // Filter tools based on agent configuration
    const agentTools = this.agent.tools || []
    
    this.enabledTools = allToolSpecs
      .filter(toolSpec => {
        const toolName = toolSpec.toolSpec?.name
        if (!toolName) return false
        
        // If agent has specific tools configured, only include those
        if (agentTools.length > 0) {
          return agentTools.includes(toolName as any)
        }
        
        // Otherwise include all tools by default
        return true
      })
      .map(toolSpec => ({
        enabled: true,
        ...toolSpec
      }))

    logger.debug(`Initialized ${this.enabledTools.length} tools for agent ${this.agent.name}`)
  }

  async sendMessage(userInput: string): Promise<ChatResponse> {
    if (!userInput.trim()) {
      throw new Error('Message cannot be empty')
    }

    if (!this.modelId) {
      throw new Error('Model ID is required')
    }

    const userMessage: Message = {
      role: 'user',
      content: [{ text: userInput }]
    }

    this.messages.push(userMessage)

    try {
      const response = await this.processMessage()
      return response
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error)
      }
      throw error
    }
  }

  async *streamMessage(userInput: string): AsyncGenerator<ChatDelta, void, unknown> {
    if (!userInput.trim()) {
      throw new Error('Message cannot be empty')
    }

    if (!this.modelId) {
      throw new Error('Model ID is required')
    }

    const userMessage: Message = {
      role: 'user',
      content: [{ text: userInput }]
    }

    this.messages.push(userMessage)

    try {
      yield* this.streamProcessMessage()
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error)
      }
      throw error
    }
  }

  private async processMessage(): Promise<ChatResponse> {
    const contextLength = this.config.cache?.contextLength || 200000
    const limitedMessages = limitContextLength(this.messages, contextLength)

    const props: StreamChatCompletionProps = {
      messages: limitedMessages,
      modelId: this.modelId,
      system: this.agent.system ? [{ text: this.agent.system }] : undefined,
      toolConfig: this.enabledTools.length ? { tools: this.enabledTools } : undefined,
      inferenceConfig: this.config.model?.inferenceParams ? {
        maxTokens: this.config.model.inferenceParams.maxTokens,
        temperature: this.config.model.inferenceParams.temperature,
        topP: this.config.model.inferenceParams.topP
      } : undefined
    }

    this.abortController = new AbortController()
    const generator = streamChatCompletion(props, this.abortController.signal)

    let responseText = ''
    let toolUses: ToolUse[] = []
    let toolResults: ToolResult[] = []
    let metadata: any = undefined

    try {
      for await (const json of generator) {
        if (json.messageStart) {
          // Message started
        } else if (json.messageStop) {
          // Message completed
          const assistantMessage: Message = {
            role: 'assistant',
            content: [{ text: responseText }]
          }
          this.messages.push(assistantMessage)
        } else if (json.contentBlockStart) {
          // Tool use started
          const toolUse = json.contentBlockStart.start?.toolUse
          if (toolUse) {
            if (this.onToolUse) {
              this.onToolUse(toolUse.name || '', {})
            }
          }
        } else if (json.contentBlockStop) {
          // Content block completed
        } else if (json.contentBlockDelta) {
          const text = json.contentBlockDelta.delta?.text
          if (text) {
            responseText += text
            if (this.onMessage) {
              this.onMessage(text)
            }
          }

          const toolUse = json.contentBlockDelta.delta?.toolUse
          if (toolUse) {
            // Handle tool use delta
          }
        } else if (json.metadata) {
          metadata = json.metadata
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request was aborted')
      }
      throw error
    } finally {
      this.abortController = null
    }

    // Process any tool uses
    if (this.messages.length > 0) {
      const lastMessage = this.messages[this.messages.length - 1]
      if (lastMessage.content) {
        const toolUseBlocks = lastMessage.content.filter(block => 'toolUse' in block)
        if (toolUseBlocks.length > 0) {
          const toolResultsProcessed = await this.executeTools(toolUseBlocks as any)
          toolResults = toolResultsProcessed
          
          // Add tool results to messages and continue conversation
          const toolResultMessage: Message = {
            role: 'user',
            content: toolResultsProcessed.map(result => ({
              toolResult: {
                toolUseId: result.id,
                content: typeof result.content === 'string' 
                  ? [{ text: result.content }] 
                  : [{ json: result.content }],
                status: result.status
              }
            }))
          }
          
          this.messages.push(toolResultMessage)
          
          // Continue conversation after tool execution
          const followUpResponse = await this.processMessage()
          responseText += followUpResponse.message
          toolUses = [...toolUses, ...(followUpResponse.toolUses || [])]
          toolResults = [...toolResults, ...(followUpResponse.toolResults || [])]
        }
      }
    }

    return {
      message: responseText,
      toolUses,
      toolResults,
      metadata: metadata ? {
        modelId: this.modelId,
        inputTokens: metadata.usage?.inputTokens,
        outputTokens: metadata.usage?.outputTokens,
        cost: this.calculateCost(metadata)
      } : undefined
    }
  }

  private async *streamProcessMessage(): AsyncGenerator<ChatDelta, void, unknown> {
    const contextLength = this.config.cache?.contextLength || 200000
    const limitedMessages = limitContextLength(this.messages, contextLength)

    const props: StreamChatCompletionProps = {
      messages: limitedMessages,
      modelId: this.modelId,
      system: this.agent.system ? [{ text: this.agent.system }] : undefined,
      toolConfig: this.enabledTools.length ? { tools: this.enabledTools } : undefined,
      inferenceConfig: this.config.model?.inferenceParams ? {
        maxTokens: this.config.model.inferenceParams.maxTokens,
        temperature: this.config.model.inferenceParams.temperature,
        topP: this.config.model.inferenceParams.topP
      } : undefined
    }

    this.abortController = new AbortController()
    const generator = streamChatCompletion(props, this.abortController.signal)

    let responseText = ''
    let currentToolUse: ToolUseBlockStart | undefined

    try {
      for await (const json of generator) {
        if (json.messageStart) {
          // Message started
        } else if (json.messageStop) {
          // Message completed
          const assistantMessage: Message = {
            role: 'assistant',
            content: [{ text: responseText }]
          }
          this.messages.push(assistantMessage)
        } else if (json.contentBlockStart) {
          // Tool use started
          currentToolUse = json.contentBlockStart.start?.toolUse
          if (currentToolUse) {
            yield {
              type: 'tool_use',
              content: {
                id: currentToolUse.toolUseId || '',
                name: currentToolUse.name || '',
                input: {}
              }
            }
          }
        } else if (json.contentBlockStop) {
          // Content block completed
          currentToolUse = undefined
        } else if (json.contentBlockDelta) {
          const text = json.contentBlockDelta.delta?.text
          if (text) {
            responseText += text
            yield {
              type: 'text',
              content: text
            }
          }

          const toolUse = json.contentBlockDelta.delta?.toolUse
          if (toolUse && currentToolUse) {
            // Handle tool use delta - could yield incremental tool input
          }
        } else if (json.metadata) {
          yield {
            type: 'metadata',
            content: {
              modelId: this.modelId,
              inputTokens: json.metadata.usage?.inputTokens,
              outputTokens: json.metadata.usage?.outputTokens,
              cost: this.calculateCost(json.metadata)
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request was aborted')
      }
      throw error
    } finally {
      this.abortController = null
    }
  }

  private async executeTools(toolUseBlocks: ContentBlock[]): Promise<ToolResult[]> {
    const results: ToolResult[] = []

    for (const block of toolUseBlocks) {
      if ('toolUse' in block && block.toolUse) {
        const toolUse = block.toolUse
        const toolName = toolUse.name || ''
        const toolInput = toolUse.input

        if (this.onToolUse) {
          this.onToolUse(toolName, toolInput)
        }

        try {
          // Execute tool using the existing tool system
          const toolResult = await this.executeTool(toolName, toolInput)
          
          const result: ToolResult = {
            id: toolUse.toolUseId || '',
            content: toolResult,
            status: 'success'
          }
          
          results.push(result)
          
          if (this.onToolResult) {
            this.onToolResult(toolName, toolResult)
          }
        } catch (error) {
          const result: ToolResult = {
            id: toolUse.toolUseId || '',
            content: error instanceof Error ? error.message : String(error),
            status: 'error'
          }
          
          results.push(result)
          
          if (this.onToolResult) {
            this.onToolResult(toolName, error)
          }
        }
      }
    }

    return results
  }

  private async executeTool(toolName: string, input: any): Promise<any> {
    // Use HeadlessToolRegistry for actual tool execution
    if (!this.toolRegistry) {
      // Initialize tool registry if not already done
      this.toolRegistry = new (require('./HeadlessToolRegistry').HeadlessToolRegistry)({
        projectPath: this.config.project?.path,
        config: this.config,
        tavilyApiKey: this.config.tools?.tavilyApiKey,
        awsConfig: this.config.aws ? {
          region: this.config.aws.region || 'us-east-1',
          accessKeyId: this.config.aws.accessKeyId,
          secretAccessKey: this.config.aws.secretAccessKey,
          sessionToken: this.config.aws.sessionToken,
          profile: this.config.aws.profile
        } : undefined
      })
    }
    
    logger.debug(`Executing tool: ${toolName}`, input)
    
    try {
      const result = await this.toolRegistry.executeTool({ type: toolName, ...input })
      return result
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, error)
      throw error
    }
  }

  private calculateCost(metadata: any): number | undefined {
    if (!metadata?.usage) return undefined
    
    try {
      return calculateCost(
        this.modelId,
        metadata.usage.inputTokens || 0,
        metadata.usage.outputTokens || 0,
        metadata.usage.cacheReadInputTokens,
        metadata.usage.cacheWriteInputTokens
      )
    } catch (error) {
      logger.debug('Failed to calculate cost:', error)
      return undefined
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  getMessages(): Message[] {
    return [...this.messages]
  }

  clearMessages(): void {
    this.messages = []
  }

  setSystemPrompt(systemPrompt: string): void {
    this.agent.system = systemPrompt
  }

  getSystemPrompt(): string {
    return this.agent.system
  }

  setTools(tools: string[]): void {
    this.agent.tools = tools as any
    this.initializeTools()
  }

  getTools(): string[] {
    return this.agent.tools || []
  }
}