import React from 'react'
import { useTranslation } from 'react-i18next'

interface AgentMetadataProps {
  author?: string
  tags?: string[]
}

export const AgentMetadata: React.FC<AgentMetadataProps> = ({ author, tags }) => {
  const { t } = useTranslation()

  if (!author && (!tags || tags.length === 0)) {
    return null
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
      {author && (
        <div className="mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
            {t('authorLabel')}
          </span>
          <div
            className="flex items-center cursor-pointer"
            onClick={() => open(`https://github.com/${author}`)}
          >
            <img
              src={`https://github.com/${author}.png`}
              alt={`${author} avatar`}
              className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 border border-gray-200 dark:border-gray-700"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const sibling = e.currentTarget.nextElementSibling
                if (sibling && sibling instanceof HTMLElement) {
                  sibling.style.display = 'flex'
                }
              }}
            />
            <div
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2"
              style={{ display: 'none' }}
            >
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {author.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="dark:text-white">{author}</span>
          </div>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">Tags</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
