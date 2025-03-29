import React from 'react'
import { useTranslation } from 'react-i18next'
import { getOriginalMcpToolName } from '@/types/tools'
import { ToolInfoModalProps } from '../types'
import { preventEventPropagation } from '../utils/eventUtils'

/**
 * ツール詳細情報を表示するモーダルダイアログコンポーネント
 */
export const ToolInfoModal: React.FC<ToolInfoModalProps> = ({
  toolName,
  toolDescription,
  onClose,
  mcpServerInfo,
  isMcp
}) => {
  const { t } = useTranslation()

  // 非MCPツールや無効なツール名の場合は表示しない
  if (!toolName || !isMcp) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={preventEventPropagation}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{getOriginalMcpToolName(toolName)}</h3>
            <span className="bg-cyan-100 text-cyan-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-cyan-900 dark:text-cyan-300">
              MCP
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="prose dark:prose-invert max-w-none text-sm">
          <p className="mb-4">{toolDescription}</p>

          {mcpServerInfo && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                {t('Server Information')}
              </h4>
              <p className="text-xs">{mcpServerInfo}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-md border-l-4 border-cyan-500">
            <h4 className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-1">
              {t('MCP Tool')}
            </h4>
            <p className="text-xs">
              {t(
                'This tool is provided by an MCP server and is always enabled. It cannot be disabled.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
