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
   * @returns The final merged model list
   */
  const handleInferenceProfilesEnabled = useCallback(
    async (enhancedModels: LLM[], overrideSettings?: Partial<BedrockSettings>): Promise<LLM[]> => {
      try {
        // Fetch inference profiles from AWS
        const inferenceProfiles = await refreshInferenceProfiles(overrideSettings)

        // Convert inference profiles to LLM format
        const profileModels = inferenceProfiles.map((profile) =>
          window.api.bedrock.convertInferenceProfileToLLM(profile)
        )

        // Merge standard models with inference profile models
        const finalModels = [...enhancedModels, ...profileModels]
        setAvailableModels(finalModels)
        return finalModels
      } catch (profileError) {
        console.warn(
          'Failed to fetch inference profiles, falling back to standard models only:',
          profileError
        )
        // Fallback to standard models only if inference profiles fail
        setAvailableModels(enhancedModels)
        return enhancedModels
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
   * @returns The standard models list
   */
  const handleInferenceProfilesDisabled = useCallback(
    async (enhancedModels: LLM[], overrideSettings?: Partial<BedrockSettings>): Promise<LLM[]> => {
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

      return enhancedModels
    },
    [currentLLM, switchToFirstStandardModel]
  )

  /**
   * Finds the best alternative model when the current model is not available
   *
   * @param currentModel - The currently selected model
   * @param availableModels - List of available models in the new region
   * @returns Best alternative model or null if none found
   */
  const findBestAlternative = useCallback(
    (currentModel: LLM, availableModels: LLM[]): LLM | null => {
      if (availableModels.length === 0) return null

      // Try to find a model from the same family (e.g., Claude 3.5 Sonnet variants)
      const modelFamily = currentModel.modelName.split(' ').slice(0, 3).join(' ') // e.g., "Claude 3.5 Sonnet"
      const sameFamily = availableModels.find(
        (model) => model.modelName.includes(modelFamily) && model.toolUse === currentModel.toolUse
      )

      if (sameFamily) return sameFamily

      // Try to find a model with the same tool support
      const sameToolSupport = availableModels.find(
        (model) => model.toolUse === currentModel.toolUse
      )

      if (sameToolSupport) return sameToolSupport

      // Fallback to first available model
      return availableModels[0]
    },
    []
  )

  /**
   * Validates the current model against available models and switches if necessary
   *
   * @param newModels - List of newly fetched available models
   */
  const validateAndSwitchModel = useCallback(
    (newModels: LLM[]): void => {
      if (!currentLLM || !onModelUpdate) return

      // Check if current model is available in the new model list
      const isCurrentModelAvailable = newModels.some(
        (model) => model.modelId === currentLLM.modelId
      )

      if (!isCurrentModelAvailable) {
        // Find the best alternative model
        const alternativeModel = findBestAlternative(currentLLM, newModels)
        if (alternativeModel) {
          console.info(
            `Model automatically switched from ${currentLLM.modelName} to ${alternativeModel.modelName} due to region change`
          )
          onModelUpdate(alternativeModel)
        } else {
          console.warn('No suitable alternative model found for region change')
        }
      }
    },
    [currentLLM, onModelUpdate, findBestAlternative]
  )

  /**
   * Fetches and updates the list of available models
   *
   * This function performs the following operations:
   * 1. Retrieves base models from the API
   * 2. Conditionally fetches and merges inference profiles based on settings
   * 3. Handles automatic model switching when inference profiles are disabled
   * 4. Validates current model and switches to alternative if needed
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

        let finalModels: LLM[] = []

        // Handle inference profiles based on settings
        if (settings.enableInferenceProfiles) {
          finalModels = await handleInferenceProfilesEnabled(models, overrideSettings)
        } else {
          finalModels = await handleInferenceProfilesDisabled(models, overrideSettings)
        }

        // Validate current model and switch if necessary (only when not in initial load)
        if (isInitializedRef.current) {
          validateAndSwitchModel(finalModels)
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
    [
      bedrockSettings,
      handleInferenceProfilesEnabled,
      handleInferenceProfilesDisabled,
      validateAndSwitchModel
    ]
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
