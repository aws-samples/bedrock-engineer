import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { LLM } from '@/types/llm'
import { Label, Select } from 'flowbite-react'

export const RecognizeVideoSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { recognizeVideoModel, setRecognizeVideoModel, availableModels } = useSettings()

  // Nova関連モデルをフィルタリング
  const videoCapableModels = useMemo(() => {
    return availableModels
      .filter((model) => model.modelId.includes('amazon.nova'))
      .sort((a, b) => a.modelName.localeCompare(b.modelName))
  }, [availableModels])

  // モデル変更のハンドラー
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecognizeVideoModel(e.target.value)
  }

  return (
    <div className="prose dark:prose-invert max-w-none w-full">
      {/* ツールの説明 */}
      <div className="mb-6 w-full">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.recognizeVideo.description',
            'The recognizeVideo tool uses Amazon Nova models to analyze and describe video content. It uploads videos to S3, processes them with Nova Micro/Lite/Pro/Premier models, and provides detailed descriptions of video scenes and actions.'
          )}
        </p>
      </div>

      {/* 設定フォーム */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <div className="mb-4 w-full">
          <Label htmlFor="recognizeVideoModel" value={t('Recognition Model')} />
          <Select
            id="recognizeVideoModel"
            value={recognizeVideoModel}
            onChange={handleModelChange}
            className="mt-2 w-full"
          >
            {videoCapableModels.map((model: LLM) => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </Select>
        </div>

        {/* 対応形式・制限事項 */}
        <div className="mb-4 w-full">
          <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-md">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              {t('Supported Formats & Limitations')}
            </h5>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div>
                <strong>{t('Formats')}:</strong> MP4, MOV, MKV, WebM, FLV, MPEG, MPG, WMV, 3GP
              </div>
              <div>
                <strong>{t('File Size')}:</strong> {t('Up to 1GB')}
              </div>
              <div>
                <strong>{t('Recommended Duration')}:</strong>{' '}
                {t('Low motion: <1 hour, High motion: <16 minutes')}
              </div>
            </div>
          </div>
        </div>

        {/* 使用方法 */}
        <div className="mb-4 w-full">
          <div className="bg-green-50 dark:bg-gray-800 p-4 rounded-md">
            <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              {t('Usage')}
            </h5>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <div>{t('1. Upload video file to S3 automatically')}</div>
              <div>{t('2. Analyze video content with selected Nova model')}</div>
              <div>{t('3. Receive detailed Japanese description')}</div>
              <div>{t('4. Cleanup temporary S3 files')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-50 dark:bg-gray-800 p-4 rounded-md w-full">
        <h5 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          {t('Important Notes')}
        </h5>
        <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <div>{t('• Requires AWS S3 bucket for video upload')}</div>
          <div>{t('• Processing time varies by video length and model')}</div>
          <div>{t('• Nova Premier provides the most detailed analysis')}</div>
          <div>{t('• Temporary files are automatically cleaned up')}</div>
        </div>
      </div>
    </div>
  )
}
