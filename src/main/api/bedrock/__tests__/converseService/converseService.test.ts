import { ConverseService } from '../../services/converseService'
import { ConfigStore } from '../../../../../preload/store'
import { CallConverseAPIProps } from '../../types'
import { ConverseCommand, ConverseStreamCommand } from '@aws-sdk/client-bedrock-runtime'

// サービスのmockを作成
jest.mock('@aws-sdk/client-bedrock-runtime')
jest.mock('../../client')
jest.mock('../../../../../common/logger', () => ({
  createCategoryLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}))

// IPCインタフェースのmock
const mockIpcMain = {
  on: jest.fn()
}
// イベントリスナーのmock
const mockEventEmitter = {
  emit: jest.fn()
}

// Electronモジュールをモック
jest.mock('electron', () => ({
  ipcMain: mockIpcMain
}))

describe('ConverseService', () => {
  let service: ConverseService
  let mockStore: ConfigStore
  let mockContext: { store: ConfigStore }

  beforeEach(() => {
    // テスト前の準備
    jest.clearAllMocks()
    
    // モックストアの設定
    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    } as unknown as ConfigStore

    mockContext = { store: mockStore }
    
    // モックの基本値を設定
    mockStore.get.mockImplementation((key: string) => {
      if (key === 'aws') {
        return {
          region: 'us-east-1',
          accessKeyId: 'mock-key',
          secretAccessKey: 'mock-secret'
        }
      }
      if (key === 'inferenceParams') {
        return {
          maxTokens: 4096,
          temperature: 0.7
        }
      }
      return undefined
    })

    // サービスインスタンスの作成
    service = new ConverseService(mockContext)
  })

  describe('handleError method', () => {
    // privateメソッドをテストするためにanyにキャスト
    const serviceAny = service as any
    
    it('should retry with reduced content when max token exceeded error occurs', async () => {
      // Arrange
      const error = {
        name: 'ValidationException',
        message: 'The specified request would exceed max token limit',
        $metadata: {}
      }
      
      const props: CallConverseAPIProps = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        messages: [
          {
            role: 'assistant',
            content: [
              {
                toolUse: {
                  name: 'writeToFile',
                  input: JSON.stringify({ content: 'a'.repeat(1000) })
                }
              }
            ]
          }
        ],
        system: [{ text: 'You are a helpful assistant' }]
      }
      
      // テスト用にconverseメソッドをモック
      serviceAny.converse = jest.fn().mockResolvedValue('success-response')
      
      // Act
      const result = await serviceAny.handleError(
        error,
        props,
        0, // 初回リトライ
        'converse',
        ConverseCommand
      )
      
      // Assert
      expect(serviceAny.converse).toHaveBeenCalled()
      // リトライされたことを確認
      expect(result).toBe('success-response')
    })
    
    it('should throw MaxTokenExceededError after max retries', async () => {
      // Arrange
      const error = {
        name: 'ValidationException',
        message: 'Exceeded maximum token limit',
        $metadata: {}
      }
      
      const props: CallConverseAPIProps = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        messages: [
          {
            role: 'assistant',
            content: [
              {
                toolUse: {
                  name: 'writeToFile',
                  input: JSON.stringify({ content: 'a'.repeat(1000) })
                }
              }
            ]
          }
        ],
        system: [{ text: 'You are a helpful assistant' }]
      }
      
      // Act & Assert
      await expect(
        serviceAny.handleError(
          error,
          props,
          ConverseService['MAX_RETRIES'], // 最大リトライ回数に達した状態
          'converse',
          ConverseCommand
        )
      ).rejects.toThrow('Max token limit exceeded')
    })
  })

  describe('reduceToolUseContent method', () => {
    const serviceAny = service as any
    
    it('should reduce toolUse input size effectively', () => {
      // Arrange
      const longContent = 'a'.repeat(1000)
      const props: CallConverseAPIProps = {
        modelId: 'test-model',
        messages: [
          {
            role: 'assistant',
            content: [
              {
                toolUse: {
                  name: 'writeToFile',
                  input: { content: longContent, path: '/tmp/file.txt' }
                }
              }
            ]
          }
        ],
        system: [{ text: 'System prompt' }]
      }
      
      // Act
      const result = serviceAny.reduceToolUseContent(props)
      
      // Assert
      const originalLength = JSON.stringify(
        props.messages[0].content[0].toolUse.input
      ).length
      
      const reducedLength = JSON.stringify(
        result.messages[0].content[0].toolUse.input
      ).length
      
      // 縮小後のサイズが元のサイズより小さいことを確認
      expect(reducedLength).toBeLessThan(originalLength)
      
      // 約50%に縮小されていることを確認（多少の誤差を許容）
      const expectedReduction = originalLength * ConverseService['CONTENT_REDUCTION_FACTOR']
      const allowedVariance = 50 // JSONの構造による誤差を許容
      expect(reducedLength).toBeGreaterThanOrEqual(expectedReduction - allowedVariance)
      expect(reducedLength).toBeLessThanOrEqual(expectedReduction + allowedVariance)
    })
    
    it('should handle string input in toolUse', () => {
      // Arrange
      const longString = 'a'.repeat(1000)
      const props: CallConverseAPIProps = {
        modelId: 'test-model',
        messages: [
          {
            role: 'assistant',
            content: [
              {
                toolUse: {
                  name: 'writeToFile',
                  input: longString
                }
              }
            ]
          }
        ],
        system: [{ text: 'System prompt' }]
      }
      
      // Act
      const result = serviceAny.reduceToolUseContent(props)
      
      // Assert
      const originalLength = (props.messages[0].content[0].toolUse.input as string).length
      const reducedLength = (result.messages[0].content[0].toolUse.input as string).length
      
      // 縮小後のサイズが元のサイズの約50%であることを確認
      expect(reducedLength).toBe(Math.floor(originalLength * ConverseService['CONTENT_REDUCTION_FACTOR']))
    })
  })

  describe('ensureValidJson method', () => {
    const serviceAny = service as any
    
    it('should fix incomplete JSON by adding missing brackets', () => {
      // Arrange
      const incompleteJson = '{"name": "test", "values": [1, 2, 3'
      
      // Act
      const result = serviceAny.ensureValidJson(incompleteJson)
      
      // Assert
      expect(() => JSON.parse(result)).not.toThrow()
      const parsed = JSON.parse(result)
      expect(parsed.name).toBe('test')
      expect(parsed.values).toEqual([1, 2, 3])
    })
    
    it('should handle nested structures correctly', () => {
      // Arrange
      const incompleteJson = '{"user": {"name": "John", "profile": {"interests": ["coding", "reading"'
      
      // Act
      const result = serviceAny.ensureValidJson(incompleteJson)
      
      // Assert
      expect(() => JSON.parse(result)).not.toThrow()
      const parsed = JSON.parse(result)
      expect(parsed.user.name).toBe('John')
      expect(Array.isArray(parsed.user.profile.interests)).toBe(true)
    })
  })
})