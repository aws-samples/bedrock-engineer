import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Label, Select, Spinner } from 'flowbite-react'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { ipc } from '@renderer/lib/api'

interface CameraDevice {
  deviceId: string
  label: string
  isDefault: boolean
}

export const CameraCaptureSettingForm: React.FC = () => {
  const { t } = useTranslation()
  const { recognizeImageModel, setRecognizeImageModel, availableModels } = useSettings()

  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([])
  // defaultCameraは変数として残しますが、_プレフィックスを付けて未使用変数として明示します
  const [_defaultCamera, setDefaultCamera] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [permissionError, setPermissionError] = useState<string>('')

  // カメラデバイスの一覧を取得
  useEffect(() => {
    const fetchCameraDevices = async () => {
      try {
        setLoading(true)

        // 権限確認
        const permissionCheck = await ipc('camera:check-permissions', undefined)
        if (!permissionCheck.hasPermission) {
          setPermissionError(permissionCheck.message)
          setCameraDevices([])
          setLoading(false)
          return
        }

        // デバイス一覧取得
        const devices = await ipc('camera:list-devices', undefined)
        setCameraDevices(devices || [])

        // デフォルトカメラの設定
        const defaultDevice = devices.find((device) => device.isDefault)
        if (defaultDevice) {
          setDefaultCamera(defaultDevice.deviceId)
        }
      } catch (error) {
        console.error('Failed to fetch camera devices', error)
        setCameraDevices([])
        setPermissionError(t('Failed to access camera. Please check your camera permissions.'))
      } finally {
        setLoading(false)
      }
    }

    fetchCameraDevices()
  }, [t])

  // Vision-capable モデルをフィルタリング（Claude と Nova シリーズ）
  const visionCapableModels = React.useMemo(() => {
    return availableModels
      .filter(
        (model) =>
          model.modelId.includes('anthropic.claude') || model.modelId.includes('amazon.nova')
      )
      .sort((a, b) => a.modelName.localeCompare(b.modelName))
  }, [availableModels])

  return (
    <div className="prose dark:prose-invert max-w-none w-full">
      {/* ツールの説明 */}
      <div className="mb-6 w-full">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.cameraCapture.description',
            'The cameraCapture tool activates your computer camera to capture an image and save it as a file. When a recognition prompt is provided, the captured image will be automatically analyzed with AI to extract text content, identify objects, and provide detailed visual descriptions.'
          )}
        </p>
      </div>

      {/* 設定フォーム */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">{t('Camera Settings')}</h4>

        {/* カメラデバイス一覧 */}
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Spinner size="md" />
            <span className="ml-2">{t('Checking camera permissions...')}</span>
          </div>
        ) : permissionError ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
            <h5 className="font-medium mb-2">{t('Camera Permission Error')}</h5>
            <p className="text-sm">{permissionError}</p>
            <p className="mt-2 text-sm">
              {t('Please grant camera permissions in your browser or system settings.')}
            </p>
          </div>
        ) : cameraDevices.length === 0 ? (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md">
            <h5 className="font-medium mb-2">{t('No Camera Detected')}</h5>
            <p className="text-sm">
              {t('No camera devices were detected. Please check your camera connection.')}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <Label htmlFor="cameraDevice" value={t('Available Cameras')} />
            <div className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
              {t('The following cameras are available on your system:')}
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {cameraDevices.map((device) => (
                <li key={device.deviceId} className="flex items-center">
                  <span className="mr-2">•</span>
                  <span className="font-medium">{device.label}</span>
                  {device.isDefault && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                      {t('Default')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t(
                'When using the cameraCapture tool, you can specify a specific camera using the deviceId parameter, or leave it empty to use the default camera.'
              )}
            </p>
          </div>
        )}

        {/* LLMモデル選択 */}
        <div className="w-full mt-4">
          <Label htmlFor="recognizeImageModel" value={t('AI Model for Image Analysis')} />
          <Select
            id="recognizeImageModel"
            value={recognizeImageModel}
            onChange={(e) => setRecognizeImageModel(e.target.value)}
            className="mt-2 w-full"
          >
            {visionCapableModels.map((model) => (
              <option key={model.modelId} value={model.modelId}>
                {model.modelName}
              </option>
            ))}
          </Select>
        </div>

        {/* 使用方法の説明 */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-blue-300">{t('How to Use')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>
              • <strong>{t('Camera capture only')}:</strong>{' '}
              {t('Use without any prompt to capture camera image only')}
            </li>
            <li>
              • <strong>{t('Camera capture + AI analysis')}:</strong>{' '}
              {t('Provide a recognition prompt to automatically analyze the captured image')}
            </li>
            <li>
              • <strong>{t('Example prompts')}:</strong>{' '}
              {t(
                '"What object is this?", "Read and extract text from this document", "Identify the person"'
              )}
            </li>
            <li>
              • <strong>{t('Device selection')}:</strong>{' '}
              {t('Optionally specify deviceId to use a specific camera')}
            </li>
          </ul>
        </div>

        {/* AI分析機能の説明 */}
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 dark:border dark:border-purple-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-purple-300">{t('AI Analysis Features')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Extract and read text from documents, screens, and signs')}</li>
            <li>• {t('Identify objects, products, and items accurately')}</li>
            <li>• {t('Recognize people and scenes with detailed descriptions')}</li>
            <li>• {t('Read QR codes and barcodes in captured images')}</li>
            <li>• {t('Generate detailed visual documentation automatically')}</li>
          </ul>
        </div>

        {/* プライバシー・セキュリティ情報 */}
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-red-300">{t('Privacy & Security')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Camera access requires explicit user permission')}</li>
            <li>• {t('Camera activates only when the tool is specifically used')}</li>
            <li>• {t('Camera access is handled through secure browser APIs')}</li>
            <li>• {t('Captured images are temporarily stored and automatically cleaned up')}</li>
            <li>• {t('AI analysis is performed using your configured AWS Bedrock models')}</li>
            <li>
              • {t('Consider the privacy implications when capturing images with personal data')}
            </li>
          </ul>
        </div>

        {/* 使用例 */}
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 dark:border dark:border-yellow-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-yellow-300">{t('Usage Examples')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Scan and extract text from physical documents')}</li>
            <li>• {t('Identify objects, plants, or products')}</li>
            <li>• {t('Read QR codes or barcodes')}</li>
            <li>• {t('Create visual documentation with AI-generated descriptions')}</li>
            <li>• {t('Analyze physical items or equipment')}</li>
            <li>• {t('Capture business cards and extract contact information')}</li>
            <li>• {t('Document visual issues or problems for troubleshooting')}</li>
          </ul>
        </div>

        {/* パフォーマンス情報 */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/20 dark:border dark:border-gray-600 rounded-md">
          <h5 className="font-medium mb-2 dark:text-gray-300">{t('Performance Notes')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Camera capture is typically very fast (< 1 second)')}</li>
            <li>• {t('AI analysis may take 5-15 seconds depending on image complexity')}</li>
            <li>
              •{' '}
              {t(
                'Higher resolution images provide better analysis results but take longer to process'
              )}
            </li>
            <li>• {t('Ensure proper lighting for best results with text recognition')}</li>
            <li>• {t('Network latency affects AI analysis response time')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
