import { describe, test, beforeAll, expect } from '@jest/globals'
import { BedrockService } from '../index'
import type { ServiceContext } from '../types'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Skip these tests if not in integration test environment
const INTEGRATION_TEST = process.env.INTEGRATION_TEST === 'true'

// Create a mock store for testing
function createMockStore(initialState: Record<string, any> = {}): ServiceContext['store'] {
  const store = {
    state: { ...initialState },
    get(key: string) {
      if (key === 'aws') {
        return {
          region: process.env.AWS_REGION || 'us-west-2',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      }
      if (key === 'inferenceParams') {
        return {
          maxTokens: 8192,
          temperature: 0.5,
          topP: 0.9
        }
      }
      return this.state[key]
    },
    set(key: string, value: any) {
      this.state[key] = value
    }
  }
  return store
}

// Agent関連のテスト用設定
const TEST_AGENT_ID = process.env.TEST_AGENT_ID || 'FKXNGR6QRE' // デフォルトのテスト用エージェントID
const TEST_AGENT_ALIAS_ID = process.env.TEST_AGENT_ALIAS_ID || 'ZHSSM0WPXS'

// Only run these tests if INTEGRATION_TEST is true
;(INTEGRATION_TEST ? describe : describe.skip)('BedrockService Integration Tests', () => {
  let bedrockService: BedrockService

  beforeAll(async () => {
    const mockStore = createMockStore()
    bedrockService = new BedrockService({ store: mockStore })
  })

  describe('RAG Tests', () => {
    test('retrieve', async () => {
      const prompt = 'A serene mountain landscape at sunset with a calm lake reflection'

      const result = await bedrockService.retrieve({
        knowledgeBaseId: 'OOUYEZK6CG',
        retrievalQuery: {
          text: prompt
        }
      })

      console.log(result)
    }, 30000)
  })

  // Agent関連のテストケース
  describe('Agent Tests', () => {
    test('should successfully invoke agent with basic input', async () => {
      const inputText = 'Hello, what can you help me with?'

      const response = await bedrockService.invokeAgent({
        agentId: TEST_AGENT_ID,
        agentAliasId: TEST_AGENT_ALIAS_ID,
        inputText
      })

      expect(response).toBeDefined()
      expect(response.$metadata.httpStatusCode).toBe(200)

      console.log({
        response
      })
    }, 30000)

    test('should maintain conversation context with session ID', async () => {
      // 初期の対話
      const initialResponse = await bedrockService.invokeAgent({
        agentId: TEST_AGENT_ID,
        agentAliasId: TEST_AGENT_ALIAS_ID,
        inputText: 'What can you do?'
      })

      expect(initialResponse.sessionId).toBeDefined()
      const sessionId = initialResponse.sessionId

      // 同じセッションでフォローアップの質問
      const followUpResponse = await bedrockService.invokeAgent({
        agentId: TEST_AGENT_ID,
        agentAliasId: TEST_AGENT_ALIAS_ID,
        sessionId,
        inputText: 'Can you provide more details about that?'
      })

      expect(followUpResponse.sessionId).toBe(sessionId)
      expect(followUpResponse.$metadata.httpStatusCode).toBe(200)
      console.log({
        followUpResponse
      })
    }, 30000)

    test('should handle invalid agent ID with appropriate error', async () => {
      const invalidAgentId = 'invalid-id'

      await expect(
        bedrockService.invokeAgent({
          agentId: invalidAgentId,
          agentAliasId: TEST_AGENT_ALIAS_ID,
          inputText: 'Hello'
        })
      ).rejects.toThrow()
    }, 30000)
  })

  describe.only('Agent Tests (save image)', () => {
    test('should save png file', async () => {
      const inputText = `以下の購買データをもとに、購買日ごとの購入金額の合計値をグラフとして可視化してください。
このCSV形式のデータには、以下のような情報が含まれています。
- 'customer_id': 顧客 ID
- 'product_id': 商品 ID
- 'purchase_date': 購買日
- 'purchase_amount': 購買金額

<購買データ>
customer_id,product_id,purchase_date,purchase_amount
C001,P001,2023-04-01,50.00
C002,P002,2023-04-02,75.00
C003,P003,2023-04-03,100.00
C001,P002,2023-04-04,60.00
C002,P001,2023-04-05,40.00
C003,P003,2023-04-06,90.00
C001,P001,2023-04-07,30.00
C002,P002,2023-04-08,80.00
C003,P001,2023-04-09,45.00
C001,P003,2023-04-10,120.00
</購買データ>`

      const response = await bedrockService.invokeAgent({
        agentId: TEST_AGENT_ID,
        agentAliasId: TEST_AGENT_ALIAS_ID,
        inputText,
        enableTrace: true
      })

      expect(response).toBeDefined()
      expect(response.$metadata.httpStatusCode).toBe(200)
      console.log({
        files: JSON.stringify(response.completion?.files)
      })
      // save files
      if (response.completion?.files) {
        for (const file of response.completion.files) {
          // const buffer = Buffer.from(file.content, 'base64')
          // save current test directory
          const fileDir = join(__dirname, `./${file.name}`)
          await writeFile(fileDir, file.content)
        }
      }

      console.log({
        response
      })
    }, 300000)
  })
})
