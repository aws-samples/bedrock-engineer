import { app, shell, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron'
import { join, resolve } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/icon.ico?asset'
import api from './api'
import { handleFileOpen } from '../preload/file'
import Store from 'electron-store'
import getRandomPort from '../preload/lib/random-port'
import { store } from '../preload/store'
import fs from 'fs'
import { CustomAgent } from '../types/agent-chat'
import yaml from 'js-yaml'

// No need to track project path anymore as we always read from disk
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

  // Initial load of shared agents (optional - for logging purposes only)
  loadSharedAgents()
    .then((result) => {
      console.log(`Found ${result.agents.length} shared agents at startup`)
    })
    .catch((err) => {
      console.error('Failed to load shared agents:', err)
    })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('open-file', () =>
    handleFileOpen({
      title: 'openFile...',
      properties: ['openFile']
    })
  )
  ipcMain.handle('open-directory', async () => {
    const path = await handleFileOpen({
      title: 'Select Directory',
      properties: ['openDirectory', 'createDirectory'],
      message: 'Select a directory for your project',
      buttonLabel: 'Select Directory'
    })

    // If path was selected and it differs from the current project path,
    // update the project path in store
    if (path && path !== store.get('projectPath')) {
      store.set('projectPath', path)
      // Project path is stored in electron-store
      // Preload agents in the background for initial data
      loadSharedAgents().then((result) => {
        console.log(`Loaded ${result.agents.length} shared agents for new project path`)
      })
    }

    return path
  })

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

  /**
   * Load shared agents from the project directory
   * This function reads agent JSON and YAML files from the .bedrock-engineer/agents directory
   * Always reads from disk to ensure latest data is returned
   */
  async function loadSharedAgents(): Promise<{ agents: CustomAgent[]; error: string | null }> {
    try {
      const projectPath = store.get('projectPath') as string
      if (!projectPath) {
        return { agents: [], error: null }
      }

      // Project path from store is used

      console.log('Loading shared agents from disk')
      const agentsDir = resolve(projectPath, '.bedrock-engineer/agents')

      // Check if the directory exists
      try {
        await fs.promises.access(agentsDir)
      } catch (error) {
        // If directory doesn't exist, just return empty array
        return { agents: [], error: null }
      }

      // Read JSON and YAML files in the agents directory
      const files = (await fs.promises.readdir(agentsDir)).filter(
        (file) => file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')
      )
      const agents: CustomAgent[] = []

      // Process all files concurrently using Promise.all for better performance
      const agentPromises = files.map(async (file) => {
        try {
          const filePath = resolve(agentsDir, file)
          const content = await fs.promises.readFile(filePath, 'utf-8')

          // Parse the file content based on its extension
          let agent: CustomAgent
          if (file.endsWith('.json')) {
            agent = JSON.parse(content) as CustomAgent
          } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
            agent = yaml.load(content) as CustomAgent
          } else {
            throw new Error(`Unsupported file format: ${file}`)
          }

          // Make sure each loaded agent has a unique ID to prevent React key conflicts
          // If the ID doesn't already start with 'shared-', prefix it
          if (!agent.id || !agent.id.startsWith('shared-')) {
            // Remove any file extension (.json, .yml, .yaml) for the safeName
            const safeName = file.replace(/\.(json|ya?ml)$/, '').toLowerCase()
            agent.id = `shared-${safeName}-${Math.random().toString(36).substring(2, 9)}`
          }

          // Add a flag to indicate this is a shared agent
          agent.isShared = true
          return agent
        } catch (err) {
          console.error(`Error reading agent file ${file}:`, err)
          return null
        }
      })

      // Wait for all promises to resolve and filter out any null results (from failed reads)
      const loadedAgents = (await Promise.all(agentPromises)).filter(
        (agent): agent is CustomAgent => agent !== null
      )
      agents.push(...loadedAgents)

      return { agents, error: null }
    } catch (error) {
      console.error('Error reading shared agents:', error)
      return { agents: [], error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Shared agents handler - uses cached data when possible
  ipcMain.handle('read-shared-agents', async () => {
    return await loadSharedAgents()
  })

  // Handler to save an agent as a shared agent
  ipcMain.handle('save-shared-agent', async (_, agent, options?: { format?: 'json' | 'yaml' }) => {
    try {
      const projectPath = store.get('projectPath') as string
      if (!projectPath) {
        return { success: false, error: 'No project path selected' }
      }

      // Determine file format (default to YAML if not specified)
      const format = options?.format || 'yaml'
      const fileExtension = format === 'json' ? '.json' : '.yaml'

      // Ensure directories exist
      const bedrockEngineerDir = resolve(projectPath, '.bedrock-engineer')
      const agentsDir = resolve(bedrockEngineerDir, 'agents')

      // Create directories if they don't exist (recursive will create both parent and child dirs)
      await fs.promises.mkdir(agentsDir, { recursive: true })

      // Generate a safe filename from the agent name
      const safeFileName =
        agent.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'custom-agent'

      // Check if the file already exists and add a suffix if needed
      let fileName = `${safeFileName}${fileExtension}`
      let count = 1

      // Helper function to check if file exists, using async fs
      const fileExists = async (path: string): Promise<boolean> => {
        try {
          await fs.promises.access(path)
          return true
        } catch {
          return false
        }
      }

      while (await fileExists(resolve(agentsDir, fileName))) {
        fileName = `${safeFileName}-${count}${fileExtension}`
        count++
      }

      // Generate new ID for shared agent to avoid key conflicts
      const newId = `shared-${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`

      // Make sure agent has isShared set to true and a unique ID
      const sharedAgent = {
        ...agent,
        id: newId,
        isShared: true
      }

      // Write the agent to file based on the format
      const filePath = resolve(agentsDir, fileName)
      let fileContent: string

      if (format === 'json') {
        fileContent = JSON.stringify(sharedAgent, null, 2)
      } else {
        // For YAML format
        fileContent = yaml.dump(sharedAgent, {
          indent: 2,
          lineWidth: 120,
          noRefs: true, // Don't output YAML references
          sortKeys: false // Preserve key order
        })
      }

      await fs.promises.writeFile(filePath, fileContent, 'utf-8')

      // We don't need to call loadSharedAgents here anymore since there's no cache
      // Client will call read-shared-agents when needed to get the latest data

      return { success: true, filePath, format }
    } catch (error) {
      console.error('Error saving shared agent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
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
