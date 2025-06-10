import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToolResult } from '@/types/tools'
import { ToolResultHeader } from './common/ToolResultHeader'

interface ErrorResultProps {
  result: ToolResult
}

export const ErrorResult: React.FC<ErrorResultProps> = ({ result }) => {
  const { t } = useTranslation()

  const errorDetails = result.result || {}
  const errorMessage = result.error || result.message || 'An error occurred'
  const toolName = result.name || errorDetails.toolName || 'Unknown Tool'
  const metadata = errorDetails.metadata || {}

  return (
    <div className="border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20 overflow-hidden">
      <ToolResultHeader
        success={false}
        toolName={toolName}
        title={t('Tool Error')}
        error={errorMessage}
      />

      <div className="p-4 space-y-3">
        {/* Error Message */}
        <div>
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            {t('Error Message')}
          </h4>
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-3">
            <pre className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap font-mono">
              {errorMessage}
            </pre>
          </div>
        </div>

        {/* Error Details */}
        {errorDetails.errorMessage && errorDetails.errorMessage !== errorMessage && (
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              {t('Details')}
            </h4>
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-3">
              <pre className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap font-mono">
                {errorDetails.errorMessage}
              </pre>
            </div>
          </div>
        )}

        {/* Metadata */}
        {Object.keys(metadata).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              {t('Additional Information')}
            </h4>
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded p-3">
              <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 rounded p-2">
          <p>
            {t(
              'This error occurred during tool execution. Please check the input parameters and try again.'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
