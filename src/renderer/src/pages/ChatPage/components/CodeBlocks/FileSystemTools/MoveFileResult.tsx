import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaArrowRight, FaCut } from 'react-icons/fa'
import { ToolResultHeader, PathDisplay } from '../common'

interface MoveFileResultData {
  success: boolean
  name: 'moveFile'
  message: string
  error?: string
  result?: {
    source: string
    destination: string
  }
}

interface MoveFileResultProps {
  result: MoveFileResultData
}

export const MoveFileResult: React.FC<MoveFileResultProps> = ({ result }) => {
  const { t } = useTranslation()

  if (!result.success || !result.result) {
    return (
      <ToolResultHeader
        success={false}
        toolName="Move File"
        title={t('Move File Failed')}
        error={result.error}
      />
    )
  }

  const { source, destination } = result.result

  return (
    <ToolResultHeader
      success={true}
      toolName="moveFile"
      title={t('File Moved Successfully')}
      icon={<FaCut className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('From')}:</div>
            <PathDisplay path={source} copyable />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <FaArrowRight className="text-green-600 dark:text-green-400" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('To')}:</div>
            <PathDisplay path={destination} copyable />
          </div>
        </div>
      </div>
    </ToolResultHeader>
  )
}
