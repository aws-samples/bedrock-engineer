/**
 * 設定管理コマンド
 */
import { Command } from 'commander'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import { loadConfig, updateAwsConfig, updateProjectPath, getConfigDir } from '../utils/config'

export function registerConfigCommand(program: Command): void {
  program
    .command('config')
    .description('CLI設定の管理')
    .option('-r, --region <region>', 'AWS リージョンを設定')
    .option('-k, --key <accessKeyId>', 'AWS アクセスキー ID を設定')
    .option('-s, --secret <secretAccessKey>', 'AWS シークレットアクセスキーを設定')
    .option('-p, --profile <profile>', 'AWS プロファイル名を設定')
    .option('--project <path>', 'プロジェクトディレクトリのパスを設定')
    .option('--show', '現在の設定を表示')
    .action(async (options) => {
      try {
        // 現在の設定を読み込み
        const currentConfig = loadConfig()

        // 設定が変更されたかどうか
        let configUpdated = false

        // AWSリージョンが指定された場合
        if (options.region) {
          updateAwsConfig(options.region)
          console.log(chalk.green(`AWS リージョンを ${options.region} に設定しました`))
          configUpdated = true
        }

        // AWSアクセスキーIDが指定された場合
        if (options.key) {
          updateAwsConfig(undefined, options.key)
          console.log(chalk.green(`AWS アクセスキー ID を設定しました`))
          configUpdated = true
        }

        // AWSシークレットアクセスキーが指定された場合
        if (options.secret) {
          updateAwsConfig(undefined, undefined, options.secret)
          console.log(chalk.green(`AWS シークレットアクセスキーを設定しました`))
          configUpdated = true
        }

        // AWSプロファイルが指定された場合
        if (options.profile) {
          updateAwsConfig(undefined, undefined, undefined, options.profile)
          console.log(chalk.green(`AWS プロファイルを ${options.profile} に設定しました`))
          configUpdated = true
        }

        // プロジェクトパスが指定された場合
        if (options.project) {
          // パスを絶対パスに変換
          const projectPath = path.resolve(options.project)
          
          // ディレクトリが存在するか確認
          if (!fs.existsSync(projectPath)) {
            console.log(chalk.red(`指定されたパス ${projectPath} が存在しません`))
            return
          }
          
          updateProjectPath(projectPath)
          console.log(chalk.green(`プロジェクトパスを ${projectPath} に設定しました`))
          
          // .bedrock-engineerディレクトリがない場合は警告
          const bedrockDir = path.join(projectPath, '.bedrock-engineer')
          if (!fs.existsSync(bedrockDir)) {
            console.log(chalk.yellow(`警告: ${bedrockDir} ディレクトリが見つかりません`))
            console.log(chalk.yellow('これはBedrock Engineerプロジェクトではないかもしれません'))
            console.log(chalk.yellow(`ディレクトリを作成するには: mkdir -p ${bedrockDir}/agents`))
          }
          
          configUpdated = true
        }

        // 何も指定されていない、または --show オプションが指定された場合は現在の設定を表示
        if (!configUpdated || options.show) {
          console.log(chalk.bold('現在の設定:'))
          console.log('')
          console.log(chalk.bold('AWS設定:'))
          console.log(` リージョン: ${chalk.cyan(currentConfig.aws.region)}`)

          if (currentConfig.aws.profile) {
            console.log(` プロファイル: ${chalk.cyan(currentConfig.aws.profile)}`)
          } else {
            const hasCredentials = !!currentConfig.aws.credentials?.accessKeyId && 
                                   !!currentConfig.aws.credentials?.secretAccessKey
            
            console.log(` 認証情報: ${hasCredentials ? chalk.green('設定済み') : chalk.yellow('未設定')}`)
          }

          console.log('')
          console.log(chalk.bold('プロジェクト設定:'))
          if (currentConfig.project.path) {
            console.log(` パス: ${chalk.cyan(currentConfig.project.path)}`)
            
            // エージェントディレクトリの存在確認
            const agentsDir = path.join(currentConfig.project.path, '.bedrock-engineer/agents')
            if (fs.existsSync(agentsDir)) {
              const agentFiles = fs.readdirSync(agentsDir).filter(
                file => file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')
              )
              console.log(` エージェント数: ${chalk.cyan(agentFiles.length)}`)
            } else {
              console.log(` エージェント: ${chalk.yellow('ディレクトリが見つかりません')}`)
            }
          } else {
            console.log(` パス: ${chalk.yellow('未設定')}`)
            console.log(` ヒント: ${chalk.green('--project <path>')} オプションでプロジェクトパスを設定してください`)
          }

          console.log('')
          console.log(chalk.dim(`設定ファイルの場所: ${path.join(getConfigDir(), 'cli-config.json')}`))
        }
      } catch (error) {
        console.error(chalk.red('設定の更新に失敗しました:'), error)
      }
    })
}