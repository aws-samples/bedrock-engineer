import React from 'react'
import { useTranslation } from 'react-i18next'
import { SettingSection } from '../SettingSection'
import { SettingInput } from '../SettingInput'

interface AgentChatSectionProps {
  tavilySearchApiKey: string
  onUpdateTavilySearchApiKey: (value: string) => void
  contextLength: number
  onUpdateContextLength: (value: number) => void
  enablePromptCache: boolean
  onUpdateEnablePromptCache: (enabled: boolean) => void
  requestTimeout: number
  onUpdateRequestTimeout: (timeout: number) => void
}

export const AgentChatSection: React.FC<AgentChatSectionProps> = ({
  tavilySearchApiKey,
  onUpdateTavilySearchApiKey,
  contextLength,
  onUpdateContextLength,
  enablePromptCache,
  onUpdateEnablePromptCache,
  requestTimeout,
  onUpdateRequestTimeout
}) => {
  const { t } = useTranslation()

  const handleContextLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      onUpdateContextLength(value)
    }
  }

  const handleRequestTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      onUpdateRequestTimeout(value)
    }
  }

  return (
    <SettingSection title={t('Agent Chat')}>
      <div className="space-y-4">
        <SettingInput
          label={t('Tavily Search API Key')}
          type="password"
          placeholder={t('tavilySearchApiKeyPlaceholder', 'tvly-xxxxxxxxxxxxxxx')}
          value={tavilySearchApiKey}
          onChange={(e) => onUpdateTavilySearchApiKey(e.target.value)}
        />
        <div className="flex gap-1 text-xs text-gray-800 dark:text-gray-200">
          <span>{t('Learn more about Tavily Search, go to')}</span>
          <button
            onClick={() => window.open(t('tavilySearchUrl', 'https://tavily.com/'))}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('tavilySearchUrl', 'https://tavily.com/')}
          </button>
        </div>

        <div className="pt-4">
          <SettingInput
            label={t('Context Length (number of messages to include in API requests)')}
            type="number"
            min={t('minContextLength', '1')}
            placeholder={t('contextLengthPlaceholder', '10')}
            value={contextLength.toString()}
            onChange={handleContextLengthChange}
          />
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {t(
              'Limiting context length reduces token usage but may affect conversation continuity'
            )}
          </div>
        </div>

        <div className="pt-4">
          <SettingInput
            label={t('Request Timeout (minutes)')}
            type="number"
            min="1"
            placeholder="15"
            value={requestTimeout.toString()}
            onChange={handleRequestTimeoutChange}
          />
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {t('Maximum time to wait for agent responses before timing out')}
          </div>
        </div>

        <div className="pt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enable-prompt-cache"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
              checked={enablePromptCache}
              onChange={(e) => onUpdateEnablePromptCache(e.target.checked)}
            />
            <label
              htmlFor="enable-prompt-cache"
              className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('Enable Prompt Cache')}
            </label>
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 ml-6">
            {t('Prompt Cache reduces token usage by caching parts of the conversation')}
          </div>
        </div>
      </div>
    </SettingSection>
  )
}
