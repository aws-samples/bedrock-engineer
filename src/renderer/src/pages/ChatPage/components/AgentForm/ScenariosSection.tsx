import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiTrash, FiPlus, FiZap } from 'react-icons/fi'
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
  const [newScenario, setNewScenario] = useState({ title: '', content: '' })

  const addScenario = () => {
    if (newScenario.title && newScenario.content) {
      onChange([...scenarios, newScenario])
      setNewScenario({ title: '', content: '' })
    }
  }

  const removeScenario = (index: number) => {
    onChange(scenarios.filter((_, i) => i !== index))
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
              <span>{isGenerating ? t('generating') : 'Scenarios を自動生成する'}</span>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-1">
          {t('scenariosDescription')}
        </p>
      </div>

      <div className="space-y-2">
        {scenarios.map((scenario, index) => (
          <div key={index} className="flex items-center space-x-2">
            <textarea
              value={scenario.title}
              readOnly
              className="flex-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <textarea
              value={scenario.content}
              readOnly
              className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => removeScenario(index)}
              title={t('deleteScenario')}
              className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <FiTrash />
            </button>
          </div>
        ))}
      </div>

      {isGenerating ? (
        <Loading />
      ) : (
        <div className="flex space-x-2 justify-between">
          <textarea
            value={newScenario.title}
            onChange={(e) => setNewScenario({ ...newScenario, title: e.target.value })}
            placeholder={t('scenarioTitlePlaceholder')}
            className="flex-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-[4rem]"
          />
          <textarea
            value={newScenario.content}
            onChange={(e) => setNewScenario({ ...newScenario, content: e.target.value })}
            placeholder={t('scenarioContentPlaceholder')}
            className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-[4rem]"
          />
          <button
            type="button"
            onClick={addScenario}
            className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <FiPlus />
          </button>
        </div>
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
