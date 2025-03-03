import { app, shell, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/icon.ico?asset'
import api from './api'
import { handleFileOpen } from '../preload/file'
import Store from 'electron-store'
import getRandomPort from '../preload/lib/random-port'
import { store } from '../preload/store'
import fs from 'fs'
Store.initRenderer()

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
          ? [{ type: 'separator' }, { role: 'front' }, { role: 'window' }]
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
  const mainWindow = new BrowserWindow({
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

  // Add zoom-related shortcut keys
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      if (input.key === '=' || input.key === '+') {
        const currentZoom = mainWindow.webContents.getZoomFactor()
        mainWindow.webContents.setZoomFactor(currentZoom + 0.1)
        event.preventDefault()
      } else if (input.key === '-') {
        const currentZoom = mainWindow.webContents.getZoomFactor()
        mainWindow.webContents.setZoomFactor(Math.max(0.1, currentZoom - 0.1))
        event.preventDefault()
      } else if (input.key === '0') {
        mainWindow.webContents.setZoomFactor(1.0)
        event.preventDefault()
      } else if (input.key === 'r') {
        mainWindow.reload()
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
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const port = await getRandomPort()
  store.set('apiEndpoint', `http://localhost:${port}`)

  api.listen(port, () => {
    console.log({
      API_ENDPOINT: 'http://localhost' + port
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set userDataPath in store
  store.set('userDataPath', app.getPath('userData'))
  console.log('User Data Path:', app.getPath('userData'))

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('open-file', () =>
    handleFileOpen({
      title: 'openFile...',
      properties: ['openFile']
    })
  )
  ipcMain.handle('open-directory', () =>
    handleFileOpen({
      title: 'openDirectory',
      properties: ['openDirectory']
    })
  )

  // Local image loading handler
  ipcMain.handle('get-local-image', async (_, path: string) => {
    try {
      const data = await fs.promises.readFile(path)
      const ext = path.split('.').pop()?.toLowerCase() || 'png'
      const base64 = data.toString('base64')
      return `data:image/${ext};base64,${base64}`
    } catch (error) {
      console.error('Failed to read image:', error)
      throw error
    }
  })

  // Window focus state handler
  ipcMain.handle('window:isFocused', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window?.isFocused() ?? false
  })

  // Web fetch handler for Tool execution
  ipcMain.handle('fetch-website', async (_event, url: string, options?: any) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        const json = await response.json()
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          data: json
        }
      } else {
        const text = await response.text()
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          data: text
        }
      }
    } catch (error) {
      console.error('Error fetching website:', error)
      throw error
    }
  })
  createWindow()

  // Electron Store save config.json in this directory
  console.log({ userDataDir: app.getPath('userData') })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
