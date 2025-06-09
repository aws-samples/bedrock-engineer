import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { MdErrorOutline } from 'react-icons/md'
import { DiffViewer } from './DiffViewer'
import { ApplyDiffEditResultProps } from './types'

export const ApplyDiffEditResult: React.FC<ApplyDiffEditResultProps> = ({ result }) => {
  const { t } = useTranslation()

  // Handle error case
  if (!result.success) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <MdErrorOutline className="text-red-600 dark:text-red-400 text-xl flex-shrink-0" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">{t('Diff Edit Failed')}</h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {result.error || t('An error occurred while applying the diff')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Handle success case without result data
  if (!result.result) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0" />
          <div>
            <h3 className="text-yellow-800 dark:text-yellow-200 font-medium">
              {t('No Diff Data')}
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              {t('The diff operation completed but no result data is available')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { path, originalText, updatedText } = result.result

  // Calculate some basic statistics
  const originalLines = originalText.split('\n').length
  const updatedLines = updatedText.split('\n').length
  const originalChars = originalText.length
  const updatedChars = updatedText.length

  return (
    <div className="space-y-4">
      {/* Success Header with Summary */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <FaCheck className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-green-800 dark:text-green-200 font-medium">
              {t('Diff Applied Successfully')}
            </h3>
            <div className="text-green-700 dark:text-green-300 text-sm mt-1 font-mono truncate">
              {path}
            </div>
          </div>
        </div>

        {/* Compact Statistics */}
        <div className="flex items-center gap-6 text-sm text-green-700 dark:text-green-300">
          <div className="flex items-center gap-1">
            <span className="font-medium">{t('Lines')}:</span>
            <span>
              {originalLines} → {updatedLines}
            </span>
            {originalLines !== updatedLines && (
              <span
                className={`ml-1 ${updatedLines > originalLines ? 'text-green-600' : 'text-red-600'}`}
              >
                ({updatedLines > originalLines ? '+' : ''}
                {updatedLines - originalLines})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{t('Characters')}:</span>
            <span>
              {originalChars} → {updatedChars}
            </span>
            {originalChars !== updatedChars && (
              <span
                className={`ml-1 ${updatedChars > originalChars ? 'text-green-600' : 'text-red-600'}`}
              >
                ({updatedChars > originalChars ? '+' : ''}
                {updatedChars - originalChars})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diff Viewer */}
      <DiffViewer originalText={originalText} updatedText={updatedText} filePath={path} />
    </div>
  )
}
