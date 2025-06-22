import React from 'react'
import { Modal, Button } from 'flowbite-react'
import { FiDownload, FiClock, FiSettings, FiX } from 'react-icons/fi'
import { UpdateInfo } from '../services/UpdateCheckerService'

interface UpdateNotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  updateInfo: UpdateInfo | null
  onDownload: () => void
  onSkipVersion: () => void
  onRemindLater: () => void
  onOpenSettings: () => void
  formatPublishedDate: (publishedAt: string) => string
}

export const UpdateNotificationDialog: React.FC<UpdateNotificationDialogProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onDownload,
  onSkipVersion,
  onRemindLater,
  onOpenSettings,
  formatPublishedDate
}) => {
  if (!updateInfo || !updateInfo.hasUpdate) {
    return null
  }

  const handleDownload = () => {
    onDownload()
    onClose()
  }

  const handleSkipVersion = () => {
    onSkipVersion()
    onClose()
  }

  const handleRemindLater = () => {
    onRemindLater()
    onClose()
  }

  const handleOpenSettings = () => {
    onOpenSettings()
    onClose()
  }

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" className="update-notification-modal">
      <Modal.Header className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FiDownload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            新しいバージョンが利用可能です
          </span>
        </div>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        {/* Version Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-medium text-blue-900 dark:text-blue-100">バージョン情報</h3>
            {updateInfo.isPrerelease && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                プレリリース
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex justify-between">
              <span>現在のバージョン:</span>
              <span className="font-mono">{updateInfo.currentVersion}</span>
            </div>
            <div className="flex justify-between">
              <span>最新バージョン:</span>
              <span className="font-mono font-medium">{updateInfo.latestVersion}</span>
            </div>
            <div className="flex justify-between">
              <span>リリース日:</span>
              <span>{formatPublishedDate(updateInfo.publishedAt)}</span>
            </div>
          </div>
        </div>

        {/* Release Notes */}
        {updateInfo.releaseNotes && (
          <div className="space-y-2">
            <h3 className="text-md font-medium text-gray-900 dark:text-white">リリースノート</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                {updateInfo.releaseNotes}
              </pre>
            </div>
          </div>
        )}

        {/* Information Note */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>注意:</strong>
            新しいバージョンをダウンロードするには、GitHubのリリースページが開きます。
            アプリケーションを手動でアップデートしてください。
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 border-t border-gray-200 dark:border-gray-700">
        {/* Primary Actions */}
        <div className="flex flex-1 space-x-2">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            size="sm"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            ダウンロード
          </Button>
          <Button onClick={handleRemindLater} color="light" className="flex-1" size="sm">
            <FiClock className="w-4 h-4 mr-2" />
            後で通知
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="flex space-x-2">
          <Button onClick={handleOpenSettings} color="light" size="sm" className="px-3">
            <FiSettings className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleSkipVersion}
            color="light"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FiX className="w-4 h-4 mr-1" />
            スキップ
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
