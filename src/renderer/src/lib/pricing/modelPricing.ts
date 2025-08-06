// Electron rendererプロセスからmainプロセスの関数を直接インポートできないため、
// IPCを通して価格情報を取得するAPIを使用する必要があります。
// 現在は簡略化のため、直接的な実装を維持しています。

interface ModelPricing {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

/**
 * モデルの価格情報を取得
 * TODO: IPCを通してmainプロセスのgetModelPricing()を呼び出すように変更
 */
const getModelPricingLocal = (modelId: string): ModelPricing | null => {
  // Claude 3.7 Sonnet
  if (modelId.includes('claude-3-7-sonnet')) {
    return { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  }
  // Claude 3.5 Sonnet
  if (modelId.includes('claude-3-5-sonnet')) {
    return { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  }
  // Claude 3.5 Haiku
  if (modelId.includes('claude-3-5-haiku')) {
    return { input: 0.0008, output: 0.004, cacheRead: 0.00008, cacheWrite: 0.001 }
  }
  // Claude 3 Haiku
  if (modelId.includes('claude-3-haiku')) {
    return { input: 0.0008, output: 0.004, cacheRead: 0.00008, cacheWrite: 0.001 }
  }
  // Claude 3 Sonnet
  if (modelId.includes('claude-3-sonnet')) {
    return { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  }
  // Claude 3 Opus
  if (modelId.includes('claude-3-opus')) {
    return { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 }
  }
  // Claude Opus 4.1
  if (modelId.includes('claude-opus-4-1')) {
    return { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 }
  }
  // Claude Opus 4
  if (modelId.includes('claude-opus-4')) {
    return { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 }
  }
  // Claude Sonnet 4
  if (modelId.includes('claude-sonnet-4')) {
    return { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 }
  }
  // Nova Pro
  if (modelId.includes('nova-pro')) {
    return { input: 0.0008, output: 0.0032, cacheRead: 0.0002, cacheWrite: 0 }
  }
  // Nova Lite
  if (modelId.includes('nova-lite')) {
    return { input: 0.00006, output: 0.00024, cacheRead: 0.000015, cacheWrite: 0 }
  }
  // Nova Micro
  if (modelId.includes('nova-micro')) {
    return { input: 0.000035, output: 0.00014, cacheRead: 0.00000875, cacheWrite: 0 }
  }

  return null
}

/**
 * モデルIDとトークン使用量からコストを計算する関数
 * @param modelId モデルID
 * @param inputTokens 入力トークン数
 * @param outputTokens 出力トークン数
 * @param cacheReadTokens キャッシュ読み取りトークン数
 * @param cacheWriteTokens キャッシュ書き込みトークン数
 * @returns 計算されたコスト（ドル）
 */
export const calculateCost = (
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0
): number => {
  const pricing = getModelPricingLocal(modelId)
  if (!pricing) return 0

  // 1000トークンあたりの価格で計算し、結果を1000で割る
  return (
    (inputTokens * pricing.input +
      outputTokens * pricing.output +
      cacheReadTokens * pricing.cacheRead +
      cacheWriteTokens * pricing.cacheWrite) /
    1000
  )
}

/**
 * バックワード互換性のためのmodelPricingオブジェクト
 *
 * @deprecated このオブジェクトは削除予定です。calculateCost()関数を直接使用してください。
 */
export const modelPricing = {
  // Claude 3 Sonnet
  '3-7-sonnet': { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 },
  '3-5-sonnet': { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 },
  // Claude 3 Haiku
  '3-5-haiku': { input: 0.0008, output: 0.004, cacheRead: 0.00008, cacheWrite: 0.001 },
  // Claude 3 Opus
  '3-5-opus': { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 },
  // Claude 4 Models
  'sonnet-4': { input: 0.003, output: 0.015, cacheRead: 0.0003, cacheWrite: 0.00375 },
  'opus-4': { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 },
  'opus-4-1': { input: 0.015, output: 0.075, cacheRead: 0.0015, cacheWrite: 0.01875 },
  // Nova
  'nova-pro': { input: 0.0008, output: 0.0032, cacheRead: 0.0002, cacheWrite: 0 },
  'nova-lite': { input: 0.00006, output: 0.00024, cacheRead: 0.000015, cacheWrite: 0 },
  'nova-micro': { input: 0.000035, output: 0.00014, cacheRead: 0.00000875, cacheWrite: 0 }
}

/**
 * 数値を通貨形式でフォーマットする関数
 * @param value フォーマットする数値
 * @param currency 通貨コード（デフォルト: 'USD'）
 * @param locale ロケール（デフォルト: 'en-US'）
 * @returns フォーマットされた通貨文字列
 */
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  }).format(value)
}
