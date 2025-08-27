import type { ModelConfig } from './models'
import { getModelConfig } from './models'

/**
 * Class responsible for pricing calculations
 */
export class PricingCalculator {
  private modelPricing: ModelConfig['pricing']

  constructor(modelId: string) {
    const config = getModelConfig(modelId)
    this.modelPricing = config?.pricing
  }

  /**
   * Calculate the cost for input tokens
   */
  calculateInputCost(tokens: number): number {
    if (!this.modelPricing) return 0
    return (tokens * this.modelPricing.input) / 1000
  }

  /**
   * Calculate the cost for output tokens
   */
  calculateOutputCost(tokens: number): number {
    if (!this.modelPricing) return 0
    return (tokens * this.modelPricing.output) / 1000
  }

  /**
   * Calculate the cost for cache read tokens
   */
  calculateCacheReadCost(tokens: number): number {
    if (!this.modelPricing) return 0
    return (tokens * this.modelPricing.cacheRead) / 1000
  }

  /**
   * Calculate the cost for cache write tokens
   */
  calculateCacheWriteCost(tokens: number): number {
    if (!this.modelPricing) return 0
    return (tokens * this.modelPricing.cacheWrite) / 1000
  }

  /**
   * Calculate the total cost
   */
  calculateTotalCost(
    inputTokens: number,
    outputTokens: number,
    cacheReadTokens: number = 0,
    cacheWriteTokens: number = 0
  ): number {
    return (
      this.calculateInputCost(inputTokens) +
      this.calculateOutputCost(outputTokens) +
      this.calculateCacheReadCost(cacheReadTokens) +
      this.calculateCacheWriteCost(cacheWriteTokens)
    )
  }

  /**
   * Get pricing information
   */
  getPricing(): ModelConfig['pricing'] | undefined {
    return this.modelPricing
  }

  /**
   * Function to format numbers in currency format (static method)
   */
  static formatCurrency(value: number, currency: string = 'USD', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }).format(value)
  }
}
