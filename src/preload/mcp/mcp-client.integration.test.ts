import { test, expect, jest, beforeAll, afterAll, describe } from '@jest/globals'
import { MCPClient } from './mcp-client'

describe('MCPClient Integration Tests', () => {
  let mcpClient: MCPClient

  beforeAll(async () => {
    // Connect to the MCP fetch server
    mcpClient = await MCPClient.fromCommand('uvx', ['mcp-server-fetch'])
  })

  afterAll(async () => {
    // Clean up resources
    await mcpClient.cleanup()

    // Restore console.log
    jest.restoreAllMocks()
  })

  test('should connect to MCP server and list available tools', async () => {
    // Check if tools are available
    const tools = mcpClient.tools
    console.log({ tools: JSON.stringify(tools, null, 2) })

    // Verify we have at least one tool
    expect(tools.length).toBeGreaterThan(0)

    // Verify each tool has the required structure
    for (const tool of tools) {
      expect(tool).toHaveProperty('toolSpec')
      expect(tool.toolSpec).toHaveProperty('name')
      expect(tool.toolSpec).toHaveProperty('description')
      expect(tool.toolSpec).toHaveProperty('inputSchema')
    }

    // Log tools for debugging (will be mocked in actual test run)
    console.log(
      'Available tools:',
      tools.map((t) => t.toolSpec!.name)
    )

    const res = await mcpClient.callTool('fetch', {
      url: 'http://github.com/aws-samples/bedrock-engineer'
    })
    console.log({ res })
  })

  // Additional tests can be added here in the future:
  // - Test calling specific tools
  // - Test error handling scenarios
  // - Test with invalid inputs
})
