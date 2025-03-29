import { jest, describe, test, expect, afterAll } from '@jest/globals'
import { getMcpToolSpecs, tryExecuteMcpTool } from './index'

// テストのタイムアウト時間を長めに設定
jest.setTimeout(60000)

describe('MCP Integration Tests', () => {
  afterAll(() => {
    jest.restoreAllMocks()
  })

  test('should initialize MCP clients and get tool specs', async () => {
    const tools = await getMcpToolSpecs()

    // ツールが取得できることを検証
    expect(Array.isArray(tools)).toBe(true)

    // 各ツールの基本構造を検証 (リストが空の場合もあるため)
    if (tools.length > 0) {
      const firstTool = tools[0]
      expect(firstTool).toHaveProperty('toolSpec')

      // 使用可能なツール名を表示
      console.log('Available tools:', tools.map((tool) => tool.toolSpec?.name).filter(Boolean))
    } else {
      console.log('No MCP tools were found.')
    }
  })

  // 基本的な存在しないツールのテスト - これは通常失敗しないはず
  test('should return not found for invalid tool', async () => {
    const result = await tryExecuteMcpTool('non_existent_tool', {})
    expect(result.found).toBe(false)
  })
})
