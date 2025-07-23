import { IpcMainInvokeEvent } from 'electron'
import { handleFileOpen } from '../../preload/file'
import fs from 'fs'
import path from 'path'
import { log } from '../../common/logger'
import { store } from '../../preload/store'

export const fileHandlers = {
  'open-file': async (_event: IpcMainInvokeEvent) => {
    return handleFileOpen({
      title: 'openFile...',
      properties: ['openFile']
    })
  },

  'open-directory': async (_event: IpcMainInvokeEvent) => {
    const path = await handleFileOpen({
      title: 'Select Directory',
      properties: ['openDirectory', 'createDirectory'],
      message: 'Select a directory for your project',
      buttonLabel: 'Select Directory'
    })

    // If path was selected and it differs from the current project path,
    // update the project path in store
    if (path) {
      if (path !== store.get('projectPath')) {
        store.set('projectPath', path)
        log.info('Project path changed', { newPath: path })
      }
    }

    return path
  },

  'get-local-image': async (_event: IpcMainInvokeEvent, filePath: string) => {
    try {
      const data = await fs.promises.readFile(filePath)
      const ext = filePath.split('.').pop()?.toLowerCase() || 'png'
      const base64 = data.toString('base64')
      return `data:image/${ext};base64,${base64}`
    } catch (error) {
      log.error('Failed to read image', {
        path: filePath,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'read-project-ignore': async (
    _event: IpcMainInvokeEvent,
    { projectPath }: { projectPath: string }
  ) => {
    try {
      const ignoreFilePath = path.join(projectPath, '.bedrock-engineer', '.ignore')

      try {
        const content = await fs.promises.readFile(ignoreFilePath, 'utf-8')
        log.info('Project ignore file read successfully', { projectPath, ignoreFilePath })
        return { content, exists: true }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          // ファイルが存在しない場合は空の内容を返す
          log.info('Project ignore file does not exist', { projectPath, ignoreFilePath })
          return { content: '', exists: false }
        }
        throw error
      }
    } catch (error) {
      log.error('Failed to read project ignore file', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'write-project-ignore': async (
    _event: IpcMainInvokeEvent,
    { projectPath, content }: { projectPath: string; content: string }
  ) => {
    try {
      const bedrockEngineerDir = path.join(projectPath, '.bedrock-engineer')
      const ignoreFilePath = path.join(bedrockEngineerDir, '.ignore')

      // .bedrock-engineerディレクトリが存在しない場合は作成
      try {
        await fs.promises.access(bedrockEngineerDir)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await fs.promises.mkdir(bedrockEngineerDir, { recursive: true })
          log.info('Created .bedrock-engineer directory', { bedrockEngineerDir })
        } else {
          throw error
        }
      }

      // .ignoreファイルを書き込み
      await fs.promises.writeFile(ignoreFilePath, content, 'utf-8')
      log.info('Project ignore file written successfully', { projectPath, ignoreFilePath })

      return { success: true }
    } catch (error) {
      log.error('Failed to write project ignore file', {
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return { success: false }
    }
  },

  'save-website-content': async (
    _event: IpcMainInvokeEvent,
    {
      content,
      url,
      filename,
      directory,
      format
    }: {
      content: string
      url: string
      filename?: string
      directory?: string
      format: 'html' | 'txt'
    }
  ) => {
    try {
      // プロジェクトパスを取得
      const projectPath = store.get('projectPath') || process.cwd()

      // 保存先ディレクトリを決定
      const targetDirectory = directory
        ? path.resolve(directory)
        : path.join(projectPath, 'downloads')

      // ディレクトリが存在しない場合は作成
      try {
        await fs.promises.access(targetDirectory)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await fs.promises.mkdir(targetDirectory, { recursive: true })
          log.info('Created downloads directory', { targetDirectory })
        } else {
          throw error
        }
      }

      // ファイル名の生成
      let finalFilename: string
      if (filename) {
        // 拡張子が指定されていない場合は追加
        const extension = format === 'html' ? '.html' : '.txt'
        finalFilename = filename.endsWith(extension) ? filename : filename + extension
      } else {
        // URLからドメイン名を抽出してファイル名を生成
        try {
          const urlObj = new URL(url)
          const domain = urlObj.hostname.replace(/^www\./, '')
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          const extension = format === 'html' ? '.html' : '.txt'
          finalFilename = `${domain}_${timestamp}${extension}`
        } catch {
          // URLが無効な場合のフォールバック
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          const extension = format === 'html' ? '.html' : '.txt'
          finalFilename = `website_${timestamp}${extension}`
        }
      }

      const filePath = path.join(targetDirectory, finalFilename)

      // ファイル名の重複を避ける
      let finalPath = filePath
      let counter = 1
      let fileExists = true
      while (fileExists) {
        try {
          await fs.promises.access(finalPath)
          // ファイルが存在する場合、番号を付けて再試行
          const extension = path.extname(finalFilename)
          const basename = path.basename(finalFilename, extension)
          const newFilename = `${basename}_${counter}${extension}`
          finalPath = path.join(targetDirectory, newFilename)
          counter++
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // ファイルが存在しない場合は使用可能
            fileExists = false
          } else {
            throw error
          }
        }
      }

      // ファイルを保存
      await fs.promises.writeFile(finalPath, content, 'utf-8')

      log.info('Website content saved successfully', {
        url,
        filePath: finalPath,
        format,
        fileSize: content.length
      })

      return {
        success: true,
        filePath: finalPath
      }
    } catch (error) {
      log.error('Failed to save website content', {
        url,
        filename,
        directory,
        format,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
} as const
