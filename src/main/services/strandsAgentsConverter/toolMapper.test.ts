import { TOOL_MAPPING, generateSpecialSetupCode, generateImportStatement } from './toolMapper'
import { StrandsTool } from './types'

describe('toolMapper', () => {
  describe('TOOL_MAPPING', () => {
    it('should have correct tool mappings', () => {
      // Check supported tools
      expect(TOOL_MAPPING.readFiles).toEqual({
        strandsName: 'file_read',
        importPath: 'strands_tools',
        supported: true
      })

      expect(TOOL_MAPPING.writeToFile).toEqual({
        strandsName: 'file_write',
        importPath: 'strands_tools',
        supported: true
      })

      expect(TOOL_MAPPING.codeInterpreter).toEqual({
        strandsName: 'python_repl',
        importPath: 'strands_tools',
        supported: true
      })
    })

    it('should have unsupported tools with reasons', () => {
      expect(TOOL_MAPPING.screenCapture.supported).toBe(false)
      expect(TOOL_MAPPING.screenCapture.reason).toContain('screen capture tool')

      expect(TOOL_MAPPING.cameraCapture.supported).toBe(false)
      expect(TOOL_MAPPING.cameraCapture.reason).toContain('camera capture tool')

      expect(TOOL_MAPPING.todo.supported).toBe(false)
      expect(TOOL_MAPPING.todo.reason).toContain('TODO tools')
    })

    it('should have all required tools defined', () => {
      const toolNames = Object.keys(TOOL_MAPPING)

      // Confirm required tools are included
      expect(toolNames).toContain('readFiles')
      expect(toolNames).toContain('writeToFile')
      expect(toolNames).toContain('executeCommand')
      expect(toolNames).toContain('codeInterpreter')
      expect(toolNames).toContain('generateImage')
      expect(toolNames).toContain('think')

      // Confirm each tool has required properties
      toolNames.forEach((toolName) => {
        const tool = TOOL_MAPPING[toolName as keyof typeof TOOL_MAPPING]
        expect(tool).toHaveProperty('strandsName')
        expect(tool).toHaveProperty('importPath')
        expect(tool).toHaveProperty('supported')

        if (!tool.supported) {
          expect(tool).toHaveProperty('reason')
          expect(tool.reason).toBeTruthy()
        }
      })
    })
  })

  describe('generateSpecialSetupCode', () => {
    it('should return empty string for python_repl', () => {
      const tool: StrandsTool = {
        strandsName: 'python_repl',
        importPath: 'strands_tools',
        supported: true
      }

      const setupCode = generateSpecialSetupCode('codeInterpreter', tool)
      expect(setupCode).toBe('')
    })

    it('should return empty string for regular tools', () => {
      const tool: StrandsTool = {
        strandsName: 'file_read',
        importPath: 'strands_tools',
        supported: true
      }

      const setupCode = generateSpecialSetupCode('readFiles', tool)
      expect(setupCode).toBe('')
    })
  })

  describe('generateImportStatement', () => {
    it('should generate basic import statements', () => {
      const tools: StrandsTool[] = [
        {
          strandsName: 'file_read',
          importPath: 'strands_tools',
          supported: true
        },
        {
          strandsName: 'file_write',
          importPath: 'strands_tools',
          supported: true
        }
      ]

      const imports = generateImportStatement(tools)

      expect(imports).toHaveLength(1)
      expect(imports[0]).toBe('from strands_tools import file_read, file_write')
    })

    it('should generate special import statements', () => {
      const tools: StrandsTool[] = [
        {
          strandsName: 'code_interpreter',
          importPath: 'strands_tools.code_interpreter',
          providerClass: 'AgentCoreCodeInterpreter',
          supported: true
        }
      ]

      const imports = generateImportStatement(tools)

      expect(imports).toHaveLength(1)
      expect(imports[0]).toBe('from strands_tools.code_interpreter import AgentCoreCodeInterpreter')
    })

    it('should generate mixed import statements', () => {
      const tools: StrandsTool[] = [
        {
          strandsName: 'file_read',
          importPath: 'strands_tools',
          supported: true
        },
        {
          strandsName: 'code_interpreter',
          importPath: 'strands_tools.code_interpreter',
          providerClass: 'AgentCoreCodeInterpreter',
          supported: true
        }
      ]

      const imports = generateImportStatement(tools)

      expect(imports).toHaveLength(2)
      expect(imports).toContain('from strands_tools import file_read')
      expect(imports).toContain(
        'from strands_tools.code_interpreter import AgentCoreCodeInterpreter'
      )
    })

    it('should skip unsupported tools', () => {
      const tools: StrandsTool[] = [
        {
          strandsName: 'file_read',
          importPath: 'strands_tools',
          supported: true
        },
        {
          strandsName: '',
          importPath: '',
          supported: false,
          reason: 'Not supported'
        }
      ]

      const imports = generateImportStatement(tools)

      expect(imports).toHaveLength(1)
      expect(imports[0]).toBe('from strands_tools import file_read')
    })
  })
})
