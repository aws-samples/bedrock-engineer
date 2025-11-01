import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiX, FiZap, FiPlus } from 'react-icons/fi'
import { ScenariosSectionProps } from './types'

export const ScenariosSection: React.FC<ScenariosSectionProps> = ({
  scenarios,
  name,
  description,
  system,
  onChange,
  isGenerating,
  onAutoGenerate
}) => {
  const { t } = useTranslation()

  const addScenario = () => {
    onChange([...scenarios, { title: '', content: '' }])
  }

  const removeScenario = (index: number) => {
    onChange(scenarios.filter((_, i) => i !== index))
  }

  const updateScenario = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...scenarios]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="mb-2">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-shrink-0">
            Scenarios {t('optional')}
          </label>
          {name && description && system && (
            <button
              type="button"
              onClick={onAutoGenerate}
              disabled={isGenerating}
              className="inline-flex items-center text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800
              text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5 transition-colors duration-200 border border-blue-200 dark:border-blue-800"
            >
              <FiZap className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-pulse' : ''}`} />
              <span>{isGenerating ? t('generating') : t('autoGenerateScinario')}</span>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-1">
          {t('scenariosDescription')}
        </p>
      </div>

      {isGenerating && scenarios.length === 0 ? (
        <Loading />
      ) : (
        <>
          {scenarios.length > 0 && (
            <div className="space-y-2">
              {scenarios.map((scenario, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <textarea
                    value={scenario.title}
                    onChange={(e) => updateScenario(index, 'title', e.target.value)}
                    placeholder={t('scenarioTitlePlaceholder')}
                    className="flex-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={isGenerating}
                  />
                  <textarea
                    value={scenario.content}
                    onChange={(e) => updateScenario(index, 'content', e.target.value)}
                    placeholder={t('scenarioContentPlaceholder')}
                    className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                      text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={isGenerating}
                  />
                  <button
                    type="button"
                    onClick={() => removeScenario(index)}
                    title={t('deleteScenario')}
                    disabled={isGenerating}
                    className="flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600
                      bg-gray-50 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                      text-gray-700 dark:text-gray-200 transition-colors duration-200 px-3 h-[60px]
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {isGenerating && scenarios.length > 0 && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full"></div>
              <span>{t('generating')}</span>
            </div>
          )}
          {!isGenerating && (
            <button
              type="button"
              onClick={addScenario}
              className="w-full mt-2 py-2 px-4 bg-gray-50 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-200 rounded-md transition-colors duration-200
                flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600"
            >
              <FiPlus className="w-4 h-4" />
              <span>{t('addScenario')}</span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

const Loading = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="animate-pulse h-2 w-12 bg-slate-200 rounded"></span>
      <div className="flex-1 space-y-6 py-1">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-slate-200 rounded col-span-2"></div>
            <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}
