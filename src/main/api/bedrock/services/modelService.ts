import { getDefaultPromptRouter, getModelsForRegion } from '../../../../common/models/models'
import { getAccountId } from '../utils/awsUtils'
import type { ServiceContext, AWSCredentials } from '../types'
import { BedrockSupportRegion } from '../../../../types/llm'

export class ModelService {
  constructor(private context: ServiceContext) {}

  async listModels() {
    const awsCredentials = this.context.store.get('aws') as AWSCredentials
    const { region, accessKeyId, useProfile } = awsCredentials

    // AWS認証情報のバリデーション
    if (!region || (!useProfile && !accessKeyId)) {
      console.warn('AWS credentials not configured properly')
      return []
    }

    try {
      const models = getModelsForRegion(region as BedrockSupportRegion)
      const accountId = await getAccountId(awsCredentials)
      const promptRouterModels = accountId ? getDefaultPromptRouter(accountId, region) : []
      const result = [...models, ...promptRouterModels]

      return result
    } catch (error) {
      console.error('Error in listModels:', error)
      return []
    }
  }
}
