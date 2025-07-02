import React from 'react'
import { useTranslation } from 'react-i18next'
import { FiSave } from 'react-icons/fi'
import { formEventUtils } from '../utils/formEventUtils'

/**
 * フォームアクションボタンコンポーネント
 */
export const FormActionButtons: React.FC<{
  onSubmit?: (e: React.FormEvent) => void
  onCancel: () => void
  isGenerating: boolean
}> = ({ onCancel, isGenerating }) => {
  const { t } = useTranslation()

  return (
    <div className="flex justify-end space-x-3" onClick={formEventUtils.preventPropagation}>
      <button
        type="button"
        onClick={formEventUtils.createSafeHandler(onCancel)}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400
          dark:focus:ring-offset-gray-900 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
      >
        {t('cancel')}
      </button>
      <button
        type="submit"
        onClick={(e) => {
          e.stopPropagation()
        }}
        disabled={isGenerating}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2
          focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900 transition-all duration-200
          ${
            isGenerating
              ? 'text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-70'
              : 'text-white bg-blue-600 dark:bg-blue-500 border-transparent hover:bg-blue-700 dark:hover:bg-blue-400 hover:shadow-md'
          }`}
      >
        {isGenerating ? (
          <>
            <svg
              className="w-4 h-4 mr-1 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p>{t('generating')}...</p>
          </>
        ) : (
          <>
            <FiSave />
            <p>{t('save')}</p>
          </>
        )}
      </button>
    </div>
  )
}
