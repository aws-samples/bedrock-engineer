import React, { useState } from 'react'
import { Tooltip } from 'flowbite-react'
import { FiDownload } from 'react-icons/fi'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { SandpackFiles } from '@codesandbox/sandpack-react'
import { useTranslation } from 'react-i18next'

interface DownloadButtonProps {
  files: SandpackFiles
  disabled?: boolean
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ files, disabled = false }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const { t } = useTranslation()

  const handleDownload = async () => {
    if (disabled || isDownloading) return

    setIsDownloading(true)

    try {
      const zip = new JSZip()

      // Add all files to the zip
      Object.entries(files).forEach(([path, file]) => {
        // Remove leading slash if present
        const cleanPath = path.startsWith('/') ? path.slice(1) : path
        // Handle both string and SandpackFile object
        const content = typeof file === 'string' ? file : file.code
        zip.file(cleanPath, content)
      })

      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' })

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `generated-website-${timestamp}.zip`

      // Trigger download
      saveAs(content, filename)
    } catch (error) {
      console.error('Failed to download files:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Tooltip content={isDownloading ? t('downloading') : t('downloadAllFiles')}>
      <button
        onClick={handleDownload}
        disabled={disabled || isDownloading}
        className={`p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all ${
          disabled || isDownloading
            ? 'opacity-50 cursor-not-allowed'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        aria-label={t('downloadAllFiles')}
      >
        <FiDownload size={15} className={isDownloading ? 'animate-pulse' : ''} />
      </button>
    </Tooltip>
  )
}
