import React from 'react'
import { useTranslation } from 'react-i18next'

interface TagFilterProps {
  tags: string[]
  selectedTags: string[]
  onSelectTag: (tag: string) => void
}

export const TagFilter: React.FC<TagFilterProps> = ({ tags, selectedTags, onSelectTag }) => {
  const { t } = useTranslation()

  if (tags.length === 0) {
    return null
  }

  return (
    <div className="flex overflow-x-auto gap-2 mb-4 pb-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(tag)}
          className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            selectedTags.includes(tag)
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {tag}
        </button>
      ))}
      {selectedTags.length > 0 && (
        <button
          onClick={() => {
            // Clear all tags by clicking each selected tag again
            selectedTags.forEach((tag) => onSelectTag(tag))
          }}
          className="sticky right-0 px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40 whitespace-nowrap shadow-[-8px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[-8px_0_8px_-4px_rgba(0,0,0,0.3)]"
        >
          {t('clearAll')}
        </button>
      )}
    </div>
  )
}
