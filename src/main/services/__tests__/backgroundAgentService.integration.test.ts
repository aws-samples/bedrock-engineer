import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach
} from '@jest/globals'
import { BackgroundAgentManager } from '../../managers/backgroundAgentManager'
import { ChatSessionManager } from '../../store/chatSession'
import { BedrockService } from '../../api/bedrock'
import { CustomAgent } from '../../../types/agent-chat'
import { store } from '../../../preload/store'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

// テストのタイムアウト時間を長めに設定（Bedrock通信を含むため）
jest.setTimeout(120000)

describe('BackgroundAgentService Integration Tests', () => {
  let backgroundAgentManager: BackgroundAgentManager
  let chatSessionManager: ChatSessionManager
  let bedrockService: BedrockService
  let tempDir: string
  let originalUserDataPath: string | undefined

  // デフォルトのSoftware Developerエージェント定義
  const defaultSoftwareDeveloperAgent: CustomAgent = {
    id: 'softwareAgent',
    name: 'Software Developer',
    description:
      'A skilled software developer that can help with coding, debugging, and technical tasks.',
    system: `You are a skilled software developer with expertise in multiple programming languages and frameworks.
You can help with:
- Writing clean, efficient code
- Debugging and troubleshooting
- Code reviews and optimization
- Architectural decisions
- Best practices and patterns

Always provide clear explanations with your code examples.`,
    scenarios: [
      {
        title: 'Code Review',
        content: 'Please review this code and suggest improvements'
      },
      {
        title: 'Debug Issue',
        content: 'Help me debug this error in my code'
      }
    ],
    icon: 'code',
    iconColor: '#3b82f6',
    tags: ['coding', 'development', 'programming'],
    author: 'Bedrock Engineer',
    isCustom: false,
    category: 'coding',
    tools: [] // シンプルなテストのためツールなし
  }

  beforeAll(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bedrock-engineer-test-'))

    // storeのuserDataPathを一時的に変更
    originalUserDataPath = store.get('userDataPath')
    store.set('userDataPath', tempDir)

    // AWS設定の確認
    const awsProfile = process.env.AWS_PROFILE
    const awsRegion = process.env.AWS_REGION || 'us-west-2'

    if (!awsProfile) {
      throw new Error('AWS_PROFILE environment variable is required for integration tests')
    }

    console.log(`Using AWS Profile: ${awsProfile}, Region: ${awsRegion}`)

    // AWS設定をstoreに設定
    store.set('aws', {
      region: awsRegion,
      profile: awsProfile,
      useProfile: true,
      accessKeyId: '',
      secretAccessKey: ''
    })

    // デフォルトエージェントをstoreに設定
    store.set('customAgents', [defaultSoftwareDeveloperAgent])
  })

  afterAll(async () => {
    // 一時ディレクトリをクリーンアップ
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }

    // 元のuserDataPathを復元
    if (originalUserDataPath) {
      store.set('userDataPath', originalUserDataPath)
    }
  })

  beforeEach(async () => {
    // 各テスト前にサービスを初期化
    chatSessionManager = new ChatSessionManager()
    bedrockService = new BedrockService({ store })
    backgroundAgentManager = new BackgroundAgentManager(chatSessionManager, bedrockService)
  })

  afterEach(async () => {
    // 各テスト後にバックグラウンドエージェントをシャットダウン
    if (backgroundAgentManager) {
      await backgroundAgentManager.shutdown()
    }
  })

  test('should start default Software Developer agent and get status', async () => {
    // エージェント開始前に利用可能なエージェントを確認
    const availableAgents = backgroundAgentManager.getAvailableAgents()
    expect(availableAgents.customAgents).toHaveLength(1)
    expect(availableAgents.customAgents[0].id).toBe('softwareAgent')
    expect(availableAgents.customAgents[0].name).toBe('Software Developer')

    // エージェントを開始
    const startResult = await backgroundAgentManager.startAgent({
      agentId: 'softwareAgent',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      config: {
        logLevel: 'info'
      }
    })

    expect(startResult.success).toBe(true)
    expect(startResult.data).toBeDefined()
    expect(startResult.data.agentId).toBe('softwareAgent')

    // エージェントの状態を確認
    const status = backgroundAgentManager.getAgentStatus('softwareAgent')
    expect(status).toBeDefined()
    expect(status!.agentId).toBe('softwareAgent')
    expect(status!.status).toBe('running')
    expect(status!.startedAt).toBeDefined()
    expect(status!.totalSessions).toBe(0)
    expect(status!.messagesProcessed).toBe(0)
    expect(status!.errorCount).toBe(0)

    console.log('Agent Status:', {
      id: status!.id,
      agentId: status!.agentId,
      status: status!.status,
      uptime: status!.uptime
    })

    // エージェントを停止
    const stopResult = await backgroundAgentManager.stopAgent('softwareAgent')
    expect(stopResult.success).toBe(true)

    // 停止後の状態確認
    const stoppedStatus = backgroundAgentManager.getAgentStatus('softwareAgent')
    expect(stoppedStatus).toBeNull()
  })

  test('should process a simple message with Bedrock integration', async () => {
    // エージェントを開始
    const startResult = await backgroundAgentManager.startAgent({
      agentId: 'softwareAgent',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      config: {
        logLevel: 'info'
      }
    })

    expect(startResult.success).toBe(true)

    // シンプルなメッセージを送信
    const testMessage =
      'Hello! Can you tell me what programming language you recommend for beginners?'

    console.log('Sending test message to agent:', testMessage)

    const messages = await backgroundAgentManager.processMessage('softwareAgent', testMessage)

    // レスポンスの検証
    expect(messages).toBeDefined()
    expect(messages.length).toBeGreaterThanOrEqual(2) // user + assistant message

    // ユーザーメッセージの検証
    const userMessage = messages.find((msg) => msg.role === 'user')
    expect(userMessage).toBeDefined()
    expect(userMessage!.content).toBeDefined()
    expect(userMessage!.content![0]).toHaveProperty('text', testMessage)

    // アシスタントメッセージの検証
    const assistantMessage = messages.find((msg) => msg.role === 'assistant')
    expect(assistantMessage).toBeDefined()
    expect(assistantMessage!.content).toBeDefined()
    expect(assistantMessage!.content!.length).toBeGreaterThan(0)

    const responseText = assistantMessage!.content![0] as any
    expect(responseText).toHaveProperty('text')
    expect(typeof responseText.text).toBe('string')
    expect(responseText.text.length).toBeGreaterThan(0)

    console.log('Received response from agent:', {
      messageCount: messages.length,
      responseLength: responseText.text.length,
      responsePreview: responseText.text.substring(0, 100) + '...'
    })

    // エージェントの状態更新を確認
    const updatedStatus = backgroundAgentManager.getAgentStatus('softwareAgent')
    expect(updatedStatus!.messagesProcessed).toBe(1)
    expect(updatedStatus!.totalSessions).toBe(1)

    // エージェントを停止
    await backgroundAgentManager.stopAgent('softwareAgent')
  })

  test('should handle multiple agents status retrieval', async () => {
    // 複数のエージェント状態取得のテスト
    const allStatuses = backgroundAgentManager.getAllAgentStatuses()
    expect(Array.isArray(allStatuses)).toBe(true)
    expect(allStatuses.length).toBe(0) // まだエージェントが起動していない

    // エージェントを開始
    await backgroundAgentManager.startAgent({
      agentId: 'softwareAgent',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    })

    // 状態一覧を再取得
    const statusesAfterStart = backgroundAgentManager.getAllAgentStatuses()
    expect(statusesAfterStart.length).toBe(1)
    expect(statusesAfterStart[0].agentId).toBe('softwareAgent')
    expect(statusesAfterStart[0].status).toBe('running')

    // クリーンアップ
    await backgroundAgentManager.stopAgent('softwareAgent')
  })

  test('should continue conversation with specified sessionId', async () => {
    // エージェントを開始
    const startResult = await backgroundAgentManager.startAgent({
      agentId: 'softwareAgent',
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      config: {
        logLevel: 'info'
      }
    })

    expect(startResult.success).toBe(true)

    // 最初のメッセージを送信（新しいセッションが作成される）
    const firstMessage = 'What is Python?'
    console.log('Sending first message:', firstMessage)

    const firstResponse = await backgroundAgentManager.processMessage('softwareAgent', firstMessage)

    // 最初のレスポンスの検証
    expect(firstResponse).toBeDefined()
    expect(firstResponse.length).toBeGreaterThanOrEqual(2) // user + assistant message

    // セッションIDを取得（エージェントの状態から）
    const statusAfterFirst = backgroundAgentManager.getAgentStatus('softwareAgent')
    expect(statusAfterFirst).toBeDefined()
    expect(statusAfterFirst!.currentSessionId).toBeDefined()

    const sessionId = statusAfterFirst!.currentSessionId!
    console.log('Session ID for continuation:', sessionId)

    // 同じセッションIDで続けてメッセージを送信
    const followUpMessage = 'Can you give me a simple Python code example?'
    console.log('Sending follow-up message with sessionId:', followUpMessage)

    const secondResponse = await backgroundAgentManager.processMessage(
      'softwareAgent',
      followUpMessage,
      sessionId
    )

    // 2回目のレスポンスの検証
    expect(secondResponse).toBeDefined()
    expect(secondResponse.length).toBeGreaterThanOrEqual(4) // 1st user + 1st assistant + 2nd user + 2nd assistant

    // メッセージの順序とコンテンツを確認
    const messages = secondResponse
    expect(messages[0].role).toBe('user')
    expect(messages[0].content![0]).toHaveProperty('text', firstMessage)

    expect(messages[1].role).toBe('assistant')
    expect(messages[1].content![0]).toHaveProperty('text')

    expect(messages[2].role).toBe('user')
    expect(messages[2].content![0]).toHaveProperty('text', followUpMessage)

    expect(messages[3].role).toBe('assistant')
    expect(messages[3].content![0]).toHaveProperty('text')

    const finalResponseText = messages[3].content![0] as any
    expect(typeof finalResponseText.text).toBe('string')
    expect(finalResponseText.text.length).toBeGreaterThan(0)

    console.log('Final conversation state:', {
      totalMessages: messages.length,
      sessionId: sessionId,
      finalResponsePreview: finalResponseText.text.substring(0, 100) + '...'
    })

    // エージェントの状態確認（メッセージ数が2に増えているはず）
    const finalStatus = backgroundAgentManager.getAgentStatus('softwareAgent')
    expect(finalStatus!.messagesProcessed).toBe(2)
    expect(finalStatus!.currentSessionId).toBe(sessionId)

    // エージェントを停止
    await backgroundAgentManager.stopAgent('softwareAgent')
  })
})
