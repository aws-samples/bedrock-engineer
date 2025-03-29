import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'
import { ConnectionResultsMap } from './types/mcpServer.types'
import { generateConnectionSummary } from './utils/connectionTestUtils'
import { preventModalClose } from './utils/eventUtils'

interface ConnectionTestResultsProps {
  connectionResults: ConnectionResultsMap
  mcpServers: McpServerConfig[]
  onClearResults: () => void
}

/**
 * 接続テスト結果の概要を表示するコンポーネント
 */
export const ConnectionTestResults: React.FC<ConnectionTestResultsProps> = ({
  connectionResults,
  mcpServers,
  onClearResults
}) => {
  const { t } = useTranslation()

  // 結果がなければ何も表示しない
  if (Object.keys(connectionResults).length === 0) {
    return null
  }

  const summary = generateConnectionSummary(connectionResults, mcpServers.length)

  return (
    <div
      className="p-2 bg-gray-50 dark:bg-gray-800 rounded mb-2 flex items-center justify-between"
      onClick={preventModalClose}
    >
      <div className="text-xs">
        <span className="font-medium">{t('Connection Status')}:</span>{' '}
        <span className="text-green-600 dark:text-green-400">
          {summary.success} {t('success')}
        </span>
        {summary.failed > 0 && (
          <>
            {' / '}
            <span className="text-red-600 dark:text-red-400">
              {summary.failed} {t('failed')}
            </span>
          </>
        )}
        {' / '}
        <span>
          {summary.total} {t('total')}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClearResults()
        }}
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        {t('Clear Results')}
      </button>
    </div>
  )
}
