/**
 * AWS設定ユーティリティ
 */
import { loadConfig } from './config'

/**
 * AWS認証情報プロバイダを作成
 */
export function createCredentialsProvider() {
  const config = loadConfig()

  // モックの認証情報を返す（CLI専用の簡易実装）
  return {
    accessKeyId: 'MOCK_ACCESS_KEY_FOR_CLI',
    secretAccessKey: 'MOCK_SECRET_KEY_FOR_CLI'
  }
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