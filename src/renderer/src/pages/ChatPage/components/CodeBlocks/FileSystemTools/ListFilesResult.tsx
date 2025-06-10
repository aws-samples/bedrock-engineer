import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaFolderOpen } from 'react-icons/fa'
import { ToolResultHeader, StatisticsBadge, ContentPreview } from '../common'

interface ListFilesResultData {
  success: boolean
  name: 'listFiles'
  message: string
  error?: string
  result?: {
    path: string
    structure: string
    totalLines?: number
    maxDepth?: number
    ignorePatterns?: number
  }
}

interface ListFilesResultProps {
  result: ListFilesResultData
}

export const ListFilesResult: React.FC<ListFilesResultProps> = ({ result }) => {
  const { t } = useTranslation()

  if (!result.success || !result.result) {
    return (
      <ToolResultHeader
        success={false}
        toolName="List Files"
        title={t('List Files Failed')}
        error={result.error}
      />
    )
  }

  const { path, structure, totalLines, maxDepth, ignorePatterns } = result.result

  return (
    <div className="space-y-4">
      <ToolResultHeader
        success={true}
        toolName="listFiles"
        title={t('Directory Listed Successfully')}
        subtitle={path}
        icon={<FaFolderOpen className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />}
      >
        <div className="flex items-center gap-6 text-sm">
          {totalLines && <StatisticsBadge label={t('Items')} value={totalLines} />}
          {maxDepth && <StatisticsBadge label={t('Max Depth')} value={maxDepth} />}
          {ignorePatterns && (
            <StatisticsBadge label={t('Ignore Patterns')} value={ignorePatterns} />
          )}
        </div>
      </ToolResultHeader>

      <ContentPreview
        content={structure}
        maxLines={25}
        fileName="Directory Structure:"
        collapsible={true}
        defaultExpanded={true}
      />
    </div>
  )
}
