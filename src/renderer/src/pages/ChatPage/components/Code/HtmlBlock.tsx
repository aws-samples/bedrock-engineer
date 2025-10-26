import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VscCode, VscEye } from 'react-icons/vsc'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ResizableContainer } from './ResizableContainer'

type HtmlBlockProps = {
  code: string
  className?: string
}

export const HtmlBlock: React.FC<HtmlBlockProps> = ({ code, className = '' }) => {
  const { t } = useTranslation()
  const [isPreviewMode, setIsPreviewMode] = useState(true)

  const toggleMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  return (
    <div
      className={`my-4 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header with toggle buttons */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HTML</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMode}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              !isPreviewMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <VscCode size={12} />
            <span>{t('Source')}</span>
          </button>
          <button
            onClick={toggleMode}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              isPreviewMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <VscEye size={12} />
            <span>{t('Preview')}</span>
          </button>
        </div>
      </div>

      {/* Resizable Content area */}
      <ResizableContainer initialHeight={800} minHeight={200} maxHeight={1800}>
        {isPreviewMode ? (
          <div className="h-full bg-white dark:bg-gray-900 relative">
            <iframe
              srcDoc={code}
              className="w-full h-full border-0"
              style={{ zIndex: 1 }}
              title="HTML Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-auto">
            <SyntaxHighlighter
              language="html"
              style={tomorrow}
              showLineNumbers
              wrapLines
              className="!m-0 !bg-transparent h-full"
              customStyle={{
                background: 'transparent',
                padding: '1rem',
                height: '100%'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        )}
      </ResizableContainer>
    </div>
  )
}

export default HtmlBlock
