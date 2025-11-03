import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'flowbite-react'
import { useSettings } from '@renderer/contexts/SettingsContext'

type PlanActToggleProps = {
  className?: string
}

const planModeStyle = 'bg-yellow-300 text-gray-700'
const actModeStyle =
  'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 bg-[length:200%_100%] animate-gradient-x text-white'
const unselectedStyle = 'bg-gray-50 dark:bg-gray-800 text-gray-300 hover:text-gray-400'

export const PlanActToggle: React.FC<PlanActToggleProps> = ({ className = '' }) => {
  const { t } = useTranslation()
  const { planMode, setPlanMode } = useSettings()

  // プラットフォームに応じた翻訳キーを決定
  const { planModeTooltipKey, actModeTooltipKey } = useMemo(() => {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    return {
      planModeTooltipKey: isMac
        ? 'Plan mode - Read-only tools enabled (⌘+Shift+A)'
        : 'Plan mode - Read-only tools enabled (Ctrl+Shift+A)',
      actModeTooltipKey: isMac
        ? 'Act mode - All tools enabled (⌘+Shift+A)'
        : 'Act mode - All tools enabled (Ctrl+Shift+A)'
    }
  }, [])

  return (
    <div className={`flex rounded-full border dark:border-gray-700 overflow-hidden ${className}`}>
      <Tooltip content={t(planModeTooltipKey)} placement="bottom" animation="duration-500">
        <button
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            planMode ? planModeStyle : unselectedStyle
          }`}
          onClick={() => setPlanMode(true)}
          aria-pressed={planMode}
        >
          Plan
        </button>
      </Tooltip>
      <Tooltip content={t(actModeTooltipKey)} placement="bottom" animation="duration-500">
        <button
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            !planMode ? actModeStyle : unselectedStyle
          }`}
          onClick={() => setPlanMode(false)}
          aria-pressed={!planMode}
        >
          Act
        </button>
      </Tooltip>
    </div>
  )
}
