import React from 'react'
import { XCircleIcon } from '@heroicons/react/24/outline'

interface TaskErrorDisplayProps {
  error: string
  errorTitle: string
}

export const TaskErrorDisplay: React.FC<TaskErrorDisplayProps> = ({ error, errorTitle }) => {
  return (
    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <div className="flex items-start space-x-2">
        <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-medium text-red-800 dark:text-red-200">{errorTitle}:</div>
          <div className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</div>
        </div>
      </div>
    </div>
  )
}
