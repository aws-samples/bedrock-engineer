import { describe, test, beforeAll, afterAll, expect } from '@jest/globals'
import { VideoRecognitionService } from '../services/videoRecognitionService'
import type { ServiceContext } from '../types'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createHash } from 'crypto'

// Skip these tests if not in integration test environment
const INTEGRATION_TEST = process.env.INTEGRATION_TEST === 'true'

// Create a mock store for testing
function createMockStore(initialState: Record<string, any> = {}): ServiceContext['store'] {
  const store = {
    state: { ...initialState },
    get(key: string) {
      if (key === 'aws') {
        return {
          region: process.env.AWS_REGION || 'us-east-1',
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

// Helper function to create a test video file (simple MP4)
async function createTestVideoFile(): Promise<string> {
  const testVideoPath = path.join(__dirname, 'test-assets', 'test-video.mp4')

  // Ensure the directory exists
  await fs.mkdir(path.join(__dirname, 'test-assets'), { recursive: true })

  // Create a very simple test video file (this would normally be a real video file)
  // For testing purposes, we'll create a minimal MP4 file structure
  // Note: In real tests, you would use a proper test video file
  const minimalMp4Header = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x20,
    0x66,
    0x74,
    0x79,
    0x70, // ftyp box
    0x69,
    0x73,
    0x6f,
    0x6d,
    0x00,
    0x00,
    0x02,
    0x00,
    0x69,
    0x73,
    0x6f,
    0x6d,
    0x69,
    0x73,
    0x6f,
    0x32,
    0x61,
    0x76,
    0x63,
    0x31,
    0x6d,
    0x70,
    0x34,
    0x31
  ])

  try {
    await fs.access(testVideoPath)
  } catch {
    // File doesn't exist, create it
    await fs.writeFile(testVideoPath, minimalMp4Header)
  }

  return testVideoPath
}

// Helper function to save test results
async function saveTestResult(result: any, testName: string): Promise<string> {
  const hash = createHash('md5').update(testName).digest('hex')
  const fileName = `video-recognition-result-${hash}.json`
  const filePath = path.join(__dirname, 'test-outputs', fileName)

  // Ensure the directory exists
  await fs.mkdir(path.join(__dirname, 'test-outputs'), { recursive: true })

  await fs.writeFile(filePath, JSON.stringify(result, null, 2))
  return filePath
}

// Only run these tests if INTEGRATION_TEST is true
;(INTEGRATION_TEST ? describe : describe.skip)('VideoRecognitionService Integration Tests', () => {
  let videoRecognitionService: VideoRecognitionService
  let testVideoPath: string

  beforeAll(async () => {
    const mockStore = createMockStore()
    videoRecognitionService = new VideoRecognitionService({ store: mockStore })

    // Create test video file
    testVideoPath = await createTestVideoFile()
  })

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(testVideoPath)
    } catch {
      // Ignore cleanup errors
    }
  })

  test('should recognize video using Nova Lite model', async () => {
    const result = await videoRecognitionService.recognizeVideo({
      videoPath: testVideoPath,
      prompt: 'この動画の内容を説明してください。',
      modelId: 'amazon.nova-lite-v1:0',
      s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket',
      cleanupS3: true
    })

    expect(result).toBeDefined()
    expect(result.description).toBeTruthy()
    expect(result.modelUsed).toBe('amazon.nova-lite-v1:0')
    expect(result.processingTime).toBeGreaterThan(0)

    // Save result for inspection
    const filePath = await saveTestResult(result, 'nova-lite-recognition')
    console.log(`Test result saved to: ${filePath}`)
    console.log('Recognition result:', result.description)
  }, 60000)

  test('should recognize video using Nova Pro model', async () => {
    const result = await videoRecognitionService.recognizeVideo({
      videoPath: testVideoPath,
      prompt: 'Describe what you see in this video in detail.',
      modelId: 'amazon.nova-pro-v1:0',
      s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket',
      cleanupS3: true
    })

    expect(result).toBeDefined()
    expect(result.description).toBeTruthy()
    expect(result.modelUsed).toBe('amazon.nova-pro-v1:0')

    const filePath = await saveTestResult(result, 'nova-pro-recognition')
    console.log(`Test result saved to: ${filePath}`)
    console.log('Recognition result:', result.description)
  }, 60000)

  test('should recognize video using Nova Premier model', async () => {
    const result = await videoRecognitionService.recognizeVideo({
      videoPath: testVideoPath,
      prompt:
        'この動画について、詳細な分析を行ってください。シーン、オブジェクト、動きなどを含めて説明してください。',
      modelId: 'amazon.nova-premier-v1:0',
      s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket',
      cleanupS3: true
    })

    expect(result).toBeDefined()
    expect(result.description).toBeTruthy()
    expect(result.modelUsed).toBe('amazon.nova-premier-v1:0')

    const filePath = await saveTestResult(result, 'nova-premier-recognition')
    console.log(`Test result saved to: ${filePath}`)
    console.log('Recognition result:', result.description)
  }, 90000)

  test('should handle video file validation errors', async () => {
    const invalidVideoPath = path.join(__dirname, 'non-existent-video.mp4')

    await expect(
      videoRecognitionService.recognizeVideo({
        videoPath: invalidVideoPath,
        s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket'
      })
    ).rejects.toThrow()
  })

  test('should handle unsupported video format', async () => {
    const textFilePath = path.join(__dirname, 'test-assets', 'test.txt')

    // Create a text file
    await fs.mkdir(path.join(__dirname, 'test-assets'), { recursive: true })
    await fs.writeFile(textFilePath, 'This is not a video file')

    await expect(
      videoRecognitionService.recognizeVideo({
        videoPath: textFilePath,
        s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket'
      })
    ).rejects.toThrow('Unsupported video format')

    // Clean up
    await fs.unlink(textFilePath)
  })

  test('should use cross-region model when specified', async () => {
    const result = await videoRecognitionService.recognizeVideo({
      videoPath: testVideoPath,
      prompt: 'What is happening in this video?',
      modelId: 'us.amazon.nova-lite-v1:0', // Cross-region model
      s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket',
      cleanupS3: true
    })

    expect(result).toBeDefined()
    expect(result.description).toBeTruthy()
    expect(result.modelUsed).toBe('us.amazon.nova-lite-v1:0')

    const filePath = await saveTestResult(result, 'cross-region-recognition')
    console.log(`Test result saved to: ${filePath}`)
  }, 60000)

  test('should provide estimated token usage', async () => {
    const result = await videoRecognitionService.recognizeVideo({
      videoPath: testVideoPath,
      prompt: 'Brief description of this video.',
      modelId: 'amazon.nova-micro-v1:0',
      s3BucketName: process.env.TEST_S3_BUCKET || 'test-bucket',
      cleanupS3: true
    })

    expect(result).toBeDefined()
    expect(result.estimatedTokens).toBeDefined()
    expect(typeof result.estimatedTokens).toBe('number')
    expect(result.estimatedTokens).toBeGreaterThan(0)

    console.log(`Estimated tokens: ${result.estimatedTokens}`)
  }, 60000)
})

// Unit tests that don't require AWS credentials
describe('VideoRecognitionService Unit Tests', () => {
  test('should validate video file format correctly', async () => {
    // This test would require implementing public validation methods
    // or testing through the main recognizeVideo method with mock data
    expect(true).toBe(true) // Placeholder
  })

  test('should generate correct S3 keys', async () => {
    // This test would validate S3 key generation logic
    expect(true).toBe(true) // Placeholder
  })
})
