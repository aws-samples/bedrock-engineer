import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { KnowledgeBasesContent } from './KnowledgeBasesContent'
import { CommandsContent } from './CommandsContent'
import { BedrockAgentsContent } from './BedrockAgentsContent'
import { ToolDetailsTabProps } from '../../types'
import { preventEventPropagation } from '../../utils/eventUtils'

/**
 * ツール詳細設定タブコンポーネント
 */
export const ToolDetailsTab: React.FC<ToolDetailsTabProps> = ({
  enabledTools,
  expandedTools,
  toggleToolExpand,
  toolsWithConfigurations,
  knowledgeBases,
  onKnowledgeBasesChange,
  allowedCommands,
  onAllowedCommandsChange,
  bedrockAgents,
  onBedrockAgentsChange
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-4" onClick={preventEventPropagation}>
      <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
          {t('Configure settings for enabled tools')}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {t('Tool Detail Settings Description')}
        </p>
      </div>

      {enabledTools.length === 0 ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('No tools enabled. Enable tools in the Available Tools tab to configure them.')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* retrieve ツール設定 */}
          {toolsWithConfigurations.retrieve.isEnabled && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                onClick={(e) => {
                  preventEventPropagation(e)
                  toggleToolExpand('retrieve')
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="text-gray-600 dark:text-gray-300">
                    {expandedTools.retrieve ? <FiChevronDown /> : <FiChevronRight />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {toolsWithConfigurations.retrieve.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {toolsWithConfigurations.retrieve.description}
                    </p>
                  </div>
                </div>
              </div>

              {expandedTools.retrieve && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <KnowledgeBasesContent
                    knowledgeBases={knowledgeBases}
                    onChange={onKnowledgeBasesChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* executeCommand ツール設定 */}
          {toolsWithConfigurations.executeCommand.isEnabled && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                onClick={(e) => {
                  preventEventPropagation(e)
                  toggleToolExpand('executeCommand')
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="text-gray-600 dark:text-gray-300">
                    {expandedTools.executeCommand ? <FiChevronDown /> : <FiChevronRight />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {toolsWithConfigurations.executeCommand.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {toolsWithConfigurations.executeCommand.description}
                    </p>
                  </div>
                </div>
              </div>

              {expandedTools.executeCommand && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <CommandsContent commands={allowedCommands} onChange={onAllowedCommandsChange} />
                </div>
              )}
            </div>
          )}

          {/* invokeBedrockAgent ツール設定 */}
          {toolsWithConfigurations.invokeBedrockAgent.isEnabled && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                onClick={(e) => {
                  preventEventPropagation(e)
                  toggleToolExpand('invokeBedrockAgent')
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="text-gray-600 dark:text-gray-300">
                    {expandedTools.invokeBedrockAgent ? <FiChevronDown /> : <FiChevronRight />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {toolsWithConfigurations.invokeBedrockAgent.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {toolsWithConfigurations.invokeBedrockAgent.description}
                    </p>
                  </div>
                </div>
              </div>

              {expandedTools.invokeBedrockAgent && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <BedrockAgentsContent agents={bedrockAgents} onChange={onBedrockAgentsChange} />
                </div>
              )}
            </div>
          )}

          {/* 有効なツールがあるが、設定が必要なツールがない場合 */}
          {enabledTools.length > 0 &&
            !Object.values(toolsWithConfigurations).some((config) => config.isEnabled) && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {t(
                    'No configurable tools enabled. Enable retrieve, executeCommand, or invokeBedrockAgent tools to access their configurations.'
                  )}
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
