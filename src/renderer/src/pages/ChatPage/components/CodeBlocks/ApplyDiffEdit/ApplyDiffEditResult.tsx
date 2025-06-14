import React from 'react'
import { useTranslation } from 'react-i18next'
import { DiffViewer } from './DiffViewer'
import { ApplyDiffEditResultProps } from './types'

export const ApplyDiffEditResult: React.FC<ApplyDiffEditResultProps> = ({ response }) => {
  const { t } = useTranslation()

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
    <DiffViewer
      originalText={response.result.originalText}
      updatedText={response.result.updatedText}
      filePath={response.result.path}
    />
  )
}