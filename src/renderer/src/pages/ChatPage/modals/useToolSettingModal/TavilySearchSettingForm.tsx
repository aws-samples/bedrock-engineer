import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaEye, FaEyeSlash, FaPlus, FaTrash } from 'react-icons/fa'
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

  const presets = {
    technical: {
      label: t('Technical Sites', 'Technical Sites'),
      domains: ['github.com', 'stackoverflow.com', 'docs.aws.amazon.com', 'developer.mozilla.org']
    },
    news: {
      label: t('News Sites', 'News Sites'),
      domains: ['reuters.com', 'bbc.com', 'cnn.com', 'apnews.com']
    },
    academic: {
      label: t('Academic Sites', 'Academic Sites'),
      domains: ['scholar.google.com', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'jstor.org']
    },
    excludeSocial: {
      label: t('Exclude Social Media', 'Exclude Social Media'),
      domains: ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com']
    }
  }

  const handleSaveApiKey = () => {
    setTavilySearchApiKey(apiKey)
  }

  const validateDomain = (domain: string): boolean => {
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z0-9-]*[a-zA-Z0-9])$/
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

  const applyPreset = (preset: 'technical' | 'news' | 'academic' | 'excludeSocial') => {
    if (preset === 'excludeSocial') {
      const updated = [...new Set([...localExcludeDomains, ...presets[preset].domains])]
      setLocalExcludeDomains(updated)
      onUpdateTavilyConfig({
        includeDomains: localIncludeDomains,
        excludeDomains: updated
      })
    } else {
      const updated = [...new Set([...localIncludeDomains, ...presets[preset].domains])]
      setLocalIncludeDomains(updated)
      onUpdateTavilyConfig({
        includeDomains: updated,
        excludeDomains: localExcludeDomains
      })
    }
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
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? t('Hide API Key') : t('Show API Key')}
                title={showApiKey ? t('Hide API Key') : t('Show API Key')}
              >
                {showApiKey ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              className="min-w-[80px] px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

        {/* プリセットボタン */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-2">
            {t('Quick Presets', 'Quick Presets')}
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof presets)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Include Domains */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-600 dark:text-gray-300">
              {t('Include Domains', 'Include Domains')}
            </label>
            {localIncludeDomains.length > 0 && (
              <button
                onClick={clearAllIncludeDomains}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
              >
                {t('Clear All', 'Clear All')}
              </button>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newIncludeDomain}
              onChange={(e) => setNewIncludeDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-3 py-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addIncludeDomain()
                }
              }}
            />
            <button
              onClick={addIncludeDomain}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {localIncludeDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
              >
                {domain}
                <button
                  onClick={() => removeIncludeDomain(domain)}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <FaTrash className="w-2 h-2" />
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
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
              >
                {t('Clear All', 'Clear All')}
              </button>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newExcludeDomain}
              onChange={(e) => setNewExcludeDomain(e.target.value)}
              placeholder="example.com"
              className="flex-1 px-3 py-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addExcludeDomain()
                }
              }}
            />
            <button
              onClick={addExcludeDomain}
              className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {localExcludeDomains.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                {domain}
                <button
                  onClick={() => removeExcludeDomain(domain)}
                  className="hover:text-gray-500 dark:hover:text-gray-400"
                >
                  <FaTrash className="w-2 h-2" />
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
