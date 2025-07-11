import React, { useState } from 'react'
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'
import { formatProjectPath } from '../utils/pathUtils'

interface ProjectPathDisplayProps {
  path: string
  variant: 'card' | 'table'
  className?: string
  showCopyButton?: boolean
}

export const ProjectPathDisplay: React.FC<ProjectPathDisplayProps> = ({
  path,
  variant,
  className = '',
  showCopyButton = true
}) => {
  const [copied, setCopied] = useState(false)
  const { displayPath, fullPath, needsTruncation } = formatProjectPath(path, variant)

  if (!path) {
    return null
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await navigator.clipboard.writeText(fullPath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy path:', error)
    }
  }

  const baseClasses =
    variant === 'card'
      ? 'text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded'
      : 'text-xs text-blue-600 dark:text-blue-400'

  if (!showCopyButton || !needsTruncation) {
    return (
      <span
        className={`${baseClasses} truncate ${className}`}
        title={needsTruncation ? fullPath : undefined}
      >
        {displayPath}
      </span>
    )
  }

  return (
    <div className={`group flex items-center space-x-1 ${className}`}>
      <span className={`${baseClasses} truncate flex-1 min-w-0`} title={fullPath}>
        {displayPath}
      </span>
      {needsTruncation && showCopyButton && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
          title={copied ? 'コピーしました！' : 'パスをコピー'}
        >
          {copied ? (
            <CheckIcon className="h-3 w-3 text-green-600" />
          ) : (
            <ClipboardIcon className="h-3 w-3 text-gray-500 hover:text-blue-600" />
          )}
        </button>
      )}
    </div>
  )
}
