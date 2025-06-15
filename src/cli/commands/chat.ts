/**
 * チャットコマンド
 */
import { Command } from 'commander'
import chalk from 'chalk'
import readline from 'readline'
import inquirer from 'inquirer'
import { getAgents, getAgentById, sendMessage } from '../services/agent-service'
import { createSession, addMessage } from '../services/session-service'
import { loadConfig } from '../utils/config'

// コマンド登録
export function registerChatCommand(program: Command): void {
  program
    .command('chat')
    .description('エージェントとチャットを開始')
    .option('-a, --agent <id>', 'エージェントID')
    .option('-m, --model <id>', 'モデルID', 'anthropic.claude-3-5-sonnet-20240620-v1:0')
    .action(async (options) => {
      try {
        // 設定読み込み
        const config = loadConfig()
        
        if (!config.project.path) {
          console.log(
            chalk.yellow(
              'プロジェクトパスが設定されていません。推奨：bedrock-cli config --project <path>'
            )
          )
          console.log('')
        }
        
        // エージェント選択
        let agentId = options.agent
        
        // エージェントIDが指定されていない場合は対話形式で選択
        if (!agentId) {
          const agents = await getAgents()
          
          if (agents.length === 0) {
            console.log(chalk.yellow('利用可能なエージェントがありません'))
            return
          }
          
          const choices = agents.map(agent => ({
            name: `${agent.name} - ${agent.description || '説明なし'}`,
            value: agent.id
          }))
          
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'agentId',
              message: 'チャットするエージェントを選択してください:',
              choices
            }
          ])
          
          agentId = answer.agentId
        }
        
        // 選択したエージェントの情報を取得
        const agent = await getAgentById(agentId)
        
        if (!agent) {
          console.log(chalk.red(`エージェントID "${agentId}" が見つかりません`))
          return
        }
        
        // セッション作成
        const sessionId = createSession(agentId, options.model)
        
        console.log(chalk.bold.green(`${agent.name} とのチャットを開始します`))
        console.log(chalk.dim(`セッションID: ${sessionId}`))
        console.log(chalk.dim('終了するには "exit" または "quit" と入力してください'))
        console.log(chalk.dim('-------------------'))
        
        // 読み込みインターフェイス
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          prompt: chalk.bold('あなた> ')
        })
        
        // 初期プロンプト
        rl.prompt()
        
        // 入力処理
        rl.on('line', async (line) => {
          const input = line.trim()
          
          // 終了コマンド
          if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            rl.close()
            return
          }
          
          // 空入力
          if (!input) {
            rl.prompt()
            return
          }
          
          try {
            // メッセージ送信
            addMessage(sessionId, 'user', input)
            
            console.log(chalk.dim('-------------------'))
            console.log(chalk.bold.blue(`${agent.name}> `))
            
            // 応答を取得（現在はモック）
            const response = await sendMessage(agentId, input, options.model)
            
            // 応答を表示
            console.log(response)
            
            // セッションに応答を保存
            addMessage(sessionId, 'assistant', response)
            
            console.log(chalk.dim('-------------------'))
            rl.prompt()
          } catch (error) {
            console.error(chalk.red('エラーが発生しました:'), error)
            rl.prompt()
          }
        })
        
        // 終了処理
        rl.on('close', () => {
          console.log(chalk.green('\nチャットセッションを終了しました'))
          process.exit(0)
        })
      } catch (error) {
        console.error(chalk.red('エラーが発生しました:'), error)
      }
    })
}