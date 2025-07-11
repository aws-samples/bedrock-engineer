import React from 'react'

interface ToggleSwitchProps {
  enabled: boolean
  onToggle: (e: React.MouseEvent) => void
  disabled?: boolean
  enabledLabel?: string
  disabledLabel?: string
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onToggle,
  disabled = false,
  enabledLabel,
  disabledLabel
}) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-pressed={enabled}
    aria-label={enabled ? enabledLabel : disabledLabel}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)
