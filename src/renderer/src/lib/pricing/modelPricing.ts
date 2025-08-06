/**
 * モデルごとの価格設定（1000トークンあたりのドル価格）
 * バージニア北部
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
  // モデルIDからモデルタイプを特定
  const pricing = Object.entries(modelPricing).find(([key]) => modelId.includes(key))?.[1]
  if (pricing == null) return 0

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
