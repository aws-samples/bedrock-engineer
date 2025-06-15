/**
 * CLI アプリケーションのエントリーポイント
 */
import { Command } from 'commander'
import { registerListAgentsCommand } from './commands/list-agents'
// import { registerChatCommand } from './commands/chat'
import fs from 'fs'
import path from 'path'

// パッケージ情報を読み込み
const packageJsonPath = path.join(__dirname, '../../package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

// プログラムインスタンスを作成
const program = new Command()
program
  .name('bedrock-cli')
  .description('Bedrock Engineer Command Line Interface')
  .version(packageJson.version)

// コマンドを登録
registerListAgentsCommand(program)
// registerChatCommand(program)

// エラーハンドリングを設定
program.exitOverride((err) => {
  if (err.code === 'commander.helpDisplayed') {
    process.exit(0)
  }

  if (err.code === 'commander.unknownCommand') {
    console.error(`エラー: 不明なコマンド '${err.message.split("'")[1]}'`)
    console.log(`'bedrock-cli --help' でヘルプを表示`)
    process.exit(1)
  }

  console.error(`エラー: ${err.message}`)
  process.exit(1)
})

export { program }
