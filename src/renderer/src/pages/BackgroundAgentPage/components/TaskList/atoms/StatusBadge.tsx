import React from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'

interface StatusBadgeProps {
  type: 'error' | 'success' | 'warning' | 'info'
  children: React.ReactNode
  icon?: React.ReactNode
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, children, icon }) => {
  const getTypeClasses = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const defaultIcon = type === 'error' ? <XCircleIcon className="h-3 w-3 mr-1" /> : null

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeClasses()}`}
    >
      {icon || defaultIcon}
      {children}
    </span>
  )
}
