import { calculateCost } from '@renderer/lib/pricing/modelPricing'
import { IdentifiableMessage } from '@/types/chat/message'

/**
 * メタデータに基づいてセッションコストを計算
 */
export function calculateSessionCost(
  modelId: string,
  metadata: IdentifiableMessage['metadata']
): number | undefined {
  if (
    !modelId ||
    !metadata?.converseMetadata?.usage ||
    !metadata.converseMetadata.usage.inputTokens ||
    !metadata.converseMetadata.usage.outputTokens
  ) {
    return undefined
  }

  try {
    return calculateCost(
      modelId,
      metadata.converseMetadata.usage.inputTokens,
      metadata.converseMetadata.usage.outputTokens,
      metadata.converseMetadata.usage.cacheReadInputTokens,
      metadata.converseMetadata.usage.cacheWriteInputTokens
    )
  } catch (error) {
    console.error('Error calculating cost:', error)
    return undefined
  }
}
