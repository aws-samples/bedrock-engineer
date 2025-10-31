import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import {
  CustomAgentSchema,
  AgentIconSchema,
  AgentCategorySchema
} from '../../../../../common/schemas/agent-schema'

describe('Directory Agents YAML Validation', () => {
  const directoryAgentsPath = path.join(
    process.cwd(),
    'src',
    'renderer',
    'src',
    'assets',
    'directory-agents'
  )

  // YAMLファイルの一覧を取得
  const yamlFiles = fs
    .readdirSync(directoryAgentsPath)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))

  describe('Directory structure', () => {
    test('directory-agents directory exists', () => {
      expect(fs.existsSync(directoryAgentsPath)).toBe(true)
    })

    test('directory contains YAML files', () => {
      expect(yamlFiles.length).toBeGreaterThan(0)
    })
  })

  // 各YAMLファイルに対してテスト
  yamlFiles.forEach((filename) => {
    describe(`${filename}`, () => {
      const filePath = path.join(directoryAgentsPath, filename)
      let fileContent: string
      let parsedYaml: any

      beforeAll(() => {
        fileContent = fs.readFileSync(filePath, 'utf8')
      })

      test('file can be read', () => {
        expect(fileContent).toBeTruthy()
        expect(fileContent.length).toBeGreaterThan(0)
      })

      test('YAML can be parsed', () => {
        expect(() => {
          parsedYaml = yaml.load(fileContent)
        }).not.toThrow()
        expect(parsedYaml).toBeTruthy()
      })

      test('conforms to CustomAgent schema', () => {
        if (!parsedYaml) {
          parsedYaml = yaml.load(fileContent)
        }

        const result = CustomAgentSchema.safeParse(parsedYaml)

        if (!result.success) {
          // エラーの詳細を表示
          console.error(`\nValidation errors in ${filename}:`)
          result.error.errors.forEach((err) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`)
          })
        }

        expect(result.success).toBe(true)
      })

      describe('required fields', () => {
        beforeAll(() => {
          if (!parsedYaml) {
            parsedYaml = yaml.load(fileContent)
          }
        })

        test('has id field', () => {
          expect(parsedYaml).toHaveProperty('id')
          expect(typeof parsedYaml.id).toBe('string')
          expect(parsedYaml.id.length).toBeGreaterThan(0)
        })

        test('has name field', () => {
          expect(parsedYaml).toHaveProperty('name')
          expect(typeof parsedYaml.name).toBe('string')
          expect(parsedYaml.name.length).toBeGreaterThan(0)
        })

        test('has description field', () => {
          expect(parsedYaml).toHaveProperty('description')
          expect(typeof parsedYaml.description).toBe('string')
          expect(parsedYaml.description.length).toBeGreaterThan(0)
        })

        test('has system field', () => {
          expect(parsedYaml).toHaveProperty('system')
          expect(typeof parsedYaml.system).toBe('string')
          expect(parsedYaml.system.length).toBeGreaterThan(0)
        })

        test('has scenarios field', () => {
          expect(parsedYaml).toHaveProperty('scenarios')
          expect(Array.isArray(parsedYaml.scenarios)).toBe(true)
        })

        test('has tags field', () => {
          expect(parsedYaml).toHaveProperty('tags')
          expect(Array.isArray(parsedYaml.tags)).toBe(true)
        })

        test('has isCustom field', () => {
          expect(parsedYaml).toHaveProperty('isCustom')
          expect(typeof parsedYaml.isCustom).toBe('boolean')
        })
      })

      describe('scenarios structure', () => {
        beforeAll(() => {
          if (!parsedYaml) {
            parsedYaml = yaml.load(fileContent)
          }
        })

        test('each scenario has title and content', () => {
          parsedYaml.scenarios.forEach((scenario: any) => {
            expect(scenario).toHaveProperty('title')
            expect(scenario).toHaveProperty('content')
            expect(typeof scenario.title).toBe('string')
            expect(typeof scenario.content).toBe('string')
            expect(scenario.title.length).toBeGreaterThan(0)
            expect(scenario.content.length).toBeGreaterThan(0)
          })
        })
      })

      describe('optional fields validation', () => {
        beforeAll(() => {
          if (!parsedYaml) {
            parsedYaml = yaml.load(fileContent)
          }
        })

        test('icon is valid if present', () => {
          if (parsedYaml.icon) {
            const result = AgentIconSchema.safeParse(parsedYaml.icon)
            expect(result.success).toBe(true)
          }
        })

        test('category is valid if present', () => {
          if (parsedYaml.category) {
            const result = AgentCategorySchema.safeParse(parsedYaml.category)
            expect(result.success).toBe(true)
          }
        })

        test('tools are valid if present', () => {
          if (parsedYaml.tools) {
            expect(Array.isArray(parsedYaml.tools)).toBe(true)
            parsedYaml.tools.forEach((tool: any) => {
              expect(typeof tool).toBe('string')
            })
          }
        })

        test('mcpServers structure is valid if present', () => {
          if (parsedYaml.mcpServers) {
            expect(Array.isArray(parsedYaml.mcpServers)).toBe(true)
            parsedYaml.mcpServers.forEach((server: any) => {
              expect(server).toHaveProperty('name')
              expect(server).toHaveProperty('description')
              expect(typeof server.name).toBe('string')
              expect(typeof server.description).toBe('string')

              // connectionTypeに応じた必須フィールドのチェック
              if (server.connectionType === 'command') {
                expect(server).toHaveProperty('command')
              } else if (server.connectionType === 'url') {
                expect(server).toHaveProperty('url')
              }
            })
          }
        })

        test('knowledgeBases structure is valid if present', () => {
          if (parsedYaml.knowledgeBases) {
            expect(Array.isArray(parsedYaml.knowledgeBases)).toBe(true)
            parsedYaml.knowledgeBases.forEach((kb: any) => {
              expect(kb).toHaveProperty('knowledgeBaseId')
              expect(kb).toHaveProperty('description')
              expect(typeof kb.knowledgeBaseId).toBe('string')
              expect(typeof kb.description).toBe('string')
            })
          }
        })

        test('bedrockAgents structure is valid if present', () => {
          if (parsedYaml.bedrockAgents) {
            expect(Array.isArray(parsedYaml.bedrockAgents)).toBe(true)
            parsedYaml.bedrockAgents.forEach((agent: any) => {
              expect(agent).toHaveProperty('agentId')
              expect(agent).toHaveProperty('aliasId')
              expect(agent).toHaveProperty('description')
              expect(typeof agent.agentId).toBe('string')
              expect(typeof agent.aliasId).toBe('string')
              expect(typeof agent.description).toBe('string')
            })
          }
        })

        test('flows structure is valid if present', () => {
          if (parsedYaml.flows) {
            expect(Array.isArray(parsedYaml.flows)).toBe(true)
            parsedYaml.flows.forEach((flow: any) => {
              expect(flow).toHaveProperty('flowIdentifier')
              expect(flow).toHaveProperty('flowAliasIdentifier')
              expect(flow).toHaveProperty('description')
              expect(typeof flow.flowIdentifier).toBe('string')
              expect(typeof flow.flowAliasIdentifier).toBe('string')
              expect(typeof flow.description).toBe('string')

              // inputTypeがある場合のschemaチェック
              if (flow.inputType === 'object' || flow.inputType === 'array') {
                // schemaフィールドは任意だが、ある場合はobjectであるべき
                if (flow.schema) {
                  expect(typeof flow.schema).toBe('object')
                }
              }
            })
          }
        })

        test('environmentContextSettings structure is valid if present', () => {
          if (parsedYaml.environmentContextSettings) {
            const settings = parsedYaml.environmentContextSettings
            expect(settings).toHaveProperty('todoListInstruction')
            expect(settings).toHaveProperty('projectRule')
            expect(settings).toHaveProperty('visualExpressionRules')
            expect(typeof settings.todoListInstruction).toBe('boolean')
            expect(typeof settings.projectRule).toBe('boolean')
            expect(typeof settings.visualExpressionRules).toBe('boolean')
          }
        })
      })

      describe('business rules', () => {
        beforeAll(() => {
          if (!parsedYaml) {
            parsedYaml = yaml.load(fileContent)
          }
        })

        test('if isShared is true, author field should be present', () => {
          if (parsedYaml.isShared === true) {
            expect(parsedYaml).toHaveProperty('author')
            expect(typeof parsedYaml.author).toBe('string')
            expect(parsedYaml.author.length).toBeGreaterThan(0)
          }
        })
      })
    })
  })

  // 全体のサマリーテスト
  describe('Overall validation summary', () => {
    test('all YAML files are valid', () => {
      const results: { filename: string; valid: boolean; errors?: string[] }[] = []

      yamlFiles.forEach((filename) => {
        const filePath = path.join(directoryAgentsPath, filename)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const parsedYaml = yaml.load(fileContent)
        const result = CustomAgentSchema.safeParse(parsedYaml)

        results.push({
          filename,
          valid: result.success,
          errors: result.success ? undefined : result.error.errors.map((e) => e.message)
        })
      })

      const invalidFiles = results.filter((r) => !r.valid)

      if (invalidFiles.length > 0) {
        console.error('\nInvalid files:')
        invalidFiles.forEach((file) => {
          console.error(`  - ${file.filename}:`)
          file.errors?.forEach((error) => {
            console.error(`    * ${error}`)
          })
        })
      }

      expect(invalidFiles.length).toBe(0)
    })

    test('provides validation statistics', () => {
      const stats = {
        total: yamlFiles.length,
        withMcpServers: 0,
        withKnowledgeBases: 0,
        withBedrockAgents: 0,
        withFlows: 0,
        withEnvironmentContext: 0,
        isShared: 0
      }

      yamlFiles.forEach((filename) => {
        const filePath = path.join(directoryAgentsPath, filename)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        const parsedYaml = yaml.load(fileContent) as any

        if (parsedYaml.mcpServers && parsedYaml.mcpServers.length > 0) {
          stats.withMcpServers++
        }
        if (parsedYaml.knowledgeBases && parsedYaml.knowledgeBases.length > 0) {
          stats.withKnowledgeBases++
        }
        if (parsedYaml.bedrockAgents && parsedYaml.bedrockAgents.length > 0) {
          stats.withBedrockAgents++
        }
        if (parsedYaml.flows && parsedYaml.flows.length > 0) {
          stats.withFlows++
        }
        if (parsedYaml.environmentContextSettings) {
          stats.withEnvironmentContext++
        }
        if (parsedYaml.isShared === true) {
          stats.isShared++
        }
      })

      console.log('\n=== Validation Statistics ===')
      console.log(`Total YAML files: ${stats.total}`)
      console.log(`Files with MCP servers: ${stats.withMcpServers}`)
      console.log(`Files with Knowledge Bases: ${stats.withKnowledgeBases}`)
      console.log(`Files with Bedrock Agents: ${stats.withBedrockAgents}`)
      console.log(`Files with Flows: ${stats.withFlows}`)
      console.log(`Files with Environment Context: ${stats.withEnvironmentContext}`)
      console.log(`Shared files: ${stats.isShared}`)
      console.log('============================\n')

      // 統計情報が正常に取得できたことを確認
      expect(stats.total).toBe(yamlFiles.length)
    })
  })
})
