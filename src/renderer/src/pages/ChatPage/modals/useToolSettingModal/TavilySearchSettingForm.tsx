import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaEye, FaEyeSlash, FaPlus, FaTimes } from 'react-icons/fa'
import { TavilySearchConfig } from 'src/types/agent-chat'

interface TavilySearchSettingFormProps {
  tavilySearchApiKey: string
  setTavilySearchApiKey: (apiKey: string) => void
  selectedAgentId: string
  includeDomains: string[]
  excludeDomains: string[]
  onUpdateTavilyConfig: (config: TavilySearchConfig) => void
}

export const TavilySearchSettingForm = ({
  tavilySearchApiKey,
  setTavilySearchApiKey,
  selectedAgentId: _selectedAgentId,
  includeDomains,
  excludeDomains,
  onUpdateTavilyConfig
}: TavilySearchSettingFormProps) => {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState(tavilySearchApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [localIncludeDomains, setLocalIncludeDomains] = useState<string[]>(includeDomains)
  const [localExcludeDomains, setLocalExcludeDomains] = useState<string[]>(excludeDomains)
  const [newIncludeDomain, setNewIncludeDomain] = useState('')
  const [newExcludeDomain, setNewExcludeDomain] = useState('')
  const [includeDomainError, setIncludeDomainError] = useState(false)
  const [excludeDomainError, setExcludeDomainError] = useState(false)

  const handleSaveApiKey = () => {
    setTavilySearchApiKey(apiKey)
  }

  const validateDomain = (domain: string): boolean => {
    // Supports:
    // - Standard domains: example.com
    // - Wildcards: *.com, *.example.com
    // - Paths: linkedin.com/in, example.com/path/to/page
    const domainRegex =
      /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,})(\/[^\s]*)?$/
    return domainRegex.test(domain.trim())
  }

  const addIncludeDomain = () => {
    const domain = newIncludeDomain.trim()
    if (domain && validateDomain(domain) && !localIncludeDomains.includes(domain)) {
      const updated = [...localIncludeDomains, domain]
      setLocalIncludeDomains(updated)
      setNewIncludeDomain('')
      onUpdateTavilyConfig({
        includeDomains: updated,
        excludeDomains: localExcludeDomains
      })
    }
  }

  const addExcludeDomain = () => {
    const domain = newExcludeDomain.trim()
    if (domain && validateDomain(domain) && !localExcludeDomains.includes(domain)) {
      const updated = [...localExcludeDomains, domain]
      setLocalExcludeDomains(updated)
      setNewExcludeDomain('')
      onUpdateTavilyConfig({
        includeDomains: localIncludeDomains,
        excludeDomains: updated
      })
    }
  }

  const removeIncludeDomain = (domain: string) => {
    const updated = localIncludeDomains.filter((d) => d !== domain)
    setLocalIncludeDomains(updated)
    onUpdateTavilyConfig({
      includeDomains: updated,
      excludeDomains: localExcludeDomains
    })
  }

  const removeExcludeDomain = (domain: string) => {
    const updated = localExcludeDomains.filter((d) => d !== domain)
    setLocalExcludeDomains(updated)
    onUpdateTavilyConfig({
      includeDomains: localIncludeDomains,
      excludeDomains: updated
    })
  }

  const clearAllIncludeDomains = () => {
    setLocalIncludeDomains([])
    onUpdateTavilyConfig({
      includeDomains: [],
      excludeDomains: localExcludeDomains
    })
  }

  const clearAllExcludeDomains = () => {
    setLocalExcludeDomains([])
    onUpdateTavilyConfig({
      includeDomains: localIncludeDomains,
      excludeDomains: []
    })
  }

  return (
    <div className="mt-4 space-y-4">
      {/* ツールの説明 */}
      <div className="prose dark:prose-invert max-w-none">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.tavilySearch.description',
            'Tavily Search enables the AI assistant to search the web for current information, providing better responses to queries about recent events, technical documentation, or other information that may not be in its training data.'
          )}
        </p>
      </div>

      {/* API Key設定 */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">
          {t('Tavily Search API Settings')}
        </h4>
        <div className="flex-grow">
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">API Key</label>
          <div className="flex items-center gap-2">
            <div className="flex-grow relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="tvly-xxxxxxxxxxxxxxx"
                className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 cursor-pointer"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? t('Hide API Key') : t('Show API Key')}
                title={showApiKey ? t('Hide API Key') : t('Show API Key')}
              >
                {showApiKey ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              className="min-w-[80px] px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {t('Save')}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
            {t('You need a Tavily Search API key to use this feature. Get your API key at')}
            <a
              href="https://tavily.com/"
              target="_blank"
              rel="noreferrer"
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              tavily.com
            </a>
          </p>
        </div>
      </div>

      {/* ドメイン設定 */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">
          {t('Domain Settings', 'Domain Settings')}
        </h4>

        {/* Include Domains */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">
              {t('Include Domains', 'Include Domains')}
            </label>
            {localIncludeDomains.length > 0 && (
              <button
                onClick={clearAllIncludeDomains}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline cursor-pointer"
              >
                {t('Clear All', 'Clear All')}
              </button>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newIncludeDomain}
              onChange={(e) => {
                const value = e.target.value
                setNewIncludeDomain(value)
                if (value && !validateDomain(value)) {
                  setIncludeDomainError(true)
                } else {
                  setIncludeDomainError(false)
                }
              }}
              placeholder="example.com"
              className="flex-1 px-3 py-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !includeDomainError) {
                  addIncludeDomain()
                }
              }}
            />
            <button
              onClick={addIncludeDomain}
              disabled={includeDomainError || !newIncludeDomain}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
          {includeDomainError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {t(
                'Please enter a valid domain (e.g., example.com)',
                'Please enter a valid domain (e.g., example.com)'
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {localIncludeDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
              >
                {domain}
                <button
                  onClick={() => removeIncludeDomain(domain)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Exclude Domains */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">
              {t('Exclude Domains', 'Exclude Domains')}
            </label>
            {localExcludeDomains.length > 0 && (
              <button
                onClick={clearAllExcludeDomains}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline cursor-pointer"
              >
                {t('Clear All', 'Clear All')}
              </button>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newExcludeDomain}
              onChange={(e) => {
                const value = e.target.value
                setNewExcludeDomain(value)
                if (value && !validateDomain(value)) {
                  setExcludeDomainError(true)
                } else {
                  setExcludeDomainError(false)
                }
              }}
              placeholder="example.com"
              className="flex-1 px-3 py-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !excludeDomainError) {
                  addExcludeDomain()
                }
              }}
            />
            <button
              onClick={addExcludeDomain}
              disabled={excludeDomainError || !newExcludeDomain}
              className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
          {excludeDomainError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              {t(
                'Please enter a valid domain (e.g., example.com)',
                'Please enter a valid domain (e.g., example.com)'
              )}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {localExcludeDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {domain}
                <button
                  onClick={() => removeExcludeDomain(domain)}
                  className="hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t(
              'Domain Settings Help',
              'Include domains to limit search to specific websites. Exclude domains to avoid certain websites. Changes are saved automatically.'
            )}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {t('Learn more about domain settings at')}{' '}
            <a
              href="https://docs.tavily.com/documentation/best-practices/best-practices-search#include-domains-restricting-searches-to-specific-domains"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Tavily Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
