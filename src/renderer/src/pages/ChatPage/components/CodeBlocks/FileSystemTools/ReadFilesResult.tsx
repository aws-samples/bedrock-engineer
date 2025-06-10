import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
  FaCopy
} from 'react-icons/fa'
import { ToolResultHeader, StatisticsBadge, ContentPreview } from '../common'

interface FileReadResult {
  path: string
  content?: string
  error?: string
  lines?: number
  size?: number
  encoding?: string
  lineRange?: { from?: number; to?: number }
}

interface ReadFilesSummary {
  totalFiles: number
  successfulFiles: number
  failedFiles: number
  totalLines?: number
  totalSize?: number
}

interface ReadFilesResultData {
  success: boolean
  name: 'readFiles'
  message: string
  error?: string
  result?: {
    files: FileReadResult[]
    summary: ReadFilesSummary
  }
}

interface ReadFilesResultProps {
  result: ReadFilesResultData
}

const FileItem: React.FC<{ file: FileReadResult; isExpanded: boolean; onToggle: () => void }> = ({
  file,
  isExpanded,
  onToggle
}) => {
  const { t } = useTranslation()
  const fileName = file.path.split('/').pop() || file.path

  const handleCopy = async () => {
    if (file.content) {
      try {
        await navigator.clipboard.writeText(file.content)
      } catch (error) {
        console.error('Failed to copy content:', error)
      }
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <FaChevronDown className="text-gray-400 flex-shrink-0" />
          ) : (
            <FaChevronRight className="text-gray-400 flex-shrink-0" />
          )}

          {file.error ? (
            <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
          ) : (
            <FaFileAlt className="text-blue-500 flex-shrink-0" />
          )}

          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-gray-100">{fileName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{file.path}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {file.error ? (
            <span className="text-red-600 dark:text-red-400">{t('Error')}</span>
          ) : (
            <>
              {file.lines && <StatisticsBadge label={t('Lines')} value={file.lines} />}
              {file.size && <StatisticsBadge label={t('Size')} value={file.size} unit=" chars" />}
              {file.lineRange && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('Lines {{from}}-{{to}}', {
                    from: file.lineRange.from || 1,
                    to: file.lineRange.to || '∞'
                  })}
                </span>
              )}
            </>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {file.error ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20">
              <div className="text-red-800 dark:text-red-200 text-sm">
                <strong>{t('Error')}:</strong> {file.error}
              </div>
            </div>
          ) : file.content ? (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={handleCopy}
                  className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors"
                  title={t('Copy content')}
                >
                  <FaCopy className="text-sm" />
                </button>
              </div>
              <ContentPreview
                content={file.content}
                maxLines={20}
                fileName={fileName}
                language={fileName.split('.').pop()}
                collapsible={true}
                defaultExpanded={true}
              />
            </div>
          ) : (
            <div className="p-3 text-gray-500 dark:text-gray-400 text-sm">
              {t('No content available')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const ReadFilesResult: React.FC<ReadFilesResultProps> = ({ result }) => {
  const { t } = useTranslation()
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  if (!result.success || !result.result) {
    return (
      <ToolResultHeader
        success={false}
        toolName="Read Files"
        title={t('Read Files Failed')}
        error={result.error}
      />
    )
  }

  const { files, summary } = result.result

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedFiles(new Set(files.map((f) => f.path)))
  }

  const collapseAll = () => {
    setExpandedFiles(new Set())
  }

  return (
    <div className="space-y-4">
      <ToolResultHeader
        success={summary.failedFiles === 0}
        toolName="readFiles"
        title={
          summary.failedFiles === 0 ? t('Files Read Successfully') : t('Files Read with Errors')
        }
        subtitle={
          summary.totalFiles === 1
            ? files[0]?.path
            : t('{{count}} files', { count: summary.totalFiles })
        }
        icon={
          summary.failedFiles === 0 ? (
            <FaFileAlt className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />
          ) : (
            <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0" />
          )
        }
      >
        <div className="flex items-center gap-6 text-sm">
          <StatisticsBadge label={t('Total Files')} value={summary.totalFiles} />
          <div className="text-green-600 dark:text-green-400">
            <StatisticsBadge label={t('Successful')} value={summary.successfulFiles} />
          </div>
          {summary.failedFiles > 0 && (
            <div className="text-red-600 dark:text-red-400">
              <StatisticsBadge label={t('Failed')} value={summary.failedFiles} />
            </div>
          )}
          {summary.totalLines && (
            <StatisticsBadge label={t('Total Lines')} value={summary.totalLines} />
          )}
          {summary.totalSize && (
            <StatisticsBadge label={t('Total Size')} value={summary.totalSize} unit=" chars" />
          )}
        </div>
      </ToolResultHeader>

      {files.length > 1 && (
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            {t('Expand All')}
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('Collapse All')}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {files.map((file) => (
          <FileItem
            key={file.path}
            file={file}
            isExpanded={files.length === 1 || expandedFiles.has(file.path)}
            onToggle={() => toggleFile(file.path)}
          />
        ))}
      </div>
    </div>
  )
}
