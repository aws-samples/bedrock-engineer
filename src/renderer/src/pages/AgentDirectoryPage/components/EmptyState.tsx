import React from 'react'
import { useTranslation } from 'react-i18next'
import { TbSearchOff } from 'react-icons/tb'

export const EmptyState: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)]">
      <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-full shadow-sm">
        <TbSearchOff className="w-16 h-16 text-blue-400 dark:text-blue-500" />
      </div>
      <p className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('noAgentsFound')}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        {t('tryDifferentSearch')}
      </p>
    </div>
  )
}
