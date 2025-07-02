import {
  ListInferenceProfilesCommand,
  GetInferenceProfileCommand,
  ListInferenceProfilesCommandOutput,
  GetInferenceProfileCommandOutput
} from '@aws-sdk/client-bedrock'
import { createBedrockClient } from '../client'
import type { ApplicationInferenceProfile } from '../../../../types/llm'
import type { ServiceContext } from '../types'
import { createCategoryLogger } from '../../../../common/logger'

// Create category logger for inference profile service
const inferenceProfileLogger = createCategoryLogger('bedrock:inferenceProfile')

/**
 * Bedrock Inference Profile APIと連携するサービスクラス
 * アプリケーション推論プロファイルの取得と管理を担当
 */
export class InferenceProfileService {
  constructor(private context: ServiceContext) {}

  /**
   * 利用可能なアプリケーション推論プロファイルの一覧を取得
   */
  async listApplicationInferenceProfiles(): Promise<ApplicationInferenceProfile[]> {
    try {
      const awsConfig = this.context.store.get('aws')
      const bedrockClient = createBedrockClient(awsConfig)

      inferenceProfileLogger.debug('Fetching inference profiles list', {
        region: awsConfig.region
      })

      const command = new ListInferenceProfilesCommand({
        typeEquals: 'APPLICATION' // 自作のプロファイルのみ取得する
      })
      const response: ListInferenceProfilesCommandOutput = await bedrockClient.send(command)

      const profiles: ApplicationInferenceProfile[] = (response.inferenceProfileSummaries || [])
        .map((profile) => ({
          inferenceProfileArn: profile.inferenceProfileArn || '',
          inferenceProfileName: profile.inferenceProfileName || '',
          description: profile.description,
          status: profile.status || '',
          createdAt: profile.createdAt || new Date(),
          updatedAt: profile.updatedAt || new Date(),
          modelSource: {
            copyFrom: (profile.models && profile.models[0]?.modelArn) || ''
          },
          type: profile.type || ''
        }))
        .filter((profile) => profile.inferenceProfileArn) // ARNが存在するもののみ

      inferenceProfileLogger.debug('Successfully fetched inference profiles', {
        count: profiles.length,
        profiles: profiles.map((p) => ({
          name: p.inferenceProfileName,
          arn: p.inferenceProfileArn
        }))
      })

      return profiles
    } catch (error: any) {
      inferenceProfileLogger.error('Failed to fetch inference profiles list', {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })

      // エラーが発生した場合は空の配列を返す（UIの動作を継続させるため）
      return []
    }
  }

  /**
   * 特定のアプリケーション推論プロファイルの詳細情報を取得
   */
  async getApplicationInferenceProfile(
    inferenceProfileArn: string
  ): Promise<ApplicationInferenceProfile | null> {
    try {
      const awsConfig = this.context.store.get('aws')
      const bedrockClient = createBedrockClient(awsConfig)

      inferenceProfileLogger.debug('Fetching inference profile details', {
        inferenceProfileArn,
        region: awsConfig.region
      })

      const command = new GetInferenceProfileCommand({
        inferenceProfileIdentifier: inferenceProfileArn
      })
      const response: GetInferenceProfileCommandOutput = await bedrockClient.send(command)

      if (!response.inferenceProfileArn) {
        inferenceProfileLogger.warn('Inference profile not found', { inferenceProfileArn })
        return null
      }

      const profile: ApplicationInferenceProfile = {
        inferenceProfileArn: response.inferenceProfileArn,
        inferenceProfileName: response.inferenceProfileName || '',
        description: response.description,
        status: response.status || '',
        createdAt: response.createdAt || new Date(),
        updatedAt: response.updatedAt || new Date(),
        modelSource: {
          copyFrom: (response.models && response.models[0]?.modelArn) || ''
        },
        type: response.type || ''
      }

      inferenceProfileLogger.debug('Successfully fetched inference profile details', {
        name: profile.inferenceProfileName,
        arn: profile.inferenceProfileArn,
        status: profile.status
      })

      return profile
    } catch (error: any) {
      inferenceProfileLogger.error('Failed to fetch inference profile details', {
        inferenceProfileArn,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })

      return null
    }
  }

  /**
   * アプリケーション推論プロファイルをLLMインターフェースに変換
   */
  convertProfileToLLM(profile: ApplicationInferenceProfile): any {
    // 基盤となるモデル名を推測（ARNから）
    const baseModelId = this.extractModelIdFromArn(profile.modelSource.copyFrom)
    const modelName = profile.inferenceProfileName || `Inference Profile: ${baseModelId}`

    return {
      modelId: profile.inferenceProfileArn,
      modelName: modelName,
      toolUse: true, // 推論プロファイルは通常ツールユースをサポート
      regions: ['us-east-1', 'us-west-2'], // デフォルトリージョン（実際の対応リージョンは別途取得）
      isInferenceProfile: true,
      inferenceProfileArn: profile.inferenceProfileArn,
      maxTokensLimit: 4096, // デフォルト値
      supportsThinking: false, // デフォルトはfalse
      description: profile.description // InferenceProfileのdescriptionを追加
    }
  }

  /**
   * ARNからモデルIDを抽出するヘルパーメソッド
   */
  private extractModelIdFromArn(modelArn: string): string {
    if (!modelArn) return 'unknown'

    // ARN形式: arn:aws:bedrock:region:account-id:foundation-model/model-id
    const parts = modelArn.split('/')
    return parts[parts.length - 1] || 'unknown'
  }
}
