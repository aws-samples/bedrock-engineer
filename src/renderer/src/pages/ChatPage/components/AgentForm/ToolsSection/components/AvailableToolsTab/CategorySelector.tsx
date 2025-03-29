import React from 'react'
import { useTranslation } from 'react-i18next'
import { CategorySelectorProps } from '../../types'

/**
 * ツールカテゴリ選択コンポーネント
 */
export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onChange
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-end">
      <div className="flex items-center">
        <label className="mr-2 text-sm text-gray-700 dark:text-gray-300">
          {t('tools.category')}:
        </label>
        <select
          value={selectedCategory}
          onChange={onChange}
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
  )
}
