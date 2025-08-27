import { test, expect } from '@jest/globals'
import { PricingCalculator } from '../../../../common/models/pricing'

test('should calculate cost for Claude Sonnet 4', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

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

  const actualCost = pricingCalculator.calculateTotalCost(
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Claude Opus 4', () => {
  const modelId = 'anthropic.claude-opus-4-20250514-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

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

  const actualCost = pricingCalculator.calculateTotalCost(
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Claude Opus 4.1', () => {
  const modelId = 'anthropic.claude-opus-4-1-20250805-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

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

  const actualCost = pricingCalculator.calculateTotalCost(
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should return 0 for unknown model', () => {
  const modelId = 'unknown-model'
  const pricingCalculator = new PricingCalculator(modelId)
  const cost = pricingCalculator.calculateTotalCost(1000, 500)

  expect(cost).toBe(0)
})

test('should handle zero tokens', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)
  const cost = pricingCalculator.calculateTotalCost(0, 0, 0, 0)

  expect(cost).toBe(0)
})

test('should calculate cost without cache tokens', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

  const inputTokens = 1000
  const outputTokens = 500

  const expectedCost = (inputTokens * 0.003 + outputTokens * 0.015) / 1000
  const actualCost = pricingCalculator.calculateTotalCost(inputTokens, outputTokens)

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate individual cost components', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  expect(pricingCalculator.calculateInputCost(inputTokens)).toBeCloseTo(
    (inputTokens * 0.003) / 1000,
    6
  )
  expect(pricingCalculator.calculateOutputCost(outputTokens)).toBeCloseTo(
    (outputTokens * 0.015) / 1000,
    6
  )
  expect(pricingCalculator.calculateCacheReadCost(cacheReadTokens)).toBeCloseTo(
    (cacheReadTokens * 0.0003) / 1000,
    6
  )
  expect(pricingCalculator.calculateCacheWriteCost(cacheWriteTokens)).toBeCloseTo(
    (cacheWriteTokens * 0.00375) / 1000,
    6
  )
})

test('should get pricing information', () => {
  const modelId = 'anthropic.claude-sonnet-4-20250514-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

  const pricing = pricingCalculator.getPricing()

  expect(pricing).toEqual({
    input: 0.003,
    output: 0.015,
    cacheRead: 0.0003,
    cacheWrite: 0.00375
  })
})

test('should return undefined pricing for unknown model', () => {
  const modelId = 'unknown-model'
  const pricingCalculator = new PricingCalculator(modelId)

  const pricing = pricingCalculator.getPricing()

  expect(pricing).toBeUndefined()
})

test('should format currency with default settings', () => {
  const value = 0.012345
  const formatted = PricingCalculator.formatCurrency(value)

  expect(formatted).toBe('$0.012345')
})

test('should format currency with custom locale', () => {
  const value = 0.012345
  const formatted = PricingCalculator.formatCurrency(value, 'USD', 'ja-JP')

  expect(formatted).toBe('$0.012345')
})

test('should format zero value', () => {
  const value = 0
  const formatted = PricingCalculator.formatCurrency(value)

  expect(formatted).toBe('$0.000000')
})

test('should calculate cost for Nova Pro', () => {
  const modelId = 'amazon.nova-pro-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const expectedCost =
    (inputTokens * 0.0008 +
      outputTokens * 0.0032 +
      cacheReadTokens * 0.0002 +
      cacheWriteTokens * 0) /
    1000

  const actualCost = pricingCalculator.calculateTotalCost(
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})

test('should calculate cost for Nova Lite', () => {
  const modelId = 'amazon.nova-lite-v1:0'
  const pricingCalculator = new PricingCalculator(modelId)

  const inputTokens = 1000
  const outputTokens = 500
  const cacheReadTokens = 200
  const cacheWriteTokens = 100

  const expectedCost =
    (inputTokens * 0.00006 +
      outputTokens * 0.00024 +
      cacheReadTokens * 0.000015 +
      cacheWriteTokens * 0) /
    1000

  const actualCost = pricingCalculator.calculateTotalCost(
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens
  )

  expect(actualCost).toBeCloseTo(expectedCost, 6)
})
