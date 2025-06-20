import React from 'react'
import useSetting from '@renderer/hooks/useSetting'
import { AgentFormProps } from './types'
import { useAgentForm } from './useAgentForm'
import { formEventUtils } from './utils/formEventUtils'
import { useAgentFilter } from '../AgentList'

// 分割されたコンポーネントのインポート
import { AgentFormSidebar } from './components/AgentFormSidebar'
import { AgentFormContent } from './components/AgentFormContent'
import { FormActionButtons } from './components/FormActionButtons'

/**
 * エージェント作成・編集フォームコンポーネント
 * サイドバー形式のレイアウトに変更し、階層をより明確に表示
 */
export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel }) => {
  const { projectPath, agents } = useSetting()
  const { availableTags } = useAgentFilter(agents)

  // フォーム状態管理フック
  const {
    formData,
    activeTab,
    agentTools,
    agentCategory,
    isLoadingMcpTools,
    tempMcpTools,
    generateSystemPrompt,
    generateVoiceChatPrompt,
    generateScenarios,
    isGeneratingSystem,
    isGeneratingVoiceChat,
    isGeneratingScenarios,
    updateField,
    handleSubmit,
    handleToolsChange,
    handleCategoryChange,
    handleTabChange,
    fetchMcpTools
  } = useAgentForm(agent, onSave)

  const handleAdditionalInstructionChange = React.useCallback(
    (value: string) => updateField('additionalInstruction', value),
    [updateField]
  )

  // 合成された生成状態
  const isGenerating = isGeneratingSystem || isGeneratingVoiceChat || isGeneratingScenarios

  return (
    <div>
      <form
        onSubmit={formEventUtils.createSubmitHandler(handleSubmit)}
        className="flex flex-col h-full"
        style={{ height: '100%', maxHeight: '100%', display: 'flex' }}
        onClick={formEventUtils.preventPropagation}
      >
        {/* スクロール可能なメインコンテンツエリア */}
        <div className="flex flex-1 min-h-0">
          {/* 左側のサイドバーナビゲーション - 画面幅に応じて幅を変更 */}
          <div className="lg:w-64 w-16 border-r border-gray-200 dark:border-gray-700/50 flex-shrink-0 overflow-y-auto transition-all duration-300">
            <AgentFormSidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onToolsTabClick={() => fetchMcpTools(formData.mcpServers)}
            />
          </div>

          {/* 右側のコンテンツエリア - スクロール可能なコンテンツ */}
          <div className="flex-1 overflow-y-auto p-6 pb-16 bg-white dark:bg-gray-900">
            {/* タブコンテンツ */}
            <AgentFormContent
              activeTab={activeTab}
              formData={formData}
              agentTools={agentTools}
              agentCategory={agentCategory}
              updateField={updateField}
              handleToolsChange={handleToolsChange}
              handleCategoryChange={handleCategoryChange}
              projectPath={projectPath}
              isLoadingMcpTools={isLoadingMcpTools}
              tempMcpTools={tempMcpTools}
              handleAutoGeneratePrompt={generateSystemPrompt}
              handleVoiceChatGenerate={generateVoiceChatPrompt}
              handleGenerateScenarios={generateScenarios}
              isGeneratingSystem={isGeneratingSystem}
              isGeneratingVoiceChat={isGeneratingVoiceChat}
              isGeneratingScenarios={isGeneratingScenarios}
              availableTags={availableTags}
              fetchMcpTools={fetchMcpTools}
              handleAdditionalInstructionChange={handleAdditionalInstructionChange}
            />
          </div>
        </div>

        {/* フッター固定部分 - 常に画面下部に表示 */}
        <div className="flex-shrink-0 px-6 py-4 sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
          <FormActionButtons onCancel={onCancel} isGenerating={isGenerating} />
        </div>
      </form>
    </div>
  )
}
