import { useTranslation } from 'react-i18next'
import { TavilySearchConfig } from 'src/types/agent-chat'
import { useDomainList } from './hooks/useDomainList'
import { ApiKeySection } from './components/ApiKeySection'
import { DomainListSection } from './components/DomainListSection'

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

  // Include domains management
  const includeDomainsHook = useDomainList({
    initialDomains: includeDomains,
    onUpdate: (updated) => {
      onUpdateTavilyConfig({
        includeDomains: updated,
        excludeDomains: excludeDomainsHook.domains
      })
    }
  })

  // Exclude domains management
  const excludeDomainsHook = useDomainList({
    initialDomains: excludeDomains,
    onUpdate: (updated) => {
      onUpdateTavilyConfig({
        includeDomains: includeDomainsHook.domains,
        excludeDomains: updated
      })
    }
  })

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
      <ApiKeySection apiKey={tavilySearchApiKey} onSave={setTavilySearchApiKey} />

      {/* ドメイン設定 */}
      <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">
          {t('Domain Settings', 'Domain Settings')}
        </h4>

        {/* Include Domains */}
        <DomainListSection
          label={t('Include Domains', 'Include Domains')}
          domains={includeDomainsHook.domains}
          newDomain={includeDomainsHook.newDomain}
          error={includeDomainsHook.error}
          variant="include"
          onDomainChange={includeDomainsHook.handleDomainChange}
          onAddDomain={includeDomainsHook.addDomain}
          onRemoveDomain={includeDomainsHook.removeDomain}
          onClearAll={includeDomainsHook.clearAll}
        />

        {/* Exclude Domains */}
        <DomainListSection
          label={t('Exclude Domains', 'Exclude Domains')}
          domains={excludeDomainsHook.domains}
          newDomain={excludeDomainsHook.newDomain}
          error={excludeDomainsHook.error}
          variant="exclude"
          onDomainChange={excludeDomainsHook.handleDomainChange}
          onAddDomain={excludeDomainsHook.addDomain}
          onRemoveDomain={excludeDomainsHook.removeDomain}
          onClearAll={excludeDomainsHook.clearAll}
        />

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
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
