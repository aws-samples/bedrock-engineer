import { Modal } from 'flowbite-react'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '@renderer/contexts/SettingsContext'

interface IgnoreSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  projectPath?: string
}

export const IgnoreSettingsModal: React.FC<IgnoreSettingsModalProps> = ({
  isOpen,
  onClose,
  projectPath
}) => {
  const { t } = useTranslation()
  const { ignoreFiles, setIgnoreFiles } = useSettings()

  // タブの状態管理
  const [activeTab, setActiveTab] = useState<'global' | 'project'>('global')

  // グローバル設定の状態
  const [globalIgnoreContent, setGlobalIgnoreContent] = useState<string>('')

  // プロジェクト固有設定の状態
  const [projectIgnoreContent, setProjectIgnoreContent] = useState<string>('')
  const [isLoadingProject, setIsLoadingProject] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // プロジェクトパスが選択されているかどうかを判定
  const hasProjectPath =
    projectPath &&
    projectPath.trim() !== '' &&
    !projectPath.includes('選択') &&
    !projectPath.includes('Select') &&
    (projectPath.startsWith('/') || projectPath.match(/^[A-Za-z]:/))

  // モーダルが開かれた時にデータを読み込み
  useEffect(() => {
    if (isOpen) {
      loadGlobalIgnoreSettings()

      if (hasProjectPath) {
        // プロジェクト固有設定がある場合はプロジェクトタブをデフォルトにする
        setActiveTab('project')
        loadProjectIgnoreSettings()
      } else {
        setActiveTab('global')
      }
    }
  }, [isOpen, hasProjectPath])

  const loadGlobalIgnoreSettings = () => {
    setGlobalIgnoreContent(ignoreFiles.join('\n'))
  }

  const loadProjectIgnoreSettings = async () => {
    if (!projectPath) return

    setIsLoadingProject(true)
    setError('')

    try {
      const result = await window.api.readProjectIgnore(projectPath)
      setProjectIgnoreContent(result.content)
    } catch (error) {
      console.error('Failed to load project ignore file:', error)
      setError(t('ignoreSettings.loadError'))
    } finally {
      setIsLoadingProject(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      if (activeTab === 'global') {
        // グローバル設定を保存
        const arr = globalIgnoreContent.split('\n').filter((item) => item.trim() !== '')
        setIgnoreFiles(arr)
      } else if (activeTab === 'project' && projectPath) {
        // プロジェクト固有設定を保存
        const result = await window.api.writeProjectIgnore(projectPath, projectIgnoreContent)
        if (!result.success) {
          setError(t('ignoreSettings.saveError'))
          return
        }
      }

      onClose()
    } catch (error) {
      console.error('Failed to save ignore settings:', error)
      setError(t('ignoreSettings.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  return (
    <Modal dismissible show={isOpen} onClose={handleClose} size="4xl">
      <Modal.Header>{t('ignoreSettings.title')}</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          {/* タブナビゲーション */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('global')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'global'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {t('ignoreSettings.globalTab')}
              </button>
              {hasProjectPath && (
                <button
                  onClick={() => setActiveTab('project')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'project'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {t('ignoreSettings.projectTab')}
                </button>
              )}
            </nav>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* タブコンテンツ */}
          {activeTab === 'global' && (
            <div>
              <p className="text-gray-700 text-sm mb-4 dark:text-white">
                {t('ignoreSettings.globalDescription')}
              </p>
              <textarea
                className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder={t('ignoreSettings.globalPlaceholder')}
                value={globalIgnoreContent}
                onChange={(e) => setGlobalIgnoreContent(e.target.value)}
                rows={12}
                disabled={isSaving}
              />
            </div>
          )}

          {activeTab === 'project' && hasProjectPath && (
            <div>
              <div className="mb-4">
                <p className="text-gray-700 text-sm dark:text-white">
                  {t('ignoreSettings.projectDescription')}
                </p>
                <p className="text-gray-600 text-xs mt-2 dark:text-gray-400">
                  {t('ignoreSettings.projectPath')}:{' '}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{projectPath}</code>
                </p>
              </div>

              {isLoadingProject ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {t('ignoreSettings.loading')}
                  </span>
                </div>
              ) : (
                <textarea
                  className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder={t('ignoreSettings.projectPlaceholder')}
                  value={projectIgnoreContent}
                  onChange={(e) => setProjectIgnoreContent(e.target.value)}
                  rows={12}
                  disabled={isSaving}
                />
              )}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-between w-full">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoadingProject}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {isSaving ? t('ignoreSettings.saving') : t('ignoreSettings.save')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
