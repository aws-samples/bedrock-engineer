import React from 'react'
import { ChevronDownIcon, ChevronUpIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { StatusBadge } from '../atoms/StatusBadge'

interface TaskExpandedDetailsProps {
  isExpanded: boolean
  onToggleExpanded: () => void
  wakeWord: string
  continueSession?: boolean
  continueSessionPrompt?: string
  createdAt?: number
  formatDate: (timestamp?: number) => string
  // i18n labels
  detailsLabel: string
  continuationLabel: string
  wakeWordLabel: string
  continuationPromptLabel: string
  createdLabel: string
}

export const TaskExpandedDetails: React.FC<TaskExpandedDetailsProps> = ({
  isExpanded,
  onToggleExpanded,
  wakeWord,
  continueSession,
  continueSessionPrompt,
  createdAt,
  formatDate,
  detailsLabel,
  continuationLabel,
  wakeWordLabel,
  continuationPromptLabel,
  createdLabel
}) => {
  return (
    <div className="mb-3">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleExpanded}
          className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
        >
          <span>{detailsLabel}</span>
          {isExpanded ? (
            <ChevronUpIcon className="h-3 w-3" />
          ) : (
            <ChevronDownIcon className="h-3 w-3" />
          )}
        </button>
        {continueSession && <StatusBadge type="info">{continuationLabel}</StatusBadge>}
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Wake Word */}
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {wakeWordLabel}:
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 text-xs text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
              {wakeWord}
            </div>
          </div>

          {/* Session Continuation */}
          {continueSession && continueSessionPrompt && (
            <div>
              <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                {continuationPromptLabel}:
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-2 text-xs text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
                {continueSessionPrompt}
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <CalendarIcon className="h-3 w-3" />
            <span>
              {createdLabel}: {formatDate(createdAt)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
