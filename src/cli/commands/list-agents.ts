/**
 * エージェント一覧表示コマンド
 */
import { Command } from 'commander'
import chalk from 'chalk'
import { getAgents } from '../services/agent-service'
import { loadConfig } from '../utils/config'
import path from 'path'

export function registerListAgentsCommand(program: Command): void {
  program
    .command('list-agents')
    .alias('agents')
    .description('利用可能なエージェント一覧を表示します')
    .option('-v, --verbose', '詳細情報を表示')
    .action(async (options) => {
      try {
        // 設定読み込み
        const config = loadConfig()
        
        if (!config.project.path) {
          console.log(
            chalk.yellow(
              'プロジェクトパスが設定されていません。デフォルトエージェントのみ表示します。'
            )
          )
          console.log(
            chalk.yellow(
              'カスタムエージェントを表示するには: bedrock-cli config --project <path>'
            )
          )
          console.log('')
        } else {
          console.log(
            chalk.green(
              `プロジェクト: ${config.project.path}`
            )
          )
          console.log(
            chalk.dim(
              `エージェント定義ディレクトリ: ${path.join(config.project.path, '.bedrock-engineer/agents')}`
            )
          )
          console.log('')
        }

        // エージェント一覧を取得
        const agents = await getAgents()
        
        if (agents.length === 0) {
          console.log(chalk.yellow('利用可能なエージェントが見つかりませんでした。'))
          return
        }

        console.log(chalk.bold('利用可能なエージェント一覧:'))
        console.log('')

        // エージェントを表示
        agents.forEach((agent, index) => {
          // エージェントのタイプ（デフォルトかカスタムか）
          const agentType = agent.isCustom ? chalk.blue('[カスタム]') : chalk.green('[デフォルト]')
          
          console.log(`${chalk.bold(index + 1)}. ${chalk.cyan(agent.name)} ${agentType} [ID: ${agent.id}]`)
          console.log(`   ${agent.description || '説明なし'}`)
          
          // 詳細モードの場合は追加情報を表示
          if (options.verbose) {
            if (agent.tags && agent.tags.length > 0) {
              console.log(`   ${chalk.dim('タグ:')} ${agent.tags.join(', ')}`)
            }
          }
          
          console.log('')
        })

        console.log(chalk.bold('使用法:'))
        console.log(`  ${chalk.green('bedrock-cli chat --agent <agent-id>')}`)
        console.log(`  例: ${chalk.green('bedrock-cli chat --agent software-developer')}`)
      } catch (error) {
        console.error(chalk.red('エージェント一覧の取得に失敗しました:'), error)
      }
    })
}