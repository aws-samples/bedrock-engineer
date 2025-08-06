import { test, expect } from '@jest/globals'
import { calculateCost, formatCurrency } from './modelPricing'

test('should calculate cost for Claude Sonnet 4', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const expectedCost =
    (inputTokens * 0.003 +
      outputTokens * 0.015 +
      cacheReadTokens * 0.0003 +
      cacheWriteTokens * 0.00375) /
    1000

  const actualCost = calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Claude Opus 4', () => {
  const modelId = 'anthropic.claude-opus-4-20250514-v1:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const expectedCost =
    (inputTokens * 0.015 +
      outputTokens * 0.075 +
      cacheReadTokens * 0.0015 +
      cacheWriteTokens * 0.01875) /
    1000

  const actualCost = calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Claude Opus 4.1', () => {
  const modelId = 'anthropic.claude-opus-4-1-20250805-v1:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const expectedCost =
    (inputTokens * 0.015 +
      outputTokens * 0.075 +
      cacheReadTokens * 0.0015 +
      cacheWriteTokens * 0.01875) /
    1000

  const actualCost = calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Claude 3.5 Sonnet', () => {
  const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const expectedCost =
    (inputTokens * 0.003 +
      outputTokens * 0.015 +
      cacheReadTokens * 0.0003 +
      cacheWriteTokens * 0.00375) /
    1000

  const actualCost = calculateCost(
    modelId,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Nova models', () => {
  const testCases = [
    {
      modelId: 'amazon.nova-pro-v1:0',
      expected: { input: 0.0008, output: 0.0032, cacheRead: 0.0002, cacheWrite: 0 }
    },
    {
      modelId: 'amazon.nova-lite-v1:0',
      expected: { input: 0.00006, output: 0.00024, cacheRead: 0.000015, cacheWrite: 0 }
    },
    {
      modelId: 'amazon.nova-micro-v1:0',
      expected: { input: 0.000035, output: 0.00014, cacheRead: 0.00000875, cacheWrite: 0 }
    }
  ]

  testCases.forEach(({ modelId, expected }) => {
    const inputTokens = 1000
    const outputTokens = 500
    const cacheReadTokens = 200
    const cacheWriteTokens = 100

    const expectedCost =
      (inputTokens * expected.input +
        outputTokens * expected.output +
        cacheReadTokens * expected.cacheRead +
        cacheWriteTokens * expected.cacheWrite) /
      1000

    const actualCost = calculateCost(
      modelId,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens
    )

    expect(actualCost).toBeCloseTo(expectedCost, 8)
  })
})

test('should return 0 for unknown model', () => {
  const modelId = 'unknown-model'
  const cost = calculateCost(modelId, 1000, 500)

  expect(cost).toBe(0)
})

test('should handle zero tokens', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const cost = calculateCost(modelId, 0, 0, 0, 0)

  expect(cost).toBe(0)
})

test('should calculate cost without cache tokens', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const inputTokens = 1000
  const outputTokens = 500

  const expectedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000
  const actualCost = calculateCost(modelId, inputTokens, outputTokens)

  expect(actualCost).toBeCloseTo(expectedCost, 6)
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
