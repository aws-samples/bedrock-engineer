import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { getMcpToolSpecs, tryExecuteMcpTool } from './index'
import * as mcpClient from './mcp-client'

// MCPClientをモック
jest.mock('./mcp-client', () => {
  return {
    MCPClient: {
      fromCommand: jest.fn().mockImplementation(() => {
        return {
          tools: [
            {
              toolSpec: {
                name: 'mockTool',
                description: 'A mocked tool for testing',
                inputSchema: { json: { type: 'object' } }
              }
            }
          ],
          callTool: jest.fn().mockImplementation((toolName) => {
            if (toolName === 'mockTool') {
              return [{ type: 'text', text: 'Mock tool response' }]
            }
            throw new Error(`Tool ${toolName} not found`)
          }),
          cleanup: jest.fn()
        }
      })
    }
  }
})

describe('MCP Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the module's state between tests
    jest.resetModules()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should get tool specs from MCP clients', async () => {
    const tools = await getMcpToolSpecs()

    // MCPClient.fromCommandが呼ばれたことを確認
    expect(mcpClient.MCPClient.fromCommand).toHaveBeenCalled()

    // ツールリストが返されることを確認
    expect(Array.isArray(tools)).toBe(true)
    expect(tools.length).toBeGreaterThan(0)

    const firstTool = tools[0]
    expect(firstTool).toHaveProperty('toolSpec')
    expect(firstTool.toolSpec?.name).toBe('mockTool')
  })

  test('should execute a valid MCP tool', async () => {
    // まずツール仕様を取得 (クライアント初期化)
    await getMcpToolSpecs()

    // モックツールを実行
    const result = await tryExecuteMcpTool('mockTool', { testParam: 'value' })

    // 結果を検証
    expect(result.found).toBe(true)
    expect(result.success).toBe(true)
    expect(result.result).toBeDefined()
    expect(result.result).toEqual([{ type: 'text', text: 'Mock tool response' }])
  })

  test('should return not found for invalid tool', async () => {
    // クライアント初期化
    await getMcpToolSpecs()

    // 存在しないツール名でテスト
    const result = await tryExecuteMcpTool('non_existent_tool', {})

    // 見つからないはず
    expect(result.found).toBe(false)
    expect(result.success).toBe(false)
  })
})
