import { z } from 'zod'

/**
 * Zod schemas for CustomAgent and related types
 * Used for runtime validation with warning-only mode
 */

// CommandConfig schema
export const CommandConfigSchema = z.object({
  pattern: z.string(),
  description: z.string()
})

// WindowConfig schema
export const WindowConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean()
})

// CameraConfig schema
export const CameraConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean()
})

// Scenario schema
export const ScenarioSchema = z.object({
  title: z.string(),
  content: z.string()
})

// AgentIcon schema - Union of all possible icon types
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
  'star',
  'heart',
  'smile',
  'sad',
  'angry',
  'question',
  'info',
  'warning',
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
  'python',
  'java',
  'rust',
  'go',
  'php',
  'swift',
  'react',
  'vue',
  'angular',
  'nodejs',
  'npm',
  'webpack',
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
  'azure',
  'google-cloud',
  'digitalocean',
  'lambda',
  'bucket',
  'container',
  'database-cloud',
  'cloud-computing',
  'jenkins',
  'gitlab',
  'circleci',
  'ansible',
  'pipeline',
  'automation',
  'security',
  'lock',
  'shield',
  'bank',
  'search',
  'chart',
  'grafana',
  'prometheus',
  'firewall',
  'key',
  'certificate',
  'fingerprint',
  'scan',
  'dashboard',
  'alert',
  'report',
  'analytics',
  'logs',
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
  'light-bulb',
  'fan',
  'thermostat',
  'speaker',
  'vacuum',
  'doorbell',
  'lock-smart',
  'garden',
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
  'nutrition',
  'sleep',
  'meditation',
  'dental',
  'eye',
  'therapy',
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
  'science',
  'chemistry',
  'physics',
  'biology',
  'online-learning',
  'certificate-education',
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
  'hotel',
  'luggage',
  'passport',
  'ticket',
  'beach',
  'mountain-view',
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
  'tea',
  'juice',
  'pizza',
  'sushi',
  'ice-cream',
  'wine',
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
  'web',
  'barcode',
  'qr-code',
  'package',
  'tag',
  'discount',
  'online-payment'
])

// AgentCategory schema
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

// KnowledgeBase schema
export const KnowledgeBaseSchema = z.object({
  knowledgeBaseId: z.string(),
  description: z.string()
})

// InputType schema
export const InputTypeSchema = z.enum(['string', 'number', 'boolean', 'object', 'array'])

// FlowConfig schema
export const FlowConfigSchema = z.object({
  flowIdentifier: z.string(),
  flowAliasIdentifier: z.string(),
  description: z.string(),
  inputType: InputTypeSchema.optional(),
  schema: z.any().optional() // Use any for compatibility with existing object type
})

// McpServerConfig schema
export const McpServerConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  connectionType: z.enum(['command', 'url']).optional(),
  // Command format fields
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  // URL format fields
  url: z.string().optional(),
  headers: z.record(z.string()).optional()
})

// TavilySearchConfig schema
export const TavilySearchConfigSchema = z.object({
  includeDomains: z.array(z.string()),
  excludeDomains: z.array(z.string())
})

// AgentCoreGatewayConfig schema
export const AgentCoreGatewayConfigSchema = z.object({
  endpoint: z.string(),
  region: z.string().optional(),
  profile: z.string().optional(),
  description: z.string().optional()
})

// EnvironmentContextSettings schema
export const EnvironmentContextSettingsSchema = z
  .object({
    projectRule: z.boolean(),
    visualExpressionRules: z.boolean()
  })
  .strict()

// ToolName schema - based on available tools
export const ToolNameSchema = z.string()

// Base Agent schema
export const BaseAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  system: z.string(),
  scenarios: z.array(ScenarioSchema),
  icon: AgentIconSchema.optional(),
  iconColor: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional()
})

// CustomAgent schema - extends BaseAgent
export const CustomAgentSchema = BaseAgentSchema.extend({
  isCustom: z.boolean().optional(),
  isShared: z.boolean().optional(),
  directoryOnly: z.boolean().optional(),
  organizationId: z.string().optional(),
  tools: z.array(ToolNameSchema).optional(),
  category: AgentCategorySchema.optional(),
  allowedCommands: z.array(CommandConfigSchema).optional(),
  allowedWindows: z.array(WindowConfigSchema).optional(),
  allowedCameras: z.array(CameraConfigSchema).optional(),
  bedrockAgents: z.array(z.any()).optional(), // BedrockAgent type is complex, use any for type compatibility
  knowledgeBases: z.array(KnowledgeBaseSchema).optional(),
  flows: z.array(FlowConfigSchema).optional(),
  mcpServers: z.array(McpServerConfigSchema).optional(),
  mcpTools: z.array(z.any()).optional(), // ToolState is complex, use any for type compatibility
  tavilySearchConfig: TavilySearchConfigSchema.optional(),
  agentCoreGateways: z.array(AgentCoreGatewayConfigSchema).optional(),
  agentCoreGatewayTools: z.array(z.any()).optional(), // ToolState is complex, use any for type compatibility
  additionalInstruction: z.string().optional(),
  environmentContextSettings: EnvironmentContextSettingsSchema.optional()
})

// Export type inference helpers (with original naming for backward compatibility)
export type CustomAgentSchemaType = z.infer<typeof CustomAgentSchema>
export type EnvironmentContextSettingsSchemaType = z.infer<typeof EnvironmentContextSettingsSchema>
export type KnowledgeBaseSchemaType = z.infer<typeof KnowledgeBaseSchema>
export type FlowConfigSchemaType = z.infer<typeof FlowConfigSchema>
export type McpServerConfigSchemaType = z.infer<typeof McpServerConfigSchema>
export type TavilySearchConfigSchemaType = z.infer<typeof TavilySearchConfigSchema>
export type AgentCoreGatewayConfigSchemaType = z.infer<typeof AgentCoreGatewayConfigSchema>
export type CommandConfigSchemaType = z.infer<typeof CommandConfigSchema>
export type WindowConfigSchemaType = z.infer<typeof WindowConfigSchema>
export type CameraConfigSchemaType = z.infer<typeof CameraConfigSchema>
export type ScenarioSchemaType = z.infer<typeof ScenarioSchema>
export type AgentIconSchemaType = z.infer<typeof AgentIconSchema>
export type AgentCategorySchemaType = z.infer<typeof AgentCategorySchema>
export type InputTypeSchemaType = z.infer<typeof InputTypeSchema>
export type BaseAgentSchemaType = z.infer<typeof BaseAgentSchema>
