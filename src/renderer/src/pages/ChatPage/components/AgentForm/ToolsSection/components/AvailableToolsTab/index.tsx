import React from 'react'
import { useTranslation } from 'react-i18next'
import { CategorySelector } from './CategorySelector'
import { ToolCategorySection } from './ToolCategorySection'
import { AvailableToolsTabProps } from '../../types'
import { preventEventPropagation } from '../../utils/eventUtils'

/**
 * 利用可能なツールタブコンポーネント
 */
export const AvailableToolsTab: React.FC<AvailableToolsTabProps> = ({
  categorizedTools,
  selectedCategory,
  mcpServers,
  onCategoryChange,
  onToggleTool,
  onShowToolInfo
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-3" onClick={preventEventPropagation}>
      <div className="flex items-center justify-end">
        <CategorySelector selectedCategory={selectedCategory} onChange={onCategoryChange} />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-1">{t('tools.description')}</p>

      {/* ツールカテゴリセクションをループで表示 */}
      {categorizedTools.map((category) => (
        <ToolCategorySection
          key={category.id}
          category={category}
          mcpServers={mcpServers}
          onToggleTool={onToggleTool}
          onShowToolInfo={onShowToolInfo}
        />
      ))}
    </div>
  )
}
