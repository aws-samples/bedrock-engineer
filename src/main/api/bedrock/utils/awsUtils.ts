import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import type { AWSCredentials } from '../types'
import { baseModels, usModels, euModels, apacModels } from '../models'
import type { LLM } from '../../../../types/llm'

/**
 * 指定されたモデルIDに対応するモデル情報を取得する
 */
function findModelById(modelId: string): LLM | undefined {
  // すべてのモデルリストを結合して検索
  const allModels = [...baseModels, ...usModels, ...euModels, ...apacModels]
  return allModels.find((model) => model.modelId === modelId)
}

/**
 * ThrottlingException 発生時に別のリージョンを選択する
 * 現在のリージョンとは異なるリージョンをランダムに返す
 *
 * @param currentRegion 現在のリージョン
 * @param modelId モデルID
 * @returns 選択されたリージョン（現在のリージョンとは異なる）
 */
export function getAlternateRegionOnThrottling(
  currentRegion: string,
  modelId: string,
  configuredRegions: string[] = []
): string {
  // モデル情報を取得
  const model = findModelById(modelId)
  if (!model || !model.regions) {
    return currentRegion
  }

  // 設定された利用可能なリージョンとモデルの利用可能なリージョンの共通部分を取得
  let availableRegions =
    configuredRegions.length > 0
      ? model.regions.filter((region) => configuredRegions.includes(region))
      : model.regions

  // 現在のリージョンを除外
  availableRegions = availableRegions.filter((region) => region !== currentRegion)

  // 利用可能なリージョンがない場合は現在のリージョンを返す
  if (availableRegions.length === 0) {
    return currentRegion
  }

  // ランダムに別のリージョンを選択
  const randomIndex = Math.floor(Math.random() * availableRegions.length)
  return availableRegions[randomIndex]
}

export async function getAccountId(awsCredentials: AWSCredentials) {
  try {
    const sts = new STSClient({
      credentials: {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey,
        sessionToken: awsCredentials?.sessionToken
      },
      region: awsCredentials.region
    })
    const command = new GetCallerIdentityCommand({})
    const res = await sts.send(command)
    return res.Account
  } catch (error) {
    console.error('Error getting AWS account ID:', error)
    return null
  }
}
