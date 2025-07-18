import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { api } from './api'
import { store } from './store'
import { file } from './file'
import { chatHistory } from './chat-history'
import { appWindow } from './appWindow'
import { rendererLogger, createRendererCategoryLogger } from './logger'
import { ipcClient } from './ipc-client'
import { executeTool } from './tools'
import { ToolResult } from '../types/tools'
import { ToolMetadataCollector } from './tools/registry'

// Initialize preload logger with category
const log = createRendererCategoryLogger('preload')

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    log.info('Initializing preload APIs')
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('store', store)
    contextBridge.exposeInMainWorld('file', file)
    contextBridge.exposeInMainWorld('chatHistory', chatHistory)
    contextBridge.exposeInMainWorld('appWindow', appWindow)
    contextBridge.exposeInMainWorld('ipc', ipcClient)
    contextBridge.exposeInMainWorld('logger', {
      log: rendererLogger,
      createCategoryLogger: createRendererCategoryLogger
    })

    // main プロセスから無理やり preload プロセスのツールを実行するための expose
    contextBridge.exposeInMainWorld('preloadTools', {
      onToolRequest: () => {
        ipcRenderer.on('preload-tool-request', async (_event, data) => {
          try {
            log.info('Received preload tool request', {
              requestId: data.requestId,
              toolType: data.toolInput.type
            })

            const result = await executeTool(data.toolInput)

            // 結果がstring型の場合はToolResult形式に変換
            let toolResult: ToolResult
            if (typeof result === 'string') {
              toolResult = {
                name: data.toolInput.type as any,
                success: true,
                result,
                message: 'Tool executed successfully'
              }
            } else {
              toolResult = result
            }

            log.debug('Preload tool execution completed, sending response', {
              requestId: data.requestId,
              toolType: data.toolInput.type,
              success: toolResult.success
            })

            // レスポンスを送信
            ipcRenderer.send('preload-tool-response', {
              requestId: data.requestId,
              result: toolResult
            })
          } catch (error: any) {
            log.error('Preload tool execution failed', {
              requestId: data.requestId,
              toolType: data.toolInput.type,
              error: error.message,
              stack: error.stack
            })

            const errorResult: ToolResult = {
              name: data.toolInput.type as any,
              success: false,
              result: null,
              error: error.message || 'Tool execution failed',
              message: 'Tool execution failed'
            }

            ipcRenderer.send('preload-tool-response', {
              requestId: data.requestId,
              result: errorResult
            })
          }
        })

        // ツール仕様取得用のIPCハンドラー
        ipcRenderer.on('get-tool-specs-request', async (_event, data) => {
          try {
            log.debug('Received tool specs request', {
              requestId: data.requestId
            })

            // ToolMetadataCollectorからツール仕様を取得
            const toolSpecs = ToolMetadataCollector.getToolSpecs()

            log.debug('Sending tool specs response', {
              requestId: data.requestId,
              specsCount: toolSpecs.length
            })

            // レスポンスを送信
            ipcRenderer.send(`tool-specs-response-${data.requestId}`, toolSpecs)
          } catch (error: any) {
            log.error('Failed to get tool specs', {
              requestId: data.requestId,
              error: error.message,
              stack: error.stack
            })

            // エラー時は空配列を返す
            ipcRenderer.send(`tool-specs-response-${data.requestId}`, [])
          }
        })
      }
    })

    log.info('Preload APIs initialized successfully')
  } catch (error) {
    log.error('Error initializing preload APIs', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
} else {
  try {
    log.info('Initializing preload APIs (context isolation disabled)')
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
    // @ts-ignore (define in dts)
    window.store = store
    // @ts-ignore (define in dts)
    window.file = file
    // @ts-ignore (define in dts)
    window.chatHistory = chatHistory
    // @ts-ignore (define in dts)
    window.appWindow = appWindow
    // @ts-ignore (define in dts)
    window.ipc = ipcClient
    // @ts-ignore (define in dts)
    window.logger = {
      log: rendererLogger,
      createCategoryLogger: createRendererCategoryLogger
    }
    log.info('Preload APIs initialized successfully (context isolation disabled)')
  } catch (error) {
    log.error('Error initializing preload APIs (context isolation disabled)', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
