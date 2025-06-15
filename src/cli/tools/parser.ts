/**
 * ツール使用リクエストのパーサー
 */
import { ToolName, ToolInput } from '../../types/tools'

/**
 * ツール呼び出しのパターン
 */
const TOOL_PATTERN = /```(?:json)?\s*\{\s*"action":\s*"(\w+)"[^}]*}/i

/**
 * ツール使用要求をパースする
 */
export function parseToolRequest(message: string): { detected: boolean; toolName?: ToolName; input?: any } {
  // ツール使用パターンを検索
  const match = message.match(TOOL_PATTERN)
  if (!match) {
    return { detected: false }
  }
  
  try {
    // JSONブロック全体を抽出
    const startIndex = message.indexOf('{', message.indexOf(match[1]))
    const endIndex = message.indexOf('}', startIndex) + 1
    const jsonContent = message.substring(startIndex, endIndex)
    
    // JSONをパース
    const parsed = JSON.parse(jsonContent)
    const toolName = parsed.action as ToolName
    
    // 入力データを抽出
    const { action, ...input } = parsed
    
    return {
      detected: true,
      toolName,
      input
    }
  } catch (error) {
    console.error('Failed to parse tool request:', error)
    return { detected: false }
  }
}

/**
 * ツール結果をフォーマットする
 */
export function formatToolResult(toolName: ToolName, result: any, success: boolean): string {
  const resultObj = {
    tool: toolName,
    success,
    result: success ? result : null,
    error: !success ? result : null
  }
  
  return `\`\`\`json\n${JSON.stringify(resultObj, null, 2)}\n\`\`\``
}