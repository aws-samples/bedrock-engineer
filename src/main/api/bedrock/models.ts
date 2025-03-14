import { BedrockSupportRegion, LLM } from '../../../types/llm'

// Base models without cross-region inference
export const baseModels: LLM[] = [
  {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    modelName: 'Claude 3 Sonnet',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: [
      'us-east-1',
      'us-east-2',
      'us-west-2',
      'eu-central-1',
      'eu-west-1',
      'eu-west-3',
      // 'ap-northeast-1',  // クロスリージョン推論のみ対応
      // 'ap-northeast-2', // クロスリージョン推論のみ対応
      'ap-south-1',
      // 'ap-southeast-1', // クロスリージョン推論のみ対応
      'ap-southeast-2'
    ]
  },
  {
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    modelName: 'Claude 3 Haiku',
    toolUse: true,
    maxTokensLimit: 4096,
    regions: [
      'us-east-1',
      // 'us-east-2',
      'us-west-2',
      'eu-central-1',
      'eu-west-1',
      'eu-west-3',
      'ap-northeast-1',
      // 'ap-northeast-2', // クロスリージョン推論のみ対応
      'ap-south-1',
      'ap-southeast-1',
      'ap-southeast-2'
    ]
  },
  {
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    modelName: 'Claude 3.5 Haiku',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: [
      // 'us-east-1',
      // 'us-east-2',
      'us-west-2'
    ]
  },
  {
    modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    modelName: 'Claude 3.5 Sonnet',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: [
      'us-east-1',
      // 'us-east-2',
      'us-west-2',
      'eu-central-1',
      'eu-west-1',
      // 'eu-west-3',
      'ap-northeast-1',
      // 'ap-northeast-2', // クロスリージョン推論のみ対応
      'ap-south-1'
      // 'ap-southeast-1',
      // 'ap-southeast-2'
    ]
  },
  {
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    modelName: 'Claude 3.5 Sonnet v2',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: ['us-west-2']
  }
]
const usRegions = ['us-east-1', 'us-east-2', 'us-west-2'] as BedrockSupportRegion[]

// US cross-region inference models
export const usModels: LLM[] = [
  {
    modelId: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
    modelName: 'Claude 3 Sonnet (US cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: ['us-east-1', 'us-west-2']
  },
  {
    modelId: 'us.anthropic.claude-3-haiku-20240307-v1:0',
    modelName: 'Claude 3 Haiku (US cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: usRegions
  },
  {
    modelId: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    modelName: 'Claude 3.5 Haiku (US cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: usRegions
  },
  {
    modelId: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
    modelName: 'Claude 3.5 Sonnet (US cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: usRegions
  },
  {
    modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    modelName: 'Claude 3.5 Sonnet v2 (US cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: usRegions
  },
  {
    modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    modelName: 'Claude 3.7 Sonnet (US cross-region)',
    toolUse: true,
    maxTokensLimit: 64000,
    regions: usRegions
  },
  {
    modelId: 'us.amazon.nova-pro-v1:0',
    modelName: 'Amazon Nova Pro (US cross-region)',
    toolUse: true,
    maxTokensLimit: 5120,
    regions: usRegions
  },
  {
    modelId: 'us.amazon.nova-lite-v1:0',
    modelName: 'Amazon Nova Lite (US cross-region)',
    toolUse: true,
    maxTokensLimit: 5120,
    regions: usRegions
  },
  {
    modelId: 'us.amazon.nova-micro-v1:0',
    modelName: 'Amazon Nova Micro (US cross-region)',
    toolUse: true,
    maxTokensLimit: 5120,
    regions: usRegions
  },
  // DeepSeek
  {
    modelId: 'us.deepseek.r1-v1:0',
    modelName: 'DeepSeek R1 (US cross-region)',
    toolUse: false,
    maxTokensLimit: 32768,
    regions: usRegions
  }
]

const euRegions = ['eu-central-1', 'eu-west-1', 'eu-west-3'] as BedrockSupportRegion[]

// EU cross-region inference models
export const euModels: LLM[] = [
  {
    modelId: 'eu.anthropic.claude-3-sonnet-20240229-v1:0',
    modelName: 'Claude 3 Sonnet (EU cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: euRegions
  },
  {
    modelId: 'eu.anthropic.claude-3-5-sonnet-20240620-v1:0',
    modelName: 'Claude 3.5 Sonnet (EU cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: euRegions
  },
  {
    modelId: 'eu.anthropic.claude-3-haiku-20240307-v1:0',
    modelName: 'Claude 3 Haiku (EU cross-region)',
    toolUse: true,
    maxTokensLimit: 4096,
    regions: euRegions
  }
]

const apacRegions = [
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2'
] as BedrockSupportRegion[]

// APAC cross-region inference models
export const apacModels: LLM[] = [
  {
    modelId: 'apac.anthropic.claude-3-5-sonnet-20241022-v2:0',
    modelName: 'Claude 3.5 Sonnet v2 (APAC cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: apacRegions
  },
  {
    modelId: 'apac.anthropic.claude-3-sonnet-20240229-v1:0',
    modelName: 'Claude 3 Sonnet (APAC cross-region)',
    toolUse: true,
    maxTokensLimit: 8192,
    regions: ['ap-northeast-1']
  },
  {
    modelId: 'apac.anthropic.claude-3-haiku-20240307-v1:0',
    modelName: 'Claude 3 Haiku (APAC cross-region)',
    toolUse: true,
    maxTokensLimit: 4096,
    regions: ['ap-northeast-1']
  }
]

// Combine all models based on region
export const getModelsForRegion = (region: BedrockSupportRegion): LLM[] => {
  const models = baseModels.filter((model) => model.regions?.includes(region))

  // Add US models for US regions
  if (usRegions.includes(region)) {
    models.push(...usModels.filter((model) => model.regions?.includes(region)))
  }

  // Add EU models for EU regions
  if (euRegions.includes(region)) {
    models.push(...euModels.filter((model) => model.regions?.includes(region)))
  }

  // Add APAC models for APAC regions
  if (apacRegions.includes(region)) {
    models.push(...apacModels.filter((model) => model.regions?.includes(region)))
  }

  // sort by model name

  return models.sort((a, b) => a.modelName.localeCompare(b.modelName))
}

// Prompt Router support
export const getDefaultPromptRouter = (accountId: string, region: string) => {
  if (region === 'us-east-1' || region === 'us-west-2') {
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

  return []
}
