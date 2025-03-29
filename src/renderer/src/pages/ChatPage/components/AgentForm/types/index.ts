import { CustomAgent } from '@/types/agent-chat'

/**
 * エージェントフォームのタブID型定義
 */
export type AgentFormTabId = 'basic' | 'mcp-servers' | 'tools'

/**
 * エージェントフォームのプロパティ型定義
 */
export interface AgentFormProps {
  agent?: CustomAgent
  onSave: (agent: CustomAgent) => void
  onCancel: () => void
}
