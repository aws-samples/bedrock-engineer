import { ToolState, EnvironmentContextSettings } from '@/types/agent-chat'
import { SystemPromptBuilder } from '../../../../../common/agents/toolRuleGenerator'
import { IToolDescriptionProvider } from '../../../../../common/agents/toolDescriptionProvider'

/**
 * Renderer-specific tool description provider for window.api access
 * Now async-compatible to match IToolDescriptionProvider interface
 */
class RendererToolDescriptionProvider implements IToolDescriptionProvider {
  async getToolDescription(toolName: string): Promise<string> {
    // Access preload API through window.api
    if (typeof window !== 'undefined' && window.api?.tools?.getToolUsageDescription) {
      return window.api.tools.getToolUsageDescription(toolName)
    }

    // Fallback if API is not available
    return 'External tool with specific functionality.\nRefer to tool documentation for usage.'
  }
}

const rendererToolDescriptionProvider = new RendererToolDescriptionProvider()

/**
 * 環境コンテキストを生成する関数（非同期版）
 * 共通の generateEnvironmentContext を使用
 */
export const getEnvironmentContext = async (
  enabledTools: ToolState[] = [],
  contextSettings?: EnvironmentContextSettings
): Promise<string> => {
  return await SystemPromptBuilder.generateEnvironmentContext(
    enabledTools,
    rendererToolDescriptionProvider,
    contextSettings
  )
}
