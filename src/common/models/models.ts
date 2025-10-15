import type { BedrockSupportRegion, LLM } from '../../types/llm'

/**
 * Type definition for cacheable fields
 */
export type CacheableField = 'messages' | 'system' | 'tools'

/**
 * Type definition for model providers
 */
export type ModelProvider = 'anthropic' | 'amazon' | 'deepseek' | 'stability' | 'openai'

/**
 * Type definition for model categories
 */
export type ModelCategory = 'text' | 'image'

/**
 * Type definition for inference profiles
 */
export type InferenceProfileType =
  | 'base' // Single region, no prefix
  | 'global' // global. - All commercial regions
  | 'regional-us' // us. - US region
  | 'regional-eu' // eu. - EU region
  | 'regional-apac' // apac. - APAC region
  | 'jp' // jp. - Japan domestic only

/**
 * Inference profile definition
 * Structure representing Amazon Bedrock inference profiles
 */
export interface InferenceProfile {
  /**
   * Type of inference profile
   * - base: Direct execution in a single region (no prefix)
   * - global: Global routing to all commercial AWS regions
   * - regional-us/eu/apac: Cross-region inference within specific geography
   * - jp: Cross-region inference limited to Japan (Tokyo/Osaka)
   */
  type: InferenceProfileType

  /**
   * Prefix added to model ID
   * - 'global': Global inference profile
   * - 'us': US region cross-region inference
   * - 'eu': EU region cross-region inference
   * - 'apac': APAC region cross-region inference
   * - 'jp': Japan domestic inference
   * - undefined: Base model (no prefix)
   */
  prefix?: string

  /**
   * List of AWS regions where this profile can process requests
   * For cross-region inference, load is automatically balanced across these regions
   */
  regions: BedrockSupportRegion[]

  /**
   * Suffix added to display name in UI
   * Examples: "(Global)", "(JP)", "(US)", "(EU)", "(APAC)"
   * undefined for base models
   */
  displaySuffix?: string
}

/**
 * Unified model configuration interface
 */
export interface ModelConfig {
  baseId: string
  name: string
  provider: ModelProvider
  category: ModelCategory

  // Features
  toolUse: boolean
  maxTokensLimit: number
  supportsThinking?: boolean
  supportsStreamingToolUse?: boolean // Support for Tool Use with streaming

  // Inference profiles (new design)
  inferenceProfiles: InferenceProfile[]

  // Pricing (dollar price per 1000 tokens)
  pricing?: {
    input: number
    output: number
    cacheRead: number
    cacheWrite: number
  }

  // Cache configuration
  cache?: {
    supported: boolean
    cacheableFields: CacheableField[]
  }
}

/**
 * Unified model registry
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-west-1', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ]
  },

  // Claude 3 Haiku
  {
    baseId: 'claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 4096,
    inferenceProfiles: [
      {
        type: 'base',
        regions: [
          'us-east-1',
          // 'us-east-2', // On-demand not supported - use US CRIS profile instead
          'us-west-2',
          'ca-central-1',
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2',
          'eu-central-1',
          // 'eu-west-1', // On-demand not supported - use EU CRIS profile instead
          'eu-west-2',
          'eu-west-3'
        ]
      },
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-west-1', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ]
  },

  // Claude 3.5 Haiku
  {
    baseId: 'claude-3-5-haiku-20241022-v1:0',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      },
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      }
    ],
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

  // Claude Haiku 4.5
  {
    baseId: 'claude-haiku-4-5-20251001-v1:0',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 64000,
    supportsThinking: true,
    inferenceProfiles: [
      {
        type: 'global',
        prefix: 'global',
        regions: [
          'us-east-1',
          'us-east-2',
          'us-west-1',
          'us-west-2',
          'eu-central-1',
          'eu-central-2',
          'eu-north-1',
          'eu-south-1',
          'eu-south-2',
          'eu-west-1',
          'eu-west-2',
          'eu-west-3',
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-northeast-3',
          'ap-south-1',
          'ap-south-2',
          'ap-southeast-1',
          'ap-southeast-2',
          'ap-southeast-3',
          'ap-southeast-4',
          'ca-central-1',
          'sa-east-1'
        ],
        displaySuffix: '(Global)'
      },
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: [
          'eu-central-1',
          'eu-central-2',
          'eu-north-1',
          'eu-south-1',
          'eu-south-2',
          'eu-west-1',
          'eu-west-2',
          'eu-west-3'
        ],
        displaySuffix: '(EU)'
      },
      {
        type: 'jp',
        prefix: 'jp',
        regions: ['ap-northeast-1', 'ap-northeast-3'],
        displaySuffix: '(JP)'
      }
    ],
    pricing: {
      input: 0.001,
      output: 0.005,
      cacheRead: 0.0001,
      cacheWrite: 0.00125
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
    inferenceProfiles: [
      {
        type: 'base',
        regions: [
          'us-east-1',
          'us-west-2',
          'ap-northeast-1',
          'ap-southeast-1',
          'eu-central-1',
          'eu-west-3'
        ]
      },
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-west-1', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-northeast-3',
          'ap-south-1',
          'ap-south-2',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-north-1', 'eu-west-1', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-northeast-3',
          'ap-south-1',
          'ap-south-2',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-west-2'],
        displaySuffix: '(US)'
      }
    ]
  },

  // Claude Opus 4
  {
    baseId: 'claude-opus-4-20250514-v1:0',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 32000,
    supportsThinking: true,
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      }
    ],
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
    maxTokensLimit: 32000,
    supportsThinking: true,
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      }
    ],
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
    maxTokensLimit: 64000,
    supportsThinking: true,
    inferenceProfiles: [
      {
        type: 'global',
        prefix: 'global',
        regions: ['us-west-2', 'us-east-1', 'us-east-2', 'eu-west-1', 'ap-northeast-1'],
        displaySuffix: '(Global)'
      },
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-northeast-3',
          'ap-south-1',
          'ap-south-2',
          'ap-southeast-1',
          'ap-southeast-2',
          'ap-southeast-3',
          'ap-southeast-4'
        ],
        displaySuffix: '(APAC)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: [
          'eu-central-1',
          'eu-north-1',
          'eu-south-1',
          'eu-south-2',
          'eu-west-1',
          'eu-west-3'
        ],
        displaySuffix: '(EU)'
      }
    ],
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

  // Claude Sonnet 4.5
  {
    baseId: 'claude-sonnet-4-5-20250929-v1:0',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 64000,
    supportsThinking: true,
    inferenceProfiles: [
      {
        type: 'jp',
        prefix: 'jp',
        regions: ['ap-northeast-1', 'ap-northeast-3'],
        displaySuffix: '(JP)'
      },
      {
        type: 'global',
        prefix: 'global',
        regions: ['us-west-2', 'us-east-1', 'us-east-2', 'eu-west-1', 'ap-northeast-1'],
        displaySuffix: '(Global)'
      },
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: [
          'eu-central-1',
          'eu-central-2',
          'eu-north-1',
          'eu-south-1',
          'eu-south-2',
          'eu-west-1',
          'eu-west-2',
          'eu-west-3'
        ],
        displaySuffix: '(EU)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      }
    ]
  },

  // Amazon Nova Pro
  {
    baseId: 'nova-pro-v1:0',
    name: 'Amazon Nova Pro',
    provider: 'amazon',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 5120,
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-north-1', 'eu-south-1', 'eu-west-1', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-north-1', 'eu-south-1', 'eu-south-2', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      },
      {
        type: 'regional-eu',
        prefix: 'eu',
        regions: ['eu-central-1', 'eu-north-1', 'eu-south-1', 'eu-south-2', 'eu-west-3'],
        displaySuffix: '(EU)'
      },
      {
        type: 'regional-apac',
        prefix: 'apac',
        regions: [
          'ap-northeast-1',
          'ap-northeast-2',
          'ap-south-1',
          'ap-southeast-1',
          'ap-southeast-2'
        ],
        displaySuffix: '(APAC)'
      }
    ],
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
    inferenceProfiles: [
      {
        type: 'regional-us',
        prefix: 'us',
        regions: ['us-east-1', 'us-east-2', 'us-west-2'],
        displaySuffix: '(US)'
      }
    ]
  },

  // OpenAI GPT-OSS 120B
  {
    baseId: 'gpt-oss-120b-1:0',
    name: 'GPT-OSS 120B',
    provider: 'openai',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    supportsThinking: false,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },

  // OpenAI GPT-OSS 20B
  {
    baseId: 'gpt-oss-20b-1:0',
    name: 'GPT-OSS 20B',
    provider: 'openai',
    category: 'text',
    toolUse: true,
    maxTokensLimit: 8192,
    supportsThinking: false,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
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
  //   inferenceProfiles: [
  //     {
  //       type: 'base',
  //       regions: ['us-east-1']
  //     }
  //   ]
  // }
]

/**
 * Image generation model registry
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
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },
  {
    baseId: 'stability.sd3-large-v1:0',
    name: 'Stability SD3 Large',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },
  {
    baseId: 'stability.stable-image-core-v1:0',
    name: 'Stability Stable Image Core v1.0',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },
  {
    baseId: 'stability.stable-image-core-v1:1',
    name: 'Stability Stable Image Core v1.1',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },
  {
    baseId: 'stability.stable-image-ultra-v1:0',
    name: 'Stability Stable Image Ultra v1.0',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },
  {
    baseId: 'stability.stable-image-ultra-v1:1',
    name: 'Stability Stable Image Ultra v1.1',
    provider: 'stability',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-west-2']
      }
    ]
  },
  // Amazon models
  {
    baseId: 'amazon.nova-canvas-v1:0',
    name: 'Amazon Nova Canvas',
    provider: 'amazon',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-east-1', 'ap-northeast-1', 'eu-west-1']
      }
    ]
  },
  {
    baseId: 'amazon.titan-image-generator-v2:0',
    name: 'Amazon Titan Image Generator v2',
    provider: 'amazon',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-east-1', 'us-west-2']
      }
    ]
  },
  {
    baseId: 'amazon.titan-image-generator-v1',
    name: 'Amazon Titan Image Generator v1',
    provider: 'amazon',
    category: 'image',
    toolUse: false,
    maxTokensLimit: 0,
    inferenceProfiles: [
      {
        type: 'base',
        regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'ap-south-1']
      }
    ]
  }
]

/**
 * Check if model ID is in ARN format
 */
function isArnModelId(modelId: string): boolean {
  return modelId.startsWith('arn:aws:bedrock:')
}

/**
 * Remove region prefix from model ID to get base model name
 * Example: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0' → 'anthropic.claude-3-7-sonnet-20250219-v1:0'
 */
export function getBaseModelId(modelId: string): string {
  // Region prefix pattern: specific region codes (e.g., 'us.', 'eu.', 'apac.', 'jp.', 'global.')
  const regionPrefixPattern = /^(us|eu|apac|jp|global)\./
  return modelId.replace(regionPrefixPattern, '')
}

/**
 * Generate full model ID from model configuration
 */
function generateFullModelId(config: ModelConfig, profile: InferenceProfile): string {
  // Return as-is if model ID is in ARN format
  if (isArnModelId(config.baseId)) {
    return config.baseId
  }

  // Add prefix if it exists (for cross-region inference profile)
  if (profile.prefix) {
    return `${profile.prefix}.${config.provider}.${config.baseId}`
  }

  // No prefix for base type
  return `${config.provider}.${config.baseId}`
}

/**
 * Create LLM object from model configuration
 */
function createLLMFromConfig(config: ModelConfig, profile: InferenceProfile): LLM {
  const modelId = generateFullModelId(config, profile)
  const modelName = profile.displaySuffix ? `${config.name} ${profile.displaySuffix}` : config.name

  return {
    modelId,
    modelName,
    toolUse: config.toolUse,
    maxTokensLimit: config.maxTokensLimit,
    supportsThinking: config.supportsThinking,
    regions: profile.regions
  }
}

/**
 * Generate all LLM objects from model configurations
 */
function generateModelsFromConfigs(): LLM[] {
  const models: LLM[] = []

  // Process only text models
  const textModels = MODEL_REGISTRY.filter((config) => config.category === 'text')

  textModels.forEach((config) => {
    config.inferenceProfiles.forEach((profile) => {
      models.push(createLLMFromConfig(config, profile))
    })
  })

  return models
}

// Generated model list
export const allModels = generateModelsFromConfigs()

/**
 * Get models by region
 */
export const getModelsForRegion = (region: BedrockSupportRegion): LLM[] => {
  const models = allModels.filter((model) => model.regions?.includes(region))
  return models.sort((a, b) => a.modelName.localeCompare(b.modelName))
}

/**
 * Get list of model IDs that support Thinking
 */
export const getThinkingSupportedModelIds = (): string[] => {
  return allModels.filter((model) => model.supportsThinking === true).map((model) => model.modelId)
}

/**
 * Get image generation models by region
 */
export const getImageGenerationModelsForRegion = (region: BedrockSupportRegion) => {
  const models: Array<{ id: string; name: string }> = []

  IMAGE_GENERATION_MODELS.forEach((config) => {
    // Find inference profiles that include the specified region
    const hasRegion = config.inferenceProfiles.some((profile) => profile.regions.includes(region))

    if (hasRegion) {
      models.push({
        id: config.baseId,
        name: config.name
      })
    }
  })

  return models.sort((a, b) => {
    // Provider order: Amazon → Stability
    const providerOrderA = a.id.startsWith('amazon') ? 0 : 1
    const providerOrderB = b.id.startsWith('amazon') ? 0 : 1

    if (providerOrderA !== providerOrderB) {
      return providerOrderA - providerOrderB
    }

    // Within same provider, sort by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Model utility functions
 */
export const getModelMaxTokens = (modelId: string): number => {
  // Try exact match first
  let model = allModels.find((m) => m.modelId === modelId)

  // Try partial match if exact match not found
  if (!model) {
    model = allModels.find((m) => m.modelId.includes(modelId) || modelId.includes(m.modelId))
  }

  return model?.maxTokensLimit || 8192 // Default value
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
// Pricing-related functions
// =========================

/**
 * Get model configuration
 */
export const getModelConfig = (modelId: string): ModelConfig | undefined => {
  const baseModelId = getBaseModelId(modelId)
  return MODEL_REGISTRY.find(
    (c) => baseModelId.includes(c.baseId) || baseModelId.includes(`${c.provider}.${c.baseId}`)
  )
}

/**
 * Check if model supports streaming with Tool Use
 */
export const supportsStreamingWithToolUse = (modelId: string): boolean => {
  const config = getModelConfig(modelId)
  // Return false only if supportsStreamingToolUse is explicitly false
  // If undefined, assume true (supported) by default
  return config?.supportsStreamingToolUse !== false
}
