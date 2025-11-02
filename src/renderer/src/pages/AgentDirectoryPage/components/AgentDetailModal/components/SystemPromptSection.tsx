import React from 'react'
import { useTranslation } from 'react-i18next'

interface SystemPromptSectionProps {
  systemPrompt: string
}

export const SystemPromptSection: React.FC<SystemPromptSectionProps> = ({ systemPrompt }) => {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="text-lg font-medium mb-2 dark:text-white flex items-center">
        <span className="mr-2">{t('systemPromptLabel')}</span>
      </h3>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-y-auto max-h-[50vh] border border-gray-200 dark:border-gray-700">
        <pre className="whitespace-pre-wrap text-sm dark:text-gray-200 font-mono">
          {systemPrompt}
        </pre>
      </div>
    </div>
  )
}
