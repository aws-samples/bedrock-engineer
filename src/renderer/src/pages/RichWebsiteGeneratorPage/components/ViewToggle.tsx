import React from 'react'
import { Tooltip } from 'flowbite-react'
import { FiCode, FiEye } from 'react-icons/fi'

type View = 'code' | 'preview'

interface ViewToggleProps {
  activeView: View
  onViewChange: (view: View) => void
}

const activeStyle = 'bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-300'
const deActiveStyle =
  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'

export const ViewToggle: React.FC<ViewToggleProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800">
      <Tooltip content="Preview">
        <button
          onClick={() => onViewChange('preview')}
          className={`p-1.5 rounded-lg border-r border-gray-200 dark:border-gray-600 transition-all ${
            activeView === 'preview' ? activeStyle : deActiveStyle
          }`}
          aria-label="Preview"
          aria-pressed={activeView === 'preview'}
        >
          <FiEye size={15} />
        </button>
      </Tooltip>
      <Tooltip content="Code">
        <button
          onClick={() => onViewChange('code')}
          className={`p-1.5 rounded-lg transition-all ${
            activeView === 'code' ? activeStyle : deActiveStyle
          }`}
          aria-label="Code"
          aria-pressed={activeView === 'code'}
        >
          <FiCode size={15} />
        </button>
      </Tooltip>
    </div>
  )
}
