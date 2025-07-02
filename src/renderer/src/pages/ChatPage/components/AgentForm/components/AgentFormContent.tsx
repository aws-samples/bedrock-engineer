import React from 'react'
import { formEventUtils } from '../utils/formEventUtils'
import { BasicSection } from '../BasicSection'
import { SystemPromptSection } from '../SystemPromptSection'
import { ScenariosSection } from '../ScenariosSection'
import { TagsSection } from '../TagsSection'
import { ToolsSection } from '../ToolsSection'
import { McpServerSection } from '../McpServerSection'
import { AgentCategory, CustomAgent, ToolState, McpServerConfig } from '@/types/agent-chat'
import { useTranslation } from 'react-i18next'

// タブ識別子の型定義
type AgentFormTabId = 'basic' | 'mcp-servers' | 'tools'

/**
 * タブコンテンツコンポーネント
 */
export const AgentFormContent: React.FC<{
  activeTab: AgentFormTabId
  formData: CustomAgent
  agentTools: ToolState[]
  agentCategory: AgentCategory
  updateField: <K extends keyof CustomAgent>(field: K, value: CustomAgent[K]) => void
  handleToolsChange: (tools: ToolState[]) => void
  handleCategoryChange: (category: AgentCategory) => void
  projectPath: string
  isLoadingMcpTools: boolean
  tempMcpTools: ToolState[]
  handleAutoGeneratePrompt: () => void
  handleVoiceChatGenerate: () => void
  handleGenerateScenarios: () => void
  isGeneratingSystem: boolean
  isGeneratingVoiceChat: boolean
  isGeneratingScenarios: boolean
  availableTags: string[]
  fetchMcpTools: (servers?: McpServerConfig[]) => Promise<void>
  handleAdditionalInstructionChange?: (value: string) => void
}> = ({
  activeTab,
  formData,
  agentTools,
  agentCategory,
  updateField,
  handleToolsChange,
  handleCategoryChange,
  projectPath,
  isLoadingMcpTools,
  tempMcpTools,
  handleAutoGeneratePrompt,
  handleVoiceChatGenerate,
  handleGenerateScenarios,
  isGeneratingSystem,
  isGeneratingVoiceChat,
  isGeneratingScenarios,
  availableTags,
  fetchMcpTools,
  handleAdditionalInstructionChange
}) => {
  const { t } = useTranslation()
  switch (activeTab) {
    case 'basic':
      return (
        <div className="h-full">
          <div className="space-y-6 overflow-y-auto pb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 pb-2 border-b border-gray-200 dark:border-gray-700/50">
              {t('Basic Agent Settings')}
            </h3>

            <BasicSection
              name={formData.name}
              description={formData.description}
              icon={formData.icon}
              iconColor={formData.iconColor}
              onChange={(field, value) => updateField(field, value)}
            />

            <SystemPromptSection
              system={formData.system}
              name={formData.name}
              description={formData.description}
              additionalInstruction={formData.additionalInstruction}
              environmentContextSettings={formData.environmentContextSettings}
              onChange={(value) => updateField('system', value)}
              onAdditionalInstructionChange={handleAdditionalInstructionChange}
              onEnvironmentContextSettingsChange={(settings) =>
                updateField('environmentContextSettings', settings)
              }
              onAutoGenerate={handleAutoGeneratePrompt}
              onVoiceChatGenerate={handleVoiceChatGenerate}
              isGenerating={isGeneratingSystem}
              isGeneratingVoiceChat={isGeneratingVoiceChat}
              projectPath={projectPath}
              allowedCommands={formData.allowedCommands || []}
              knowledgeBases={formData.knowledgeBases || []}
              bedrockAgents={formData.bedrockAgents || []}
              flows={formData.flows || []}
              tools={agentTools}
            />

            <ScenariosSection
              scenarios={formData.scenarios}
              name={formData.name}
              description={formData.description}
              system={formData.system}
              onChange={(scenarios) => updateField('scenarios', scenarios)}
              isGenerating={isGeneratingScenarios}
              onAutoGenerate={handleGenerateScenarios}
            />

            <TagsSection
              tags={formData.tags || []}
              availableTags={availableTags}
              onChange={(tags) => updateField('tags', tags)}
            />
          </div>
        </div>
      )
    case 'mcp-servers':
      return (
        <div className="h-full">
          <div className="overflow-y-auto pb-4" onClick={formEventUtils.preventPropagation}>
            <McpServerSection
              mcpServers={formData.mcpServers || []}
              onChange={async (servers) => {
                console.log('MCPサーバー設定変更:', servers.length, 'servers')
                updateField('mcpServers', servers)

                // サーバー設定変更後、タイマーを使用して状態更新の競合を避ける
                // 現在のタブがツールタブの場合のみ再取得を行う
                if (activeTab === ('tools' as AgentFormTabId)) {
                  console.log('ツールタブ表示中にMCPサーバー変更を検出 - ツールを再取得します')
                  setTimeout(async () => {
                    // 最新のサーバー情報でツールを直接取得
                    if (servers.length > 0) {
                      await fetchMcpTools(servers)
                    } else {
                      console.log('サーバーが0件になったため、ツールをクリア')
                    }
                  }, 50) // 少し長めの遅延を設定
                } else {
                  console.log('ツールタブ以外でのMCPサーバー変更 - タブ切替時に取得します')
                }
              }}
            />
          </div>
        </div>
      )
    case 'tools':
      return (
        <div className="h-full">
          <div className="overflow-y-auto pb-4">
            <ToolsSection
              tools={agentTools}
              onChange={handleToolsChange}
              agentCategory={agentCategory}
              onCategoryChange={handleCategoryChange}
              knowledgeBases={formData.knowledgeBases || []}
              onKnowledgeBasesChange={(kbs) => updateField('knowledgeBases', kbs)}
              allowedCommands={formData.allowedCommands || []}
              onAllowedCommandsChange={(commands) => updateField('allowedCommands', commands)}
              bedrockAgents={formData.bedrockAgents || []}
              onBedrockAgentsChange={(agents) => updateField('bedrockAgents', agents)}
              flows={formData.flows || []}
              onFlowsChange={(flows) => updateField('flows', flows)}
              mcpServers={formData.mcpServers || []}
              tempMcpTools={tempMcpTools}
              isLoadingMcpTools={isLoadingMcpTools}
            />
          </div>
        </div>
      )
    default:
      return null
  }
}
