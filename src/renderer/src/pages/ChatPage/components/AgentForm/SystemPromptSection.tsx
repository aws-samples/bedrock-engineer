import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiZap, FiEye, FiEyeOff, FiChevronDown, FiChevronUp, FiMic } from 'react-icons/fi'
import { ToggleSwitch } from 'flowbite-react'
import { SystemPromptSectionProps } from './types'
import { replacePlaceholders } from '../../utils/placeholder'
import { getEnvironmentContext } from '../../constants/AGENTS_ENVIRONMENT_CONTEXT'
import { motion } from 'framer-motion'

const PLACEHOLDERS = [
  { key: 'projectPath', translationKey: 'projectPathPlaceholder' },
  { key: 'date', translationKey: 'datePlaceholder' },
  { key: 'allowedCommands', translationKey: 'allowedCommandsPlaceholder' },
  { key: 'knowledgeBases', translationKey: 'knowledgeBasesPlaceholder' },
  { key: 'bedrockAgents', translationKey: 'bedrockAgentsPlaceholder' },
  { key: 'flows', translationKey: 'flowsPlaceholder' }
]

export const SystemPromptSection: React.FC<SystemPromptSectionProps> = ({
  system,
  name,
  description,
  additionalInstruction,
  environmentContextSettings,
  onChange,
  onAdditionalInstructionChange,
  onEnvironmentContextSettingsChange,
  onAutoGenerate,
  onVoiceChatGenerate,
  isGenerating,
  isGeneratingVoiceChat,
  projectPath,
  allowedCommands,
  knowledgeBases,
  bedrockAgents,
  flows = [],
  tools
}) => {
  const { t } = useTranslation()
  const [showPreview, setShowPreview] = useState(false)
  const [showAdditionalInstructionForm, setShowAdditionalInstructionForm] = useState(false)

  const getPreviewText = (text: string): string => {
    if (!text) return text
    const path = projectPath || t('noProjectPath')
    return replacePlaceholders(text, {
      projectPath: path,
      allowedCommands,
      knowledgeBases,
      bedrockAgents,
      flows
    })
  }

  const getEnvironmentContextText = (): string => {
    const path = projectPath || t('noProjectPath')
    const environmentContext = getEnvironmentContext(tools || [], environmentContextSettings)
    return replacePlaceholders(environmentContext, {
      projectPath: path,
      allowedCommands,
      knowledgeBases,
      bedrockAgents,
      flows
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  const toggleAdditionalInstructionForm = () => {
    setShowAdditionalInstructionForm(!showAdditionalInstructionForm)
  }

  const handleAdditionalInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onAdditionalInstructionChange) {
      onAdditionalInstructionChange(e.target.value)
    }
  }

  return (
    <div>
      <div className="flex justify-between pb-2">
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('systemPrompt')}
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
                <>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onAutoGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800
                    text-blue-600 dark:text-blue-400 rounded px-2 py-0.5 transition-colors duration-200 border border-blue-200 dark:border-blue-800"
                  >
                    <FiZap className={`w-3 h-3 mr-1 ${isGenerating ? 'animate-pulse' : ''}`} />
                    <span>{isGenerating ? t('generating') : t('generateSystemPrompt')}</span>
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={onVoiceChatGenerate}
                    disabled={isGeneratingVoiceChat}
                    className="inline-flex items-center text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800
                    text-green-600 dark:text-green-400 rounded px-2 py-0.5 transition-colors duration-200 border border-green-200 dark:border-green-800"
                    title={t('generateVoiceChatPromptTooltip')}
                  >
                    <FiMic
                      className={`w-3 h-3 mr-1 ${isGeneratingVoiceChat ? 'animate-pulse' : ''}`}
                    />
                    <span>
                      {isGeneratingVoiceChat ? t('generating') : t('generateVoiceChatPrompt')}
                    </span>
                  </motion.button>
                </>
              )}

              {/* Additional Instruction Toggle Button */}
              {name && description && (
                <button
                  type="button"
                  onClick={toggleAdditionalInstructionForm}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showAdditionalInstructionForm ? (
                    <FiChevronUp className="w-3 h-3" />
                  ) : (
                    <FiChevronDown className="w-3 h-3" />
                  )}
                  <span>{t('additionalInstruction')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Instruction Form */}
      {showAdditionalInstructionForm && (
        <motion.div className="mb-4" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t(
              'additionalInstructionInfo',
              'Optional instructions to guide the system prompt generation. These will be included when auto-generating the system prompt.'
            )}
          </p>
          <textarea
            value={additionalInstruction || ''}
            onChange={handleAdditionalInstructionChange}
            disabled={isGenerating || isGeneratingVoiceChat}
            className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              h-[150px] ${isGenerating || isGeneratingVoiceChat ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={t(
              'additionalInstructionPlaceholder',
              'Enter additional instructions for system prompt generation...'
            )}
          />
        </motion.div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line mb-2 mt-1">
        {t('systemPromptInfo')}
      </p>
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
            disabled={isGenerating || isGeneratingVoiceChat}
            className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
              h-[512px] ${isGenerating || isGeneratingVoiceChat ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 h-[512px] overflow-y-auto text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {/* User Input Section */}
              <div className="mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3 uppercase tracking-wide">
                  {t('userInput')}
                </p>
                <div className="whitespace-pre-wrap bg-white dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                  {getPreviewText(system)}
                </div>
              </div>

              {/* Environment Context Section */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3 uppercase tracking-wide">
                  {t('autoAddedEnvironmentContext')}
                </p>
                <div className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                  {getEnvironmentContextText()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environment Context Settings */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
          {t('Environment Context Settings')}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {t(
            'Choose which environment context sections to include in the system prompt. Basic context (project path, date) is always included.'
          )}
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-200">{t('Project Rule')}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t(
                  'Includes instructions to load project-specific rules from .bedrock-engineer/rules folder'
                )}
              </p>
            </div>
            <ToggleSwitch
              checked={Boolean(environmentContextSettings?.projectRule)}
              onChange={(checked) => {
                if (onEnvironmentContextSettingsChange) {
                  const newSettings = {
                    todoListInstruction: environmentContextSettings?.todoListInstruction ?? true,
                    projectRule: checked,
                    visualExpressionRules: environmentContextSettings?.visualExpressionRules ?? true
                  }
                  onEnvironmentContextSettingsChange(newSettings)
                }
              }}
              label=""
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {t('Visual Expression Rules')}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t(
                  'Includes instructions for creating diagrams, images, and mathematical formulas'
                )}
              </p>
            </div>
            <ToggleSwitch
              checked={Boolean(environmentContextSettings?.visualExpressionRules)}
              onChange={(checked) => {
                if (onEnvironmentContextSettingsChange) {
                  onEnvironmentContextSettingsChange({
                    todoListInstruction: environmentContextSettings?.todoListInstruction ?? true,
                    projectRule: environmentContextSettings?.projectRule ?? true,
                    visualExpressionRules: checked
                  })
                }
              }}
              label=""
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {t('TODO List Instruction')}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('Includes instructions to create TODO lists for long-running tasks')}
              </p>
            </div>
            <ToggleSwitch
              checked={Boolean(environmentContextSettings?.todoListInstruction)}
              onChange={(checked) => {
                if (onEnvironmentContextSettingsChange) {
                  onEnvironmentContextSettingsChange({
                    todoListInstruction: checked,
                    projectRule: environmentContextSettings?.projectRule ?? true,
                    visualExpressionRules: environmentContextSettings?.visualExpressionRules ?? true
                  })
                }
              }}
              label=""
            />
          </div>
        </div>
      </div>
    </div>
  )
}
