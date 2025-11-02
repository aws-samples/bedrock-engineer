import React from 'react'
import { useTranslation } from 'react-i18next'
import { ToolName, isMcpTool } from '@/types/tools'
import { toolIcons } from '@renderer/components/icons/ToolIcons'

interface ToolsListProps {
  tools: string[]
}

export const ToolsList: React.FC<ToolsListProps> = ({ tools }) => {
  const { t } = useTranslation()

  if (!tools || tools.length === 0) {
    return null
  }

  // MCPツールを除外
  const standardTools = tools.filter((tool) => !isMcpTool(tool))

  if (standardTools.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2 dark:text-white">{t('toolsLabel')}</h3>
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {standardTools.map((tool) => (
            <span
              key={tool}
              className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1.5"
            >
              <span className="flex-shrink-0 [&>svg]:!size-4">{toolIcons[tool as ToolName]}</span>
              <span>{tool}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
