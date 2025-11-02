import { createContext, useContext, ReactNode, useState } from 'react'
import { flushSync } from 'react-dom'
import { useSandpack } from '@codesandbox/sandpack-react'
import { ToolResult } from '@/types/tools'

interface SandpackOperations {
  createFile: (path: string, content: string) => Promise<ToolResult>
  updateFile: (path: string, content: string) => Promise<ToolResult>
  deleteFile: (path: string) => Promise<ToolResult>
  listFiles: () => Promise<ToolResult>
  readFile: (path: string) => Promise<ToolResult>
}

interface RichWebsiteGeneratorContextType {
  sandpackOperations: SandpackOperations
  lastUpdate: number
}

const RichWebsiteGeneratorContext = createContext<RichWebsiteGeneratorContextType | null>(null)

export function RichWebsiteGeneratorProvider({ children }: { children: ReactNode }) {
  const { sandpack } = useSandpack()
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const sandpackOperations: SandpackOperations = {
    createFile: async (path: string, content: string) => {
      try {
        console.log('[sandpackCreateFile] Creating file:', path)

        // Sandpack の updateFile を使用（新規作成も可能）
        sandpack.updateFile(path, content)

        // 作成したファイルをアクティブにして UI を更新
        sandpack.setActiveFile(path)

        // flushSync で同期的に状態を更新し、即座に DOM に反映
        flushSync(() => {
          setLastUpdate(Date.now())
        })

        console.log('[sandpackCreateFile] File created successfully:', path)

        return {
          name: 'sandpackCreateFile',
          success: true,
          result: {
            success: true,
            path,
            message: `Successfully created file: ${path}`
          }
        }
      } catch (error: any) {
        return {
          name: 'sandpackCreateFile',
          success: false,
          result: {
            success: false,
            error: error.message
          }
        }
      }
    },

    updateFile: async (path: string, content: string) => {
      try {
        console.log('[sandpackUpdateFile] Updating file:', path)

        sandpack.updateFile(path, content)

        // 更新したファイルをアクティブにして UI を更新
        sandpack.setActiveFile(path)

        // flushSync で同期的に状態を更新し、即座に DOM に反映
        flushSync(() => {
          setLastUpdate(Date.now())
        })

        console.log('[sandpackUpdateFile] File updated successfully:', path)

        return {
          name: 'sandpackUpdateFile',
          success: true,
          result: {
            success: true,
            path,
            message: `Successfully updated file: ${path}`
          }
        }
      } catch (error: any) {
        return {
          name: 'sandpackUpdateFile',
          success: false,
          result: {
            success: false,
            error: error.message
          }
        }
      }
    },

    deleteFile: async (path: string) => {
      try {
        sandpack.deleteFile(path)

        return {
          name: 'sandpackDeleteFile',
          success: true,
          result: {
            success: true,
            path,
            message: `Successfully deleted file: ${path}`
          }
        }
      } catch (error: any) {
        return {
          name: 'sandpackDeleteFile',
          success: false,
          result: {
            success: false,
            error: error.message
          }
        }
      }
    },

    listFiles: async () => {
      try {
        const fileList = Object.keys(sandpack.files).map((path) => ({
          path,
          size: sandpack.files[path]?.code?.length || 0
        }))

        return {
          name: 'sandpackListFiles',
          success: true,
          result: {
            success: true,
            files: fileList,
            count: fileList.length
          }
        }
      } catch (error: any) {
        return {
          name: 'sandpackListFiles',
          success: false,
          result: {
            success: false,
            error: error.message
          }
        }
      }
    },

    readFile: async (path: string) => {
      try {
        const file = sandpack.files[path]

        if (!file) {
          throw new Error(`File not found: ${path}`)
        }

        return {
          name: 'sandpackReadFile',
          success: true,
          result: {
            success: true,
            path,
            content: file.code
          }
        }
      } catch (error: any) {
        return {
          name: 'sandpackReadFile',
          success: false,
          result: {
            success: false,
            error: error.message
          }
        }
      }
    }
  }

  return (
    <RichWebsiteGeneratorContext.Provider value={{ sandpackOperations, lastUpdate }}>
      {children}
    </RichWebsiteGeneratorContext.Provider>
  )
}

export function useRichWebsiteGenerator() {
  const context = useContext(RichWebsiteGeneratorContext)
  if (!context) {
    throw new Error('useRichWebsiteGenerator must be used within RichWebsiteGeneratorProvider')
  }
  return context
}
