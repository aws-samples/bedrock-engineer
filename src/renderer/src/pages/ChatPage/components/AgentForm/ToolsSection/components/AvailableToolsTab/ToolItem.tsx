import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from 'flowbite-react'
import { FiServer } from 'react-icons/fi'
import { getOriginalMcpToolName, ToolName } from '@/types/tools'
import { toolIcons } from '../../../../Tool/ToolIcons'
import { ToolItemProps } from '../../types'
import { preventEventPropagation } from '../../utils/eventUtils'

/**
 * ツールアイテムコンポーネント
 */
export const ToolItem: React.FC<ToolItemProps> = ({
  tool,
  isMcp,
  serverInfo,
  onToggle,
  onShowInfo
}) => {
  const { t } = useTranslation()

  const toolName = tool.toolSpec?.name
  if (!toolName) return null

  // ツール名の表示
  const displayedName = isMcp ? getOriginalMcpToolName(toolName) : toolName

  // ツールアイコン
  const ToolIcon = isMcp ? (
    <FiServer className="h-5 w-5" />
  ) : toolName ? (
    toolIcons[toolName as ToolName]
  ) : null

  return (
    <div
      className={`flex items-center justify-between p-3 ${
        isMcp
          ? 'bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800'
          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
      } rounded-md shadow-sm`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-7 h-7 flex items-center justify-center">
          {ToolIcon}
        </div>
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {displayedName}
            {isMcp && (
              <span className="ml-1 text-xs font-normal bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 py-0.5 px-1 rounded">
                MCP
              </span>
            )}
          </p>
          <div>
            {isMcp ? (
              <p
                className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 overflow-hidden cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted"
                title={t('Click for more information')}
                onClick={(e) => {
                  preventEventPropagation(e)
                  if (onShowInfo && toolName) {
                    onShowInfo(toolName)
                  }
                }}
              >
                {tool.toolSpec?.description || t('MCP tool from Model Context Protocol server')}
                {/* サーバー情報があれば表示 */}
                {serverInfo && (
                  <span className="block mt-0.5 text-blue-600 dark:text-blue-400 truncate">
                    {serverInfo}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 overflow-hidden">
                {toolName ? t(`tool descriptions.${toolName}`) : ''}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0" onClick={preventEventPropagation}>
        {isMcp ? (
          <div className="flex items-center">
            <ToggleSwitch checked={true} onChange={() => {}} disabled={true} label="" />
          </div>
        ) : (
          <ToggleSwitch checked={tool.enabled} onChange={() => onToggle(toolName)} label="" />
        )}
      </div>
    </div>
  )
}
