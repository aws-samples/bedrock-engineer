import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaCheck } from 'react-icons/fa'
import { MdErrorOutline } from 'react-icons/md'
import { ToolResultHeaderProps } from './types'

export const ToolResultHeader: React.FC<ToolResultHeaderProps> = ({
  success,
  toolName,
  title,
  subtitle,
  error,
  icon,
  children
}) => {
  const { t } = useTranslation()

  if (!success) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <MdErrorOutline className="text-red-600 dark:text-red-400 text-xl flex-shrink-0" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">
              {t(`${toolName} Failed`)}
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {error || t('An error occurred while executing the tool')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        {icon || <FaCheck className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />}
        <div className="flex-1">
          <h3 className="text-green-800 dark:text-green-200 font-medium">{title}</h3>
          {subtitle && (
            <div className="text-green-700 dark:text-green-300 text-sm mt-1 font-mono truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children && <div className="text-green-700 dark:text-green-300 text-sm">{children}</div>}
    </div>
  )
}
