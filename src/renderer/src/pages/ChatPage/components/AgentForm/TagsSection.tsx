import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions
} from '@headlessui/react'
import { FiChevronDown, FiX } from 'react-icons/fi'

interface TagsSectionProps {
  tags: string[]
  availableTags?: string[]
  onChange: (tags: string[]) => void
}

export const TagsSection: React.FC<TagsSectionProps> = ({ tags, availableTags = [], onChange }) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  // タグの正規化関数
  const normalizeTag = (tag: string) => tag.trim()

  // フィルタリングされたタグの候補
  const filteredTags = useMemo(() => {
    const normalizedQuery = normalizeTag(query)
    return availableTags.filter((tag) => {
      const normalizedTag = normalizeTag(tag)
      return (
        normalizedTag.includes(normalizedQuery) && !tags.map(normalizeTag).includes(normalizedTag)
      )
    })
  }, [query, availableTags, tags])

  const handleAddTag = (newTag: string) => {
    const normalizedNewTag = normalizeTag(newTag)
    if (normalizedNewTag && !tags.map(normalizeTag).includes(normalizedNewTag)) {
      onChange([...tags, normalizedNewTag])
      setQuery('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => normalizeTag(tag) !== normalizeTag(tagToRemove)))
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags {t('optional')}
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('tagsDescription')}</p>

      {/* 登録済みタグの表示 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 inline-flex items-center p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800
                rounded-full"
            >
              <span className="sr-only">{t('remove')}</span>
              <FiX className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Comboboxを使用したタグ入力 */}
      <Combobox value={query} onChange={handleAddTag}>
        <div className="relative">
          <div className="flex">
            <ComboboxInput
              className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600
                shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                dark:bg-gray-800 dark:text-gray-200"
              placeholder={t('enterTag')}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  e.preventDefault()
                  handleAddTag(query)
                }
              }}
            />
            <ComboboxButton
              className="ml-2 inline-flex items-center px-3 py-2 border
              border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm
              text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
              hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FiChevronDown className="h-4 w-4" />
            </ComboboxButton>
          </div>

          <ComboboxOptions
            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800
            shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5
            overflow-auto focus:outline-none sm:text-sm"
          >
            {filteredTags.map((tag) => (
              <ComboboxOption
                key={tag}
                value={tag}
                className={({ active }) =>
                  `cursor-default select-none relative py-2 pl-3 pr-9 ${
                    active
                      ? 'text-white bg-blue-600 dark:bg-blue-700'
                      : 'text-gray-900 dark:text-gray-200'
                  }`
                }
              >
                {tag}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  )
}
