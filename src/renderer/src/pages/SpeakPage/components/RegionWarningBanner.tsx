import React from 'react'
import { useTranslation } from 'react-i18next'
import { BsExclamationTriangle, BsGear, BsX } from 'react-icons/bs'

interface RegionWarningBannerProps {
  currentRegion: string
  supportedRegions: readonly string[]
  onDismiss: () => void
  onOpenSettings: () => void
}

export const RegionWarningBanner: React.FC<RegionWarningBannerProps> = ({
  currentRegion,
  supportedRegions,
  onDismiss,
  onOpenSettings
}) => {
  const { t } = useTranslation()

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        {/* Warning Icon */}
        <BsExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {t('voiceChat.regionWarning.title', 'Voice Chat Not Available')}
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {t('voiceChat.regionWarning.message', {
              currentRegion,
              supportedRegions: supportedRegions.join(', '),
              defaultValue: `Voice Chat (Nova Sonic) is not available in the current region (${currentRegion}). Please switch to a supported region: ${supportedRegions.join(', ')}.`
            })}
          </p>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center space-x-3">
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center space-x-1 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
            >
              <BsGear className="w-4 h-4" />
              <span>{t('voiceChat.regionWarning.openSettings', 'Open Settings')}</span>
            </button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
          title={t('common.dismiss', 'Dismiss')}
        >
          <BsX className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
