import type { Message, ContentBlock, ToolConfiguration } from '@aws-sdk/client-bedrock-runtime'
import type { CacheableField, ModelConfig } from './models'
import { getModelConfig } from './models'

/**
 * Class responsible for prompt cache management
 */
export class PromptCacheManager {
  private modelConfig: ModelConfig | undefined
  private modelId: string

  constructor(modelId: string) {
    this.modelId = modelId
    this.modelConfig = getModelConfig(modelId)
  }

  /**
   * Check if the model supports Prompt Cache
   */
  isSupported(): boolean {
    return this.modelConfig?.cache?.supported ?? false
  }

  /**
   * Get cacheable fields supported by the model
   */
  getCacheableFields(): CacheableField[] {
    return this.modelConfig?.cache?.cacheableFields || []
  }

  /**
   * Add cache points to messages
   */
  addCachePointsToMessages(messages: Message[], firstCachePoint?: number): Message[] {
    // If model doesn't support Prompt Cache or messages field is not cacheable, return original messages
    if (!this.isSupported() || !this.getCacheableFields().includes('messages')) {
      return messages
    }

    if (messages.length === 0) return messages

    // Create a copy of messages
    const messagesWithCachePoints = [...messages]

    // Determine indices for cache points
    const secondCachePoint = messages.length - 1

    // Set both cache points (eliminate duplicates)
    const indicesToAddCache = [
      ...new Set([...(firstCachePoint !== undefined ? [firstCachePoint] : []), secondCachePoint])
    ].filter(
      (index) =>
        // For Amazon Nova, placing cachePoint immediately after toolResult causes an error
        this.getCacheableFields().includes('tools') ||
        !messages[index].content?.some((b) => b.toolResult)
    )

    // Add cache points only to selected messages
    const result = messagesWithCachePoints.map((message, index) => {
      if (indicesToAddCache.includes(index) && message.content && Array.isArray(message.content)) {
        // Add cache point (explicitly specify type)
        return {
          ...message,
          content: [
            ...message.content,
            { cachePoint: { type: 'default' } } as ContentBlock.CachePointMember
          ]
        }
      }
      return message
    })

    return result
  }

  /**
   * Add cache point to system prompt
   */
  addCachePointToSystem<T extends ContentBlock[] | { text: string }[]>(system: T): T {
    // If model doesn't support Prompt Cache or system field is not cacheable, return original system prompt
    if (!this.isSupported() || !this.getCacheableFields().includes('system')) {
      return system
    }

    // Add cachePoint to system prompt
    if (system.length > 0) {
      // Add cache point
      const updatedSystem = [
        ...system,
        { cachePoint: { type: 'default' } } as ContentBlock.CachePointMember
      ]
      return updatedSystem as T
    }

    return system
  }

  /**
   * Add cache point to tool configuration
   */
  addCachePointToTools(toolConfig: ToolConfiguration | undefined): ToolConfiguration | undefined {
    // Return undefined if no tool configuration
    if (!toolConfig) {
      return toolConfig
    }

    // If model doesn't support Prompt Cache or tools field is not cacheable, return original tool configuration
    if (!this.isSupported() || !this.getCacheableFields().includes('tools')) {
      return toolConfig
    }

    // Add cachePoint to tool configuration
    if (toolConfig.tools && toolConfig.tools.length > 0) {
      // Add cache point
      const cachePointTool = { cachePoint: { type: 'default' } } as any

      return {
        ...toolConfig,
        tools: [...toolConfig.tools, cachePointTool]
      }
    }

    return toolConfig
  }
}
