import { IpcMainInvokeEvent, app } from 'electron'
import { spawn } from 'child_process'
import axios from 'axios'
import { log } from '../../common/logger'
import { store } from '../../preload/store'
import { createUtilProxyAgent } from '../lib/proxy-utils'
import { getTodoFilePath, TodoList } from '../../preload/tools/handlers/todo/types'
import { promises as fs } from 'fs'

export const utilHandlers = {
  'get-app-path': async (_event: IpcMainInvokeEvent) => {
    return app.getAppPath()
  },

  'fetch-website': async (_event: IpcMainInvokeEvent, params: [string, any?]) => {
    const [url, options] = params
    try {
      // Get proxy configuration from store
      const awsConfig = store.get('aws')
      const proxyAgents = createUtilProxyAgent(awsConfig?.proxyConfig)
      const axiosConfig: any = {
        method: options?.method || 'GET',
        url: url,
        headers: {
          ...options?.headers,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }

      // Add request body if provided
      if (options?.body) {
        axiosConfig.data = options.body
      }

      // Apply appropriate proxy agent based on URL protocol
      if (proxyAgents) {
        const targetUrl = new URL(url)
        const agent = proxyAgents.httpsAgent

        if (targetUrl.protocol === 'https:') {
          axiosConfig.httpsAgent = agent
        } else {
          axiosConfig.httpAgent = agent
        }
      } else {
        log.debug('No proxy agent configured, using direct connection', { url })
      }

      const response = await axios(axiosConfig)

      return {
        status: response.status,
        headers: response.headers as Record<string, string>,
        data: response.data
      }
    } catch (error) {
      log.error('Error fetching website', {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'check-docker-availability': async (_event: IpcMainInvokeEvent) => {
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['--version'], { stdio: 'pipe' })

      let output = ''
      let errorOutput = ''

      dockerProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      dockerProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      dockerProcess.on('close', (code) => {
        if (code === 0 && output.includes('Docker version')) {
          // Extract version information
          const versionMatch = output.match(/Docker version (\d+\.\d+\.\d+)/)
          const version = versionMatch ? versionMatch[1] : 'Unknown'

          resolve({
            available: true,
            version,
            lastChecked: new Date()
          })
        } else {
          resolve({
            available: false,
            error: errorOutput || 'Docker not found or not running',
            lastChecked: new Date()
          })
        }
      })

      dockerProcess.on('error', (error) => {
        resolve({
          available: false,
          error: error.message,
          lastChecked: new Date()
        })
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        dockerProcess.kill()
        resolve({
          available: false,
          error: 'Docker check timed out',
          lastChecked: new Date()
        })
      }, 5000)
    })
  },

  'get-todo-list': async (_event: IpcMainInvokeEvent, params?: { sessionId?: string }) => {
    try {
      // Always get projectPath from store
      const projectPath = store.get('projectPath') || require('os').homedir()

      // Only get specific session TODO list, no fallback
      if (params?.sessionId) {
        const todoList = await getTodoListFromFile(projectPath, params.sessionId)
        log.debug('Retrieved session-specific TODO list from file', {
          todoList: todoList ? { id: todoList.id, itemCount: todoList.items.length } : null,
          sessionId: params.sessionId,
          projectPath,
          found: !!todoList
        })
        return todoList
      }

      // No session ID provided, return null
      log.debug('No session ID provided for TODO list retrieval')
      return null
    } catch (error) {
      log.error('Error retrieving TODO list', {
        error: error instanceof Error ? error.message : String(error),
        params
      })
      return null
    }
  }
} as const

/**
 * Get a specific todo list from file
 */
async function getTodoListFromFile(
  projectPath: string,
  sessionId: string
): Promise<TodoList | null> {
  try {
    const filePath = getTodoFilePath(projectPath, sessionId)
    const fileContent = await fs.readFile(filePath, 'utf8')
    const todoList: TodoList = JSON.parse(fileContent)
    return todoList
  } catch (error) {
    log.debug('Todo file not found or could not be read', {
      projectPath,
      sessionId,
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}
