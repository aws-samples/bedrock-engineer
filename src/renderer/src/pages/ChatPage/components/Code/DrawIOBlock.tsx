import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  VscCode,
  VscEye,
  VscZoomIn,
  VscZoomOut,
  VscScreenFull,
  VscCloudDownload
} from 'react-icons/vsc'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { DrawIoEmbed, DrawIoEmbedRef } from 'react-drawio'
import { ResizableContainer } from './ResizableContainer'

type DrawIOBlockProps = {
  xml: string
  className?: string
}

export const DrawIOBlock: React.FC<DrawIOBlockProps> = ({ xml, className = '' }) => {
  const { t } = useTranslation()
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const drawioRef = useRef<DrawIoEmbedRef>(null)
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const toggleMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setZoomLevel(1)
  }

  const downloadAsPNG = async () => {
    try {
      if (drawioRef.current) {
        // DrawIOからダイアグラムを出力
        drawioRef.current.exportDiagram({
          format: 'png',
          scale: 3
        })
      }
    } catch (error) {
      console.error('Failed to download PNG:', error)
    }
  }

  // XMLが更新されたときにDrawIOを更新
  useEffect(() => {
    if (xml && drawioRef.current) {
      const timeoutId = setTimeout(async () => {
        try {
          if (drawioRef.current) {
            await drawioRef.current.load({ xml })
          }
        } catch (error) {
          console.error('Failed to load DrawIO XML:', error)
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
    // xmlがない場合は何もしない
    return undefined
  }, [xml])

  return (
    <div
      className={`my-4 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header with toggle buttons */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">DrawIO</span>
        <div className="flex items-center space-x-2">
          {/* Zoom controls and download button - only show in preview mode */}
          {isPreviewMode && (
            <>
              <button
                onClick={downloadAsPNG}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Download as PNG"
              >
                <VscCloudDownload size={14} />
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <VscZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <VscZoomIn size={14} />
              </button>
              <button
                onClick={resetZoom}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Reset Zoom"
              >
                <VscScreenFull size={14} />
              </button>
            </>
          )}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
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
      <ResizableContainer initialHeight={600} minHeight={200} maxHeight={800}>
        {/* Preview mode - always rendered but hidden when not in preview mode */}
        <div
          className={`h-full bg-white dark:bg-gray-900 overflow-hidden border-0 ${
            isPreviewMode ? 'block' : 'hidden'
          }`}
        >
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              minWidth: `${100 * zoomLevel}%`,
              minHeight: `${100 * zoomLevel}%`,
              width: '100%',
              height: '100%'
            }}
            className="transition-transform duration-200"
          >
            <DrawIoEmbed
              ref={drawioRef}
              xml={xml}
              configuration={{
                defaultLibraries: 'aws4;aws3;aws3d;general;flowchart;basic;arrows2',
                sidebarWidth: 0, // Hide sidebar in chat view
                toolbar: false, // Hide toolbar for cleaner view
                menubar: false, // Hide menubar
                editable: false // Make it read-only
              }}
              urlParameters={{
                dark: isDark,
                ui: 'min' // Minimal UI
              }}
            />
          </div>
        </div>

        {/* Source mode - always rendered but hidden when in preview mode */}
        <div
          className={`max-w-[88vw] h-full overflow-y-scroll bg-gray-50 dark:bg-gray-900 ${isPreviewMode ? 'hidden' : 'block'}`}
        >
          <SyntaxHighlighter
            language="xml"
            style={tomorrow}
            showLineNumbers
            wrapLines={false}
            className="!m-0 !bg-transparent h-full"
            customStyle={{
              background: 'transparent',
              padding: '1rem',
              height: '100%',
              width: '100%'
            }}
          >
            {xml}
          </SyntaxHighlighter>
        </div>
      </ResizableContainer>
    </div>
  )
}

export default DrawIOBlock
