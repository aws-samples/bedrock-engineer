/**
 * CLI設定ユーティリティ
 */
import fs from 'fs'
import path from 'path'
import os from 'os'

// 設定ディレクトリのパス
const CONFIG_DIR = path.join(os.homedir(), '.bedrock-engineer')
const CONFIG_FILE = path.join(CONFIG_DIR, 'cli-config.json')

// デフォルト設定
const DEFAULT_CONFIG = {
  aws: {
    region: 'us-west-2',
    credentials: {
      accessKeyId: '',
      secretAccessKey: ''
    }
  },
  project: {
    path: ''
  }
}

// 設定タイプ定義
export interface CliConfig {
  aws: {
    region: string
    credentials: {
      accessKeyId: string
      secretAccessKey: string
    }
    profile?: string
  }
  project: {
    path: string
  }
}

/**
 * 設定を読み込む
 */
export function loadConfig(): CliConfig {
  // 設定ディレクトリが存在しない場合は作成
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }

  // 設定ファイルが存在しない場合はデフォルト設定を作成
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2))
    return { ...DEFAULT_CONFIG }
  }

  // 設定ファイルを読み込む
  try {
    const configStr = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(configStr) as CliConfig
  } catch (error) {
    console.error('設定ファイルの読み込みに失敗しました:', error)
    return { ...DEFAULT_CONFIG }
  }
}

/**
 * 設定を保存する
 */
export function saveConfig(config: CliConfig): void {
  // 設定ディレクトリが存在しない場合は作成
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }

  // 設定を保存
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('設定ファイルの保存に失敗しました:', error)
  }
}

/**
 * 設定を更新する
 */
export function updateConfig(partialConfig: Partial<CliConfig>): CliConfig {
  const currentConfig = loadConfig()
  const newConfig = {
    ...currentConfig,
    ...partialConfig,
    aws: {
      ...currentConfig.aws,
      ...(partialConfig.aws || {}),
      credentials: {
        ...currentConfig.aws.credentials,
        ...(partialConfig.aws?.credentials || {})
      }
    },
    project: {
      ...currentConfig.project,
      ...(partialConfig.project || {})
    }
  }
  saveConfig(newConfig)
  return newConfig
}

/**
 * AWS設定を更新する
 */
export function updateAwsConfig(
  region?: string,
  accessKeyId?: string,
  secretAccessKey?: string,
  profile?: string
): CliConfig {
  const currentConfig = loadConfig()
  const newConfig = { ...currentConfig }

  if (region) {
    newConfig.aws.region = region
  }

  if (accessKeyId) {
    newConfig.aws.credentials.accessKeyId = accessKeyId
  }

  if (secretAccessKey) {
    newConfig.aws.credentials.secretAccessKey = secretAccessKey
  }

  if (profile) {
    newConfig.aws.profile = profile
  } else if (newConfig.aws.profile) {
    // profileが指定されていない場合、既存のprofileを削除
    delete newConfig.aws.profile
  }

  saveConfig(newConfig)
  return newConfig
}

/**
 * プロジェクトパスを更新する
 */
export function updateProjectPath(projectPath: string): CliConfig {
  return updateConfig({
    project: {
      path: projectPath
    }
  })
}

/**
 * 設定ディレクトリのパスを取得する
 */
export function getConfigDir(): string {
  return CONFIG_DIR
}