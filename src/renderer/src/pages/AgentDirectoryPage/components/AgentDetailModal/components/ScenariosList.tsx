import React from 'react'
import { useTranslation } from 'react-i18next'
import { Scenario } from '@/types/agent-chat'

interface ScenariosListProps {
  scenarios: Scenario[]
}

export const ScenariosList: React.FC<ScenariosListProps> = ({ scenarios }) => {
  const { t } = useTranslation()

  if (!scenarios || scenarios.length === 0) {
    return null
  }

  return (
    <div>
      <h3 className="text-lg font-medium mb-2 dark:text-white">{t('scenariosLabel')}</h3>
      <div className="space-y-3">
        {scenarios.map((scenario, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h4 className="font-medium text-sm dark:text-white mb-2">{scenario.title}</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {scenario.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
