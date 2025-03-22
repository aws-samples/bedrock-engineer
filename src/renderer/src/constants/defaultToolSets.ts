import { ToolState } from '@/types/agent-chat'

// カテゴリー毎のデフォルトツール設定（名前のみを定義）
// 実際のツールオブジェクトはgetToolsForCategory関数内でwindow.toolsから取得
const DEFAULT_TOOL_NAMES: Record<string, string[]> = {
  // 一般的な目的向け - 基本的なツールのみ
  general: ['readFiles', 'listFiles', 'tavilySearch', 'fetchWebsite'],

  // ソフトウェア開発向け - コード関連ツールを強化
  coding: [
    'createFolder',
    'writeToFile',
    'readFiles',
    'listFiles',
    'applyDiffEdit',
    'moveFile',
    'copyFile',
    'tavilySearch',
    'executeCommand'
  ],

  // デザインとクリエイティブ向け
  design: ['readFiles', 'listFiles', 'fetchWebsite', 'tavilySearch', 'generateImage'],

  // データ分析向け
  data: ['readFiles', 'listFiles', 'tavilySearch', 'fetchWebsite', 'retrieve', 'executeCommand'],

  // ビジネスと生産性向け
  business: ['readFiles', 'listFiles', 'tavilySearch', 'fetchWebsite', 'retrieve'],

  all: [
    'createFolder',
    'writeToFile',
    'readFiles',
    'listFiles',
    'applyDiffEdit',
    'moveFile',
    'copyFile',
    'tavilySearch',
    'fetchWebsite',
    'retrieve',
    'generateImage',
    'invokeBedrockAgent',
    'executeCommand'
  ],

  // カスタム設定用（すべて名前指定なし - 空配列）
  custom: []
}

/**
 * カテゴリに基づいてツール設定を取得するヘルパー関数
 *
 * @param category エージェントカテゴリ
 * @param allTools 利用可能なすべてのツール
 * @returns カテゴリに基づいて設定されたツールリスト
 */
export const getToolsForCategory = (category: string, allTools: ToolState[]): ToolState[] => {
  const categoryNames = DEFAULT_TOOL_NAMES[category] || []

  // カテゴリに基づいてツール設定を生成
  return allTools.map((tool) => {
    const toolName = tool.toolSpec?.name
    if (!toolName) return { ...tool, enabled: false }

    return {
      ...tool,
      enabled: categoryNames.includes(toolName)
    }
  })
}
