import { test, expect } from '@jest/globals'
import { calculateCost, formatCurrency, modelPricing } from './modelPricing'

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

test('should contain Claude Sonnet 4 pricing', () => {
  expect(modelPricing['sonnet-4']).toEqual({
    input: 0.003,
    output: 0.015,
    cacheRead: 0.0003,
    cacheWrite: 0.00375
  })
})

test('should contain Claude Opus 4 pricing', () => {
  expect(modelPricing['opus-4']).toEqual({
    input: 0.015,
    output: 0.075,
    cacheRead: 0.0015,
    cacheWrite: 0.01875
  })
})

test('should contain Claude Opus 4.1 pricing', () => {
  expect(modelPricing['opus-4-1']).toEqual({
    input: 0.015,
    output: 0.075,
    cacheRead: 0.0015,
    cacheWrite: 0.01875
  })
})

test('should have all required pricing fields for new models', () => {
  const requiredFields = ['input', 'output', 'cacheRead', 'cacheWrite']

  expect(Object.keys(modelPricing['sonnet-4'])).toEqual(expect.arrayContaining(requiredFields))
  expect(Object.keys(modelPricing['opus-4'])).toEqual(expect.arrayContaining(requiredFields))
})
