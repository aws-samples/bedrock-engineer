import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FiLoader, FiSend } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

type BackgroundAgentTextAreaProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  disabled?: boolean
  placeholder?: string
  onHeightChange?: (height: number) => void
}

export const BackgroundAgentTextArea: React.FC<BackgroundAgentTextAreaProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder,
  onHeightChange
}) => {
  const { t } = useTranslation()
  const [isComposing, setIsComposing] = useState(false)
  const [isManuallyResized, setIsManuallyResized] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState<number>(72) // Initial height for 3 lines (24px * 3)
  const [isHovering, setIsHovering] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // プラットフォームに応じた Modifire キーの表示を決定
  const modifierKey = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    return isMac ? '⌘' : 'Ctrl'
  }, [])

  // プレースホルダーテキストの生成
  const placeholderText = useMemo(() => {
    if (placeholder) return placeholder
    return t('backgroundAgent.history.enterMessage', { modifier: modifierKey })
  }, [t, modifierKey, placeholder])

  // テキストエリアの高さを自動調整する（10行まで）
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleMouseDown = (e: MouseEvent) => {
      // Detect mouse down on the resize handle
      const { clientX, clientY } = e
      const { bottom, right } = textarea.getBoundingClientRect()
      const resizeHandleSize = 16 // Size of the resize handle (pixels)

      // Check if the mouse is in the bottom-right corner of the textarea (resize handle)
      if (
        clientX > right - resizeHandleSize &&
        clientX < right &&
        clientY > bottom - resizeHandleSize &&
        clientY < bottom
      ) {
        const handleMouseUp = () => {
          setIsManuallyResized(true)
          document.removeEventListener('mouseup', handleMouseUp)
        }
        document.addEventListener('mouseup', handleMouseUp)
      }
    }

    textarea.addEventListener('mousedown', handleMouseDown)
    return () => {
      textarea.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Automatically adjust textarea height (only if not manually resized by user)
  useEffect(() => {
    if (textareaRef.current && !isManuallyResized) {
      // Resize to the scroll height (minimum 3 lines, maximum 10 lines)
      textareaRef.current.style.height = 'auto'
      const lineHeight = 24 // Approximately 24px per line
      const minHeight = 3 * lineHeight // Height for 3 lines
      const maxHeight = 10 * lineHeight // Height for 10 lines (will scroll beyond this)
      const scrollHeight = textareaRef.current.scrollHeight

      // Limit height and change overflow settings if exceeding 10 lines
      let newHeight: number
      if (scrollHeight > maxHeight) {
        newHeight = maxHeight
        textareaRef.current.style.height = `${newHeight}px`
        textareaRef.current.style.overflowY = 'auto' // Show scrollbar
      } else {
        newHeight = Math.max(minHeight, scrollHeight)
        textareaRef.current.style.height = `${newHeight}px`
        textareaRef.current.style.overflowY = 'hidden' // Hide scrollbar
      }

      // Update height state and notify parent
      setTextareaHeight(newHeight)
      if (onHeightChange) {
        onHeightChange(newHeight)
      }
    }
  }, [value, isManuallyResized, onHeightChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // メッセージ送信のキー入力処理
    if (isComposing) {
      return
    }

    const cmdenter = e.key === 'Enter' && (e.metaKey || e.ctrlKey)
    const enter = e.key === 'Enter'

    // Enterで送信、Shift+Enterで改行
    if (enter && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (cmdenter) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (value.trim() === '') {
      toast.error(t('Enter at least one character of text'))
      return
    }
    if (value.trim()) {
      onSubmit(value)
    }
  }

  return (
    <div className="relative w-full">
      {/* Container with border that wraps both textarea and controls */}
      <div className="relative border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="relative textarea-container">
          {/* Resize bar at the top */}
          <div
            className={`resize-bar h-2 w-full cursor-ns-resize rounded-t-lg transition-opacity duration-200 ${
              isHovering
                ? 'opacity-100 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                : 'opacity-0'
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={(e) => {
              e.preventDefault()

              // Record initial position
              const startY = e.clientY
              // Get the actual height of the textarea from the DOM element (not from state)
              const startHeight = textareaRef.current
                ? textareaRef.current.clientHeight
                : textareaHeight

              // Track mouse movement
              const handleMouseMove = (moveEvent: MouseEvent) => {
                // Calculate movement distance (moving up increases height, moving down decreases height)
                const deltaY = startY - moveEvent.clientY
                // Change directly from current height (with min and max constraints)
                const newHeight = Math.max(72, Math.min(500, startHeight + deltaY))

                if (textareaRef.current) {
                  setTextareaHeight(newHeight)
                  textareaRef.current.style.height = `${newHeight}px`
                  setIsManuallyResized(true)

                  // Notify parent of height change
                  if (onHeightChange) {
                    onHeightChange(newHeight)
                  }
                }
              }

              // Handler for when the mouse button is released
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
              }

              // Add event listeners
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          />

          {/* Textarea without border */}
          <textarea
            ref={textareaRef}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            className="block w-full p-4 pb-16 text-sm text-gray-900 border-none bg-transparent dark:text-white resize-none focus:outline-none focus:ring-0"
            placeholder={placeholderText}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            onKeyDown={(e) => !disabled && handleKeyDown(e)}
            required
            rows={3}
            style={{ height: `${textareaHeight}px` }}
            disabled={disabled}
          />
        </div>

        {/* Controls at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end px-4 py-2 bg-white dark:bg-gray-800 rounded-b-lg">
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className={`rounded-lg px-3 py-2 flex items-center space-x-2 transition-colors ${
              disabled || !value.trim()
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
            }`}
            aria-label={disabled ? t('textarea.aria.sending') : t('textarea.aria.sendMessage')}
          >
            {disabled ? (
              <>
                <FiLoader className="text-lg animate-spin" />
                <span className="text-sm font-medium">{t('Sending...')}</span>
              </>
            ) : (
              <>
                <FiSend className="text-lg" />
                <span className="text-sm font-medium">{t('Send')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{t('backgroundAgent.history.sendInstruction')}</span>
      </div>
    </div>
  )
}
