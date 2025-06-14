import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IoIosClose } from 'react-icons/io'
import { HiOutlineCamera } from 'react-icons/hi'
import LocalImage from '@renderer/components/LocalImage'
import { useTranslation } from 'react-i18next'

export interface CameraCaptureResponse {
  success: boolean
  name: string
  message: string
  result: {
    filePath: string
    metadata: {
      width: number
      height: number
      format: string
      fileSize: number
      timestamp: string
      deviceId: string
      deviceName: string
    }
    recognition?: {
      content: string
      modelId: string
      prompt?: string
    }
  }
}

export const CameraCaptureResult: React.FC<{ response: CameraCaptureResponse }> = ({
  response
}) => {
  const { t } = useTranslation()
  const { result } = response
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle Esc key to close fullscreen
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.keyCode === 27) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  // Format file size in appropriate units
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  return (
    <div className="w-full">
      <div className="bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-700 dark:border-gray-800">
        {/* Header section with title and metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 pb-2 border-b border-gray-700 dark:border-gray-600">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <HiOutlineCamera className="w-5 h-5 text-blue-400" />
            {t('Camera Capture')}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="text-blue-400" title={`Device ID: ${result.metadata.deviceId}`}>
              {result.metadata.deviceName}
            </span>
            <span>
              {result.metadata.width} × {result.metadata.height}
            </span>
            <span>{formatFileSize(result.metadata.fileSize)}</span>
            <span>{result.metadata.format.toUpperCase()}</span>
            <span>{formatTimestamp(result.metadata.timestamp)}</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col md:flex-row gap-4 p-4 pt-2">
          {/* Left side: Image display */}
          <div className="flex-shrink-0 md:w-2/5">
            <div
              onClick={() => setIsFullscreen(true)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <LocalImage
                src={result.filePath}
                alt="Camera capture"
                className="aspect-auto max-h-[40vh] object-contain w-full rounded"
              />
            </div>
            <div className="mt-2 text-xs text-gray-400 truncate" title={result.filePath}>
              {result.filePath}
            </div>

            {/* Camera device info */}
            <div className="mt-2 text-xs text-gray-400">
              <span className="text-blue-400">{t('Camera Device')}:</span>{' '}
              {result.metadata.deviceName}
              {result.metadata.deviceId !== 'default' && (
                <span className="opacity-70 ml-1">({result.metadata.deviceId})</span>
              )}
            </div>

            {/* Analysis prompt under image */}
            {result.recognition?.prompt && (
              <div className="mt-3">
                <button
                  onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 mb-2 transition-colors"
                >
                  <span
                    className={`transform transition-transform ${isPromptExpanded ? 'rotate-90' : ''}`}
                  >
                    ▶
                  </span>
                  {t('Analysis Prompt')}
                </button>
                {isPromptExpanded && (
                  <div className="bg-blue-900/30 text-blue-300 p-2 rounded-md text-sm">
                    {result.recognition.prompt}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Analysis results */}
          {result.recognition && (
            <div className="flex-1 flex flex-col h-[40vh]">
              <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded-md flex-1 overflow-y-auto">
                <p className="text-gray-300 whitespace-pre-wrap text-sm">
                  {result.recognition.content}
                </p>
              </div>

              <div className="text-xs text-gray-400 mt-3">
                {t('Analyzed with')}:{' '}
                <span className="font-mono">{result.recognition.modelId}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-75"
            style={{ zIndex: 2147483647 }}
            onClick={() => setIsFullscreen(false)}
          >
            {/* Close button */}
            <div
              className="absolute top-4 right-4 p-2"
              style={{ zIndex: 2147483647 }}
              onClick={() => setIsFullscreen(false)}
            >
              <IoIosClose className="text-white w-8 h-8 hover:bg-gray-700 rounded cursor-pointer" />
            </div>

            {/* Image content */}
            <div
              className="w-full h-full flex items-center justify-center p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <LocalImage
                src={result.filePath}
                alt="Camera capture"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
