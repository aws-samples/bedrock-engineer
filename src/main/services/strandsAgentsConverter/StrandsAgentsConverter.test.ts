import { StrandsAgentsConverter } from './StrandsAgentsConverter'
import { CustomAgent } from '../../../types/agent-chat'
import { SaveOptions } from './types'
import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('StrandsAgentsConverter', () => {
  let converter: StrandsAgentsConverter

  beforeEach(() => {
    converter = new StrandsAgentsConverter()
  })

  // Mock data for testing
  const createMockAgent = (overrides: Partial<CustomAgent> = {}): CustomAgent => ({
    id: 'test-agent-1',
    name: 'Test Agent',
    description: 'A test agent for unit testing',
    system: 'You are a helpful test assistant.',
    scenarios: [],
    tools: ['readFiles', 'writeToFile'],
    isCustom: true,
    category: 'custom',
    ...overrides
  })

  describe('convertAgent', () => {
    it('should convert a basic agent successfully', async () => {
      // Arrange
      const mockAgent = createMockAgent()

      // Act
      const result = await converter.convertAgent(mockAgent)

      // Assert
      expect(result).toBeDefined()
      expect(result.pythonCode).toContain('Test Agent')
      expect(result.pythonCode).toContain('You are a helpful test assistant.')
      expect(result.config.name).toBe('Test Agent')
      expect(result.config.description).toBe('A test agent for unit testing')
      expect(result.config.modelProvider).toBe('bedrock')
      expect(result.toolMapping.supportedTools.length).toBeGreaterThan(0)
      expect(result.requirementsText).toContain('strands-agents')
    })

    it('should throw error when agent name is missing', async () => {
      // Arrange
      const mockAgent = createMockAgent({ name: '' })

      // Act & Assert
      await expect(converter.convertAgent(mockAgent)).rejects.toThrow('Agent name is required')
    })

    it('should throw error when system prompt is missing', async () => {
      // Arrange
      const mockAgent = createMockAgent({ system: '' })

      // Act & Assert
      await expect(converter.convertAgent(mockAgent)).rejects.toThrow(
        'Agent system prompt is required'
      )
    })

    it('should handle unsupported tools gracefully', async () => {
      // Arrange
      const mockAgent = createMockAgent({
        tools: ['readFiles', 'screenCapture'] // screenCapture is not supported
      })

      // Act
      const result = await converter.convertAgent(mockAgent)

      // Assert
      expect(result.warnings.length).toBeGreaterThan(0)
      const warning = result.warnings.find((w) => w.originalName === 'screenCapture')
      expect(warning).toBeDefined()
      expect(warning?.reason).toContain('screen capture tool')
    })

    it('should log warning when agent has no description', async () => {
      // Arrange
      const mockAgent = createMockAgent({ description: '' })

      // Mock console
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Act
      await converter.convertAgent(mockAgent)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[WARN] Agent Test Agent has no description')

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('convertMultipleAgents', () => {
    it('should convert multiple agents successfully', async () => {
      // Arrange
      const agents = [
        createMockAgent({ id: 'agent-1', name: 'Agent 1' }),
        createMockAgent({ id: 'agent-2', name: 'Agent 2' })
      ]

      // Act
      const results = await converter.convertMultipleAgents(agents)

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0].agent.id).toBe('agent-1')
      expect(results[0].output).toBeDefined()
      expect(results[0].error).toBeUndefined()
      expect(results[1].agent.id).toBe('agent-2')
      expect(results[1].output).toBeDefined()
      expect(results[1].error).toBeUndefined()
    })

    it('should handle errors in individual agent conversion', async () => {
      // Arrange
      const agents = [
        createMockAgent({ id: 'agent-1', name: 'Agent 1' }),
        createMockAgent({ id: 'agent-2', name: '' }) // Invalid agent
      ]

      // Act
      const results = await converter.convertMultipleAgents(agents)

      // Assert
      expect(results).toHaveLength(2)
      expect(results[0].output).toBeDefined()
      expect(results[0].error).toBeUndefined()
      expect(results[1].output).toBeUndefined()
      expect(results[1].error).toBeInstanceOf(Error)
      expect(results[1].error?.message).toBe('Agent name is required')
    })
  })

  describe('getSupportedTools', () => {
    it('should return list of supported tools', () => {
      // Act
      const supportedTools = converter.getSupportedTools()

      // Assert
      expect(supportedTools).toBeInstanceOf(Array)
      expect(supportedTools.length).toBeGreaterThan(0)
      expect(supportedTools).toContain('readFiles')
      expect(supportedTools).toContain('writeToFile')
      expect(supportedTools).not.toContain('screenCapture') // Unsupported tools are not included
    })
  })

  describe('getUnsupportedTools', () => {
    it('should return list of unsupported tools with reasons', () => {
      // Act
      const unsupportedTools = converter.getUnsupportedTools()

      // Assert
      expect(unsupportedTools).toBeInstanceOf(Array)
      expect(unsupportedTools.length).toBeGreaterThan(0)

      const screenCaptureInfo = unsupportedTools.find((tool) => tool.toolName === 'screenCapture')
      expect(screenCaptureInfo).toBeDefined()
      expect(screenCaptureInfo?.reason).toContain('screen capture tool')
    })
  })

  describe('getConversionStats', () => {
    it('should return conversion statistics', async () => {
      // Arrange
      const agents = [
        createMockAgent({ tools: ['readFiles', 'screenCapture'] }),
        createMockAgent({ tools: ['writeToFile'] })
      ]

      // Act
      const stats = await converter.getConversionStats(agents)

      // Assert
      expect(stats.totalAgents).toBe(2)
      expect(stats.supportedToolsOverall).toBeGreaterThan(0)
      expect(stats.unsupportedToolsOverall).toBeGreaterThan(0)
      expect(stats.toolsStats).toHaveProperty('readFiles')
      expect(stats.toolsStats).toHaveProperty('writeToFile')
    })
  })

  describe('validateAgent', () => {
    it('should detect duplicate tools and log warning', async () => {
      // Arrange
      const mockAgent = createMockAgent({
        tools: ['readFiles', 'readFiles', 'writeToFile'] // With duplicates
      })

      // Mock console
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Act
      await converter.convertAgent(mockAgent)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[WARN] Agent Test Agent has duplicate tools')

      // Cleanup
      consoleSpy.mockRestore()
    })
  })

  describe('File Save Functionality', () => {
    let tempDir: string

    beforeEach(async () => {
      // Create temporary directory
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'strands-test-'))
      console.log({ tempDir })
    })

    afterEach(async () => {
      // Delete temporary directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch {
        // Ignore errors
      }
    })

    it('should save all files to specified directory', async () => {
      // Arrange
      const agent = createMockAgent({
        name: 'File Save Test Agent',
        description: 'Agent for testing file save functionality'
      })
      const options: SaveOptions = {
        outputDirectory: tempDir,
        includeConfig: true, // Explicitly include config.yaml
        overwrite: false
      }

      // Act
      const result = await converter.convertAndSaveAgent(agent, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.savedFiles).toHaveLength(4) // agent.py, requirements.txt, README.md, config.yaml
      expect(result.errors).toEqual([])

      // Check file existence
      const expectedFiles = ['agent.py', 'requirements.txt', 'README.md', 'config.yaml']
      for (const fileName of expectedFiles) {
        const filePath = path.join(tempDir, fileName)
        expect(result.savedFiles).toContain(filePath)

        // Confirm that files actually exist
        await expect(fs.access(filePath)).resolves.toBeUndefined()
      }
    })

    it('should save files without config.yaml by default', async () => {
      // Arrange
      const agent = createMockAgent({
        name: 'Default Save Test Agent',
        description: 'Agent for testing default file save behavior'
      })
      const options: SaveOptions = {
        outputDirectory: tempDir,
        overwrite: false
        // includeConfig is not specified (default: false)
      }

      // Act
      const result = await converter.convertAndSaveAgent(agent, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.savedFiles).toHaveLength(3) // Only agent.py, requirements.txt, README.md
      expect(result.errors).toEqual([])

      // Check file existence
      const expectedFiles = ['agent.py', 'requirements.txt', 'README.md']
      for (const fileName of expectedFiles) {
        const filePath = path.join(tempDir, fileName)
        expect(result.savedFiles).toContain(filePath)
        await expect(fs.access(filePath)).resolves.toBeUndefined()
      }

      // Confirm config.yaml does not exist
      const configPath = path.join(tempDir, 'config.yaml')
      expect(result.savedFiles).not.toContain(configPath)
      await expect(fs.access(configPath)).rejects.toThrow()
    })

    it('should save with custom agent filename', async () => {
      // Arrange
      const agent = createMockAgent()
      const options: SaveOptions = {
        outputDirectory: tempDir,
        agentFileName: 'custom_agent.py',
        includeConfig: false
      }

      // Act
      const result = await converter.convertAndSaveAgent(agent, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.savedFiles).toHaveLength(3) // custom_agent.py, requirements.txt, README.md

      const customAgentPath = path.join(tempDir, 'custom_agent.py')
      expect(result.savedFiles).toContain(customAgentPath)
      await expect(fs.access(customAgentPath)).resolves.toBeUndefined()
    })

    it('should handle overwrite option correctly', async () => {
      // Arrange
      const agent = createMockAgent()
      const options: SaveOptions = {
        outputDirectory: tempDir,
        overwrite: false
      }

      // First save
      await converter.convertAndSaveAgent(agent, options)

      // Act - Save again to same directory (overwrite: false)
      const result = await converter.convertAndSaveAgent(agent, options)

      // Assert
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
      expect(result.errors![0].error).toContain('File already exists')
    })

    it('should overwrite files when overwrite is true', async () => {
      // Arrange
      const agent = createMockAgent()
      const options: SaveOptions = {
        outputDirectory: tempDir,
        overwrite: false
      }

      // First save
      await converter.convertAndSaveAgent(agent, options)

      // Act - Re-save with overwrite: true
      const overwriteOptions: SaveOptions = { ...options, overwrite: true }
      const result = await converter.convertAndSaveAgent(agent, overwriteOptions)

      // Assert
      expect(result.success).toBe(true)
      expect(result.errors).toEqual([])
      expect(result.savedFiles.length).toBeGreaterThan(0)
    })

    it('should create directory if it does not exist', async () => {
      // Arrange
      const agent = createMockAgent()
      const nonExistentDir = path.join(tempDir, 'nested', 'directory')
      const options: SaveOptions = {
        outputDirectory: nonExistentDir
      }

      // Act
      const result = await converter.convertAndSaveAgent(agent, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.savedFiles.length).toBeGreaterThan(0)

      // Confirm directory was created
      await expect(fs.access(nonExistentDir)).resolves.toBeUndefined()
    })

    it('should validate save options', async () => {
      // Arrange
      const agent = createMockAgent()
      const invalidOptions: SaveOptions = {
        outputDirectory: '', // Empty directory
        agentFileName: 'invalid.txt' // Does not end with .py
      }

      // Act
      const result = await converter.convertAndSaveAgent(agent, invalidOptions)

      // Assert
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should save existing output to directory', async () => {
      // Arrange
      const agent = createMockAgent()
      const output = await converter.convertAgent(agent)
      const options: SaveOptions = {
        outputDirectory: tempDir
      }

      // Act
      const result = await converter.saveAgentToDirectory(output, options)

      // Assert
      expect(result.success).toBe(true)
      expect(result.savedFiles.length).toBeGreaterThan(0)

      // Check file content
      const agentPyPath = path.join(tempDir, 'agent.py')
      const agentPyContent = await fs.readFile(agentPyPath, 'utf-8')
      expect(agentPyContent).toContain('Test Agent')
      expect(agentPyContent).toContain('You are a helpful test assistant.')
    })
  })

  describe('Integration Tests', () => {
    it('should generate valid Python code with correct imports', async () => {
      // Arrange
      const agent = createMockAgent({
        name: 'Python Code Test Agent',
        system: 'You are a Python code generation test assistant.',
        tools: ['readFiles', 'writeToFile', 'codeInterpreter']
      })

      // Act
      const result = await converter.convertAgent(agent)

      // Assert
      expect(result.pythonCode).toContain('from strands import Agent')
      expect(result.pythonCode).toContain(
        'from strands_tools import file_read, file_write, python_repl'
      )
      expect(result.pythonCode).toContain('def setup_tools():')
      expect(result.pythonCode).toContain('def create_agent():')
      expect(result.pythonCode).toContain('def main():')
    })

    it('should generate appropriate requirements.txt', async () => {
      // Arrange
      const agent = createMockAgent({
        tools: ['readFiles', 'generateImage', 'codeInterpreter']
      })

      // Act
      const result = await converter.convertAgent(agent)

      // Assert
      expect(result.requirementsText).toContain('strands-agents>=1.0.0')
      expect(result.requirementsText).toContain('strands-agents-tools>=0.2.0')
      expect(result.requirementsText).toContain('boto3>=1.26.0')
    })

    it('should provide comprehensive agent configuration', async () => {
      // Arrange
      const agent = createMockAgent({
        name: 'Integration Test Agent',
        description: 'An agent for integration testing',
        tools: ['readFiles', 'writeToFile', 'executeCommand']
      })

      // Act
      const result = await converter.convertAgent(agent)

      // Assert
      expect(result.config.name).toBe('Integration Test Agent')
      expect(result.config.description).toBe('An agent for integration testing')
      expect(result.config.modelProvider).toBe('bedrock')
      expect(result.config.toolsUsed).toContain('readFiles')
      expect(result.config.toolsUsed).toContain('writeToFile')
      expect(result.config.toolsUsed).toContain('executeCommand')
      expect(result.config.environment).toHaveProperty('AWS_REGION')
    })
  })
})
