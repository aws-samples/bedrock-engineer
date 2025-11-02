import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface ApiKeySectionProps {
  apiKey: string
  onSave: (apiKey: string) => void
}

export const ApiKeySection = ({ apiKey: initialApiKey, onSave }: ApiKeySectionProps) => {
  const { t } = useTranslation()
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSave = () => {
    onSave(apiKey)
  }

  return (
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
            onClick={handleSave}
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
  )
}
