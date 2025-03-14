import { getDefaultPromptRouter, getModelsForRegion } from '../models'
import { getAccountId } from '../utils/awsUtils'
import type { ServiceContext } from '../types'
import { BedrockSupportRegion } from '../../../../types/llm'

export class ModelService {
  private static readonly CACHE_LIFETIME = 1000 * 60 * 5 // 5 min
  private modelCache: { [key: string]: any } = {}

  constructor(private context: ServiceContext) {}

  async listModels() {
    const { accessKeyId, secretAccessKey, sessionToken, region } = this.context.store.get('aws')

    if (!accessKeyId || !secretAccessKey || !region) {
      console.warn('AWS credentials not configured')
      return []
    }

    const cacheKey = `${region}-${accessKeyId}`
    const cachedData = this.modelCache[cacheKey]

    if (
      cachedData &&
      cachedData._timestamp &&
      Date.now() - cachedData._timestamp < ModelService.CACHE_LIFETIME
    ) {
      return cachedData.filter((model) => !model._timestamp)
    }

    try {
      const models = getModelsForRegion(region as BedrockSupportRegion)

      const accountId = await getAccountId({
        accessKeyId,
        secretAccessKey,
        sessionToken,
        region
      })
      const promptRouterModels = accountId ? getDefaultPromptRouter(accountId, region) : []
      const result = [...models, ...promptRouterModels]
      this.modelCache[cacheKey] = [...result, { _timestamp: Date.now() } as any]

      return result
    } catch (error) {
      console.error('Error in listModels:', error)
      return []
    }
  }
}
