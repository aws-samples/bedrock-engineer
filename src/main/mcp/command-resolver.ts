import { existsSync } from 'fs'
import { join } from 'path'

/**
 * コマンドのパスを解決する関数
 * ローカルの実行可能ファイルを優先的に検索し、見つからない場合はシステムPATHに依存する
 */
export function resolveCommand(command: string): string {
  // 既に絶対パスまたは相対パスの場合はそのまま返す
  if (command.includes('/') || command.includes('\\')) {
    return command
  }

  // よく使われるコマンドの一般的なパスを確認
  const commonPaths = [
    // Node.js系
    join(process.cwd(), 'node_modules', '.bin', command),
    join(process.cwd(), 'node_modules', '.bin', `${command}.cmd`), // Windows
    join(process.cwd(), 'node_modules', '.bin', `${command}.ps1`), // PowerShell

    // システム系
    `/usr/local/bin/${command}`,
    `/opt/homebrew/bin/${command}`, // Apple Silicon Mac
    `/usr/bin/${command}`,
    `/bin/${command}`,

    // Python/pipx系
    join(process.env.HOME || '', '.local', 'bin', command),

    // Windows系
    `C:\\Program Files\\nodejs\\${command}.exe`,
    `C:\\Windows\\System32\\${command}.exe`
  ]

  // 存在する最初のパスを返す
  for (const path of commonPaths) {
    if (existsSync(path)) {
      return path
    }
  }

  // 見つからない場合は元のコマンド名をそのまま返す（システムPATHに依存）
  return command
}
