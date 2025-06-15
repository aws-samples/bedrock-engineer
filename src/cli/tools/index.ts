/**
 * CLIツールのエントリポイント
 */
import { cliToolRegistry } from './registry'
import { parseToolRequest, formatToolResult } from './parser'
import { ToolName } from '../../types/tools'

/**
 * メッセージからツール使用要求を検出して実行
 * @returns 処理されたメッセージ（ツールの結果またはオリジナル）とツールが検出されたか
 */
export async function processMessage(message: string): Promise<{ 
  processedMessage: string;
  toolDetected: boolean;
  toolName?: ToolName;
  toolSuccess?: boolean;
}> {
  // ツール使用要求の検出
  const { detected, toolName, input } = parseToolRequest(message)
  
  // ツール使用要求がない場合はそのまま返す
  if (!detected || !toolName) {
    return {
      processedMessage: message,
      toolDetected: false
    }
  }
  
  console.log(`Detected tool usage: ${toolName}`)
  
  try {
    // ツールの実行
    const result = await cliToolRegistry.executeTool(toolName, input)
    const formattedResult = formatToolResult(toolName, result.result, result.success)
    
    return {
      processedMessage: formattedResult,
      toolDetected: true,
      toolName,
      toolSuccess: result.success
    }
  } catch (error) {
    // エラー発生時
    const errorMessage = error instanceof Error ? error.message : String(error)
    const formattedResult = formatToolResult(toolName, errorMessage, false)
    
    return {
      processedMessage: formattedResult,
      toolDetected: true,
      toolName,
      toolSuccess: false
    }
  }
}

// ツールレジストリをエクスポート
export { cliToolRegistry }