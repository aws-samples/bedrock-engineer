import React from 'react'
import { useTranslation } from 'react-i18next'

interface ToolsListProps {
  tools: string[]
}

export const ToolsList: React.FC<ToolsListProps> = ({ tools }) => {
  const { t } = useTranslation()

  if (!tools || tools.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2 dark:text-white">{t('toolsLabel')}</h3>
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <span
              key={tool}
              className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded dark:bg-blue-900 dark:text-blue-300 flex items-center"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mr-1.5"></span>
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
