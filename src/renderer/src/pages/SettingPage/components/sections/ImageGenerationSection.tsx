import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingSection } from '../SettingSection'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { getImageGenerationModelsForRegion } from '@/common/models/models'
import { BedrockSupportRegion } from '@/types/llm'

export const ImageGenerationSection = () => {
  const { t } = useTranslation()
  const { generateImageModel, setGenerateImageModel, awsRegion } = useSettings()
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const models = getImageGenerationModelsForRegion(awsRegion as BedrockSupportRegion)
    setAvailableModels(models)
  }, [awsRegion])

  const sortedModels = useMemo(() => {
    return [...availableModels].sort((a, b) => {
      const aIsAmazon = a.id.startsWith('amazon.')
      const bIsAmazon = b.id.startsWith('amazon.')
      if (aIsAmazon && !bIsAmazon) return -1
      if (!aIsAmazon && bIsAmazon) return 1
      return a.name.localeCompare(b.name)
    })
  }, [availableModels])

  return (
    <SettingSection
      title={t('imageGenerator.settingsTitle', 'Image Generation')}
      description={t('imageGenerator.settingsDescription', 'Configure the default model for image generation')}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="image-gen-model" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('imageGenerator.defaultModel', 'Default Model')}
        </label>
        <select
          id="image-gen-model"
          value={generateImageModel}
          onChange={(e) => setGenerateImageModel(e.target.value)}
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {sortedModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </SettingSection>
  )
}
