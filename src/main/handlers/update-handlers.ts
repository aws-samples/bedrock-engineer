import { ipcMain } from 'electron'
import { versionChecker } from '../api/github/versionChecker'
import type { UpdateInfo, UpdateSettings } from '../api/github/versionChecker'
import { createCategoryLogger } from '../../common/logger'

const logger = createCategoryLogger('update-handlers')

// Store settings in electron-store
let electronStore: any

const initializeStore = () => {
  if (!electronStore) {
    try {
      const Store = require('electron-store')
      electronStore = new Store()
    } catch (error) {
      logger.error('Failed to initialize electron-store', { error: String(error) })
    }
  }
}

/**
 * Get update settings from store
 */
const getUpdateSettings = (): UpdateSettings => {
  initializeStore()

  if (!electronStore) {
    return versionChecker.getDefaultSettings()
  }

  const storedSettings = electronStore.get('updateSettings')
  if (!storedSettings) {
    const defaultSettings = versionChecker.getDefaultSettings()
    electronStore.set('updateSettings', defaultSettings)
    return defaultSettings
  }

  return storedSettings
}

/**
 * Save update settings to store
 */
const saveUpdateSettings = (settings: UpdateSettings): void => {
  initializeStore()

  if (electronStore) {
    electronStore.set('updateSettings', settings)
    logger.debug('Update settings saved', { settings })
  }
}

/**
 * Register update-related IPC handlers
 */
export const registerUpdateHandlers = (): void => {
  logger.info('Registering update IPC handlers')

  // Check for updates
  ipcMain.handle(
    'update:check',
    async (_, forceCheck: boolean = false): Promise<UpdateInfo | null> => {
      try {
        logger.debug('Received update check request', { forceCheck })

        const settings = getUpdateSettings()
        const updateInfo = await versionChecker.checkForUpdates(settings, forceCheck)

        // Update last checked timestamp if we performed a check
        if (forceCheck || updateInfo !== null) {
          const updatedSettings = versionChecker.updateLastChecked(settings)
          saveUpdateSettings(updatedSettings)
        }

        return updateInfo
      } catch (error) {
        logger.error('Failed to check for updates', { error: String(error) })
        throw error
      }
    }
  )

  // Get update settings
  ipcMain.handle('update:getSettings', async (): Promise<UpdateSettings> => {
    try {
      const settings = getUpdateSettings()
      logger.debug('Retrieved update settings', { settings })
      return settings
    } catch (error) {
      logger.error('Failed to get update settings', { error: String(error) })
      throw error
    }
  })

  // Save update settings
  ipcMain.handle('update:setSettings', async (_, settings: UpdateSettings): Promise<void> => {
    try {
      logger.debug('Saving update settings', { settings })
      saveUpdateSettings(settings)
    } catch (error) {
      logger.error('Failed to save update settings', { error: String(error) })
      throw error
    }
  })

  // Skip version
  ipcMain.handle('update:skipVersion', async (_, version: string): Promise<void> => {
    try {
      logger.debug('Skipping version', { version })

      const currentSettings = getUpdateSettings()
      const updatedSettings = versionChecker.skipVersion(currentSettings, version)
      saveUpdateSettings(updatedSettings)
    } catch (error) {
      logger.error('Failed to skip version', { error: String(error) })
      throw error
    }
  })

  // Open release URL
  ipcMain.handle('update:openReleaseUrl', async (_, url: string): Promise<void> => {
    try {
      logger.debug('Opening release URL', { url })

      const { shell } = require('electron')
      await shell.openExternal(url)
    } catch (error) {
      logger.error('Failed to open release URL', { error: String(error) })
      throw error
    }
  })

  logger.info('Update IPC handlers registered successfully')
}

/**
 * Unregister update-related IPC handlers
 */
export const unregisterUpdateHandlers = (): void => {
  logger.debug('Unregistering update IPC handlers')

  ipcMain.removeHandler('update:check')
  ipcMain.removeHandler('update:getSettings')
  ipcMain.removeHandler('update:setSettings')
  ipcMain.removeHandler('update:skipVersion')
  ipcMain.removeHandler('update:openReleaseUrl')
}

/**
 * Perform automatic update check on app startup
 */
export const performStartupUpdateCheck = async (): Promise<UpdateInfo | null> => {
  try {
    logger.info('Performing startup update check')

    const settings = getUpdateSettings()
    const updateInfo = await versionChecker.checkForUpdates(settings, false)

    if (updateInfo !== null) {
      // Update last checked timestamp
      const updatedSettings = versionChecker.updateLastChecked(settings)
      saveUpdateSettings(updatedSettings)
    }

    return updateInfo
  } catch (error) {
    logger.error('Failed to perform startup update check', { error: String(error) })
    return null
  }
}
