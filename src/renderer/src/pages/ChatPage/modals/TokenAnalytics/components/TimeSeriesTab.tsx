import React from 'react'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import { Analytics, createLineChartOptions, calculateStatistics } from '@renderer/lib/analytics'
import { formatCurrency } from '@renderer/lib/pricing/modelPricing'

interface TimeSeriesTabProps {
  analytics: Analytics
  tokenTimeSeriesData: any
  costTimeSeriesData: any
}

export const TimeSeriesTab: React.FC<TimeSeriesTabProps> = ({
  analytics,
  tokenTimeSeriesData,
  costTimeSeriesData
}) => {
  const { t } = useTranslation()
  const statistics = calculateStatistics(analytics)

  return (
    <div className="space-y-6">
      {/* 時系列トークン使用量グラフ */}
      <div className="p-4 border dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('Token Usage Over Time')}</h3>
        <div className="h-80">
          {analytics.timeSeriesData.length > 0 ? (
            <Line
              data={tokenTimeSeriesData}
              options={createLineChartOptions(t('Token Usage Trend'))}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              {t('No time series data available')}
            </div>
          )}
        </div>
      </div>

      {/* 時系列コスト分析グラフ */}
      <div className="p-4 border dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          {t('Cost Analysis Over Time')}
        </h3>
        <div className="h-80">
          {analytics.timeSeriesData.length > 0 ? (
            <Line data={costTimeSeriesData} options={createLineChartOptions(t('Cost Trend'))} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              {t('No time series data available')}
            </div>
          )}
        </div>
      </div>

      {/* 累積トークン使用量とコスト */}
      <div className="p-4 border dark:border-gray-600 dark:bg-gray-700/20 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('Cumulative Usage')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
              <span>{t('Average Tokens per Message')}:</span>
              <span className="font-medium dark:text-blue-200">
                {statistics.averageTokensPerMessage.toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1">
              <span>{t('Average Cost per Message')}:</span>
              <span className="font-medium dark:text-teal-200">
                {formatCurrency(statistics.averageCostPerMessage)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
              <span>{t('Token Usage Efficiency')}:</span>
              <span className="font-medium dark:text-orange-200">
                {statistics.tokenUsageEfficiency.toFixed(1)}%
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1">
              <span>{t('Cache Efficiency')}:</span>
              <span className="font-medium dark:text-yellow-200">
                {statistics.cacheEfficiency.toFixed(1)}%
              </span>
            </p>
            {analytics.costAnalysis.cacheSavings > 0 && (
              <p className="mt-3 text-sm font-medium py-2 px-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                {t('Saved approximately {{amount}} by using prompt cache', {
                  amount: formatCurrency(analytics.costAnalysis.cacheSavings)
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
