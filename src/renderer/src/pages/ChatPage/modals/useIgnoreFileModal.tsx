import { Modal } from 'flowbite-react'
import React from 'react'
import { useState } from 'react'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { useTranslation } from 'react-i18next'

export const useIgnoreFileModal = () => {
  const [show, setShow] = useState(false)

  const handleOpen = () => setShow(true)
  const handleClose = () => setShow(false)

  return {
    show: show,
    handleOpen: handleOpen,
    handleClose: handleClose,
    IgnoreFileModal: IgnoreFileModal
  }
}

interface IgnoreFileModalProps {
  isOpen: boolean
  onClose: () => void
}
const IgnoreFileModal = React.memo(({ isOpen, onClose }: IgnoreFileModalProps) => {
  // SettingsContext から ignoreFiles と setIgnoreFiles を取得
  const { ignoreFiles, setIgnoreFiles } = useSettings()
  const [ignoreFilesText, setIgnoreFilesText] = useState<string>(ignoreFiles.join('\n'))
  const { t } = useTranslation()

  // 表示が開かれた時に最新の設定を取得
  React.useEffect(() => {
    if (isOpen) {
      setIgnoreFilesText(ignoreFiles.join('\n'))
    }
  }, [isOpen, ignoreFiles])

  // テキスト入力を処理
  const handleIgnoreFilesChange = (str: string) => {
    setIgnoreFilesText(str)
  }

  // モーダルが閉じられる時に設定を保存
  const handleSave = () => {
    const arr = ignoreFilesText.split('\n').filter((item) => item.trim() !== '')
    setIgnoreFiles(arr)
    onClose()
  }

  return (
    <Modal dismissible show={isOpen} onClose={onClose} size="4xl">
      <Modal.Header>{t('ignoreFiles.title')}</Modal.Header>
      <Modal.Body>
        <p className="text-gray-700 text-sm pb-2 dark:text-white">{t('ignoreFiles.description')}</p>
        <textarea
          className={`block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 mt-2 dark:bg-gray-800 dark:text-white`}
          placeholder={`.git\nnode_modules\n.vscode\n${t('ignoreFiles.placeholder')}`}
          value={ignoreFilesText}
          onChange={(e) => handleIgnoreFilesChange(e.target.value)}
          required
          rows={10}
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-end w-full">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {t('ignoreFiles.save')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
})

IgnoreFileModal.displayName = 'IgnoreFileModal'
