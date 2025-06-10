import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaChevronDown, FaChevronRight, FaCode } from 'react-icons/fa'
import { ContentPreviewProps } from './types'

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  maxLines = 10,
  language,
  fileName,
  collapsible = true,
  defaultExpanded = false
}) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const lines = content.split('\n')
  const isLongContent = lines.length > maxLines
  const displayLines = isExpanded || !isLongContent ? lines : lines.slice(0, maxLines)
  const hiddenLinesCount = lines.length - maxLines

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="space-y-2">
      {fileName && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <FaCode className="text-xs" />
          <span className="font-mono">{fileName}</span>
          {language && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              {language}
            </span>
          )}
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap max-w-full">
          <code className={language ? `language-${language}` : ''}>{displayLines.join('\n')}</code>
        </pre>

        {collapsible && isLongContent && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={toggleExpanded}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              {isExpanded ? (
                <>
                  <FaChevronDown className="text-xs" />
                  {t('Show Less')}
                </>
              ) : (
                <>
                  <FaChevronRight className="text-xs" />
                  {t('Show More')} ({hiddenLinesCount} {t('more lines')})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
