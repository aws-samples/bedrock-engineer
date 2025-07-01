import { app, shell, BrowserWindow, Menu, MenuItem } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/icon.ico?asset'
import { server } from './api'
import Store from 'electron-store'
import getRandomPort from '../preload/lib/random-port'
import { store } from '../preload/store'
import { resolveProxyConfig, convertToElectronProxyConfig } from './lib/proxy-utils'
import {
  initLoggerConfig,
  initLogger,
  registerGlobalErrorHandlers,
  log,
  createCategoryLogger
} from '../common/logger'
import { registerIpcHandlers, registerLogHandler } from './lib/ipc-handler'
import { bedrockHandlers } from './handlers/bedrock-handlers'
import { fileHandlers } from './handlers/file-handlers'
import { windowHandlers } from './handlers/window-handlers'
import { agentHandlers } from './handlers/agent-handlers'
import { utilHandlers } from './handlers/util-handlers'
import { screenHandlers } from './handlers/screen-handlers'
import { cameraHandlers } from './handlers/camera-handlers'
import { registerProxyHandlers } from './handlers/proxy-handlers'
// 動的インポートを使用してfix-pathパッケージを読み込む
import('fix-path')
  .then((fixPathModule) => {
    fixPathModule.default()
  })
  .catch((err) => {
    console.error('Failed to load fix-path module:', err)
  })
// No need to track project path anymore as we always read from disk
Store.initRenderer()

// Initialize category loggers
const apiLogger = createCategoryLogger('api')
const agentsLogger = createCategoryLogger('agents')

// プロキシ認証情報を保存するグローバル変数
let currentProxyConfig: any = null

/**
 * プロキシ認証ハンドラーを設定
 */
function setupProxyAuthHandler(_window: BrowserWindow, proxyConfig: any): void {
  // 現在のプロキシ設定を保存
  currentProxyConfig = proxyConfig

  log.debug('Proxy authentication handler configured', {
    host: proxyConfig.host,
    port: proxyConfig.port,
    hasUsername: !!proxyConfig.username,
    hasPassword: !!proxyConfig.password
  })
}

/**
 * BrowserWindow Session のプロキシ設定を適用
 */
async function setupSessionProxy(window: BrowserWindow): Promise<void> {
  try {
    // ストアからAWS設定を読み取り
    const awsConfig = store.get('aws') as any

    // プロキシ設定を決定
    const proxyConfig = resolveProxyConfig(awsConfig?.proxyConfig)
    console.log({ proxyConfig })

    if (proxyConfig) {
      const electronProxyRules = convertToElectronProxyConfig(proxyConfig)

      if (electronProxyRules) {
        await window.webContents.session.setProxy({
          mode: 'fixed_servers',
          proxyRules: electronProxyRules
        })

        // プロキシ認証ハンドラーの設定
        if (proxyConfig.username && proxyConfig.password) {
          setupProxyAuthHandler(window, proxyConfig)
        }

        log.info('Session proxy configured', {
          host: proxyConfig.host,
          port: proxyConfig.port,
          proxyRules: electronProxyRules,
          hasAuth: !!(proxyConfig.username && proxyConfig.password)
        })
      }
    } else {
      // プロキシなしの場合は直接接続
      await window.webContents.session.setProxy({
        mode: 'direct'
      })

      log.debug('Session proxy disabled - using direct connection')
    }
  } catch (error) {
    log.error('Failed to setup session proxy', {
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

function createMenu(window: BrowserWindow) {
  const isMac = process.platform === 'darwin'
  const template = [
    // Application Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }])
      ]
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CommandOrControl+Plus',
          click: () => {
            const currentZoom = window.webContents.getZoomFactor()
            window.webContents.setZoomFactor(currentZoom + 0.1)
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CommandOrControl+-',
          click: () => {
            const currentZoom = window.webContents.getZoomFactor()
            window.webContents.setZoomFactor(Math.max(0.1, currentZoom - 0.1))
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CommandOrControl+0',
          click: () => {
            window.webContents.setZoomFactor(1.0)
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              {
                label: 'Hide Window',
                accelerator: 'Cmd+W',
                click: () => {
                  if (mainWindow) {
                    mainWindow.hide()
                  }
                }
              },
              { type: 'separator' },
              { role: 'front' },
              { role: 'window' }
            ]
          : [{ role: 'close' }])
      ]
    },
    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/daisuke-awaji/bedrock-engineer')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

async function createWindow(): Promise<void> {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 640,
    minHeight: 416,
    width: 1800,
    height: 1340,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      // Zoom related settings
      zoomFactor: 1.0,
      enableWebSQL: false
    }
  })

  // Create menu with mainWindow
  createMenu(mainWindow)

  // セッションレベルでプロキシを設定
  await setupSessionProxy(mainWindow)

  // Add zoom-related shortcut keys
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      if (input.key === '=' || input.key === '+') {
        const currentZoom = mainWindow!.webContents.getZoomFactor()
        mainWindow!.webContents.setZoomFactor(currentZoom + 0.1)
        event.preventDefault()
      } else if (input.key === '-') {
        const currentZoom = mainWindow!.webContents.getZoomFactor()
        mainWindow!.webContents.setZoomFactor(Math.max(0.1, currentZoom - 0.1))
        event.preventDefault()
      } else if (input.key === '0') {
        mainWindow!.webContents.setZoomFactor(1.0)
        event.preventDefault()
      } else if (input.key === 'r') {
        mainWindow!.reload()
        event.preventDefault()
      }
    }
  })

  // Create context menu
  const contextMenu = new Menu()
  contextMenu.append(
    new MenuItem({
      label: 'Copy',
      role: 'copy'
    })
  )
  contextMenu.append(
    new MenuItem({
      label: 'Paste',
      role: 'paste'
    })
  )

  // Handle context menu events
  mainWindow.webContents.on('context-menu', () => {
    contextMenu.popup()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  // Handle window close event for macOS - hide instead of close unless quitting
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault()
      mainWindow!.hide()
    } else {
      mainWindow = null
    }
  })

  // Handle window closed event for cleanup
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const port = await getRandomPort()
  store.set('apiEndpoint', `http://localhost:${port}`)

  server.listen(port, () => {
    apiLogger.info('API server started', {
      endpoint: `http://localhost:${port}`
    })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({
      mode: 'right'
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Get userDataPath early to ensure it's available for logger initialization
const userDataPath = app.getPath('userData')
// Initialize logger configuration and instance early
initLoggerConfig(userDataPath)
// Create the logger instance explicitly after configuration is set
initLogger()
registerGlobalErrorHandlers()

// Global reference to main window
let mainWindow: BrowserWindow | null = null
// Track app quit state for macOS
let isQuitting = false

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set userDataPath in store
  store.set('userDataPath', userDataPath)

  log.info('Application started', {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    userDataPath
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // プロキシ認証ハンドラーの設定（アプリケーションレベル）
  app.on('login', (event, _webContents, _authenticationResponseDetails, authInfo, callback) => {
    // プロキシ認証のリクエストかチェック
    if (authInfo.isProxy && currentProxyConfig?.username && currentProxyConfig?.password) {
      event.preventDefault()
      callback(currentProxyConfig.username, currentProxyConfig.password)

      log.debug('Proxy authentication provided', {
        host: authInfo.host,
        port: authInfo.port,
        realm: authInfo.realm
      })
    }
  })

  // IPCハンドラーの一括登録
  registerIpcHandlers(bedrockHandlers, { loggerCategory: 'bedrock:ipc' })
  registerIpcHandlers(fileHandlers, { loggerCategory: 'file:ipc' })
  registerIpcHandlers(windowHandlers, { loggerCategory: 'window:ipc' })
  registerIpcHandlers(agentHandlers, { loggerCategory: 'agents:ipc' })
  registerIpcHandlers(utilHandlers, { loggerCategory: 'utils:ipc' })
  registerIpcHandlers(screenHandlers, { loggerCategory: 'screen:ipc' })
  registerIpcHandlers(cameraHandlers, { loggerCategory: 'camera:ipc' })

  // プロキシ関連IPCハンドラーの登録
  registerProxyHandlers()

  // ログハンドラーの登録
  registerLogHandler()

  // Initial load of shared agents (optional - for logging purposes only)
  agentHandlers['read-shared-agents'](null as any)
    .then((result) => {
      agentsLogger.info(`Found shared agents at startup`, {
        count: result.agents.length,
        agentIds: result.agents.map((agent) => agent.id)
      })
    })
    .catch((err) => {
      agentsLogger.error('Failed to load shared agents', {
        error: err instanceof Error ? err.message : String(err)
      })
    })
  createWindow()

  // Log where Electron Store saves config.json
  log.debug('Electron Store configuration directory', {
    userDataDir: app.getPath('userData'),
    configFile: `${app.getPath('userData')}/config.json`
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow()
    } else if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show()
    }
  })

  // Handle before-quit to set flag for macOS
  app.on('before-quit', () => {
    isQuitting = true
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * プロキシ設定変更時の動的適用（再起動不要）
 */
export async function updateProxySettings(): Promise<void> {
  if (!mainWindow) {
    log.warn('Cannot update proxy settings: mainWindow is null')
    return
  }

  try {
    // セッションプロキシを再設定
    await setupSessionProxy(mainWindow)

    // AWS SDKクライアントは次回作成時に新しい設定が適用される
    log.info('Proxy settings updated successfully')
  } catch (error) {
    log.error('Failed to update proxy settings', {
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
