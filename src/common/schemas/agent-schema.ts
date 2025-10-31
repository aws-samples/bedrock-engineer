import { z } from 'zod'

/**
 * Zod schemas for CustomAgent validation
 * These schemas can be used for both runtime validation and type inference
 */

// AgentIconのスキーマ
export const AgentIconSchema = z.enum([
  'robot',
  'brain',
  'chat',
  'bulb',
  'books',
  'pencil',
  'messages',
  'puzzle',
  'world',
  'happy',
  'kid',
  'moon',
  'sun',
  'calendar-stats',
  'code',
  'terminal',
  'terminal2',
  'keyboard',
  'bug',
  'test',
  'api',
  'database',
  'architecture',
  'design',
  'diagram',
  'settings',
  'tool',
  'aws',
  'cloud',
  'server',
  'network',
  'laptop',
  'microchip',
  'docker',
  'kubernetes',
  'terraform',
  'git',
  'github',
  'kanban',
  'security',
  'lock',
  'shield',
  'bank',
  'search',
  'chart',
  'grafana',
  'prometheus',
  'home',
  'house-door',
  'sofa',
  'laundry',
  'wash-machine',
  'tv',
  'plant',
  'calendar-event',
  'calendar-check',
  'calendar-time',
  'clock',
  'alarm',
  'family',
  'parent',
  'baby',
  'baby-carriage',
  'child',
  'dog',
  'cat',
  'pets',
  'clothes',
  'heartbeat',
  'activity',
  'stethoscope',
  'pill',
  'vaccine',
  'medical-cross',
  'first-aid',
  'first-aid-box',
  'hospital',
  'hospital-fill',
  'wheelchair',
  'weight',
  'run',
  'running',
  'yoga',
  'fitness',
  'swimming',
  'clipboard-pulse',
  'mental-health',
  'school',
  'ballpen',
  'book',
  'bookshelf',
  'journal',
  'math',
  'abacus',
  'calculator',
  'language',
  'palette',
  'music',
  'open-book',
  'teacher',
  'graduate',
  'plane',
  'map',
  'compass',
  'camping',
  'mountain',
  'hiking',
  'car',
  'bicycle',
  'bike',
  'train',
  'bus',
  'walk',
  'camera',
  'movie',
  'gamepad',
  'tv-old',
  'guitar',
  'tennis',
  'cooker',
  'microwave',
  'kitchen',
  'chef',
  'cooking-pot',
  'grill',
  'fast-food',
  'restaurant',
  'menu',
  'salad',
  'meat',
  'bread',
  'coffee',
  'egg',
  'noodles',
  'cupcake',
  'credit-card',
  'receipt',
  'coin',
  'cash',
  'currency-yen',
  'wallet',
  'money',
  'shopping-cart',
  'shopping-bag',
  'shopping-bag-solid',
  'shopping-basket',
  'gift',
  'truck',
  'store',
  'shop',
  'web'
])

// AgentCategoryのスキーマ
export const AgentCategorySchema = z.enum([
  'general',
  'coding',
  'design',
  'data',
  'business',
  'custom',
  'all',
  'diagram',
  'website'
])

// BuiltInToolNameのスキーマ
export const BuiltInToolNameSchema = z.enum([
  'createFolder',
  'readFiles',
  'writeToFile',
  'listFiles',
  'moveFile',
  'copyFile',
  'tavilySearch',
  'fetchWebsite',
  'generateImage',
  'generateVideo',
  'checkVideoStatus',
  'downloadVideo',
  'retrieve',
  'invokeBedrockAgent',
  'executeCommand',
  'applyDiffEdit',
  'think',
  'recognizeImage',
  'invokeFlow',
  'codeInterpreter',
  'mcp',
  'screenCapture',
  'cameraCapture',
  'todo',
  'todoInit',
  'todoUpdate'
])

// ToolNameスキーマ（BuiltInToolNameまたは任意の文字列 for MCP tools）
export const ToolNameSchema = z.union([BuiltInToolNameSchema, z.string()])

// Scenarioスキーマ
export const ScenarioSchema = z.object({
  title: z.string(),
  content: z.string()
})

// BedrockAgentスキーマ
export const BedrockAgentSchema = z.object({
  agentId: z.string(),
  aliasId: z.string(),
  description: z.string()
})

// KnowledgeBaseスキーマ
export const KnowledgeBaseSchema = z.object({
  knowledgeBaseId: z.string(),
  description: z.string()
})

// InputTypeスキーマ
export const InputTypeSchema = z.enum(['string', 'number', 'boolean', 'object', 'array'])

// FlowConfigスキーマ
export const FlowConfigSchema = z.object({
  flowIdentifier: z.string(),
  flowAliasIdentifier: z.string(),
  description: z.string(),
  inputType: InputTypeSchema.optional(),
  schema: z.record(z.any()).optional()
})

// McpServerConfigスキーマ
export const McpServerConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  connectionType: z.enum(['command', 'url']).optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  url: z.string().optional(),
  headers: z.record(z.string()).optional()
})

// CommandConfigスキーマ
export const CommandConfigSchema = z.object({
  pattern: z.string(),
  description: z.string()
})

// WindowConfigスキーマ
export const WindowConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean()
})

// CameraConfigスキーマ
export const CameraConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean()
})

// TavilySearchConfigスキーマ
export const TavilySearchConfigSchema = z.object({
  includeDomains: z.array(z.string()),
  excludeDomains: z.array(z.string())
})

// EnvironmentContextSettingsスキーマ
export const EnvironmentContextSettingsSchema = z.object({
  todoListInstruction: z.boolean(),
  projectRule: z.boolean(),
  visualExpressionRules: z.boolean()
})

// CustomAgentスキーマ
export const CustomAgentSchema = z.object({
  // 必須フィールド
  id: z.string(),
  name: z.string(),
  description: z.string(),
  system: z.string(),
  scenarios: z.array(ScenarioSchema),
  tags: z.array(z.string()),
  isCustom: z.boolean(),
  icon: AgentIconSchema.optional(),
  iconColor: z.string().optional(),
  tools: z.array(ToolNameSchema).optional(),
  category: AgentCategorySchema.optional(),

  // オプショナルフィールド
  author: z.string().optional(),
  isShared: z.boolean().optional(),
  directoryOnly: z.boolean().optional(),
  organizationId: z.string().optional(),
  allowedCommands: z.array(CommandConfigSchema).optional(),
  allowedWindows: z.array(WindowConfigSchema).optional(),
  allowedCameras: z.array(CameraConfigSchema).optional(),
  bedrockAgents: z.array(BedrockAgentSchema).optional(),
  knowledgeBases: z.array(KnowledgeBaseSchema).optional(),
  flows: z.array(FlowConfigSchema).optional(),
  mcpServers: z.array(McpServerConfigSchema).optional(),
  mcpTools: z.array(z.any()).optional(), // ToolStateの詳細定義は省略
  tavilySearchConfig: TavilySearchConfigSchema.optional(),
  additionalInstruction: z.string().optional(),
  environmentContextSettings: EnvironmentContextSettingsSchema.optional()
})

// 型推論用のエクスポート
export type AgentIconType = z.infer<typeof AgentIconSchema>
export type AgentCategoryType = z.infer<typeof AgentCategorySchema>
export type BuiltInToolNameType = z.infer<typeof BuiltInToolNameSchema>
export type ToolNameType = z.infer<typeof ToolNameSchema>
export type ScenarioType = z.infer<typeof ScenarioSchema>
export type BedrockAgentType = z.infer<typeof BedrockAgentSchema>
export type KnowledgeBaseType = z.infer<typeof KnowledgeBaseSchema>
export type InputTypeType = z.infer<typeof InputTypeSchema>
export type FlowConfigType = z.infer<typeof FlowConfigSchema>
export type McpServerConfigType = z.infer<typeof McpServerConfigSchema>
export type CommandConfigType = z.infer<typeof CommandConfigSchema>
export type WindowConfigType = z.infer<typeof WindowConfigSchema>
export type CameraConfigType = z.infer<typeof CameraConfigSchema>
export type TavilySearchConfigType = z.infer<typeof TavilySearchConfigSchema>
export type EnvironmentContextSettingsType = z.infer<typeof EnvironmentContextSettingsSchema>
export type CustomAgentType = z.infer<typeof CustomAgentSchema>
