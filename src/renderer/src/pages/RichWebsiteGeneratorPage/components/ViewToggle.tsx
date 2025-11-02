import React from 'react'
import { Tooltip } from 'flowbite-react'
import { FiCode, FiEye, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi'
import { DownloadButton } from './DownloadButton'
import { SandpackFiles } from '@codesandbox/sandpack-react'

type View = 'code' | 'preview'

interface ViewToggleProps {
  activeView: View
  onViewChange: (view: View) => void
  isChatPanelVisible: boolean
  onToggleChatPanel: () => void
  files: SandpackFiles
  loading?: boolean
}

const activeStyle = 'bg-white dark:bg-gray-700 shadow-sm text-gray-700 dark:text-gray-300'
const deActiveStyle =
  'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'

export const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
  isChatPanelVisible,
  onToggleChatPanel,
  files,
  loading = false
}) => {
  return (
    <div className="inline-flex gap-2 w-full justify-between">
      <div className="inline-flex gap-2">
        {/* Chat Panel Toggle Button */}
        <Tooltip content={isChatPanelVisible ? 'Hide Chat Panel' : 'Show Chat Panel'}>
          <button
            onClick={onToggleChatPanel}
            className={`p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 transition-all ${deActiveStyle}`}
            aria-label="Toggle Chat Panel"
            aria-expanded={isChatPanelVisible}
          >
            {isChatPanelVisible ? <FiChevronsLeft size={15} /> : <FiChevronsRight size={15} />}
          </button>
        </Tooltip>

        {/* View Toggle Buttons */}
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
      </div>

      {/* Download Button */}
      <DownloadButton files={files} disabled={loading} />
    </div>
  )
}
