import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiZap, FiEye, FiEyeOff } from 'react-icons/fi'
import { SystemPromptSectionProps } from './types'
import { replacePlaceholders } from '../../utils/placeholder'

const PLACEHOLDERS = [
  { key: 'projectPath', translationKey: 'projectPathPlaceholder' },
  { key: 'date', translationKey: 'datePlaceholder' },
  { key: 'allowedCommands', translationKey: 'allowedCommandsPlaceholder' },
  { key: 'knowledgeBases', translationKey: 'knowledgeBasesPlaceholder' },
  { key: 'bedrockAgents', translationKey: 'bedrockAgentsPlaceholder' }
]

export const SystemPromptSection: React.FC<SystemPromptSectionProps> = ({
  system,
  name,
  description,
  onChange,
  onAutoGenerate,
  isGenerating,
  projectPath,
  allowedCommands,
  knowledgeBases,
  bedrockAgents
}) => {
  const { t } = useTranslation()
  const [showPreview, setShowPreview] = useState(false)

  const getPreviewText = (text: string): string => {
    if (!text) return text
    const path = projectPath || t('noProjectPath')
    return replacePlaceholders(text, {
      projectPath: path,
      allowedCommands,
      knowledgeBases,
      bedrockAgents
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  return (
    <div>
      <div className="flex justify-between pb-2">
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              System Prompt
            </label>
            <div className="flex justify-end items-center space-x-2">
              <div
                onClick={togglePreview}
                className="inline-flex items-center text-gray-500 hover:text-gray-800 dark:text-gray-400
                dark:hover:text-gray-200 cursor-pointer transition-colors duration-200"
                title={showPreview ? t('hidePreview') : t('showPreview')}
              >
                {showPreview ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </div>
              {name && description && (
                <button
                  onClick={onAutoGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800
                  text-blue-600 dark:text-blue-400 rounded px-2 py-0.5 transition-colors duration-200 border border-blue-200 dark:border-blue-800"
                >
                  <FiZap className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-pulse' : ''}`} />
                  <span>{isGenerating ? t('generating') : 'System Prompt を自動生成する'}</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line mb-2 mt-1">
            {t('systemPromptInfo')}
          </p>
        </div>
      </div>

      <div className="p-2 bg-blue-50 dark:bg-blue-800 rounded-md border border-gray-200 dark:border-gray-700 mb-2">
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{t('placeholders')}</p>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-1">
          {PLACEHOLDERS.map(({ key, translationKey }) => (
            <div key={key} className="flex items-center space-x-2">
              <code className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:text-gray-300">
                {`{{${key}}}`}
              </code>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t(translationKey)}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(`{{${key}}}`)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {t('copy')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={showPreview ? 'grid grid-cols-2 gap-4 pt-2' : ''}>
        <div className={showPreview ? 'space-y-2' : ''}>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-2">
            {t('inputSystemPrompt')}
          </p>

          <textarea
            value={system}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              h-[512px]"
            required
            placeholder={t('systemPromptPlaceholder')}
          />
        </div>

        {/* Preview Column */}
        {showPreview && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-2">
              {t('previewResult')}
            </p>
            <p
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200
                dark:border-gray-700 h-[512px] overflow-y-auto text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap"
            >
              {getPreviewText(system)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
