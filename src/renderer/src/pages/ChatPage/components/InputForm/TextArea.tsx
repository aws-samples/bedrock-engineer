import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import { FiLoader, FiSend, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ModelSelector } from '../ModelSelector'
import { ThinkingModeSelector } from '../ThinkingModeSelector'
import { InterleaveThinkingToggle } from '../InterleaveThinkingToggle'
import { PlanActToggle } from './PlanActToggle'
import { useSettings } from '@renderer/contexts/SettingsContext'

export type AttachedImage = {
  file: File
  preview: string
  base64: string
}

type TextAreaProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string, images: AttachedImage[]) => void
  disabled?: boolean
  isComposing: boolean
  setIsComposing: (value: boolean) => void
  sendMsgKey?: 'Enter' | 'Cmd+Enter'
  onHeightChange?: (height: number) => void
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isComposing,
  setIsComposing,
  sendMsgKey = 'Enter',
  onHeightChange
}) => {
  const { t } = useTranslation()
  const { planMode, setPlanMode } = useSettings()
  const [dragActive, setDragActive] = useState(false)
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])
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
  const placeholder = useMemo(() => {
    return t('textarea.placeholder', { modifier: modifierKey })
  }, [t, modifierKey])

  // グローバルなキーボードショートカットのイベントリスナーを設定
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+A (または Ctrl+Shift+A) でPlan/Actモードを切り替え
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setPlanMode(!planMode)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [planMode, setPlanMode, t])

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

  // No scroll position monitoring needed as we're keeping the border visible at all times

  const validateAndProcessImage = useCallback(
    (file: File) => {
      if (file.size > 3.75 * 1024 * 1024) {
        toast.error(t('textarea.imageValidation.tooLarge'))
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const img = new Image()
        img.onload = () => {
          if (img.width > 8000 || img.height > 8000) {
            toast.error(t('textarea.imageValidation.dimensionTooLarge'))
            return
          }
          setAttachedImages((prev) => [
            ...prev,
            {
              file,
              preview: base64,
              base64: base64.split(',')[1]
            }
          ])
        }
        img.src = base64
      }
      reader.readAsDataURL(file)
    },
    [t]
  )

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageItems = Array.from(items).filter((item) => item.type.indexOf('image') !== -1)

      if (imageItems.length === 0) return

      if (attachedImages.length + imageItems.length > 20) {
        toast.error(t('textarea.imageValidation.tooManyImages'))
        return
      }

      for (const item of imageItems) {
        const file = item.getAsFile()
        if (!file) continue

        const fileType = file.type.split('/')[1].toLowerCase()
        if (!['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(fileType)) {
          toast.error(t('textarea.imageValidation.unsupportedFormat', { format: fileType }))
          continue
        }

        validateAndProcessImage(file)
      }
    },
    [attachedImages.length, validateAndProcessImage, t]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Shift+A でPlan/Actモードを切り替え（テキストエリア内でも有効にする）
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      setPlanMode(!planMode)

      // モード切り替え通知
      const newMode = !planMode ? 'Plan' : 'Act'
      toast.success(t(`Switched to ${newMode} mode`), {
        duration: 2000,
        position: 'bottom-center',
        icon: '🔄'
      })
      return
    }

    // メッセージ送信のキー入力処理
    if (isComposing) {
      return
    }

    const cmdenter = e.key === 'Enter' && (e.metaKey || e.ctrlKey)
    const enter = e.key === 'Enter'

    if (
      (sendMsgKey === 'Enter' && enter && !e.shiftKey) ||
      (sendMsgKey === 'Cmd+Enter' && cmdenter)
    ) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (value.trim() === '') {
      toast.error(t('Enter at least one character of text'))
      return
    }
    if (value.trim() || attachedImages.length > 0) {
      onSubmit(value, attachedImages)
      setAttachedImages([])
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const allFiles = Array.from(e.dataTransfer.files)

      // 画像ファイルと非画像ファイルを分ける
      const imageFiles = allFiles.filter((file) => {
        const fileType = file.type.split('/')[0]
        return fileType === 'image'
      })

      const nonImageFiles = allFiles.filter((file) => {
        const fileType = file.type.split('/')[0]
        return fileType !== 'image'
      })

      // 画像ファイルを処理
      const validImageFiles = imageFiles.filter((file) => {
        const type = file.type.split('/')[1]?.toLowerCase()
        if (!type || !['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(type)) {
          toast.error(
            t('textarea.imageValidation.unsupportedFormat', { format: type || 'unknown' })
          )
          return false
        }
        return true
      })

      if (attachedImages.length + validImageFiles.length > 20) {
        toast.error(t('textarea.imageValidation.tooManyImages'))
        return
      }

      validImageFiles.forEach(validateAndProcessImage)

      // 非画像ファイルのパスをテキストエリアに追加
      if (nonImageFiles.length > 0) {
        const filePaths = nonImageFiles.map((file) => file.name).join('\n')

        // 現在のカーソル位置またはテキスト末尾に挿入
        if (textareaRef.current) {
          const cursorPos = textareaRef.current.selectionStart
          const currentValue = value
          const newValue =
            currentValue.substring(0, cursorPos) + filePaths + currentValue.substring(cursorPos)

          onChange(newValue)
        } else {
          // テキストエリア参照がない場合は末尾に追加
          onChange(value + (value ? '\n' : '') + filePaths)
        }
      }
    },
    [attachedImages.length, validateAndProcessImage, t, value, onChange]
  )

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="relative w-full">
      {attachedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.preview}
                alt={t('textarea.aria.removeImage')}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={t('textarea.aria.removeImage')}
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Container with border that wraps both textarea and controls */}
      <div
        className={`relative border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 ${
          dragActive ? 'border-blue-500' : ''
        }`}
        onDragEnter={handleDrag}
      >
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
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
            }}
            onKeyDown={(e) => !disabled && handleKeyDown(e)}
            onPaste={handlePaste}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            required
            rows={3}
            style={{ height: `${textareaHeight}px` }}
          />
        </div>

        {/* Controls at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-b-lg">
          <div className="flex items-center gap-2.5 z-10 pointer-events-auto">
            <div>
              <ModelSelector openable={true} />
            </div>
            <div>
              <ThinkingModeSelector />
            </div>
            <InterleaveThinkingToggle />
          </div>

          <div className="flex items-center gap-2">
            <div>
              <PlanActToggle />
            </div>
            <button
              onClick={handleSubmit}
              disabled={disabled}
              className={`rounded-lg ${
                disabled ? '' : 'hover:bg-gray-200'
              } px-2 py-2 dark:text-white dark:hover:bg-gray-700`}
              aria-label={disabled ? t('textarea.aria.sending') : t('textarea.aria.sendMessage')}
            >
              {disabled ? (
                <FiLoader className="text-xl animate-spin" />
              ) : (
                <FiSend className="text-xl" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
