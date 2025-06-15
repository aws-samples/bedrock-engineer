/**
 * AWS関連ヘルパーユーティリティ
 */
import { fromIni, fromEnv, fromTemporaryCredentials } from '@aws-sdk/credential-providers'
import { loadConfig } from './config'
import { AwsCredentialIdentityProvider } from '@smithy/types'

/**
 * AWS認証情報プロバイダを作成
 */
export function createCredentialsProvider(): AwsCredentialIdentityProvider {
  const config = loadConfig()

  // プロファイルが指定されている場合はIni Credentialsを使用
  if (config.aws.profile) {
    return fromIni({
      profile: config.aws.profile
    })
  }

  // 環境変数にAWS認証情報がある場合はそれを使用
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return fromEnv()
  }

  // 設定ファイルに認証情報がある場合はそれを使用
  if (config.aws.credentials?.accessKeyId && config.aws.credentials?.secretAccessKey) {
    return async () => {
      return {
        accessKeyId: config.aws.credentials.accessKeyId,
        secretAccessKey: config.aws.credentials.secretAccessKey
      }
    }
  }

  // どれも設定されていない場合はデフォルトのプロバイダを使用
  return fromIni()
}

/**
 * AWS設定を取得
 */
export function getAwsConfig() {
  const config = loadConfig()
  return {
    region: config.aws.region || 'us-west-2',
    credentials: createCredentialsProvider()
  }
}