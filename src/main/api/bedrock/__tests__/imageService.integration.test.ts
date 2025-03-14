import { describe, test, beforeAll } from '@jest/globals'
import { BedrockService } from '../index'
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

// Helper function to save base64 image
async function saveBase64Image(base64Data: string, prompt: string): Promise<string> {
  // Convert base64 to Unit8Array
  const data = Uint8Array.from(Buffer.from(base64Data, 'base64'))
  const hash = createHash('md5').update(prompt).digest('hex')
  const fileName = `test-image-${hash}.png`
  const filePath = path.join(__dirname, 'test-outputs', fileName)

  // Ensure the directory exists
  await fs.mkdir(path.join(__dirname, 'test-outputs'), { recursive: true })

  await fs.writeFile(filePath, data)
  return filePath
}

// Only run these tests if INTEGRATION_TEST is true
;(INTEGRATION_TEST ? describe : describe.skip)('ImageService Integration Tests', () => {
  let bedrockService: BedrockService

  beforeAll(async () => {
    const mockStore = createMockStore()
    bedrockService = new BedrockService({ store: mockStore })
  })

  test('should generate a single image using core model', async () => {
    const prompt = 'A serene mountain landscape at sunset with a calm lake reflection'

    const result = await bedrockService.generateImage({
      modelId: 'stability.stable-image-core-v1:1',
      prompt,
      aspect_ratio: '1:1',
      output_format: 'png'
    })

    // Save the generated image
    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 30000)

  test('should generate image with negative prompt using ultra model', async () => {
    const prompt = 'A professional portrait photo in a studio setting'
    const negativePrompt = 'blurry, low quality, distorted'

    const result = await bedrockService.generateImage({
      modelId: 'stability.stable-image-ultra-v1:0',
      prompt,
      negativePrompt,
      aspect_ratio: '3:2'
    })

    // Save the generated image
    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 45000)

  test('should generate images with different styles using SD3 model', async () => {
    const prompt = 'A cityscape at night'

    const result = await bedrockService.generateImage({
      modelId: 'stability.sd3-large-v1:0',
      prompt,
      aspect_ratio: '16:9'
    })

    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 90000)

  test('should generate images with different styles using SD3.5 model', async () => {
    const prompt = 'A cityscape at night'

    const result = await bedrockService.generateImage({
      modelId: 'stability.sd3-5-large-v1:0',
      prompt,
      aspect_ratio: '16:9'
    })

    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 90000)

  test('should generate image using Nova Canvas model', async () => {
    const prompt = 'A watercolor painting of a cherry blossom tree'

    const result = await bedrockService.generateImage({
      modelId: 'amazon.nova-canvas-v1:0',
      prompt,
      aspect_ratio: '1:1',
      output_format: 'png'
    })

    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 30000)

  test('should generate image using Titan Image Generator v2', async () => {
    const prompt = 'A futuristic cityscape with flying cars'
    const negativePrompt = 'blurry, low quality, distorted'

    const result = await bedrockService.generateImage({
      modelId: 'amazon.titan-image-generator-v2:0',
      prompt,
      negativePrompt,
      aspect_ratio: '16:9',
      output_format: 'png'
    })

    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 45000)

  test('should generate image using Titan Image Generator v1', async () => {
    const prompt = 'An underwater scene with colorful coral and fish'

    const result = await bedrockService.generateImage({
      modelId: 'amazon.titan-image-generator-v1',
      prompt,
      aspect_ratio: '4:5',
      output_format: 'png'
    })

    const filePath = await saveBase64Image(result.images[0], prompt)
    console.log(`Image saved to: ${filePath}`)
  }, 45000)
})
