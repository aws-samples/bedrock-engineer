import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import * as Diff from 'diff'
import { FiCopy, FiMaximize, FiMinimize, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface ApplyDiffEditResultProps {
  response: {
    success: boolean
    error?: string
    result?: {
      path: string
      originalText: string
      updatedText: string
    }
  }
}

export const ApplyDiffEditResult: React.FC<ApplyDiffEditResultProps> = ({ response }) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false)

  // Reset copy confirmation after 2 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    if (showCopyConfirmation) {
      timeoutId = setTimeout(() => {
        setShowCopyConfirmation(false)
      }, 2000)
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [showCopyConfirmation])

  // Generate the diff between the original and updated text
  const diffParts = useMemo(() => {
    if (!response.success || !response.result) return []
    return Diff.diffLines(response.result.originalText, response.result.updatedText)
  }, [response])

  // Handle copy button click
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(t('common.copied'))
    setShowCopyConfirmation(true)
  }

  // If there was an error
  if (!response.success) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-md">
        <h3 className="text-lg font-semibold">{t('errors.failedToApplyChanges')}</h3>
        <p>{response.error}</p>
      </div>
    )
  }

  // If there's no result data
  if (!response.result) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
        <h3 className="text-lg font-semibold">{t('common.noResults')}</h3>
      </div>
    )
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${isExpanded ? 'fixed inset-5 z-50 bg-white dark:bg-gray-900' : 'max-h-[60vh]'}`}>
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-base">
            {t('tools.fileChanges')}: <span className="font-mono text-sm">{response.result.path.split('/').pop()}</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
            {response.result.path}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleCopy(response.result!.updatedText)}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title={t('common.copy')}
          >
            {showCopyConfirmation ? <FiCheck /> : <FiCopy />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title={isExpanded ? t('common.minimize') : t('common.maximize')}
          >
            {isExpanded ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>

      {/* Diff Display */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700 overflow-auto">
        {/* Left side - Original Text */}
        <div className="overflow-auto">
          <div className="p-1 bg-gray-50 dark:bg-gray-800/50 text-xs text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            {t('common.original')}
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto">
            {diffParts.map((part, index) => (
              <span
                key={index}
                className={`${part.removed ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300' : ''}`}
              >
                {part.value}
              </span>
            ))}
          </pre>
        </div>
        
        {/* Right side - Updated Text */}
        <div className="overflow-auto">
          <div className="p-1 bg-gray-50 dark:bg-gray-800/50 text-xs text-center text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            {t('common.updated')}
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto">
            {diffParts.map((part, index) => (
              <span
                key={index}
                className={`${part.added ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300' : ''}`}
              >
                {part.value}
              </span>
            ))}
          </pre>
        </div>
      </div>
      
      {/* Summary Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        {diffParts.filter(part => part.added || part.removed).length > 0 ? (
          <p>
            {diffParts.filter(part => part.added).length > 0 && (
              <span className="inline-flex items-center mr-3">
                <span className="inline-block w-3 h-3 mr-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></span>
                {t('common.added')}
              </span>
            )}
            {diffParts.filter(part => part.removed).length > 0 && (
              <span className="inline-flex items-center">
                <span className="inline-block w-3 h-3 mr-1 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700"></span>
                {t('common.removed')}
              </span>
            )}
          </p>
        ) : (
          <p>{t('tools.noChanges')}</p>
        )}
      </div>
    </div>
  )
}