import { useState, useCallback, useMemo, useRef } from 'react'
import { listModels } from '@renderer/lib/api'
import type { LLM, ApplicationInferenceProfile } from '@/types/llm'

// Types
interface BedrockSettings {
  enableInferenceProfiles: boolean
  enableRegionFailover: boolean
  availableFailoverRegions: string[]
}

interface ModelFetchOptions {
  overrideSettings?: Partial<BedrockSettings>
  forceRefresh?: boolean
}

interface ModelManagementState {
  availableModels: LLM[]
  isLoadingModels: boolean
  modelError: Error | null
  availableInferenceProfiles: ApplicationInferenceProfile[]
  isLoadingInferenceProfiles: boolean
}

interface ModelManagementActions {
  fetchModels: (options?: ModelFetchOptions) => Promise<void>
  refreshInferenceProfiles: (
    overrideSettings?: Partial<BedrockSettings>
  ) => Promise<ApplicationInferenceProfile[]>
  clearModelError: () => void
}

interface UseModelManagementProps {
  bedrockSettings?: BedrockSettings
  currentLLM?: LLM
  onModelUpdate?: (model: LLM) => void
}

/**
 * Custom hook for managing model fetching and state
 *
 * Handles:
 * - Fetching and caching of available models
 * - Integration with inference profiles
 * - Error handling and loading states
 * - Automatic model switching when settings change
 */
export const useModelManagement = ({
  bedrockSettings,
  currentLLM,
  onModelUpdate
}: UseModelManagementProps): ModelManagementState & ModelManagementActions => {
  // State management
  const [availableModels, setAvailableModels] = useState<LLM[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false)
  const [modelError, setModelError] = useState<Error | null>(null)
  const [availableInferenceProfiles, setAvailableInferenceProfiles] = useState<
    ApplicationInferenceProfile[]
  >([])
  const [isLoadingInferenceProfiles, setIsLoadingInferenceProfiles] = useState<boolean>(false)

  // Use ref to track loading state without causing re-renders in useCallback dependencies
  const isLoadingRef = useRef<boolean>(false)
  const isInitializedRef = useRef<boolean>(false)

  /**
   * Refreshes application inference profiles from AWS
   *
   * @param overrideSettings - Optional settings to override current bedrockSettings
   * @returns Promise resolving to array of inference profiles
   */
  const refreshInferenceProfiles = useCallback(
    async (overrideSettings?: Partial<BedrockSettings>): Promise<ApplicationInferenceProfile[]> => {
      const effectiveSettings = { ...bedrockSettings, ...overrideSettings }

      if (!effectiveSettings.enableInferenceProfiles) {
        setAvailableInferenceProfiles([])
        return []
      }

      setIsLoadingInferenceProfiles(true)
      try {
        const profiles = await window.api.bedrock.listApplicationInferenceProfiles()
        setAvailableInferenceProfiles(profiles)
        return profiles
      } catch (error) {
        console.error('Failed to fetch inference profiles:', error)
        setAvailableInferenceProfiles([])
        return []
      } finally {
        setIsLoadingInferenceProfiles(false)
      }
    },
    [bedrockSettings]
  )

  /**
   * Handles the case when inference profiles are enabled
   * Fetches inference profiles and merges them with standard models
   *
   * @param enhancedModels - Array of enhanced standard models
   * @param overrideSettings - Optional settings override
   */
  const handleInferenceProfilesEnabled = useCallback(
    async (enhancedModels: LLM[], overrideSettings?: Partial<BedrockSettings>): Promise<void> => {
      try {
        // Fetch inference profiles from AWS
        const inferenceProfiles = await refreshInferenceProfiles(overrideSettings)

        // Convert inference profiles to LLM format
        const profileModels = inferenceProfiles.map((profile) =>
          window.api.bedrock.convertInferenceProfileToLLM(profile)
        )

        // Merge standard models with inference profile models
        setAvailableModels([...enhancedModels, ...profileModels])
      } catch (profileError) {
        console.warn(
          'Failed to fetch inference profiles, falling back to standard models only:',
          profileError
        )
        // Fallback to standard models only if inference profiles fail
        setAvailableModels(enhancedModels)
      }
    },
    [refreshInferenceProfiles]
  )

  /**
   * Switches the current model to the first available standard model
   * Used when inference profiles are disabled and current model is an inference profile
   *
   * @param enhancedModels - Array of available standard models
   */
  const switchToFirstStandardModel = useCallback(
    (enhancedModels: LLM[]): void => {
      const firstStandardModel = enhancedModels[0]
      if (firstStandardModel && onModelUpdate) {
        console.info(
          `Switching from inference profile to standard model: ${firstStandardModel.modelName}`
        )
        onModelUpdate(firstStandardModel)
      } else if (!firstStandardModel) {
        console.warn('No standard models available for automatic switching')
      }
    },
    [onModelUpdate]
  )

  /**
   * Handles the case when inference profiles are disabled
   * Sets only standard models and handles automatic model switching
   *
   * @param enhancedModels - Array of enhanced standard models
   * @param overrideSettings - Optional settings override
   */
  const handleInferenceProfilesDisabled = useCallback(
    async (enhancedModels: LLM[], overrideSettings?: Partial<BedrockSettings>): Promise<void> => {
      // Set only standard models (no inference profiles)
      setAvailableModels(enhancedModels)

      // Handle automatic model switching if needed
      const shouldSwitchModel =
        overrideSettings &&
        'enableInferenceProfiles' in overrideSettings &&
        !overrideSettings.enableInferenceProfiles &&
        currentLLM?.isInferenceProfile

      if (shouldSwitchModel) {
        switchToFirstStandardModel(enhancedModels)
      }
    },
    [currentLLM, switchToFirstStandardModel]
  )

  /**
   * Fetches and updates the list of available models
   *
   * This function performs the following operations:
   * 1. Retrieves base models from the API
   * 2. Conditionally fetches and merges inference profiles based on settings
   * 3. Handles automatic model switching when inference profiles are disabled
   *
   * @param options - Optional configuration for model fetching
   */
  const fetchModels = useCallback(
    async (options: ModelFetchOptions = {}): Promise<void> => {
      const { overrideSettings, forceRefresh = false } = options

      // Skip if already loading and not forcing refresh
      if (isLoadingRef.current && !forceRefresh) {
        return
      }

      isLoadingRef.current = true
      setIsLoadingModels(true)
      setModelError(null)

      try {
        // Fetch base models from the API
        const models = await listModels()
        if (!models) {
          console.warn('No models returned from API')
          return
        }

        // Determine effective settings (override takes precedence)
        const settings = { ...bedrockSettings, ...overrideSettings }

        // Handle inference profiles based on settings
        if (settings.enableInferenceProfiles) {
          await handleInferenceProfilesEnabled(models, overrideSettings)
        } else {
          await handleInferenceProfilesDisabled(models, overrideSettings)
        }
      } catch (error) {
        const modelError =
          error instanceof Error ? error : new Error('Unknown error occurred while fetching models')

        console.error('Failed to fetch models:', modelError)
        setModelError(modelError)
        throw modelError
      } finally {
        isLoadingRef.current = false
        setIsLoadingModels(false)
        isInitializedRef.current = true
      }
    },
    [bedrockSettings, handleInferenceProfilesEnabled, handleInferenceProfilesDisabled]
  )

  /**
   * Clears any existing model error
   */
  const clearModelError = useCallback((): void => {
    setModelError(null)
  }, [])

  // Memoized state object
  const state = useMemo(
    (): ModelManagementState => ({
      availableModels,
      isLoadingModels,
      modelError,
      availableInferenceProfiles,
      isLoadingInferenceProfiles
    }),
    [
      availableModels,
      isLoadingModels,
      modelError,
      availableInferenceProfiles,
      isLoadingInferenceProfiles
    ]
  )

  // Memoized actions object
  const actions = useMemo(
    (): ModelManagementActions => ({
      fetchModels,
      refreshInferenceProfiles,
      clearModelError
    }),
    [fetchModels, refreshInferenceProfiles, clearModelError]
  )

  return {
    ...state,
    ...actions
  }
}
