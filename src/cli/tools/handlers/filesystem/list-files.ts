/**
 * CLIモード用のlistFilesツール
 * ファイル一覧を表示する
 */
import fs from 'fs'
import path from 'path'
import { ToolName, ListFilesInput } from '../../../../types/tools'
import { CliTool } from '../../types'

export class ListFilesTool implements CliTool {
  name: ToolName = 'listFiles'
  description = 'ディレクトリ内のファイル一覧を取得します'
  
  async execute(input: ListFilesInput): Promise<{ name: ToolName; success: boolean; result: any; error?: string }> {
    try {
      const targetPath = path.resolve(input.path)
      const options = input.options || {}
      const maxDepth = options.maxDepth || 3
      const ignorePatterns = options.ignoreFiles || ['.git', 'node_modules', '.DS_Store']
      const recursive = options.recursive !== false // デフォルトはtrue
      
      // ディレクトリが存在するか確認
      if (!fs.existsSync(targetPath)) {
        return {
          name: this.name,
          success: false,
          error: `Path does not exist: ${targetPath}`,
          result: null
        }
      }
      
      // ディレクトリかどうか確認
      const stats = fs.statSync(targetPath)
      if (!stats.isDirectory()) {
        return {
          name: this.name,
          success: false,
          error: `Path is not a directory: ${targetPath}`,
          result: null
        }
      }
      
      // ファイル一覧を取得
      const fileTree = this.buildFileTree(targetPath, maxDepth, ignorePatterns, recursive)
      
      return {
        name: this.name,
        success: true,
        result: fileTree
      }
    } catch (error) {
      return {
        name: this.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        result: null
      }
    }
  }
  
  /**
   * ファイル構造を再帰的に取得する
   */
  private buildFileTree(
    dirPath: string,
    maxDepth: number,
    ignorePatterns: string[],
    recursive: boolean,
    currentDepth = 0
  ): string {
    if (currentDepth > maxDepth) {
      return `${path.basename(dirPath)}/ [max depth reached]`
    }
    
    const indent = '  '.repeat(currentDepth)
    const dirName = currentDepth === 0 ? dirPath : path.basename(dirPath)
    let result = `${indent}${dirName}/\n`
    
    try {
      const files = fs.readdirSync(dirPath)
      
      for (const file of files) {
        // 無視リストにあるファイルはスキップ
        if (ignorePatterns.some(pattern => file.includes(pattern))) {
          continue
        }
        
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)
        
        if (stats.isDirectory() && recursive) {
          // ディレクトリの場合は再帰
          result += this.buildFileTree(filePath, maxDepth, ignorePatterns, recursive, currentDepth + 1)
        } else {
          // ファイルの場合
          result += `${indent}  ${file}\n`
        }
      }
    } catch (error) {
      return `${indent}${dirName}/ [error: ${error instanceof Error ? error.message : String(error)}]`
    }
    
    return result
  }
}