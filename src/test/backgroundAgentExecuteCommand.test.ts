import { describe, it, expect, jest } from '@jest/globals'

jest.mock('uuid', () => ({ v4: () => 'uuid' }))
jest.mock('../main/api/bedrock/services/backgroundAgent/BackgroundAgentScheduler', () => ({
  BackgroundAgentScheduler: class {}
}))
jest.mock('../main/api/bedrock/services/backgroundAgent/BackgroundChatSessionManager', () => ({
  BackgroundChatSessionManager: class {}
}))
jest.mock('../main/api/bedrock/services/backgroundAgent/MainToolSpecProvider', () => ({
  MainToolSpecProvider: class {}
}))
jest.mock('electron', () => ({
  BrowserWindow: {},
  ipcMain: { on: jest.fn(), removeListener: jest.fn() }
}))
jest.mock('../main/api/bedrock/index', () => ({ BedrockService: class {} }))
jest.mock('../main/handlers/agent-handlers', () => ({ agentHandlers: {} }))
jest.mock('../main/lib/pubsub-manager', () => ({ pubSubManager: {} }))
jest.mock('../common/logger', () => ({
  createCategoryLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}))

import { BackgroundAgentService } from '../main/api/bedrock/services/backgroundAgent/BackgroundAgentService'

describe('BackgroundAgentService executeCommand restriction', () => {
  const makeService = () => {
    const service: any = Object.create(BackgroundAgentService.prototype)
    service.executePreloadToolViaIPC = jest.fn()
    service.toolSpecProvider = {
      getPreloadToolSpecs: async () => [
        { toolSpec: { name: 'executeCommand', description: '', inputSchema: { json: {} } } },
        { toolSpec: { name: 'readFiles', description: '', inputSchema: { json: {} } } }
      ],
      getMcpToolSpecs: async () => []
    }
    service.context = { store: { get: () => '' } }
    return service
  }

  it('refuses executeCommand tool calls without executing', async () => {
    const service = makeService()
    const result = await service.executeTool(
      { name: 'executeCommand', toolUseId: 't1', input: { command: 'ls' } },
      { id: 'a' },
      { agentId: 'a' }
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('disabled for background agents')
    expect(service.executePreloadToolViaIPC).not.toHaveBeenCalled()
  })

  it('does not let tool input override the tool type', async () => {
    const service = makeService()
    service.executePreloadToolViaIPC.mockResolvedValue({ success: true, result: {} })
    await service.executeTool(
      {
        name: 'readFiles',
        toolUseId: 't2',
        input: { type: 'executeCommand', command: 'ls', cwd: '/', _agentId: 'other' }
      },
      { id: 'a' },
      { agentId: 'a' }
    )
    const toolInput = service.executePreloadToolViaIPC.mock.calls[0][0]
    expect(toolInput.type).toBe('readFiles')
    expect(toolInput._agentId).toBe('a')
  })

  it('does not offer executeCommand to the model', async () => {
    const service = makeService()
    const states = await service.generateToolSpecs(['executeCommand', 'readFiles'], { id: 'a' })
    const names = states.map((s: any) => s.toolSpec.name)
    expect(names).toContain('readFiles')
    expect(names).not.toContain('executeCommand')
  })
})
