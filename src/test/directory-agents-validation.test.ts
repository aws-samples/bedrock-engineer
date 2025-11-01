import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { z } from 'zod'

/**
 * EnvironmentContextSettings のスキーマ定義
 * todoListInstruction プロパティは削除済みのため含まない
 */
const EnvironmentContextSettingsSchema = z
  .object({
    projectRule: z.boolean(),
    visualExpressionRules: z.boolean()
  })
  .strict() // 余分なプロパティを許可しない

/**
 * Directory Agents のYAMLファイルを検証するテスト
 */
describe('Directory Agents YAML Validation', () => {
  const directoryAgentsPath = path.resolve(__dirname, '../renderer/src/assets/directory-agents')

  // YAMLファイルを全て取得
  const yamlFiles = fs
    .readdirSync(directoryAgentsPath)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))

  describe('Environment Context Settings Validation', () => {
    yamlFiles.forEach((file) => {
      describe(file, () => {
        const filePath = path.join(directoryAgentsPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const agent = yaml.load(content) as any

        it('should not contain todoListInstruction property', () => {
          const settings = agent.environmentContextSettings

          // todoListInstruction プロパティが存在しないことを確認
          expect(settings).toBeDefined()
          expect(settings).not.toHaveProperty('todoListInstruction')
        })

        it('should have valid environmentContextSettings structure', () => {
          const settings = agent.environmentContextSettings

          expect(settings).toBeDefined()

          // zod でバリデーション
          const result = EnvironmentContextSettingsSchema.safeParse(settings)

          if (!result.success) {
            // エラー詳細を出力
            console.error(`Validation failed for ${file}:`)
            console.error(result.error.format())
          }

          expect(result.success).toBe(true)
        })

        it('should have only projectRule and visualExpressionRules properties', () => {
          const settings = agent.environmentContextSettings

          expect(settings).toBeDefined()

          // プロパティのキーを取得
          const keys = Object.keys(settings)

          // 許可されたプロパティのみが存在することを確認
          expect(keys).toHaveLength(2)
          expect(keys).toContain('projectRule')
          expect(keys).toContain('visualExpressionRules')
        })

        it('should have boolean values for all properties', () => {
          const settings = agent.environmentContextSettings

          expect(settings).toBeDefined()
          expect(typeof settings.projectRule).toBe('boolean')
          expect(typeof settings.visualExpressionRules).toBe('boolean')
        })
      })
    })
  })

  describe('File Statistics', () => {
    it('should report the number of YAML files', () => {
      console.log(`\nTotal YAML files found: ${yamlFiles.length}`)
      expect(yamlFiles.length).toBeGreaterThan(0)
    })
  })
})
