import Store from 'electron-store'
import { LLM, InferenceParameters, ThinkingMode, ThinkingModeBudget } from '../types/llm'
import { AgentChatConfig, KnowledgeBase, SendMsgKey, ToolState } from '../types/agent-chat'
import { CustomAgent } from '../types/agent-chat'
import { BedrockAgent } from '../types/agent'
import { AWSCredentials } from '../main/api/bedrock/types'

const DEFAULT_SHELL = '/bin/bash'
const DEFAULT_INFERENCE_PARAMS: InferenceParameters = {
  maxTokens: 4096,
  temperature: 0.5,
  topP: 0.9
}
const DEFAULT_THINKING_MODE = {
  type: 'enabled',
  budget_tokens: ThinkingModeBudget.NORMAL
}

const DEFAULT_BEDROCK_SETTINGS = {
  enableRegionFailover: false,
  availableFailoverRegions: []
}

const DEFAULT_GUARDRAIL_SETTINGS = {
  enabled: false,
  guardrailIdentifier: '',
  guardrailVersion: 'DRAFT',
  trace: 'enabled'
}

type StoreScheme = {
  /** Electronアプリケーションのユーザーデータ保存先パス */
  userDataPath?: string

  /** 現在選択されているプロジェクト（作業ディレクトリ）のパス */
  projectPath?: string

  /** 現在選択されている言語モデル (LLM) の設定 */
  llm?: LLM

  /** 言語モデルの推論パラメータ（温度、最大トークン数など） */
  inferenceParams: InferenceParameters

  /** 思考モードの設定（Claude 3.7 Sonnet用） */
  thinkingMode?: ThinkingMode

  /** 画像認識ツールの設定 */
  recognizeImageTool?: {
    /** 使用するモデルID */
    modelId: string
  }

  /** アプリケーションの表示言語設定（日本語または英語） */
  language: 'ja' | 'en'

  /** エージェントチャットの設定（無視するファイル一覧、コンテキスト長など） */
  agentChatConfig: AgentChatConfig

  /** 使用可能なツールの状態と設定（有効/無効、設定情報） */
  tools: ToolState[]

  /** ウェブサイトジェネレーター機能の設定 */
  websiteGenerator?: {
    /** 使用する知識ベース一覧 */
    knowledgeBases?: KnowledgeBase[]
    /** 知識ベース機能を有効にするかどうか */
    enableKnowledgeBase?: boolean
    /** 検索機能を有効にするかどうか */
    enableSearch?: boolean
  }

  /** Tavily検索APIの設定 */
  tavilySearch: {
    /** Tavily検索APIのAPIキー */
    apikey: string
  }

  /** Backend の APIエンドポイントのURL */
  apiEndpoint: string

  /** 高度な設定オプション */
  advancedSetting: {
    /** キーボードショートカット設定 */
    keybinding: {
      /** メッセージ送信キーの設定（EnterまたはCmd+Enter） */
      sendMsgKey: SendMsgKey
    }
  }

  /** AWS認証情報とリージョン設定 */
  aws: AWSCredentials

  /** ユーザーが作成したカスタムエージェントの一覧 */
  customAgents: CustomAgent[]

  /** 現在選択されているエージェントのID */
  selectedAgentId: string

  /** 使用可能な知識ベース一覧 */
  knowledgeBases: KnowledgeBase[]

  /** コマンド実行の設定（シェル設定） */
  shell: string

  /** 通知機能の有効/無効設定 */
  notification?: boolean

  /** Amazon Bedrock特有の設定 */
  bedrockSettings?: {
    /** リージョンフェイルオーバー機能の有効/無効 */
    enableRegionFailover: boolean
    /** フェイルオーバー時に使用可能なリージョン一覧 */
    availableFailoverRegions: string[]
  }

  /** ガードレール設定 */
  guardrailSettings?: {
    /** ガードレールを有効にするかどうか */
    enabled: boolean
    /** ガードレールID */
    guardrailIdentifier: string
    /** ガードレールバージョン */
    guardrailVersion: string
    /** ガードレールのトレース設定 */
    trace: 'enabled' | 'disabled'
  }

  /** 使用可能なAmazon Bedrockエージェントの一覧 */
  bedrockAgents?: BedrockAgent[]

  /** YAML形式から読み込まれた共有エージェントの一覧 */
  sharedAgents?: CustomAgent[]
}

const electronStore = new Store<StoreScheme>()
console.log('store path', electronStore.path)

const init = () => {
  // Initialize userDataPath if not present
  const userDataPath = electronStore.get('userDataPath')
  if (!userDataPath) {
    // This will be set from main process
    electronStore.set('userDataPath', '')
  }

  const pjPath = electronStore.get('projectPath')
  if (!pjPath) {
    const defaultProjectPath = process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']
    electronStore.set('projectPath', defaultProjectPath)
  }

  const keybinding = electronStore.get('advancedSetting')?.keybinding
  if (!keybinding) {
    electronStore.set('advancedSetting', {
      keybinding: {
        sendMsgKey: 'Enter'
      }
    })
  }

  const language = electronStore.get('language')
  if (language === undefined) {
    electronStore.set('language', 'en')
  }

  // Initialize AWS settings if not present
  const awsConfig = electronStore.get('aws')
  if (!awsConfig) {
    electronStore.set('aws', {
      region: 'us-west-2',
      accessKeyId: '',
      secretAccessKey: ''
    })
  }

  // Initialize inference parameters if not present
  const inferenceParams = electronStore.get('inferenceParams')
  if (!inferenceParams) {
    electronStore.set('inferenceParams', DEFAULT_INFERENCE_PARAMS)
  }

  // thinkingMode の初期化
  const thinkingMode = electronStore.get('thinkingMode')
  if (!thinkingMode) {
    electronStore.set('thinkingMode', DEFAULT_THINKING_MODE)
  }

  // Initialize custom agents if not present
  const customAgents = electronStore.get('customAgents')
  if (!customAgents) {
    electronStore.set('customAgents', [])
  }

  // Initialize selected agent id if not present
  const selectedAgentId = electronStore.get('selectedAgentId')
  if (!selectedAgentId) {
    electronStore.set('selectedAgentId', 'softwareAgent')
  }

  // Initialize knowledge bases
  const knowledgeBases = electronStore.get('knowledgeBases')
  if (!knowledgeBases) {
    electronStore.set('knowledgeBases', [])
  }

  // Initialize command settings if not present
  const shell = electronStore.get('shell')
  if (!shell) {
    electronStore.set('shell', DEFAULT_SHELL)
  }

  // Initialize bedrockSettings
  const bedrockSettings = electronStore.get('bedrockSettings')
  if (!bedrockSettings) {
    electronStore.set('bedrockSettings', DEFAULT_BEDROCK_SETTINGS)
  }

  // Initialize guardrailSettings
  const guardrailSettings = electronStore.get('guardrailSettings')
  if (!guardrailSettings) {
    electronStore.set('guardrailSettings', DEFAULT_GUARDRAIL_SETTINGS)
  }
}

init()

type Key = keyof StoreScheme
export const store = {
  get<T extends Key>(key: T) {
    return electronStore.get(key)
  },
  set<T extends Key>(key: T, value: StoreScheme[T]) {
    return electronStore.set(key, value)
  }
}

export type ConfigStore = typeof store
