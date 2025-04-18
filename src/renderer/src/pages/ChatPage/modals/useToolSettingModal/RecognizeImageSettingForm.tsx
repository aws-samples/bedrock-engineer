import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { LLM } from '@/types/llm'
import { Label, Select } from 'flowbite-react'

export const RecognizeImageSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { recognizeImageModel, setRecognizeImageModel, availableModels } = useSettings()

  // Claude関連モデルとNova関連モデルをフィルタリング
  const supportedModels = useMemo(() => {
    return availableModels
      .filter((model) => model.modelId.includes('anthropic.claude'))
      .sort((a, b) => a.modelName.localeCompare(b.modelName))
  }, [availableModels])

  // モデル変更のハンドラー
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecognizeImageModel(e.target.value)
  }

  return (
    <div className="prose dark:prose-invert max-w-none w-full">
      {/* ツールの説明 */}
      <div className="mb-6 w-full">
        <p className="mb-4 text-gray-700 dark:text-gray-300 font-bold">
          {t(`tool descriptions.recognizeImage`)}
        </p>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.recognizeImage.description',
            'The recognizeImage tool uses AI vision capabilities to analyze and describe images. It helps the AI assistant understand image content and provide relevant responses based on what appears in the image.'
          )}
        </p>
      </div>

      {/* 設定フォーム */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <div className="mb-4 w-full">
          <Label htmlFor="recognizeImageModel" value={t('Recognition Model')} />
          <Select
            id="recognizeImageModel"
            value={recognizeImageModel}
            onChange={handleModelChange}
            className="mt-2 w-full"
          >
            {supportedModels.map((model: LLM) => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  )
}
