import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BsCheckCircle, BsXCircle, BsArrowClockwise, BsExclamationCircle } from 'react-icons/bs'
import { checkNovaSonicRegionSupport, type RegionCheckResult } from '@renderer/lib/api/novaSonic'

interface NovaSonicStatusProps {
  currentRegion: string
}

export const NovaSonicStatus: React.FC<NovaSonicStatusProps> = ({ currentRegion }) => {
  const { t } = useTranslation()
  const [regionCheck, setRegionCheck] = useState<RegionCheckResult | null>(null)
  const [loading, setLoading] = useState(true)

  const checkRegionStatus = async () => {
    try {
      setLoading(true)
      const result = await checkNovaSonicRegionSupport(currentRegion)
      setRegionCheck(result)
    } catch (error) {
      console.error('Failed to check Nova Sonic region support:', error)
      setRegionCheck({
        isSupported: false,
        currentRegion,
        supportedRegions: ['us-east-1', 'us-west-2', 'ap-northeast-1', 'eu-north-1'],
        error: 'Failed to check region support'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkRegionStatus()
  }, [currentRegion])

  const getStatusIcon = () => {
    if (loading) {
      return <BsArrowClockwise className="w-4 h-4 text-gray-500 animate-spin" />
    }

    if (regionCheck?.isSupported) {
      return <BsCheckCircle className="w-4 h-4 text-green-500" />
    }

    return <BsXCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusText = () => {
    if (loading) {
      return t('settings.novaSonic.checking', 'Checking availability...')
    }

    if (regionCheck?.isSupported) {
      return t('settings.novaSonic.available', 'Available')
    }

    return t('settings.novaSonic.notAvailable', 'Not Available')
  }

  const getStatusColor = () => {
    if (loading) return 'text-gray-600 dark:text-gray-400'
    if (regionCheck?.isSupported) return 'text-green-600 dark:text-green-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('settings.novaSonic.title', 'Voice Chat (Nova Sonic)')}
        </h4>
        <button
          onClick={checkRegionStatus}
          disabled={loading}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          title={t('settings.novaSonic.refresh', 'Refresh status')}
        >
          <BsArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center space-x-2 mb-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusText()}</span>
      </div>

      {regionCheck && !loading && (
        <>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {t('settings.novaSonic.currentRegion', 'Current region: {{region}}', {
              region: regionCheck.currentRegion
            })}
          </div>

          {!regionCheck.isSupported && (
            <div className="space-y-2">
              <div className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                <BsExclamationCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  {t('settings.novaSonic.supportedRegions', 'Supported regions: {{regions}}', {
                    regions: regionCheck.supportedRegions.join(', ')
                  })}
                </div>
              </div>
              {regionCheck.error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {regionCheck.error}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
