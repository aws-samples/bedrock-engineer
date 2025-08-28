import type { BedrockSupportRegion, LLM } from '../../types/llm'

/**
 * キャッシュ可能なフィールドの型定義
 */
export type CacheableField = 'messages' | 'system' | 'tools'

/**
 * プロバイダー型定義
 */
export type ModelProvider = 'anthropic' | 'amazon' | 'deepseek' | 'stability' | 'openai'

/**
 * モデルカテゴリ型定義
 */
export type ModelCategory = 'text' | 'image'

/**
 * 統合されたモデル設定インターフェース
 */
export interface ModelConfig {
  baseId: string
  name: string
  provider: ModelProvider
  category: ModelCategory

  // 機能
  toolUse: boolean
  maxTokensLimit: number
  supportsThinking?: boolean
  supportsStreamingToolUse?: boolean // ストリーミングでのTool Useサポート

  // 利用可能リージョン
  availability: {
    base?: BedrockSupportRegion[]
    crossRegion?: BedrockSupportRegion[]
  }

  // 価格設定（1000トークンあたりのドル価格）
  pricing?: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
  }

  // キャッシュ設定
  cache?: {
    supported: boolean
    cacheableFields: CacheableField[]
  }
}

/**
 * 統合されたモデルレジストリ
 */
const MODEL_REGISTRY: ModelConfig[] = [
  // Claude 3 Sonnet
  {
    baseId: 'claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: [],
      crossRegion: [
        'us-east-1',
        'us-west-2',
        'ap-northeast-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'eu-central-1',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3',
        'sa-east-1'
      ]
    }
  },

  // Claude 3 Haiku
  {
    baseId: 'claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 4096,
    availability: {
      base: [
        'us-east-1',
        'us-east-2',
        'us-west-2',
        'ca-central-1',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-south-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'eu-central-1',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3'
      ],
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },

  // Claude 3.5 Haiku
  {
    baseId: 'claude-3-5-haiku-20241022-v1:0',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: ['us-west-2'],
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    },
    pricing: {
      input: 0.0008,
      output: 0.004,
      cacheRead: 0.00008,
      cacheWrite: 0.001
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system', 'tools']
    }
  },

  // Claude 3.5 Sonnet
  {
    baseId: 'claude-3-5-sonnet-20240620-v1:0',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: [
        'us-east-1',
        'us-east-2',
        'us-west-2',
        'ap-northeast-1',
        'ap-south-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'eu-central-1',
        'eu-west-1',
        'eu-west-3'
      ],
      crossRegion: ['us-east-1', 'us-west-2']
    },
    pricing: {
      input: 0.003,
      output: 0.015,
      cacheRead: 0.0003,
      cacheWrite: 0.00375
    }
  },

  // Claude 3.5 Sonnet v2
  {
    baseId: 'claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet v2',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: [],
      crossRegion: [
        'us-east-1',
        'us-east-2',
        'us-west-2',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-northeast-3',
        'ap-south-1',
        'ap-southeast-1',
        'ap-southeast-2'
      ]
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system', 'tools']
    }
  },

  // Claude 3.7 Sonnet
  {
    baseId: 'claude-3-7-sonnet-20250219-v1:0',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 64000,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2', 'ap-northeast-1', 'ap-northeast-3']
    },
    pricing: {
      input: 0.003,
      output: 0.015,
      cacheRead: 0.0003,
      cacheWrite: 0.00375
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system', 'tools']
    }
  },

  // Claude 3 Opus
  {
    baseId: 'claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      crossRegion: ['us-east-1', 'us-west-2']
    }
  },

  // Claude Opus 4
  {
    baseId: 'claude-opus-4-20250514-v1:0',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 32768,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    },
    pricing: {
      input: 0.015,
      output: 0.075,
      cacheRead: 0.0015,
      cacheWrite: 0.01875
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system', 'tools']
    }
  },

  // Claude Opus 4.1
  {
    baseId: 'claude-opus-4-1-20250805-v1:0',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    },
    pricing: {
      input: 0.015,
      output: 0.075,
      cacheRead: 0.0015,
      cacheWrite: 0.01875
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system', 'tools']
    }
  },

  // Claude Sonnet 4
  {
    baseId: 'claude-sonnet-4-20250514-v1:0',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2', 'ap-northeast-1', 'ap-northeast-3']
    },
    pricing: {
      input: 0.003,
      output: 0.015,
      cacheRead: 0.0003,
      cacheWrite: 0.00375
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system', 'tools']
    }
  },

  // Amazon Nova Premier
  {
    baseId: 'nova-premier-v1:0',
    name: 'Amazon Nova Premier',
    provider: 'amazon',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 32000,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },

  // Amazon Nova Pro
  {
    baseId: 'nova-pro-v1:0',
    name: 'Amazon Nova Pro',
    provider: 'amazon',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 5120,
    availability: {
      base: [],
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2', 'ap-northeast-1', 'ap-northeast-2']
    },
    pricing: {
      input: 0.0008,
      output: 0.0032,
      cacheRead: 0.0002,
      cacheWrite: 0
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system']
    }
  },

  // Amazon Nova Lite
  {
    baseId: 'nova-lite-v1:0',
    name: 'Amazon Nova Lite',
    provider: 'amazon',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 5120,
    availability: {
      base: [],
      crossRegion: [
        'us-east-1',
        'us-east-2',
        'us-west-2',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-south-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'eu-central-1',
        'eu-north-1',
        'eu-south-1',
        'eu-south-2',
        'eu-west-3'
      ]
    },
    pricing: {
      input: 0.00006,
      output: 0.00024,
      cacheRead: 0.000015,
      cacheWrite: 0
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system']
    }
  },

  // Amazon Nova Micro
  {
    baseId: 'nova-micro-v1:0',
    name: 'Amazon Nova Micro',
    provider: 'amazon',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 5120,
    availability: {
      base: [],
      crossRegion: [
        'us-east-1',
        'us-east-2',
        'us-west-2',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-south-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'eu-central-1',
        'eu-north-1',
        'eu-south-1',
        'eu-south-2',
        'eu-west-3'
      ]
    },
    pricing: {
      input: 0.000035,
      output: 0.00014,
      cacheRead: 0.00000875,
      cacheWrite: 0
    },
    cache: {
      supported: true,
      cacheableFields: ['messages', 'system']
    }
  },

  // DeepSeek R1
  {
    baseId: 'r1-v1:0',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    category: 'text',
    toolUse: false,
    maxTokensLimit: 32768,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },

  // OpenAI GPT-OSS 120B
  {
    baseId: 'gpt-oss-120b-1:0',
    name: 'GPT-OSS 120B',
    provider: 'openai',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: ['us-west-2']
    }
  },

  // OpenAI GPT-OSS 20B
  {
    baseId: 'gpt-oss-20b-1:0',
    name: 'GPT-OSS 20B',
    provider: 'openai',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: ['us-west-2']
    }
  }

  // Custom model (this is example)
  // {
  //   baseId: 'arn:aws:bedrock:us-east-1:1234567890:imported-model/xxxx',
  //   name: 'DeepSeek-R1-Distill-Llama-8B',
  //   provider: 'deepseek',
  //   category: 'text',
  //   toolUse: true,
  //   maxTokensLimit: 4096,
  //   supportsStreamingToolUse: false,
  //   availability: {
  //     base: ['us-east-1']
  //   }
  // }
]

/**
 * 画像生成モデルレジストリ
 */
const IMAGE_GENERATION_MODELS: ModelConfig[] = [
  // Stability AI models
  {
    baseId: 'stability.sd3-5-large-v1:0',
    name: 'Stability SD3.5 Large',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.sd3-large-v1:0',
    name: 'Stability SD3 Large',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-core-v1:0',
    name: 'Stability Stable Image Core v1.0',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-core-v1:1',
    name: 'Stability Stable Image Core v1.1',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-ultra-v1:0',
    name: 'Stability Stable Image Ultra v1.0',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-ultra-v1:1',
    name: 'Stability Stable Image Ultra v1.1',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  // Amazon models
  {
    baseId: 'amazon.nova-canvas-v1:0',
    name: 'Amazon Nova Canvas',
    provider: 'amazon',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-east-1', 'ap-northeast-1', 'eu-west-1']
    }
  },
  {
    baseId: 'amazon.titan-image-generator-v2:0',
    name: 'Amazon Titan Image Generator v2',
    provider: 'amazon',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-east-1', 'us-west-2']
    }
  },
  {
    baseId: 'amazon.titan-image-generator-v1',
    name: 'Amazon Titan Image Generator v1',
    provider: 'amazon',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'ap-south-1']
    }
  }
]

// ヘルパー関数: リージョンからプレフィックスを取得
function getRegionPrefix(region: string): string {
  if (region.startsWith('us-') || region.startsWith('ca-')) return 'us'
  if (region.startsWith('eu-')) return 'eu'
  if (region.startsWith('ap-') || region.startsWith('sa-')) return 'apac'
  return 'us' // デフォルト
}

// ヘルパー関数: リージョンをプレフィックスでグループ化
function groupRegionsByPrefix(
  regions: BedrockSupportRegion[]
): Record<string, BedrockSupportRegion[]> {
  return regions.reduce(
    (groups, region) => {
      const prefix = getRegionPrefix(region)
      if (!groups[prefix]) groups[prefix] = []
      groups[prefix].push(region)
      return groups
    },
    {} as Record<string, BedrockSupportRegion[]>
  )
}

/**
 * モデルIDがARN形式かどうかを判定する
 */
function isArnModelId(modelId: string): boolean {
  return modelId.startsWith('arn:aws:bedrock:')
}

/**
 * モデルIDからリージョンプレフィックスを削除して基本モデル名を取得する
 * 例: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0' → 'anthropic.claude-3-7-sonnet-20250219-v1:0'
 */
export function getBaseModelId(modelId: string): string {
  // リージョンプレフィックスのパターン: 特定のリージョンコード (例: 'us.', 'eu.', 'apac.')
  const regionPrefixPattern = /^(us|eu|apac)\./
  return modelId.replace(regionPrefixPattern, '')
}

/**
 * モデル設定から完全なモデルIDを生成する
 */
function generateFullModelId(config: ModelConfig, regionPrefix?: string): string {
  // ARN形式のモデルIDの場合はそのまま返す
  if (isArnModelId(config.baseId)) {
    return config.baseId
  }

  // 通常のモデルは従来通りの処理
  if (regionPrefix) {
    return `${regionPrefix}.${config.provider}.${config.baseId}`
  }
  return `${config.provider}.${config.baseId}`
}

/**
 * モデル設定からLLMオブジェクトを生成する
 */
function createLLMFromConfig(
  config: ModelConfig,
  regions: BedrockSupportRegion[],
  isCrossRegion = false,
  regionPrefix?: string
): LLM {
  return {
    modelId: generateFullModelId(config, regionPrefix),
    modelName: isCrossRegion ? `${config.name} (cross-region)` : config.name,
    toolUse: config.toolUse,
    maxTokensLimit: config.maxTokensLimit,
    supportsThinking: config.supportsThinking,
    regions
  }
}

/**
 * モデル設定からすべてのLLMオブジェクトを生成する
 */
function generateModelsFromConfigs(): LLM[] {
  const models: LLM[] = []

  // テキストモデルのみを処理
  const textModels = MODEL_REGISTRY.filter((config) => config.category === 'text')

  textModels.forEach((config) => {
    // ベースモデル
    if (config.availability.base?.length) {
      models.push(createLLMFromConfig(config, config.availability.base))
    }

    // クロスリージョンモデル（リージョンごとに個別に生成）
    if (config.availability.crossRegion?.length) {
      // リージョンをプレフィックスでグループ化
      const regionGroups = groupRegionsByPrefix(config.availability.crossRegion)

      Object.entries(regionGroups).forEach(([prefix, regions]) => {
        models.push(createLLMFromConfig(config, regions, true, prefix))
      })
    }
  })

  return models
}

// 生成されたモデル一覧
export const allModels = generateModelsFromConfigs()

/**
 * リージョン別のモデル取得
 */
export const getModelsForRegion = (region: BedrockSupportRegion): LLM[] => {
  const models = allModels.filter((model) => model.regions?.includes(region))
  return models.sort((a, b) => a.modelName.localeCompare(b.modelName))
}

/**
 * Thinking対応モデルのIDリストを取得する関数
 */
export const getThinkingSupportedModelIds = (): string[] => {
  return allModels.filter((model) => model.supportsThinking === true).map((model) => model.modelId)
}

/**
 * 画像生成モデルのリージョン別取得
 */
export const getImageGenerationModelsForRegion = (region: BedrockSupportRegion) => {
  const models: Array<{ id: string; name: string }> = []

  IMAGE_GENERATION_MODELS.forEach((config) => {
    if (config.availability.base?.includes(region)) {
      models.push({
        id: config.baseId,
        name: config.name
      })
    }
  })

  return models.sort((a, b) => {
    // プロバイダー順: Amazon → Stability
    const providerOrderA = a.id.startsWith('amazon') ? 0 : 1
    const providerOrderB = b.id.startsWith('amazon') ? 0 : 1

    if (providerOrderA !== providerOrderB) {
      return providerOrderA - providerOrderB
    }

    // 同じプロバイダー内では名前順
    return a.name.localeCompare(b.name)
  })
}

/**
 * モデルユーティリティ関数
 */
export const getModelMaxTokens = (modelId: string): number => {
  // 完全一致を最初に試す
  let model = allModels.find((m) => m.modelId === modelId)

  // 完全一致しない場合は部分一致を試す
  if (!model) {
    model = allModels.find((m) => m.modelId.includes(modelId) || modelId.includes(m.modelId))
  }

  return model?.maxTokensLimit || 8192 // デフォルト値
}

/**
 * Prompt Router support
 */
export const getDefaultPromptRouter = (accountId: string, region: string) => {
  return [
    {
      modelId: `arn:aws:bedrock:${region}:${accountId}:default-prompt-router/anthropic.claude:1`,
      modelName: 'Claude Prompt Router',
      maxTokensLimit: 8192,
      toolUse: true
    },
    {
      modelId: `arn:aws:bedrock:${region}:${accountId}:default-prompt-router/meta.llama:1`,
      modelName: 'Meta Prompt Router',
      maxTokensLimit: 8192,
      toolUse: false
    }
  ]
}

// =========================
// 価格設定関連の関数
// =========================

/**
 * モデル設定を取得する関数
 */
export const getModelConfig = (modelId: string): ModelConfig | undefined => {
  const baseModelId = getBaseModelId(modelId)
  return MODEL_REGISTRY.find(
    (c) => baseModelId.includes(c.baseId) || baseModelId.includes(`${c.provider}.${c.baseId}`)
  )
}

/**
 * モデルがストリーミング + Tool Use をサポートしているかを判定する関数
 */
export const supportsStreamingWithToolUse = (modelId: string): boolean => {
  const config = getModelConfig(modelId)
  // supportsStreamingToolUse が明示的に false の場合のみ false を返す
  // 未定義の場合はデフォルトで true（サポート）とみなす
  return config?.supportsStreamingToolUse !== false
}
