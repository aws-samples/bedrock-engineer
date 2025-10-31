import { validateAgent, validateAgents } from '../../../../common/utils/agent-validator'

describe('agent-validator', () => {
  describe('validateAgent', () => {
    test('validates a valid agent successfully', () => {
      const validAgent = {
        id: 'test-agent-1',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [
          {
            title: 'Test Scenario',
            content: 'Test content'
          }
        ],
        tags: ['test'],
        isCustom: true,
        icon: 'robot',
        iconColor: '#000000',
        category: 'general'
      }

      const result = validateAgent(validAgent)

      expect(result.success).toBe(true)
      expect(result.agent).toBeDefined()
      expect(result.errors).toBeUndefined()
      expect(result.agent?.id).toBe('test-agent-1')
    })

    test('validates agent with empty scenarios array', () => {
      const agentWithEmptyScenarios = {
        id: 'test-agent-2',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [],
        tags: [],
        isCustom: true
      }

      const result = validateAgent(agentWithEmptyScenarios)

      expect(result.success).toBe(true)
      expect(result.agent).toBeDefined()
    })

    test('validates agent with optional fields', () => {
      const agentWithOptionalFields = {
        id: 'test-agent-3',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [],
        tags: ['test'],
        isCustom: true,
        author: 'Test Author',
        isShared: true,
        tools: ['think', 'readFiles'],
        mcpServers: [
          {
            name: 'test-server',
            description: 'Test MCP server',
            command: 'test-command',
            args: ['arg1']
          }
        ],
        knowledgeBases: [
          {
            knowledgeBaseId: 'kb-123',
            description: 'Test KB'
          }
        ]
      }

      const result = validateAgent(agentWithOptionalFields)

      expect(result.success).toBe(true)
      expect(result.agent).toBeDefined()
      expect(result.agent?.author).toBe('Test Author')
      expect(result.agent?.mcpServers).toHaveLength(1)
    })

    test('fails validation for missing required field (id)', () => {
      const invalidAgent = {
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [],
        tags: [],
        isCustom: true
      }

      const result = validateAgent(invalidAgent)

      expect(result.success).toBe(false)
      expect(result.agent).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
      expect(result.errors?.some((e) => e.includes('id'))).toBe(true)
    })

    test('fails validation for missing required field (name)', () => {
      const invalidAgent = {
        id: 'test-agent-4',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [],
        tags: [],
        isCustom: true
      }

      const result = validateAgent(invalidAgent)

      expect(result.success).toBe(false)
      expect(result.errors?.some((e) => e.includes('name'))).toBe(true)
    })

    test('fails validation for invalid icon value', () => {
      const invalidAgent = {
        id: 'test-agent-5',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [],
        tags: [],
        isCustom: true,
        icon: 'invalid-icon'
      }

      const result = validateAgent(invalidAgent)

      expect(result.success).toBe(false)
      expect(result.errors?.some((e) => e.includes('icon'))).toBe(true)
    })

    test('fails validation for invalid category value', () => {
      const invalidAgent = {
        id: 'test-agent-6',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [],
        tags: [],
        isCustom: true,
        category: 'invalid-category'
      }

      const result = validateAgent(invalidAgent)

      expect(result.success).toBe(false)
      expect(result.errors?.some((e) => e.includes('category'))).toBe(true)
    })

    test('fails validation for invalid scenarios structure', () => {
      const invalidAgent = {
        id: 'test-agent-7',
        name: 'Test Agent',
        description: 'A test agent',
        system: 'You are a helpful assistant.',
        scenarios: [
          {
            title: 'Test Scenario'
            // missing content
          }
        ],
        tags: [],
        isCustom: true
      }

      const result = validateAgent(invalidAgent)

      expect(result.success).toBe(false)
      expect(result.errors?.some((e) => e.includes('scenarios'))).toBe(true)
    })

    test('fails validation for non-object input', () => {
      const result = validateAgent('not an object')

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    test('fails validation for null input', () => {
      const result = validateAgent(null)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('validateAgents', () => {
    test('validates multiple valid agents', () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          description: 'First agent',
          system: 'System 1',
          scenarios: [],
          tags: [],
          isCustom: true
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          description: 'Second agent',
          system: 'System 2',
          scenarios: [],
          tags: [],
          isCustom: true
        }
      ]

      const results = validateAgents(agents)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })

    test('identifies invalid agents in mixed array', () => {
      const agents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          description: 'First agent',
          system: 'System 1',
          scenarios: [],
          tags: [],
          isCustom: true
        },
        {
          // missing id
          name: 'Agent 2',
          description: 'Second agent',
          system: 'System 2',
          scenarios: [],
          tags: [],
          isCustom: true
        }
      ]

      const results = validateAgents(agents)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].errors).toBeDefined()
    })

    test('handles empty array', () => {
      const results = validateAgents([])

      expect(results).toHaveLength(0)
    })
  })
})
