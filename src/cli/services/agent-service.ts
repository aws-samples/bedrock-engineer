/**
 * CLI用のシンプルなエージェントサービス
 */
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import { loadConfig } from '../utils/config'
import * as yaml from 'js-yaml'

// エージェント型
export type Agent = {
  id: string
  name: string
  description: string
  system?: string
  icon?: string
  iconColor?: string
  tags?: string[]
  isCustom?: boolean
  isShared?: boolean
}

// デフォルトエージェント
const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'software-developer',
    name: 'ソフトウェア開発者',
    description: '一般的なソフトウェア開発のサポートを行います',
    system: 'あなたは熟練したソフトウェア開発者です。設計、開発、バグ修正のサポートを行います。',
    icon: 'code',
    iconColor: '#3498db'
  },
  {
    id: 'programming-mentor',
    name: 'プログラミングメンター',
    description: 'プログラミング学習のサポートを行います',
    system: 'あなたはプログラミング教育の専門家です。初心者にわかりやすく説明し、学習をサポートします。',
    icon: 'book',
    iconColor: '#2ecc71'
  },
  {
    id: 'product-designer',
    name: 'プロダクトデザイナー',
    description: '製品やサービスのデザイン支援を行います',
    system: 'あなたは製品デザインの専門家です。UIデザイン、UXデザイン、製品計画のサポートを行います。',
    icon: 'design',
    iconColor: '#e74c3c'
  }
]

/**
 * エージェント一覧を取得
 */
export async function getAgents(): Promise<Agent[]> {
  try {
    const config = loadConfig()
    const agents = [...DEFAULT_AGENTS]
    
    // プロジェクトパスが設定されていれば、カスタムエージェントを読み込む
    if (config.project.path) {
      const customAgents = await loadCustomAgents(config.project.path)
      agents.push(...customAgents)
    }
    
    return agents
  } catch (error) {
    console.error('エージェント一覧の取得に失敗しました:', error)
    return [...DEFAULT_AGENTS]
  }
}

/**
 * エージェントIDから詳細情報を取得
 */
export async function getAgentById(agentId: string): Promise<Agent | undefined> {
  const agents = await getAgents()
  return agents.find(agent => agent.id === agentId)
}

/**
 * カスタムエージェントを読み込み
 */
async function loadCustomAgents(projectPath: string): Promise<Agent[]> {
  try {
    const agentsDir = path.join(projectPath, '.bedrock-engineer/agents')
    
    // エージェントディレクトリが存在しない場合は空配列を返す
    if (!fs.existsSync(agentsDir)) {
      return []
    }
    
    // JSON/YAMLファイルを読み込む
    const files = fs.readdirSync(agentsDir).filter(
      file => file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')
    )
    
    const customAgents: Agent[] = []
    
    for (const file of files) {
      try {
        const filePath = path.join(agentsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // ファイルの拡張子に応じてパース
        let agent: any
        if (file.endsWith('.json')) {
          agent = JSON.parse(content)
        } else {
          agent = yaml.load(content)
        }
        
        // 必須フィールドを検証
        if (!agent.id || !agent.name) {
          console.warn(`エージェントファイル${file}は必須フィールドが不足しています`)
          continue
        }
        
        // 共有エージェントのフラグを設定
        agent.isCustom = true
        agent.isShared = true
        
        customAgents.push(agent)
      } catch (err) {
        console.error(`エージェントファイル${file}の読み込みに失敗しました:`, err)
      }
    }
    
    return customAgents
  } catch (error) {
    console.error('カスタムエージェントの読み込みに失敗しました:', error)
    return []
  }
}

/**
 * エージェントのメッセージ送信（モック）
 */
export async function sendMessage(agentId: string, message: string, modelId: string = 'anthropic.claude-3-5-sonnet-20240620-v1:0'): Promise<string> {
  // 実際にはAWS SDKを使ってBedrockと通信するが、デモとしてモック応答を返す
  const agent = await getAgentById(agentId)
  
  if (!agent) {
    throw new Error(`エージェントID "${agentId}" が見つかりません`)
  }
  
  console.log(chalk.blue(`[${agent.name}] メッセージを処理中...`))
  
  // デモ用のモック応答
  return new Promise((resolve) => {
    setTimeout(() => {
      if (message.includes('こんにちは') || message.includes('hello')) {
        resolve(`こんにちは！私は${agent.name}です。どのようにお手伝いできますか？`)
      } else if (message.includes('help') || message.includes('ヘルプ')) {
        resolve(`どのようなことでお困りですか？具体的に教えていただければ、サポートします。`)
      } else {
        resolve(`ご質問ありがとうございます。実際の回答を得るには、AWS認証情報を正しく設定し、Bedrockサービスに接続する必要があります。このデモでは簡易的な応答のみ提供しています。`)
      }
    }, 1000) // 1秒の遅延で応答
  })
}

/**
 * セッションID生成
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${uuidv4().slice(0, 8)}`
}