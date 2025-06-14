import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BedrockAgent } from './agent'
import { ToolName } from './tools'

// コマンド設定の型定義
export interface CommandConfig {
  pattern: string
  description: string
}

// ウィンドウ設定の型定義
export interface WindowConfig {
  id: string // ウィンドウの一意識別子
  name: string // ウィンドウタイトル
  enabled: boolean // 許可/非許可
}

// カメラ設定の型定義
export interface CameraConfig {
  id: string // カメラデバイスID
  name: string // カメラ名
  enabled: boolean // 許可/非許可
}

export type AgentChatConfig = {
  ignoreFiles?: string[]
  contextLength?: number
  enablePromptCache?: boolean
}

export type SendMsgKey = 'Enter' | 'Cmd+Enter'

export type ToolState = {
  enabled: boolean
} & Tool

export type Scenario = {
  title: string
  content: string
}

export type Agent = {
  id: string
  name: string
  description: string
  system: string
  scenarios: Scenario[]
  icon?: AgentIcon
  iconColor?: string
  tags?: string[]
  author?: string
}

export type AgentIcon =
  | 'robot'
  | 'brain'
  | 'chat'
  | 'bulb'
  | 'books'
  | 'pencil'
  | 'messages'
  | 'puzzle'
  | 'world'
  | 'happy'
  | 'kid'
  | 'moon'
  | 'sun'
  | 'calendar-stats'
  | 'code'
  | 'terminal'
  | 'terminal2'
  | 'keyboard'
  | 'bug'
  | 'test'
  | 'api'
  | 'database'
  | 'architecture'
  | 'design'
  | 'diagram'
  | 'settings'
  | 'tool'
  | 'aws'
  | 'cloud'
  | 'server'
  | 'network'
  | 'laptop'
  | 'microchip'
  | 'docker'
  | 'kubernetes'
  | 'terraform'
  | 'git'
  | 'github'
  | 'kanban'
  | 'security'
  | 'lock'
  | 'shield'
  | 'bank'
  | 'search'
  | 'chart'
  | 'grafana'
  | 'prometheus'
  // Lifestyle & Home
  | 'home'
  | 'house-door'
  | 'sofa'
  | 'laundry'
  | 'wash-machine'
  | 'tv'
  | 'plant'
  | 'calendar-event'
  | 'calendar-check'
  | 'calendar-time'
  | 'clock'
  | 'alarm'
  | 'family'
  | 'parent'
  | 'baby'
  | 'baby-carriage'
  | 'child'
  | 'dog'
  | 'cat'
  | 'pets'
  | 'clothes'
  // Health & Medical
  | 'heartbeat'
  | 'activity'
  | 'stethoscope'
  | 'pill'
  | 'vaccine'
  | 'medical-cross'
  | 'first-aid'
  | 'first-aid-box'
  | 'hospital'
  | 'hospital-fill'
  | 'wheelchair'
  | 'weight'
  | 'run'
  | 'running'
  | 'yoga'
  | 'fitness'
  | 'swimming'
  | 'clipboard-pulse'
  | 'mental-health'
  // Education & Learning
  | 'school'
  | 'ballpen'
  | 'book'
  | 'bookshelf'
  | 'journal'
  | 'math'
  | 'abacus'
  | 'calculator'
  | 'language'
  | 'palette'
  | 'music'
  | 'open-book'
  | 'teacher'
  | 'graduate'
  // Travel & Hobbies
  | 'plane'
  | 'map'
  | 'compass'
  | 'camping'
  | 'mountain'
  | 'hiking'
  | 'car'
  | 'bicycle'
  | 'bike'
  | 'train'
  | 'bus'
  | 'walk'
  | 'camera'
  | 'movie'
  | 'gamepad'
  | 'tv-old'
  | 'guitar'
  | 'tennis'
  // Food & Cooking
  | 'cooker'
  | 'microwave'
  | 'kitchen'
  | 'chef'
  | 'cooking-pot'
  | 'grill'
  | 'fast-food'
  | 'restaurant'
  | 'menu'
  | 'salad'
  | 'meat'
  | 'bread'
  | 'coffee'
  | 'egg'
  | 'noodles'
  | 'cupcake'
  // Shopping & Finance
  | 'credit-card'
  | 'receipt'
  | 'coin'
  | 'cash'
  | 'currency-yen'
  | 'wallet'
  | 'money'
  | 'shopping-cart'
  | 'shopping-bag'
  | 'shopping-bag-solid'
  | 'shopping-basket'
  | 'gift'
  | 'truck'
  | 'store'
  | 'shop'
  | 'web'

export type AgentCategory =
  | 'general'
  | 'coding'
  | 'design'
  | 'data'
  | 'business'
  | 'custom'
  | 'all'
  | 'diagram'
  | 'website'

export type CustomAgent = Agent & {
  isCustom?: boolean
  isShared?: boolean
  directoryOnly?: boolean // ディレクトリからのみ取得されたエージェント（テンプレート）
  tools?: ToolName[] // エージェント固有のツール名リスト
  category?: AgentCategory // エージェントのカテゴリ
  allowedCommands?: CommandConfig[] // エージェント固有の許可コマンド
  allowedWindows?: WindowConfig[] // エージェント固有の許可ウィンドウ
  allowedCameras?: CameraConfig[] // エージェント固有の許可カメラ
  bedrockAgents?: BedrockAgent[] // エージェント固有のBedrock Agents
  knowledgeBases?: KnowledgeBase[] // エージェント固有のKnowledge Base
  flows?: FlowConfig[] // エージェント固有のFlow設定
  mcpServers?: McpServerConfig[] // エージェント固有のMCPサーバー設定
  mcpTools?: ToolState[] // エージェント固有のMCPツール設定
  additionalInstruction?: string // エージェント生成時の追加指示
  environmentContextSettings?: EnvironmentContextSettings // エージェント固有の環境コンテキスト設定
}

export type AgentSettings = {
  customAgents: CustomAgent[]
}

export type KnowledgeBase = {
  knowledgeBaseId: string
  description: string
}

// 入力タイプの定義を追加
export type InputType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export type FlowConfig = {
  flowIdentifier: string
  flowAliasIdentifier: string
  description: string
  inputType?: InputType // 新規: 入力の型
  schema?: object // 新規: JSON Schema 定義 (objectとarrayの場合に使用)
}

// MCPサーバー設定の型定義
export interface McpServerConfig {
  name: string
  description: string
  command: string
  args: string[]
  env?: Record<string, string>
}

// 環境コンテキスト設定の型定義
export interface EnvironmentContextSettings {
  todoListInstruction: boolean // TODO_LIST_INSTRUCTION を含めるかどうか
  projectRule: boolean // PROJECT_RULE を含めるかどうか
  visualExpressionRules: boolean // VISUAL_EXPRESSION_RULES を含めるかどうか
}
