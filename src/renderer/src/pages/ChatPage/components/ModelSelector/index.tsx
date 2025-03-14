import React, { useState, useRef, useEffect } from 'react'
import { LLM } from '@/types/llm'
import { LuBrainCircuit } from 'react-icons/lu'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { FiChevronDown } from 'react-icons/fi'

type ModelSelectorProps = {
  openable: boolean
}

const MODEL_ICONS = {
  claude: <LuBrainCircuit className="size-4" />,
  llama: <LuBrainCircuit className="size-4" />
} as const

const MODEL_COLORS = {
  claude: {
    icon: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/50'
  },
  llama: {
    icon: 'text-yellow-600 dark:text-yellow-400',
    hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/50'
  }
} as const

export const ModelSelector: React.FC<ModelSelectorProps> = ({ openable }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentLLM, updateLLM, availableModels } = useSettings()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('claude')) return MODEL_ICONS.claude
    if (modelId.includes('llama')) return MODEL_ICONS.llama
    return <LuBrainCircuit className="size-4" />
  }

  const getModelColor = (modelId: string) => {
    if (modelId.includes('claude')) return MODEL_COLORS.claude
    if (modelId.includes('llama')) return MODEL_COLORS.llama
    return {
      icon: 'text-gray-600 dark:text-gray-400',
      hover: 'hover:bg-gray-50 dark:hover:bg-gray-800'
    }
  }

  return (
    <div className="justify-start flex items-center relative" ref={dropdownRef}>
      <div className="relative">
        {isOpen && (
          <div
            className="absolute z-20 w-80 bottom-full mb-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700 py-2 px-2 max-h-[40vh] overflow-y-auto"
          >
            {availableModels.map((model: LLM) => {
              const modelColors = getModelColor(model.modelId)

              return (
                <div
                  key={model.modelId}
                  onClick={() => {
                    updateLLM(model)
                    setIsOpen(false)
                  }}
                  className={`
                    flex items-center gap-4 px-3 py-2.5 cursor-pointer
                    ${model.modelId === currentLLM.modelId ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}
                    ${modelColors.hover}
                    transition-colors rounded-md
                  `}
                >
                  <div className={`rounded-md ${modelColors.icon}`}>
                    {getModelIcon(model.modelId)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {model.modelName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {model.toolUse ? 'Supports tool use' : 'Does not support tool use'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => (openable ? setIsOpen(!isOpen) : undefined)}
          className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 rounded-md transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span className={getModelColor(currentLLM.modelId).icon}>
              {getModelIcon(currentLLM.modelId)}
            </span>
            <span className="text-left whitespace-nowrap">{currentLLM.modelName}</span>
            <FiChevronDown className="text-gray-400 dark:text-gray-500" size={16} />
          </span>
        </button>
      </div>
    </div>
  )
}
