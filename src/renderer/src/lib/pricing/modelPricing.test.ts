import { test, expect, beforeEach, jest } from '@jest/globals'
import { calculateCost, formatCurrency } from './modelPricing'

interface ModelPricing {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

// Mock window.api with proper typing
const mockGetModelPricing = jest.fn<(modelId: string) => Promise<ModelPricing | null>>()

beforeEach(() => {
  // Reset mock before each test
  mockGetModelPricing.mockReset()

  // Setup mock window.api
  ;(global as any).window = {
    api: {
      bedrock: {
        getModelPricing: mockGetModelPricing
      }
    }
  }
})

test('should calculate cost for Claude Sonnet 4', async () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const pricing = { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  mockGetModelPricing.mockResolvedValue(pricing)

  const expectedCost =
    (inputTokens * 0.003 +
      outputTokens * 0.015 +
      cacheReadTokens * 0.0003 +
      cacheWriteTokens * 0.00375) /
    1000

  const actualCost = await calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should calculate cost for Claude Opus 4', async () => {
  const modelId = 'anthropic.claude-opus-4-20250514-v1:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const pricing = { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 }
  mockGetModelPricing.mockResolvedValue(pricing)

  const expectedCost =
    (inputTokens * 0.015 +
      outputTokens * 0.075 +
      cacheReadTokens * 0.0015 +
      cacheWriteTokens * 0.01875) /
    1000

  const actualCost = await calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should calculate cost for Claude Opus 4.1', async () => {
  const modelId = 'anthropic.claude-opus-4-1-20250805-v1:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const pricing = { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 }
  mockGetModelPricing.mockResolvedValue(pricing)

  const expectedCost =
    (inputTokens * 0.015 +
      outputTokens * 0.075 +
      cacheReadTokens * 0.0015 +
      cacheWriteTokens * 0.01875) /
    1000

  const actualCost = await calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should calculate cost for Claude 3.5 Sonnet', async () => {
  const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const pricing = { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  mockGetModelPricing.mockResolvedValue(pricing)

  const expectedCost =
    (inputTokens * 0.003 +
      outputTokens * 0.015 +
      cacheReadTokens * 0.0003 +
      cacheWriteTokens * 0.00375) /
    1000

  const actualCost = await calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should calculate cost for Nova models', async () => {
  const testCases = [
    {
      modelId: 'amazon.nova-pro-v1:0',
      pricing: { input: 0.0008, output: 0.0032, cacheRead: 0.0002, cacheWrite: 0 }
    },
    {
      modelId: 'amazon.nova-lite-v1:0',
      pricing: { input: 0.00006, output: 0.00024, cacheRead: 0.000015, cacheWrite: 0 }
    },
    {
      modelId: 'amazon.nova-micro-v1:0',
      pricing: { input: 0.000035, output: 0.00014, cacheRead: 0.00000875, cacheWrite: 0 }
    }
  ]

  for (const { modelId, pricing } of testCases) {
    mockGetModelPricing.mockResolvedValue(pricing)

    const inputTokens = 1000
    const outputTokens = 500
    const cacheReadTokens = 200
    const cacheWriteTokens = 100

    const expectedCost =
      (inputTokens * pricing.input +
        outputTokens * pricing.output +
        cacheReadTokens * pricing.cacheRead +
        cacheWriteTokens * pricing.cacheWrite) /
      1000

    const actualCost = await calculateCost(
      modelId,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens
    )

    expect(actualCost).toBeCloseTo(expectedCost, 8)
    expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)

    // Reset for next iteration
    mockGetModelPricing.mockReset()
  }
})

test('should return 0 for unknown model', async () => {
  const modelId = 'unknown-model'
  mockGetModelPricing.mockResolvedValue(null)

  const cost = await calculateCost(modelId, 1000, 500)

  expect(cost).toBe(0)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should handle zero tokens', async () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const pricing = { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  mockGetModelPricing.mockResolvedValue(pricing)

  const cost = await calculateCost(modelId, 0, 0, 0, 0)

  expect(cost).toBe(0)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should calculate cost without cache tokens', async () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const inputTokens = 1000
  const outputTokens = 500

  const pricing = { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  mockGetModelPricing.mockResolvedValue(pricing)

  const expectedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000
  const actualCost = await calculateCost(modelId, inputTokens, outputTokens)

  expect(actualCost).toBeCloseTo(expectedCost, 6)
  expect(mockGetModelPricing).toHaveBeenCalledWith(modelId)
})

test('should format currency with default settings', () => {
  const value = 0.012345
  const formatted = formatCurrency(value)

  expect(formatted).toBe('$0.012345')
})

test('should format currency with custom locale', () => {
  const value = 0.012345
  const formatted = formatCurrency(value, 'USD', 'ja-JP')

  expect(formatted).toBe('$0.012345')
})

test('should format zero value', () => {
  const value = 0
  const formatted = formatCurrency(value)

  expect(formatted).toBe('$0.000000')
})
