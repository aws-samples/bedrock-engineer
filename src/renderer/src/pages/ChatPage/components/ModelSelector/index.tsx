import React, { useState, useRef, useEffect } from 'react'
import { LLM } from '@/types/llm'
import { LuBrainCircuit } from 'react-icons/lu'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { FiChevronDown } from 'react-icons/fi'
import NovaLogo from './nova-color.svg'
import ClaudeLogo from './claude-color.svg'
import DeepSeekLogo from './deepseek-color.svg'
import MetaLogo from './meta-color.svg'

type ModelSelectorProps = {
  openable: boolean
}

const MODEL_ICONS = {
  claude: <ClaudeLogo />,
  llama: <LuBrainCircuit className="size-4" />
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

  const getModelIcon = (modelId: string, isInferenceProfile?: boolean) => {
    // Show group icon for inference profiles
    if (isInferenceProfile) return <LuBrainCircuit className="size-4 text-blue-600" />

    if (modelId.includes('claude')) return MODEL_ICONS.claude
    if (modelId.includes('llama')) return MODEL_ICONS.llama
    if (modelId.includes('nova')) return <NovaLogo />
    if (modelId.includes('deepseek')) return <DeepSeekLogo />
    if (modelId.includes('meta')) return <MetaLogo />
    return <LuBrainCircuit />
  }

  const modelColors = {
    icon: 'text-gray-600 dark:text-gray-400',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-800'
  }

  return (
    <div className="justify-start flex items-center relative" ref={dropdownRef}>
      <div className="relative">
        {isOpen && (
          <div
            className="absolute z-20 w-[25rem] bottom-full mb-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700 py-2 px-2 max-h-[40vh] overflow-y-auto"
          >
            {availableModels.map((model: LLM) => {
              const isInferenceProfile = model.isInferenceProfile || false
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
                  title={
                    isInferenceProfile
                      ? `Application Inference Profile: ${model.inferenceProfileArn}`
                      : ''
                  }
                >
                  <div className={`rounded-md ${modelColors.icon}`}>
                    {getModelIcon(model.modelId, isInferenceProfile)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {model.modelName}
                      {isInferenceProfile && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          Profile
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {isInferenceProfile
                        ? model.description || 'Application Inference Profile for cost tracking'
                        : model.toolUse
                          ? 'Supports tool use'
                          : 'Does not support tool use'}
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
            <span className={modelColors.icon}>
              {getModelIcon(currentLLM.modelId, currentLLM.isInferenceProfile)}
            </span>
            <span className="text-left whitespace-nowrap">{currentLLM.modelName}</span>
            <FiChevronDown className="text-gray-400 dark:text-gray-500" size={16} />
          </span>
        </button>
      </div>
    </div>
  )
}
