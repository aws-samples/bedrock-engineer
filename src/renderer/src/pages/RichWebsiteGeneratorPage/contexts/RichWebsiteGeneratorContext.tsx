import { createContext, useContext, ReactNode, useState } from 'react'
import { flushSync } from 'react-dom'
import { useSandpack } from '@codesandbox/sandpack-react'
import { ToolResult } from '@/types/tools'

interface SandpackOperations {
  createFile: (path: string, content: string) => Promise<ToolResult>
  updateFile: (path: string, originalText: string, updatedText: string) => Promise<ToolResult>
  deleteFile: (path: string) => Promise<ToolResult>
  listFiles: () => Promise<ToolResult>
  readFile: (path: string) => Promise<ToolResult>
}

interface RichWebsiteGeneratorContextType {
  sandpackOperations: SandpackOperations
  lastUpdate: number
}

const RichWebsiteGeneratorContext = createContext<RichWebsiteGeneratorContextType | null>(null)

// ファイルツリー構造の型定義
interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: FileTreeNode[]
}

// ファイルパスからツリー構造を構築
function buildFileTreeFromPaths(files: Record<string, any>): FileTreeNode {
  const root: FileTreeNode = {
    name: '/',
    path: '/',
    type: 'directory',
    children: []
  }

  Object.entries(files).forEach(([filePath, fileData]) => {
    // パスを正規化（先頭のスラッシュを除去）
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const parts = normalizedPath.split('/').filter((p) => p.length > 0)

    let currentNode = root
    let currentPath = ''

    parts.forEach((part, index) => {
      currentPath += '/' + part
      const isFile = index === parts.length - 1

      if (!currentNode.children) {
        currentNode.children = []
      }

      let childNode = currentNode.children.find((child) => child.name === part)

      if (!childNode) {
        childNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          size: isFile ? fileData?.code?.length || 0 : undefined,
          children: isFile ? undefined : []
        }
        currentNode.children.push(childNode)
      }

      currentNode = childNode
    })
  })

  return root
}

// ツリー構造を視覚的な文字列に変換
function renderFileTree(node: FileTreeNode, prefix: string = '', isLast: boolean = true): string {
  let result = ''

  if (node.name !== '/') {
    const currentPrefix = prefix + (isLast ? '└── ' : '├── ')
    const icon = node.type === 'directory' ? '📁' : '📄'
    const sizeInfo = node.type === 'file' && node.size ? ` (${formatFileSize(node.size)})` : ''
    result += `${currentPrefix}${icon} ${node.name}${sizeInfo}\n`
  }

  if (node.children && node.children.length > 0) {
    // ディレクトリを先に、次にファイルをソート
    const sortedChildren = [...node.children].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    const nextPrefix = node.name === '/' ? '' : prefix + (isLast ? '    ' : '│   ')

    sortedChildren.forEach((child, index) => {
      const isLastChild = index === sortedChildren.length - 1
      result += renderFileTree(child, nextPrefix, isLastChild)
    })
  }

  return result
}

// ファイルサイズをフォーマット
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

    updateFile: async (path: string, originalText: string, updatedText: string) => {
      try {
        console.log('[sandpackUpdateFile] Updating file:', path)

        // 1. 現在のファイル内容を取得
        const file = sandpack.files[path]
        if (!file) {
          throw new Error(`File not found: ${path}`)
        }

        const fileContent = file.code

        // 2. originalTextが存在するか確認
        if (!fileContent.includes(originalText)) {
          return {
            name: 'sandpackUpdateFile',
            success: false,
            result: {
              success: false,
              error: `Original text not found in file: ${path}. Please ensure the text matches exactly, including whitespace and line breaks.`
            }
          }
        }

        // 3. テキストを置換（最初のマッチのみ）
        const newContent = fileContent.replace(originalText, updatedText)

        // 4. Sandpackファイルを更新
        sandpack.updateFile(path, newContent)

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
            originalTextLength: originalText.length,
            updatedTextLength: updatedText.length,
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
        // ファイルツリー構造を構築
        const tree = buildFileTreeFromPaths(sandpack.files)

        // ツリーを視覚的な文字列に変換
        const treeString = renderFileTree(tree)

        // ファイル数とディレクトリ数を計算
        const fileCount = Object.keys(sandpack.files).length
        const totalSize = Object.values(sandpack.files).reduce(
          (sum, file) => sum + (file?.code?.length || 0),
          0
        )

        return {
          name: 'sandpackListFiles',
          success: true,
          result: {
            success: true,
            tree: treeString.trim() || '(empty project)',
            fileCount,
            totalSize: formatFileSize(totalSize),
            message: `Project contains ${fileCount} file(s), total size: ${formatFileSize(totalSize)}`
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
