import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import {
  CustomAgentSchema,
  CommandConfigSchema,
  WindowConfigSchema,
  CameraConfigSchema,
  ScenarioSchema,
  KnowledgeBaseSchema,
  FlowConfigSchema,
  McpServerConfigSchema,
  TavilySearchConfigSchema,
  EnvironmentContextSettingsSchema
} from '../types/agent-chat.schema'
import { validateCustomAgent, validateCustomAgents } from '../common/validation/agent-validator'

/**
 * Comprehensive Zod Schema Validation Tests
 * Tests all CustomAgent schemas and validation utilities
 */
describe('Agent Schema Validation', () => {
  const directoryAgentsPath = path.resolve(__dirname, '../renderer/src/assets/directory-agents')

  // Load all YAML files
  const yamlFiles = fs
    .readdirSync(directoryAgentsPath)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))

  describe('CommandConfig Schema', () => {
    it('should validate valid CommandConfig', () => {
      const validConfig = {
        pattern: '^npm (install|i).*',
        description: 'npm install command'
      }
      const result = CommandConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should reject CommandConfig without required fields', () => {
      const invalidConfig = { pattern: '^npm.*' }
      const result = CommandConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })
  })

  describe('WindowConfig Schema', () => {
    it('should validate valid WindowConfig', () => {
      const validConfig = {
        id: 'chrome-window',
        name: 'Google Chrome',
        enabled: true
      }
      const result = WindowConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should reject WindowConfig without required fields', () => {
      const invalidConfig = { id: 'test', enabled: true }
      const result = WindowConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })
  })

  describe('CameraConfig Schema', () => {
    it('should validate valid CameraConfig', () => {
      const validConfig = {
        id: 'camera-1',
        name: 'FaceTime HD Camera',
        enabled: false
      }
      const result = CameraConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Scenario Schema', () => {
    it('should validate valid Scenario', () => {
      const validScenario = {
        title: 'Test Scenario',
        content: 'Scenario content here'
      }
      const result = ScenarioSchema.safeParse(validScenario)
      expect(result.success).toBe(true)
    })
  })

  describe('KnowledgeBase Schema', () => {
    it('should validate valid KnowledgeBase', () => {
      const validKb = {
        knowledgeBaseId: 'KB123456',
        description: 'Product documentation'
      }
      const result = KnowledgeBaseSchema.safeParse(validKb)
      expect(result.success).toBe(true)
    })
  })

  describe('FlowConfig Schema', () => {
    it('should validate valid FlowConfig', () => {
      const validFlow = {
        flowIdentifier: 'FLOW123',
        flowAliasIdentifier: 'ALIAS123',
        description: 'Test flow',
        inputType: 'object' as const,
        schema: { type: 'object', properties: {} }
      }
      const result = FlowConfigSchema.safeParse(validFlow)
      expect(result.success).toBe(true)
    })

    it('should validate FlowConfig without optional fields', () => {
      const validFlow = {
        flowIdentifier: 'FLOW123',
        flowAliasIdentifier: 'ALIAS123',
        description: 'Test flow'
      }
      const result = FlowConfigSchema.safeParse(validFlow)
      expect(result.success).toBe(true)
    })
  })

  describe('McpServerConfig Schema', () => {
    it('should validate command-based McpServerConfig', () => {
      const validConfig = {
        name: 'test-server',
        description: 'Test MCP server',
        connectionType: 'command' as const,
        command: 'node',
        args: ['server.js'],
        env: { NODE_ENV: 'production' }
      }
      const result = McpServerConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should validate URL-based McpServerConfig', () => {
      const validConfig = {
        name: 'api-server',
        description: 'API MCP server',
        connectionType: 'url' as const,
        url: 'https://api.example.com',
        headers: { Authorization: 'Bearer token' }
      }
      const result = McpServerConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('TavilySearchConfig Schema', () => {
    it('should validate valid TavilySearchConfig', () => {
      const validConfig = {
        includeDomains: ['example.com', 'test.com'],
        excludeDomains: ['spam.com']
      }
      const result = TavilySearchConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('should validate TavilySearchConfig with empty arrays', () => {
      const validConfig = {
        includeDomains: [],
        excludeDomains: []
      }
      const result = TavilySearchConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('EnvironmentContextSettings Schema', () => {
    it('should validate valid EnvironmentContextSettings', () => {
      const validSettings = {
        projectRule: true,
        visualExpressionRules: false
      }
      const result = EnvironmentContextSettingsSchema.safeParse(validSettings)
      expect(result.success).toBe(true)
    })

    it('should reject EnvironmentContextSettings with extra properties', () => {
      const invalidSettings = {
        projectRule: true,
        visualExpressionRules: false,
        todoListInstruction: true // This should be rejected
      }
      const result = EnvironmentContextSettingsSchema.safeParse(invalidSettings)
      expect(result.success).toBe(false)
    })

    it('should reject EnvironmentContextSettings with missing properties', () => {
      const invalidSettings = {
        projectRule: true
      }
      const result = EnvironmentContextSettingsSchema.safeParse(invalidSettings)
      expect(result.success).toBe(false)
    })
  })

  describe('CustomAgent Schema', () => {
    it('should validate minimal valid CustomAgent', () => {
      const validAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'System prompt',
        scenarios: [
          {
            title: 'Test',
            content: 'Test scenario'
          }
        ]
      }
      const result = CustomAgentSchema.safeParse(validAgent)
      expect(result.success).toBe(true)
    })

    it('should validate CustomAgent with all optional fields', () => {
      const validAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'System prompt',
        scenarios: [],
        icon: 'robot' as const,
        iconColor: '#FF0000',
        tags: ['test', 'example'],
        author: 'Test Author',
        isCustom: true,
        isShared: false,
        directoryOnly: false,
        organizationId: 'org-123',
        tools: ['read_file', 'write_file'],
        category: 'coding' as const,
        allowedCommands: [{ pattern: '^npm.*', description: 'npm commands' }],
        allowedWindows: [{ id: 'chrome', name: 'Chrome', enabled: true }],
        allowedCameras: [{ id: 'cam1', name: 'Camera 1', enabled: false }],
        knowledgeBases: [{ knowledgeBaseId: 'KB123', description: 'Docs' }],
        flows: [
          {
            flowIdentifier: 'FLOW1',
            flowAliasIdentifier: 'ALIAS1',
            description: 'Flow 1'
          }
        ],
        mcpServers: [
          {
            name: 'server1',
            description: 'Server 1',
            command: 'node',
            args: ['server.js']
          }
        ],
        tavilySearchConfig: {
          includeDomains: ['example.com'],
          excludeDomains: []
        },
        additionalInstruction: 'Extra instructions',
        environmentContextSettings: {
          projectRule: true,
          visualExpressionRules: true
        }
      }
      const result = CustomAgentSchema.safeParse(validAgent)
      expect(result.success).toBe(true)
    })
  })

  describe('Directory Agents Validation', () => {
    yamlFiles.forEach((file) => {
      describe(file, () => {
        const filePath = path.join(directoryAgentsPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const agent = yaml.load(content) as any

        it('should pass CustomAgent schema validation', () => {
          const result = CustomAgentSchema.safeParse(agent)

          if (!result.success) {
            console.error(`Validation failed for ${file}:`)
            console.error(JSON.stringify(result.error.format(), null, 2))
          }

          expect(result.success).toBe(true)
        })

        it('should have valid structure with validateCustomAgent utility', () => {
          const result = validateCustomAgent(agent, {
            source: 'test',
            filePath: file
          })

          expect(result.data).toBeDefined()
          expect(result.data.id).toBeDefined()
          expect(result.data.name).toBeDefined()
        })
      })
    })
  })

  describe('Validation Utilities', () => {
    it('should validate multiple agents with validateCustomAgents', () => {
      const agents = [
        {
          id: 'agent1',
          name: 'Agent 1',
          description: 'First agent',
          system: 'System 1',
          scenarios: []
        },
        {
          id: 'agent2',
          name: 'Agent 2',
          description: 'Second agent',
          system: 'System 2',
          scenarios: []
        }
      ]

      const results = validateCustomAgents(agents, { source: 'test' })

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })

    it('should handle validation errors gracefully', () => {
      const invalidAgent = {
        id: 'test',
        // Missing required fields
        scenarios: []
      }

      const result = validateCustomAgent(invalidAgent, {
        source: 'test',
        filePath: 'test.yaml'
      })

      // In warning-only mode, data is still returned
      expect(result.data).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('File Statistics', () => {
    it('should report the number of YAML files validated', () => {
      console.log(`\nTotal YAML files validated: ${yamlFiles.length}`)
      expect(yamlFiles.length).toBeGreaterThan(0)
    })

    it('should validate all directory agents successfully', () => {
      const agents = yamlFiles.map((file) => {
        const filePath = path.join(directoryAgentsPath, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        return yaml.load(content) as any
      })

      const results = validateCustomAgents(agents, { source: 'directory-agents' })
      const allValid = results.every((r) => r.success)

      console.log(`\nValidation summary:`)
      console.log(`- Total agents: ${results.length}`)
      console.log(`- Valid: ${results.filter((r) => r.success).length}`)
      console.log(`- Invalid: ${results.filter((r) => !r.success).length}`)

      expect(allValid).toBe(true)
    })
  })
})
