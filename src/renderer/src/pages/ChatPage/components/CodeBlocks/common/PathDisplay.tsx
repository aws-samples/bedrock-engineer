import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaFolder, FaFile, FaCopy } from 'react-icons/fa'
import { PathDisplayProps } from './types'

export const PathDisplay: React.FC<PathDisplayProps> = ({
  path,
  type = 'file',
  truncate = true,
  copyable = false
}) => {
  const { t } = useTranslation()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(path)
      // Could add a toast notification here if needed
    } catch (error) {
      console.error('Failed to copy path:', error)
    }
  }

  const displayPath = truncate && path.length > 60 ? `...${path.slice(-57)}` : path

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      {type === 'folder' ? (
        <FaFolder className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
      ) : (
        <FaFile className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
      )}
      <span className="break-all" title={path}>
        {displayPath}
      </span>
      {copyable && (
        <button
          onClick={handleCopy}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title={t('Copy path')}
        >
          <FaCopy className="text-xs" />
        </button>
      )}
    </div>
  )
}
