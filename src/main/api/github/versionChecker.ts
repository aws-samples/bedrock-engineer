import { githubClient } from './githubClient'
import { createCategoryLogger } from '../../../common/logger'

const logger = createCategoryLogger('version-checker')

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

export class VersionChecker {
  private static instance: VersionChecker
  private readonly repoOwner = 'aws-samples'
  private readonly repoName = 'bedrock-engineer'

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): VersionChecker {
    if (!VersionChecker.instance) {
      VersionChecker.instance = new VersionChecker()
    }
    return VersionChecker.instance
  }

  /**
   * Compare two semantic version strings
   * @param current Current version (e.g., "1.15.3")
   * @param latest Latest version (e.g., "1.16.0")
   * @returns 1 if latest > current, 0 if equal, -1 if current > latest
   */
  private compareVersions(current: string, latest: string): number {
    // Remove 'v' prefix if present
    const currentClean = current.replace(/^v/, '')
    const latestClean = latest.replace(/^v/, '')

    const currentParts = currentClean.split('.').map(Number)
    const latestParts = latestClean.split('.').map(Number)

    // Pad arrays to same length
    const maxLength = Math.max(currentParts.length, latestParts.length)
    while (currentParts.length < maxLength) currentParts.push(0)
    while (latestParts.length < maxLength) latestParts.push(0)

    for (let i = 0; i < maxLength; i++) {
      if (latestParts[i] > currentParts[i]) return 1
      if (latestParts[i] < currentParts[i]) return -1
    }

    return 0
  }

  /**
   * Check if an update check should be performed based on settings
   * @param settings Update settings
   * @returns true if check should be performed
   */
  private shouldCheckForUpdate(settings: UpdateSettings): boolean {
    if (!settings.autoCheck || settings.checkInterval === 'never') {
      return false
    }

    if (!settings.lastChecked) {
      return true
    }

    const lastChecked = new Date(settings.lastChecked)
    const now = new Date()
    const timeDiff = now.getTime() - lastChecked.getTime()

    switch (settings.checkInterval) {
      case 'daily':
        return timeDiff > 24 * 60 * 60 * 1000 // 24 hours
      case 'weekly':
        return timeDiff > 7 * 24 * 60 * 60 * 1000 // 7 days
      default:
        return false
    }
  }

  /**
   * Get current application version from package.json
   * @returns Current version string
   */
  private getCurrentVersion(): string {
    try {
      // In Electron, we can access the app version
      const { app } = require('electron')
      return app.getVersion()
    } catch (error) {
      logger.warn('Failed to get app version from Electron, using fallback', {
        error: String(error)
      })
      // Fallback to package.json version
      return '1.15.3'
    }
  }

  /**
   * Format release notes for display (truncate if too long)
   * @param body Raw release notes from GitHub
   * @returns Formatted release notes
   */
  private formatReleaseNotes(body: string | undefined): string | undefined {
    if (!body) return undefined

    // Remove markdown headers and excessive whitespace
    let formatted = body
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .trim()

    // Truncate if too long (keep first 500 characters)
    if (formatted.length > 500) {
      formatted = formatted.substring(0, 500) + '...'
    }

    return formatted
  }

  /**
   * Check for updates
   * @param settings Update settings
   * @param forceCheck Force check regardless of settings
   * @returns Promise<UpdateInfo | null>
   */
  async checkForUpdates(
    settings: UpdateSettings,
    forceCheck: boolean = false
  ): Promise<UpdateInfo | null> {
    try {
      // Check if we should perform the update check
      if (!forceCheck && !this.shouldCheckForUpdate(settings)) {
        logger.debug('Skipping update check based on settings')
        return null
      }

      const currentVersion = this.getCurrentVersion()
      logger.info(`Checking for updates. Current version: ${currentVersion}`)

      // Get latest release from GitHub
      const latestRelease = await githubClient.getLatestRelease(
        this.repoOwner,
        this.repoName,
        settings.includePrerelease
      )

      if (!latestRelease) {
        logger.warn('No releases found or failed to fetch releases')
        return null
      }

      const latestVersion = latestRelease.tag_name
      logger.debug(`Latest release version: ${latestVersion}`)

      // Check if this version should be skipped
      if (settings.skipVersion === latestVersion) {
        logger.debug(`Skipping version ${latestVersion} as requested by user`)
        return null
      }

      // Compare versions
      const comparison = this.compareVersions(currentVersion, latestVersion)
      const hasUpdate = comparison > 0

      const updateInfo: UpdateInfo = {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseUrl: latestRelease.html_url,
        releaseNotes: this.formatReleaseNotes(latestRelease.body),
        publishedAt: latestRelease.published_at,
        isPrerelease: latestRelease.prerelease
      }

      if (hasUpdate) {
        logger.info(`Update available: ${currentVersion} -> ${latestVersion}`)
      } else {
        logger.info('No update available')
      }

      return updateInfo
    } catch (error) {
      logger.error('Failed to check for updates', { error: String(error) })
      return null
    }
  }

  /**
   * Update the last checked timestamp
   * @param settings Current settings
   * @returns Updated settings
   */
  updateLastChecked(settings: UpdateSettings): UpdateSettings {
    return {
      ...settings,
      lastChecked: new Date().toISOString()
    }
  }

  /**
   * Add a version to skip list
   * @param settings Current settings
   * @param version Version to skip
   * @returns Updated settings
   */
  skipVersion(settings: UpdateSettings, version: string): UpdateSettings {
    return {
      ...settings,
      skipVersion: version
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

// Singleton instance
export const versionChecker = VersionChecker.getInstance()
