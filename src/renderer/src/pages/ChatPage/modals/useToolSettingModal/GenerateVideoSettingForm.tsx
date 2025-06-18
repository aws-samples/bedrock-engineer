import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { Label, TextInput } from 'flowbite-react'

export const GenerateVideoSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { generateVideoS3Uri, setGenerateVideoS3Uri } = useSettings()
  const [s3Uri, setS3Uri] = useState(generateVideoS3Uri)
  const [isValidUri, setIsValidUri] = useState(true)

  // バリデーション関数
  const validateS3Uri = (uri: string): boolean => {
    if (!uri) return false
    return uri.startsWith('s3://') && uri.length > 5
  }

  // S3 URI入力のハンドラー
  const handleS3UriChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setS3Uri(value)
    setIsValidUri(validateS3Uri(value) || value === '')
  }

  // S3 URI入力完了のハンドラー（blur時）
  const handleS3UriBlur = () => {
    if (validateS3Uri(s3Uri)) {
      setGenerateVideoS3Uri(s3Uri)
      setIsValidUri(true)
    } else if (s3Uri === '') {
      setGenerateVideoS3Uri('')
      setIsValidUri(true)
    } else {
      setIsValidUri(false)
    }
  }

  // 設定値が外部から変更された場合の同期
  useEffect(() => {
    setS3Uri(generateVideoS3Uri)
  }, [generateVideoS3Uri])

  return (
    <div className="prose dark:prose-invert max-w-none w-full">
      {/* ツールの説明 */}
      <div className="mb-6 w-full">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.generateVideo.description',
            'The generateVideo tool uses Amazon Nova Reel to create high-quality videos from text descriptions. Videos are generated asynchronously and require S3 configuration for output storage.'
          )}
        </p>

        {/* ツールグループの説明 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-blue-300">{t('Tool Group', 'Tool Group')}</h5>
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {t(
              'tool info.generateVideo.group',
              'When you enable this tool, the following related tools will also be automatically enabled: checkVideoStatus (to monitor video generation progress) and downloadVideo (to download completed videos). These tools work together to provide a complete video generation workflow.'
            )}
          </p>
        </div>
      </div>

      {/* 設定フォーム */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        {/* S3 URI設定 */}
        <div className="w-full">
          <Label
            htmlFor="generateVideoS3Uri"
            value={t('S3 Output URI (Required)', 'S3 Output URI (Required)')}
          />
          <TextInput
            id="generateVideoS3Uri"
            type="text"
            placeholder="s3://your-bucket-name/videos/"
            value={s3Uri}
            onChange={handleS3UriChange}
            onBlur={handleS3UriBlur}
            className="mt-2 w-full"
            color={!isValidUri ? 'failure' : 'gray'}
            helperText={
              !isValidUri ? (
                <span className="text-red-600 dark:text-red-400">
                  {t(
                    'S3 URI must start with s3:// and include a bucket name',
                    'S3 URI must start with s3:// and include a bucket name'
                  )}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  {t(
                    'Example: s3://my-bucket/nova-reel-videos/',
                    'Example: s3://my-bucket/nova-reel-videos/'
                  )}
                </span>
              )
            }
          />
        </div>

        {/* モデル情報 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-blue-300">
            {t('Model Information', 'Model Information')}
          </h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>
              •{' '}
              {t(
                'Model: Amazon Nova Reel (region-based version selection)',
                'Model: Amazon Nova Reel (region-based version selection)'
              )}
            </li>
            <li>• {t('Resolution: 1280x720 (24fps)', 'Resolution: 1280x720 (24fps)')}</li>
            <li>
              •{' '}
              {t(
                'Duration: 6-120 seconds (6-second increments)',
                'Duration: 6-120 seconds (6-second increments)'
              )}
            </li>
            <li>
              •{' '}
              {t(
                'Processing: Asynchronous (takes several minutes)',
                'Processing: Asynchronous (takes several minutes)'
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
