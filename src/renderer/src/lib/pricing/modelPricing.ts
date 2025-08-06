interface ModelPricing {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

/**
 * モデルの価格情報を取得
 * IPCを通してmainプロセスのgetModelPricing()を呼び出す
 */
const getModelPricing = async (modelId: string): Promise<ModelPricing | null> => {
  return window.api.bedrock.getModelPricing(modelId)
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
export const calculateCost = async (
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0
): Promise<number> => {
  const pricing = await getModelPricing(modelId)
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
