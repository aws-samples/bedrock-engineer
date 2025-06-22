import { useState, useEffect, useCallback } from 'react'
import { updateCheckerService, UpdateInfo, UpdateSettings } from '../services/UpdateCheckerService'
import toast from 'react-hot-toast'

export interface UseUpdateCheckerReturn {
  // State
  updateInfo: UpdateInfo | null
  isChecking: boolean
  error: string | null
  settings: UpdateSettings | null

  // Actions
  checkForUpdates: (forceCheck?: boolean) => Promise<void>
  getSettings: () => Promise<void>
  setSettings: (settings: UpdateSettings) => Promise<void>
  skipVersion: (version: string) => Promise<void>
  openReleaseUrl: (url: string) => Promise<void>

  // Utils
  formatPublishedDate: (publishedAt: string) => string
}

export const useUpdateChecker = (): UseUpdateCheckerReturn => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettingsState] = useState<UpdateSettings | null>(null)

  // Check for updates
  const checkForUpdates = useCallback(async (forceCheck: boolean = false) => {
    try {
      setIsChecking(true)
      setError(null)

      const result = await updateCheckerService.checkForUpdates(forceCheck)
      setUpdateInfo(result)

      if (result?.hasUpdate) {
        console.log('Update available:', result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Failed to check for updates:', err)

      if (forceCheck) {
        toast.error('アップデートの確認に失敗しました')
      }
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Get settings
  const getSettings = useCallback(async () => {
    try {
      const settingsData = await updateCheckerService.getSettings()
      setSettingsState(settingsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Failed to get update settings:', err)
    }
  }, [])

  // Set settings
  const setSettings = useCallback(async (newSettings: UpdateSettings) => {
    try {
      await updateCheckerService.setSettings(newSettings)
      setSettingsState(newSettings)
      toast.success('アップデート設定を保存しました')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Failed to save update settings:', err)
      toast.error('アップデート設定の保存に失敗しました')
    }
  }, [])

  // Skip version
  const skipVersion = useCallback(
    async (version: string) => {
      try {
        await updateCheckerService.skipVersion(version)

        // Update local settings to reflect the skipped version
        if (settings) {
          const updatedSettings = { ...settings, skipVersion: version }
          setSettingsState(updatedSettings)
        }

        // Clear current update info since we're skipping it
        setUpdateInfo(null)

        toast.success(`バージョン ${version} をスキップしました`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error('Failed to skip version:', err)
        toast.error('バージョンのスキップに失敗しました')
      }
    },
    [settings]
  )

  // Open release URL
  const openReleaseUrl = useCallback(async (url: string) => {
    try {
      await updateCheckerService.openReleaseUrl(url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Failed to open release URL:', err)
      toast.error('リリースページを開けませんでした')
    }
  }, [])

  // Format published date
  const formatPublishedDate = useCallback((publishedAt: string) => {
    return updateCheckerService.formatPublishedDate(publishedAt)
  }, [])

  // Initialize settings on mount
  useEffect(() => {
    getSettings()
  }, [getSettings])

  // Listen for update notifications from main process
  useEffect(() => {
    const removeListener = updateCheckerService.onUpdateAvailable((updateInfo: UpdateInfo) => {
      console.log('Received update notification:', updateInfo)
      setUpdateInfo(updateInfo)
    })

    return removeListener
  }, [])

  return {
    // State
    updateInfo,
    isChecking,
    error,
    settings,

    // Actions
    checkForUpdates,
    getSettings,
    setSettings,
    skipVersion,
    openReleaseUrl,

    // Utils
    formatPublishedDate
  }
}
