/**
 * CLIツールレジストリ
 */
import { BuiltInToolName, isBuiltInTool, isMcpTool, ToolName, ToolInput, ToolResult } from '../../types/tools'
import { CliTool, CliToolCategory } from './types'
import { ThinkTool } from './handlers/utility/think'

class CliToolRegistry {
  private tools: Map<ToolName, CliTool> = new Map()
  private categories: Map<CliToolCategory, Set<ToolName>> = new Map()
  
  constructor() {
    this.initializeCategories()
    this.registerBuiltinTools()
  }
  
  /**
   * カテゴリを初期化
   */
  private initializeCategories(): void {
    const categories: CliToolCategory[] = [
      'filesystem',
      'web',
      'bedrock',
      'utility', 
      'system'
    ]
    
    categories.forEach(category => {
      this.categories.set(category, new Set())
    })
  }
  
  /**
   * 組み込みツールを登録
   */
  private registerBuiltinTools(): void {
    // ユーティリティツール
    this.register(new ThinkTool(), 'utility')
    
    // 今後他のツールも追加予定
  }
  
  /**
   * ツールを登録
   */
  register(tool: CliTool, category: CliToolCategory): void {
    // メインレジストリに追加
    this.tools.set(tool.name, tool)
    
    // カテゴリにも追加
    const categorySet = this.categories.get(category)
    if (categorySet) {
      categorySet.add(tool.name)
    }
    
    console.log(`Registered CLI tool: ${tool.name} (${category})`)
  }
  
  /**
   * ツールを取得
   */
  getTool(name: ToolName): CliTool | undefined {
    return this.tools.get(name)
  }
  
  /**
   * ツールを実行
   */
  async executeTool(toolName: ToolName, input: any): Promise<ToolResult> {
    const tool = this.getTool(toolName)
    
    if (!tool) {
      return {
        name: toolName,
        success: false,
        error: `Tool "${toolName}" not found or not implemented in CLI mode`,
        result: null
      }
    }
    
    try {
      return await tool.execute(input)
    } catch (error) {
      return {
        name: toolName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        result: null
      }
    }
  }
  
  /**
   * 利用可能なツール一覧を取得
   */
  getAvailableTools(): Array<{ name: ToolName, description: string, category: CliToolCategory }> {
    const result: Array<{ name: ToolName, description: string, category: CliToolCategory }> = []
    
    for (const [category, toolNames] of this.categories.entries()) {
      for (const toolName of toolNames) {
        const tool = this.getTool(toolName)
        if (tool) {
          result.push({
            name: toolName,
            description: tool.description,
            category
          })
        }
      }
    }
    
    return result
  }
}

// シングルトンインスタンス
export const cliToolRegistry = new CliToolRegistry()