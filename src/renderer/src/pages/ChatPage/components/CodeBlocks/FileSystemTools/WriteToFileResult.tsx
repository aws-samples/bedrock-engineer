import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaEdit } from 'react-icons/fa'
import { ToolResultHeader, StatisticsBadge, ContentPreview } from '../common'

interface WriteToFileResultData {
  success: boolean
  name: 'writeToFile'
  message: string
  error?: string
  result?: {
    path: string
    contentLength: number
    content: string
  }
}

interface WriteToFileResultProps {
  result: WriteToFileResultData
}

export const WriteToFileResult: React.FC<WriteToFileResultProps> = ({ result }) => {
  const { t } = useTranslation()

  if (!result.success || !result.result) {
    return (
      <ToolResultHeader
        success={false}
        toolName="Write to File"
        title={t('Write to File Failed')}
        error={result.error}
      />
    )
  }

  const { path, contentLength, content } = result.result
  const lines = content.split('\n').length

  // Determine file language from extension
  const extension = path.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    css: 'css',
    html: 'html',
    json: 'json',
    xml: 'xml',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml'
  }
  const language = extension ? languageMap[extension] : undefined

  return (
    <div className="space-y-4">
      <ToolResultHeader
        success={true}
        toolName="writeToFile"
        title={t('File Written Successfully')}
        subtitle={path}
        icon={<FaEdit className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />}
      >
        <div className="flex items-center gap-6 text-sm">
          <StatisticsBadge label={t('Size')} value={contentLength} unit=" chars" />
          <StatisticsBadge label={t('Lines')} value={lines} />
        </div>
      </ToolResultHeader>

      <ContentPreview
        content={content}
        maxLines={15}
        language={language}
        fileName={path.split('/').pop()}
        collapsible={true}
        defaultExpanded={false}
      />
    </div>
  )
}
