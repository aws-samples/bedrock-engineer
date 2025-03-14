import React, { useState, useRef, useEffect } from 'react'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { ThinkingModeBudget } from '@/types/llm'
import { LuBrain } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { FiChevronDown } from 'react-icons/fi'

type ThinkingModeSelectorProps = {
  className?: string
}

export const ThinkingModeSelector: React.FC<ThinkingModeSelectorProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentLLM, thinkingMode, updateThinkingMode } = useSettings()
  const { t } = useTranslation()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Only show for Claude 3.7 Sonnet
  if (!currentLLM.supportsThinking) {
    return null
  }

  const options = [
    { label: t('thinkingMode.none'), value: ThinkingModeBudget.NONE },
    { label: t('thinkingMode.quick'), value: ThinkingModeBudget.QUICK },
    { label: t('thinkingMode.normal'), value: ThinkingModeBudget.NORMAL },
    { label: t('thinkingMode.deep'), value: ThinkingModeBudget.DEEP },
    { label: t('thinkingMode.deeper'), value: ThinkingModeBudget.DEEPER }
  ]

  const getSelectedLabel = () => {
    const selected = options.find((option) => option.value === thinkingMode?.budget_tokens)
    return selected ? selected.label : options[0].label
  }

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 rounded-md transition-colors"
        title={t('thinkingMode.title')}
      >
        <LuBrain className="size-4 text-purple-600 dark:text-purple-400" />
        <span className="whitespace-nowrap">{getSelectedLabel()}</span>
        <FiChevronDown className="text-gray-400 dark:text-gray-500" size={16} />
      </button>

      {isOpen && (
        <div
          className="absolute z-20 w-72 bottom-full mb-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg
          border border-gray-200 dark:border-gray-700 py-1"
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                updateThinkingMode({
                  type: option.value === 0 ? 'disabled' : 'enabled',
                  budget_tokens: option.value
                })
                setIsOpen(false)
              }}
              className={`
                flex items-center gap-3 px-3 py-2 cursor-pointer
                ${thinkingMode?.budget_tokens === option.value ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors
              `}
            >
              <span className="text-sm whitespace-nowrap">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
