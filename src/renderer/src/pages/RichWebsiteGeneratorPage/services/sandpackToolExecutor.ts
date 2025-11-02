import { ToolInput, ToolResult } from '@/types/tools'

/**
 * Interface for Sandpack operations
 */
interface SandpackOperations {
  createFile: (path: string, content: string) => Promise<ToolResult>
  updateFile: (path: string, originalText: string, updatedText: string) => Promise<ToolResult>
  deleteFile: (path: string) => Promise<ToolResult>
  listFiles: () => Promise<ToolResult>
  readFile: (path: string) => Promise<ToolResult>
}

/**
 * Creates a tool executor for Sandpack operations
 * @param operations - Sandpack operations from context
 * @returns Tool executor function
 */
export function createSandpackToolExecutor(operations: SandpackOperations) {
  return async (toolInput: ToolInput): Promise<ToolResult> => {
    console.log(
      '[sandpackToolExecutor] Executing tool:',
      toolInput.type,
      'for path:',
      (toolInput as any).path
    )

    switch (toolInput.type) {
      case 'sandpackCreateFile':
        return await operations.createFile(toolInput.path, toolInput.content)

      case 'sandpackUpdateFile':
        return await operations.updateFile(
          toolInput.path,
          toolInput.originalText,
          toolInput.updatedText
        )

      case 'sandpackDeleteFile':
        return await operations.deleteFile(toolInput.path)

      case 'sandpackListFiles':
        return await operations.listFiles()

      case 'sandpackReadFile':
        return await operations.readFile(toolInput.path)

      default:
        throw new Error(`Unknown Sandpack tool: ${toolInput.type}`)
    }
  }
}
