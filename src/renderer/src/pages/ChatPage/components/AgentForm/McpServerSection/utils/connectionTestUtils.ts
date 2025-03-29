import {
  ConnectionResultsMap,
  ConnectionSummary,
  ConnectionTestResult
} from '../types/mcpServer.types'

/**
 * 接続テスト結果のサマリーを生成する
 * @param results 接続テスト結果のオブジェクト
 * @param totalServers 全サーバー数
 * @returns {ConnectionSummary} テスト結果のサマリー
 */
export function generateConnectionSummary(
  results: ConnectionResultsMap,
  totalServers: number
): ConnectionSummary {
  const testedServers = Object.keys(results).length
  const successServers = Object.values(results).filter((r) => r.success).length

  return {
    total: totalServers,
    success: successServers,
    failed: testedServers - successServers,
    notTested: totalServers - testedServers
  }
}

/**
 * 接続テスト結果を整形する
 * @param result APIから返された生の結果
 * @returns {ConnectionTestResult} 整形された結果オブジェクト
 */
export function formatConnectionResult(result: any): ConnectionTestResult {
  return {
    success: result.success,
    message: result.message,
    testedAt: Date.now(),
    details: result.details || {}
  }
}
