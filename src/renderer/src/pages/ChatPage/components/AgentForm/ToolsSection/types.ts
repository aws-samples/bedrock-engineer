import {
  AgentCategory,
  ToolState,
  KnowledgeBase,
  CommandConfig,
  McpServerConfig
} from '@/types/agent-chat'
import { BedrockAgent } from '@/types/agent'

/**
 * ツールをカテゴリ分けするための定義
 */
export interface ToolCategory {
  id: string
  name: string
  description: string
  tools: string[]
  hasMcpServers?: boolean // MCPサーバーが設定されているかどうかを示すフラグ
}

/**
 * ToolsSectionコンポーネントのプロパティ
 */
export interface ToolsSectionProps {
  agentId?: string
  tools: ToolState[]
  onChange: (tools: ToolState[]) => void
  agentCategory?: AgentCategory
  onCategoryChange?: (category: AgentCategory) => void
  knowledgeBases?: KnowledgeBase[]
  onKnowledgeBasesChange?: (knowledgeBases: KnowledgeBase[]) => void
  allowedCommands?: CommandConfig[]
  onAllowedCommandsChange?: (commands: CommandConfig[]) => void
  bedrockAgents?: BedrockAgent[]
  onBedrockAgentsChange?: (agents: BedrockAgent[]) => void
  mcpServers?: McpServerConfig[]
  tempMcpTools?: ToolState[] // 一時的なMCPツール（タブ切替時に取得したもの）
}

/**
 * ツール詳細情報モーダルコンポーネントのプロパティ
 */
export interface ToolInfoModalProps {
  toolName: string | null
  toolDescription: string
  onClose: () => void
  mcpServerInfo?: string
  isMcp?: boolean
}

/**
 * カテゴリごとに分類されたツールデータを拡張したカテゴリ
 */
export interface CategorizedToolData extends ToolCategory {
  toolsData: ToolState[]
  mcpServersInfo?: McpServerConfig[]
}

/**
 * AvailableToolsTabコンポーネントのプロパティ
 */
export interface AvailableToolsTabProps {
  categorizedTools: CategorizedToolData[]
  selectedCategory: string
  mcpServers?: McpServerConfig[]
  onCategoryChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  onToggleTool: (toolName: string) => void
  onShowToolInfo: (toolName: string) => void
}

/**
 * ToolCategorySectionコンポーネントのプロパティ
 */
export interface ToolCategorySectionProps {
  category: CategorizedToolData
  mcpServers?: McpServerConfig[]
  onToggleTool: (toolName: string) => void
  onShowToolInfo: (toolName: string) => void
}

/**
 * ToolItemコンポーネントのプロパティ
 */
export interface ToolItemProps {
  tool: ToolState
  isMcp: boolean
  serverInfo?: string
  onToggle: (toolName: string) => void
  onShowInfo?: (toolName: string) => void
}

/**
 * CategorySelectorコンポーネントのプロパティ
 */
export interface CategorySelectorProps {
  selectedCategory: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
}

/**
 * ツール詳細設定タブのプロパティ
 */
export interface ToolDetailsTabProps {
  enabledTools: ToolState[]
  expandedTools: Record<string, boolean>
  toggleToolExpand: (toolName: string) => void
  toolsWithConfigurations: {
    [key: string]: {
      title: string
      isEnabled: boolean
      description: string
    }
  }
  knowledgeBases: KnowledgeBase[]
  onKnowledgeBasesChange: (kbs: KnowledgeBase[]) => void
  allowedCommands: CommandConfig[]
  onAllowedCommandsChange: (commands: CommandConfig[]) => void
  bedrockAgents: BedrockAgent[]
  onBedrockAgentsChange: (agents: BedrockAgent[]) => void
}

/**
 * KnowledgeBasesContent コンポーネントのプロパティ
 */
export interface KnowledgeBasesContentProps {
  knowledgeBases: KnowledgeBase[]
  onChange: (knowledgeBases: KnowledgeBase[]) => void
}

/**
 * CommandsContent コンポーネントのプロパティ
 */
export interface CommandsContentProps {
  commands: CommandConfig[]
  onChange: (commands: CommandConfig[]) => void
}

/**
 * BedrockAgentsContent コンポーネントのプロパティ
 */
export interface BedrockAgentsContentProps {
  agents: BedrockAgent[]
  onChange: (agents: BedrockAgent[]) => void
}
