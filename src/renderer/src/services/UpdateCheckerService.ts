// Simple logger for renderer process
const logger = {
  debug: (message: string, meta?: any) =>
    console.debug(`[update-checker-service] ${message}`, meta),
  info: (message: string, meta?: any) => console.info(`[update-checker-service] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[update-checker-service] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[update-checker-service] ${message}`, meta)
}

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseUrl: string
  releaseNotes?: string
  publishedAt: string
  isPrerelease: boolean
}

export interface UpdateSettings {
  autoCheck: boolean
  checkInterval: 'daily' | 'weekly' | 'never'
  includePrerelease: boolean
  lastChecked?: string
  skipVersion?: string
}

export class UpdateCheckerService {
  private static instance: UpdateCheckerService

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): UpdateCheckerService {
    if (!UpdateCheckerService.instance) {
      UpdateCheckerService.instance = new UpdateCheckerService()
    }
    return UpdateCheckerService.instance
  }

  /**
   * Check for updates
   * @param forceCheck Force check regardless of settings
   * @returns Promise<UpdateInfo | null>
   */
  async checkForUpdates(forceCheck: boolean = false): Promise<UpdateInfo | null> {
    try {
      logger.debug('Checking for updates', { forceCheck })

      if (!window.api?.update?.checkVersion) {
        logger.error('Update API not available')
        throw new Error('Update API not available')
      }

      const result = await window.api.update.checkVersion(forceCheck)

      if (result) {
        logger.info('Update check completed', {
          hasUpdate: result.hasUpdate,
          currentVersion: result.currentVersion,
          latestVersion: result.latestVersion
        })
      } else {
        logger.debug('No update check performed or no update available')
      }

      return result
    } catch (error) {
      logger.error('Failed to check for updates', { error: String(error) })
      throw error
    }
  }

  /**
   * Get update settings
   * @returns Promise<UpdateSettings>
   */
  async getSettings(): Promise<UpdateSettings> {
    try {
      if (!window.api?.update?.getSettings) {
        throw new Error('Update API not available')
      }

      const settings = await window.api.update.getSettings()
      logger.debug('Retrieved update settings', { settings })
      return settings
    } catch (error) {
      logger.error('Failed to get update settings', { error: String(error) })
      throw error
    }
  }

  /**
   * Save update settings
   * @param settings Update settings to save
   */
  async setSettings(settings: UpdateSettings): Promise<void> {
    try {
      logger.debug('Saving update settings', { settings })

      if (!window.api?.update?.setSettings) {
        throw new Error('Update API not available')
      }

      await window.api.update.setSettings(settings)
      logger.info('Update settings saved successfully')
    } catch (error) {
      logger.error('Failed to save update settings', { error: String(error) })
      throw error
    }
  }

  /**
   * Skip a specific version
   * @param version Version to skip
   */
  async skipVersion(version: string): Promise<void> {
    try {
      logger.debug('Skipping version', { version })

      if (!window.api?.update?.skipVersion) {
        throw new Error('Update API not available')
      }

      await window.api.update.skipVersion(version)
      logger.info('Version skipped successfully', { version })
    } catch (error) {
      logger.error('Failed to skip version', { error: String(error) })
      throw error
    }
  }

  /**
   * Open release URL in external browser
   * @param url Release URL to open
   */
  async openReleaseUrl(url: string): Promise<void> {
    try {
      logger.debug('Opening release URL', { url })

      if (!window.api?.update?.openReleaseUrl) {
        throw new Error('Update API not available')
      }

      await window.api.update.openReleaseUrl(url)
      logger.info('Release URL opened successfully', { url })
    } catch (error) {
      logger.error('Failed to open release URL', { error: String(error) })
      throw error
    }
  }

  /**
   * Listen for update notifications from main process
   * @param callback Callback function to handle update notifications
   * @returns Cleanup function to remove listener
   */
  onUpdateAvailable(callback: (updateInfo: UpdateInfo) => void): () => void {
    try {
      if (!window.api?.update?.onUpdateAvailable) {
        logger.error('Update API not available')
        return () => {}
      }

      logger.debug('Setting up update notification listener')
      const removeListener = window.api.update.onUpdateAvailable(callback)

      return () => {
        logger.debug('Removing update notification listener')
        removeListener()
      }
    } catch (error) {
      logger.error('Failed to set up update listener', { error: String(error) })
      return () => {}
    }
  }

  /**
   * Format published date for display
   * @param publishedAt ISO date string
   * @returns Formatted date string
   */
  formatPublishedDate(publishedAt: string): string {
    try {
      const date = new Date(publishedAt)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      logger.warn('Failed to format published date', { publishedAt, error: String(error) })
      return publishedAt
    }
  }

  /**
   * Get default update settings
   * @returns Default UpdateSettings
   */
  getDefaultSettings(): UpdateSettings {
    return {
      autoCheck: true,
      checkInterval: 'daily',
      includePrerelease: false
    }
  }
}

// Export singleton instance
export const updateCheckerService = UpdateCheckerService.getInstance()
