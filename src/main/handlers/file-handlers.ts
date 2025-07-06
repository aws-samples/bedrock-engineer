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
  }
} as const
