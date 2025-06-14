/**
 * XML生成の進捗を計算するユーティリティ関数
 * XMLタグの構造完了度に基づいて0-100%の進捗を算出
 */

/**
 * ストリーミング中のXML内容から生成進捗を計算する
 *
 * @param streamingContent ストリーミング中のテキスト内容
 * @returns 0-100の進捗パーセンテージ
 */
export const calculateXmlProgress = (streamingContent: string): number => {
  if (!streamingContent) return 0

  let progress = 0

  // 基本的な進捗段階の定義
  const progressStages = [
    { pattern: /<mxfile[^>]*>/i, progress: 20, description: 'ファイル構造開始' },
    { pattern: /<diagram[^>]*>/i, progress: 40, description: 'ダイアグラム構造開始' },
    { pattern: /<mxGraphModel[^>]*>/i, progress: 60, description: 'グラフモデル開始' },
    { pattern: /<mxCell[^>]*>/i, progress: 75, description: '図形要素開始' },
    { pattern: /<\/mxfile>/i, progress: 100, description: '生成完了' }
  ]

  // 各段階をチェックして最大進捗を取得
  for (const stage of progressStages) {
    if (stage.pattern.test(streamingContent)) {
      progress = Math.max(progress, stage.progress)
    }
  }

  // 複数のmxCellタグがある場合は追加ボーナス
  const mxCellMatches = streamingContent.match(/<mxCell[^>]*>/gi)
  if (mxCellMatches && mxCellMatches.length > 1) {
    const cellBonus = Math.min(15, mxCellMatches.length * 3) // 最大15%のボーナス
    progress = Math.min(95, progress + cellBonus) // 最大95%まで
  }

  // XMLコードブロックの存在チェック
  const hasCodeBlock = /```(?:xml)?/i.test(streamingContent)
  if (hasCodeBlock && progress < 10) {
    progress = 10 // 最低10%の進捗を保証
  }

  // 文字数ベースの補正（長いXMLは進捗が進んでいると仮定）
  const contentLength = streamingContent.length
  if (contentLength > 500 && progress < 50) {
    const lengthBonus = Math.min(20, Math.floor(contentLength / 1000) * 5)
    progress = Math.max(progress, 30 + lengthBonus)
  }

  return Math.min(100, Math.max(0, progress))
}

/**
 * 時間ベースの進捗補正を計算する
 * 長時間の生成に対してUXを改善するための補助的な進捗
 *
 * @param startTime 生成開始時刻
 * @param currentProgress 現在の進捗（0-100）
 * @returns 時間補正後の進捗（0-100）
 */
export const calculateTimeBasedProgress = (startTime: number, currentProgress: number): number => {
  const elapsedTime = Date.now() - startTime
  const elapsedSeconds = elapsedTime / 1000

  // 時間ベースの最低進捗を計算（30秒で50%を保証）
  const timeBasedMinProgress = Math.min(50, (elapsedSeconds / 30) * 50)

  // 現在の進捗と時間ベース進捗の最大値を返す
  return Math.max(currentProgress, timeBasedMinProgress)
}

/**
 * 進捗に応じたメッセージを取得する
 *
 * @param progress 進捗パーセンテージ（0-100）
 * @returns 進捗に応じたメッセージ
 */
export const getProgressMessage = (progress: number): string => {
  if (progress >= 100) return 'ダイアグラム生成完了'
  if (progress >= 75) return '図形要素を配置中...'
  if (progress >= 60) return 'グラフ構造を構築中...'
  if (progress >= 40) return 'ダイアグラム構造を作成中...'
  if (progress >= 20) return 'ファイル構造を初期化中...'
  if (progress >= 10) return 'XML生成を開始中...'
  return '生成中...'
}
