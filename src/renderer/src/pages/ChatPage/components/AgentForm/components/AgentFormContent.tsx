import React from 'react'
import { useTranslation } from 'react-i18next'
import { formEventUtils } from '../utils/formEventUtils'
import { BasicSection } from '../BasicSection'
import { SystemPromptSection } from '../SystemPromptSection'
import { ScenariosSection } from '../ScenariosSection'
import { TagsSection } from '../TagsSection'
import { ToolsSection } from '../ToolsSection'
import { McpServerSection } from '../McpServerSection'
import { AgentCategory, CustomAgent, ToolState, McpServerConfig } from '@/types/agent-chat'

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
  handleGenerateScenarios: () => void
  isGeneratingSystem: boolean
  isGeneratingScenarios: boolean
  availableTags: string[]
  fetchMcpTools: (servers?: McpServerConfig[]) => Promise<void>
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
  handleGenerateScenarios,
  isGeneratingSystem,
  isGeneratingScenarios,
  availableTags,
  fetchMcpTools
}) => {
  const { t } = useTranslation()

  switch (activeTab) {
    case 'basic':
      return (
        <div className="space-y-6 overflow-y-auto max-h-[900px] pb-4">
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
            onChange={(value) => updateField('system', value)}
            onAutoGenerate={handleAutoGeneratePrompt}
            isGenerating={isGeneratingSystem}
            projectPath={projectPath}
            allowedCommands={formData.allowedCommands || []}
            knowledgeBases={formData.knowledgeBases || []}
            bedrockAgents={formData.bedrockAgents || []}
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
      )
    case 'mcp-servers':
      return (
        <div
          className="overflow-y-auto max-h-[900px] pb-4"
          onClick={formEventUtils.preventPropagation}
        >
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
      )
    case 'tools':
      return (
        <div className="overflow-y-auto max-h-[900px] pb-4">
          {isLoadingMcpTools ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full w-3/4 animate-pulse"></div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {t('MCPサーバーからツールを取得中...')}
              </p>
            </div>
          ) : (
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
              mcpServers={formData.mcpServers || []}
              tempMcpTools={tempMcpTools}
            />
          )}
        </div>
      )
    default:
      return null
  }
}
