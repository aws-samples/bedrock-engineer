import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaGlobe, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import { ToolResultHeader, StatisticsBadge, ContentPreview } from '../common'

interface FetchWebsiteResultData {
  success: boolean
  name: 'fetchWebsite'
  message: string
  error?: string
  result?: {
    url: string
    content: string
    statusCode?: number
    contentType?: string
    totalLines?: number
    cleaning?: boolean
  }
}

interface FetchWebsiteResultProps {
  result: FetchWebsiteResultData
}

export const FetchWebsiteResult: React.FC<FetchWebsiteResultProps> = ({ result }) => {
  const { t } = useTranslation()

  if (!result.success || !result.result) {
    return (
      <ToolResultHeader
        success={false}
        toolName="Fetch Website"
        title={t('Website Fetch Failed')}
        error={result.error}
      />
    )
  }

  const { url, content, statusCode, contentType, totalLines, cleaning } = result.result

  // Determine status color based on HTTP status code
  const getStatusColor = (code?: number) => {
    if (!code) return 'text-gray-500'
    if (code >= 200 && code < 300) return 'text-green-600 dark:text-green-400'
    if (code >= 300 && code < 400) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusIcon = (code?: number) => {
    if (!code) return null
    if (code >= 200 && code < 300)
      return <FaCheckCircle className="text-green-600 dark:text-green-400" />
    return <FaExclamationCircle className="text-yellow-600 dark:text-yellow-400" />
  }

  return (
    <div className="space-y-4">
      <ToolResultHeader
        success={true}
        toolName="fetchWebsite"
        title={t('Website Fetched Successfully')}
        subtitle={url}
        icon={<FaGlobe className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />}
      >
        <div className="flex items-center gap-6 text-sm flex-wrap">
          {statusCode && (
            <div className="flex items-center gap-1">
              {getStatusIcon(statusCode)}
              <span className="font-medium">{t('Status')}:</span>
              <span className={getStatusColor(statusCode)}>{statusCode}</span>
            </div>
          )}
          {contentType && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{t('Type')}:</span>
              <span className="text-gray-600 dark:text-gray-400 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {contentType.split(';')[0]}
              </span>
            </div>
          )}
          <StatisticsBadge label={t('Size')} value={content.length} unit=" chars" />
          {totalLines && <StatisticsBadge label={t('Lines')} value={totalLines} />}
          {cleaning && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              {t('Cleaned')}
            </span>
          )}
        </div>
      </ToolResultHeader>

      <ContentPreview
        content={content}
        maxLines={20}
        fileName={new URL(url).hostname}
        collapsible={true}
        defaultExpanded={false}
      />
    </div>
  )
}
