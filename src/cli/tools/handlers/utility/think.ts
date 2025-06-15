/**
 * CLIモード用のthinkツール
 * LLMの内部思考を表現する
 */
import { ToolName, ThinkInput } from '../../../../types/tools'
import { CliTool } from '../../types'

export class ThinkTool implements CliTool {
  name: ToolName = 'think'
  description = 'エージェントの内部思考を表現します (結果はユーザーには表示されません)'
  
  async execute(input: ThinkInput): Promise<{ name: ToolName; success: boolean; result: any }> {
    // CLIモードでは単に思考内容をログに記録する（ユーザーには表示しない）
    console.log(`Agent thought: ${input.thought}`)
    
    return {
      name: this.name,
      success: true,
      result: '思考内容を処理しました（内部のみ）'
    }
  }
}