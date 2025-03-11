import React, { useCallback, useState, useMemo } from 'react'
import { FiLoader, FiSend, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

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
  placeholder?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isComposing,
  setIsComposing,
  sendMsgKey = 'Enter',
  placeholder: customPlaceholder
}) => {
  const { t } = useTranslation()
  const [dragActive, setDragActive] = useState(false)
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([])

  // プラットフォームに応じた Modifire キーの表示を決定
  const modifierKey = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    return isMac ? '⌘' : 'Ctrl'
  }, [])

  // プレースホルダーテキストの生成
  const placeholder = useMemo(() => {
    return customPlaceholder || t('textarea.placeholder', { modifier: modifierKey })
  }, [t, modifierKey, customPlaceholder])

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
    if (e.shiftKey || isComposing) {
      return
    }

    const cmdenter = e.key === 'Enter' && (e.metaKey || e.ctrlKey)
    const enter = e.key === 'Enter'

    if ((sendMsgKey === 'Enter' && enter) || (sendMsgKey === 'Cmd+Enter' && cmdenter)) {
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

      const files = Array.from(e.dataTransfer.files).filter((file) => {
        const type = file.type.split('/')[1].toLowerCase()
        if (!['png', 'jpeg', 'jpg', 'gif', 'webp'].includes(type)) {
          toast.error(t('textarea.imageValidation.unsupportedFormat', { format: type }))
          return false
        }
        return true
      })

      if (attachedImages.length + files.length > 20) {
        toast.error(t('textarea.imageValidation.tooManyImages'))
        return
      }

      files.forEach(validateAndProcessImage)
    },
    [attachedImages.length, validateAndProcessImage, t]
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

      <div
        className={`relative ${dragActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
        onDragEnter={handleDrag}
      >
        <textarea
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          className={`block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:text-white dark:bg-gray-800 z-9 ${
            dragActive ? 'border-blue-500' : ''
          }`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => !disabled && handleKeyDown(e)}
          onPaste={handlePaste}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          required
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className={`absolute end-2.5 bottom-2.5 rounded-lg ${
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
  )
}
