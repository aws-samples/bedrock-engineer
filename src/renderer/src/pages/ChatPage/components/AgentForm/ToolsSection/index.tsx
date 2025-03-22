import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentCategory, ToolState } from '@/types/agent-chat'
import useSetting from '@renderer/hooks/useSetting'
import { ToggleSwitch } from 'flowbite-react'
import { toolIcons } from '../../../components/Tool/ToolIcons'
import { ToolName } from '@/types/tools'

// ツールをカテゴリ分けするための定義
interface ToolCategory {
  id: string
  name: string
  description: string
  tools: string[]
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'file-system',
    name: 'File System',
    description: 'Tools for managing files and directories',
    tools: [
      'createFolder',
      'writeToFile',
      'readFiles',
      'listFiles',
      'moveFile',
      'copyFile',
      'applyDiffEdit'
    ]
  },
  {
    id: 'web-interaction',
    name: 'Web & Search',
    description: 'Tools for interacting with web resources',
    tools: ['tavilySearch', 'fetchWebsite']
  },
  {
    id: 'ai-services',
    name: 'AI Services',
    description: 'Tools that utilize AWS AI services',
    tools: ['generateImage', 'retrieve', 'invokeBedrockAgent']
  },
  {
    id: 'system',
    name: 'System',
    description: 'Tools for system interaction',
    tools: ['executeCommand']
  }
]

type ToolsSectionProps = {
  agentId?: string
  tools: ToolState[]
  onChange: (tools: ToolState[]) => void
  agentCategory?: AgentCategory
  onCategoryChange?: (category: AgentCategory) => void
}

export const ToolsSection: React.FC<ToolsSectionProps> = ({
  tools: initialTools,
  onChange,
  agentCategory: initialCategory = 'general',
  onCategoryChange
}) => {
  const { t } = useTranslation()
  const { getDefaultToolsForCategory } = useSetting()
  const [agentTools, setAgentTools] = useState<ToolState[]>(initialTools || [])
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)

  // initialTools が変更されたら同期
  useEffect(() => {
    if (initialTools?.length > 0) {
      setAgentTools(initialTools)
    }
  }, [initialTools])

  // ツール設定変更のハンドラ
  const handleToggleTool = (toolName: string) => {
    const updatedTools = agentTools.map((tool) => {
      if (tool.toolSpec?.name === toolName) {
        return { ...tool, enabled: !tool.enabled }
      }
      return tool
    })
    setAgentTools(updatedTools)
    onChange(updatedTools)
  }

  // カテゴリー選択のハンドラ
  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = event.target.value
    setSelectedCategory(newCategory)

    // カテゴリーに基づいたデフォルトツール設定をロード
    const defaultTools = getDefaultToolsForCategory(newCategory)
    setAgentTools(defaultTools)
    onChange(defaultTools)

    // 親コンポーネントのカテゴリ変更ハンドラがあれば呼び出す
    if (onCategoryChange && newCategory) {
      onCategoryChange(newCategory as AgentCategory)
    }
  }

  // 各カテゴリのツールを取得する
  const getToolsByCategory = () => {
    const toolsByCategory = TOOL_CATEGORIES.map((category) => {
      const toolsInCategory =
        agentTools?.filter(
          (tool) => tool.toolSpec?.name && category.tools.includes(tool.toolSpec.name)
        ) || []

      return {
        ...category,
        toolsData: toolsInCategory
      }
    })

    return toolsByCategory
  }

  const categorizedTools = getToolsByCategory()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-shrink-0">
            Agent Tools
          </label>
        </div>

        {/* カテゴリー選択 */}
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-700 dark:text-gray-300">
            {t('tools.category')}:
          </label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          >
            <option value="general">{t('Tool Categories.General Purpose')}</option>
            <option value="coding">{t('Tool Categories.Software Development')}</option>
            <option value="design">{t('Tool Categories.Design & Creative')}</option>
            <option value="data">{t('Tool Categories.Data Analysis')}</option>
            <option value="business">{t('Tool Categories.Business & Productivity')}</option>
            <option value="custom">{t('Tool Categories.Custom Configuration')}</option>
            <option value="all">{t('Tool Categories.All Configuration')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-1">
          {t('tools.description')}
        </p>

        {/* ツールリスト */}
        {categorizedTools.map((category) => (
          <div key={category.id} className="mb-4">
            {/* カテゴリヘッダー */}
            <div className="p-3 bg-blue-50 dark:bg-blue-800 font-medium sticky top-0 z-10 rounded-t-md">
              <div className="text-sm text-gray-800 dark:text-gray-200">
                {t(`Tool Categories.${category.name}`)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t(`Tool Categories.${category.name} Description`)}
              </div>
            </div>

            {/* ツールリスト */}
            {category.toolsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-3">
                {category.toolsData.map((tool) => {
                  const toolName = tool.toolSpec?.name
                  if (!toolName) return null

                  return (
                    <div
                      key={toolName}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-500 dark:text-gray-400 flex-shrink-0 w-7 h-7 flex items-center justify-center">
                          {toolIcons[toolName as ToolName]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{toolName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t(`tool descriptions.${toolName}`)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ToggleSwitch
                          checked={tool.enabled}
                          onChange={() => handleToggleTool(toolName)}
                          label=""
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t('No tools in this category')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ToolsSection
