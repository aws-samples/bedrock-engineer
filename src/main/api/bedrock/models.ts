import { BedrockSupportRegion, LLM } from '../../../types/llm'

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

// モデル定義の型
interface ModelDefinition {
  baseId: string
  name: string
  toolUse: boolean
  maxTokensLimit: number
  supportsThinking?: boolean
  availability: {
    base?: BedrockSupportRegion[]
    crossRegion?: BedrockSupportRegion[]
  }
}

// 統合されたモデル定義（AWS公式ドキュメント準拠）
const MODEL_DEFINITIONS: ModelDefinition[] = [
  // Claude 3 Sonnet
  {
    baseId: 'claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
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
    toolUse: true,
    maxTokensLimit: 8192,
    availability: {
      base: ['us-west-2'],
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },
  // Claude 3.5 Sonnet
  {
    baseId: 'claude-3-5-sonnet-20240620-v1:0',
    name: 'Claude 3.5 Sonnet',
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
    }
  },
  // Claude 3.5 Sonnet v2
  {
    baseId: 'claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet v2',
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
    }
  },
  // Claude 3.7 Sonnet
  {
    baseId: 'claude-3-7-sonnet-20250219-v1:0',
    name: 'Claude 3.7 Sonnet',
    toolUse: true,
    maxTokensLimit: 64000,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2', 'ap-northeast-1', 'ap-northeast-3']
    }
  },
  // Claude 3 Opus
  {
    baseId: 'claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
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
    toolUse: true,
    maxTokensLimit: 32768,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },
  // Claude Opus 4.1
  {
    baseId: 'claude-opus-4-1-20250805-v1:0',
    name: 'Claude Opus 4.1',
    toolUse: true,
    maxTokensLimit: 8192,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },
  // Claude Sonnet 4
  {
    baseId: 'claude-sonnet-4-20250514-v1:0',
    name: 'Claude Sonnet 4',
    toolUse: true,
    maxTokensLimit: 8192,
    supportsThinking: true,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2', 'ap-northeast-1', 'ap-northeast-3']
    }
  }
]

// Amazon Nova モデル定義
const NOVA_MODELS: ModelDefinition[] = [
  {
    baseId: 'nova-premier-v1:0',
    name: 'Amazon Nova Premier',
    toolUse: true,
    maxTokensLimit: 32000,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  },
  {
    baseId: 'nova-pro-v1:0',
    name: 'Amazon Nova Pro',
    toolUse: true,
    maxTokensLimit: 5120,
    availability: {
      base: [],
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2', 'ap-northeast-1', 'ap-northeast-2']
    }
  },
  {
    baseId: 'nova-lite-v1:0',
    name: 'Amazon Nova Lite',
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
    }
  },
  {
    baseId: 'nova-micro-v1:0',
    name: 'Amazon Nova Micro',
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
    }
  }
]

// その他のモデル定義
const OTHER_MODELS: ModelDefinition[] = [
  {
    baseId: 'r1-v1:0',
    name: 'DeepSeek R1',
    toolUse: false,
    maxTokensLimit: 32768,
    availability: {
      crossRegion: ['us-east-1', 'us-east-2', 'us-west-2']
    }
  }
]

// 画像生成モデル定義
const IMAGE_GENERATION_MODELS: ModelDefinition[] = [
  // Stability AI models
  {
    baseId: 'stability.sd3-5-large-v1:0',
    name: 'Stability SD3.5 Large',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.sd3-large-v1:0',
    name: 'Stability SD3 Large',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-core-v1:0',
    name: 'Stability Stable Image Core v1.0',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-core-v1:1',
    name: 'Stability Stable Image Core v1.1',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-ultra-v1:0',
    name: 'Stability Stable Image Ultra v1.0',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-west-2']
    }
  },
  {
    baseId: 'stability.stable-image-ultra-v1:1',
    name: 'Stability Stable Image Ultra v1.1',
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
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-east-1', 'ap-northeast-1', 'eu-west-1']
    }
  },
  {
    baseId: 'amazon.titan-image-generator-v2:0',
    name: 'Amazon Titan Image Generator v2',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-east-1', 'us-west-2']
    }
  },
  {
    baseId: 'amazon.titan-image-generator-v1',
    name: 'Amazon Titan Image Generator v1',
    toolUse: false,
    maxTokensLimit: 0,
    availability: {
      base: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'ap-south-1']
    }
  }
]

// 全モデル定義を統合
const ALL_MODEL_DEFINITIONS = [
  ...MODEL_DEFINITIONS.map((def) => ({ ...def, provider: 'anthropic' })),
  ...NOVA_MODELS.map((def) => ({ ...def, provider: 'amazon' })),
  ...OTHER_MODELS.map((def) => ({ ...def, provider: 'deepseek' }))
]

// モデル生成関数
function generateModelsFromDefinitions(): LLM[] {
  const models: LLM[] = []

  ALL_MODEL_DEFINITIONS.forEach((def) => {
    // ベースモデル
    if (def.availability.base?.length) {
      const modelId = `${def.provider}.${def.baseId}`
      models.push({
        modelId,
        modelName: def.name,
        toolUse: def.toolUse,
        maxTokensLimit: def.maxTokensLimit,
        supportsThinking: def.supportsThinking,
        regions: def.availability.base
      })
    }

    // クロスリージョンモデル（リージョンごとに個別に生成）
    if (def.availability.crossRegion?.length) {
      // リージョンをプレフィックスでグループ化
      const regionGroups = groupRegionsByPrefix(def.availability.crossRegion)

      Object.entries(regionGroups).forEach(([prefix, regions]) => {
        const modelId = `${prefix}.${def.provider}.${def.baseId}`

        models.push({
          modelId,
          modelName: `${def.name} (cross-region)`,
          toolUse: def.toolUse,
          maxTokensLimit: def.maxTokensLimit,
          supportsThinking: def.supportsThinking,
          regions
        })
      })
    }
  })

  return models
}

// 生成されたモデル一覧
export const allModels = generateModelsFromDefinitions()

// リージョン別のモデル取得
export const getModelsForRegion = (region: BedrockSupportRegion): LLM[] => {
  const models = allModels.filter((model) => model.regions?.includes(region))
  return models.sort((a, b) => a.modelName.localeCompare(b.modelName))
}

// Thinking対応モデルのIDリストを取得する関数
export const getThinkingSupportedModelIds = (): string[] => {
  return allModels.filter((model) => model.supportsThinking === true).map((model) => model.modelId)
}

// 画像生成モデルのリージョン別取得
export const getImageGenerationModelsForRegion = (region: BedrockSupportRegion) => {
  const models: Array<{ id: string; name: string }> = []

  IMAGE_GENERATION_MODELS.forEach((def) => {
    if (def.availability.base?.includes(region)) {
      models.push({
        id: def.baseId,
        name: def.name
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

// モデルユーティリティ関数
export const getModelMaxTokens = (modelId: string): number => {
  // 完全一致を最初に試す
  let model = allModels.find((m) => m.modelId === modelId)

  // 完全一致しない場合は部分一致を試す
  if (!model) {
    model = allModels.find((m) => m.modelId.includes(modelId) || modelId.includes(m.modelId))
  }

  return model?.maxTokensLimit || 8192 // デフォルト値
}

export const getModelByModelId = (modelId: string) => {
  // 完全一致を最初に試す
  let model = allModels.find((m) => m.modelId === modelId)

  // 完全一致しない場合は部分一致を試す
  if (!model) {
    model = allModels.find((m) => m.modelId.includes(modelId) || modelId.includes(m.modelId))
  }

  return model
}

// Prompt Router support
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
