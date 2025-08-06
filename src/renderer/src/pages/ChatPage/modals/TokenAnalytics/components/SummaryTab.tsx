import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pie } from 'react-chartjs-2'
import { Analytics, createPieChartOptions } from '@renderer/lib/analytics'
import { formatCurrency } from '@renderer/lib/pricing/modelPricing'

interface SummaryTabProps {
  analytics: Analytics
  tokenChartData: any
  costChartData: any
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  analytics,
  tokenChartData,
  costChartData
}) => {
  const { t } = useTranslation()
  const pieChartOptions = createPieChartOptions()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* トークン使用量の詳細 */}
      <div className="p-4 border dark:border-gray-600 dark:bg-gray-700/20 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('Token Usage')}</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
            <span>{t('Input Tokens')}:</span>
            <span className="font-medium dark:text-blue-200">
              {analytics.tokenUsage.inputTokens.toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
            <span>{t('Output Tokens')}:</span>
            <span className="font-medium dark:text-teal-200">
              {analytics.tokenUsage.outputTokens.toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
            <span>{t('Cache Read Tokens')}:</span>
            <span className="font-medium dark:text-yellow-200">
              {analytics.tokenUsage.cacheReadTokens.toLocaleString()}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1">
            <span>{t('Cache Write Tokens')}:</span>
            <span className="font-medium dark:text-orange-200">
              {analytics.tokenUsage.cacheWriteTokens.toLocaleString()}
            </span>
          </p>
        </div>
        {/* トークン使用量の円グラフ */}
        <div className="h-64">
          {analytics.tokenUsage.totalTokens > 0 ? (
            <Pie data={tokenChartData} options={pieChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              {t('No token usage data available')}
            </div>
          )}
        </div>
      </div>

      {/* コスト分析の詳細 */}
      <div className="p-4 border dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('Cost Analysis')}</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('Input Cost')}:{' '}
            <span className="font-medium">{formatCurrency(analytics.costAnalysis.inputCost)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('Output Cost')}:{' '}
            <span className="font-medium">{formatCurrency(analytics.costAnalysis.outputCost)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('Cache Read Cost')}:{' '}
            <span className="font-medium">
              {formatCurrency(analytics.costAnalysis.cacheReadCost)}
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('Cache Write Cost')}:{' '}
            <span className="font-medium">
              {formatCurrency(analytics.costAnalysis.cacheWriteCost)}
            </span>
          </p>
          {analytics.costAnalysis.cacheSavings > 0 && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium">
              {t('Saved approximately {{amount}} by using prompt cache', {
                amount: formatCurrency(analytics.costAnalysis.cacheSavings)
              })}
            </p>
          )}
        </div>
        {/* コスト分析の円グラフ */}
        <div className="h-64">
          {analytics.costAnalysis.totalCost > 0 ? (
            <Pie data={costChartData} options={pieChartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              {t('No cost data available')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
