import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'flowbite-react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js'
import { TokenAnalyticsModalProps, TabType } from '@renderer/lib/analytics'
import { formatCurrency } from '@renderer/lib/pricing/modelPricing'
import { useTokenAnalytics } from './hooks/useTokenAnalytics'
import { useChartData } from './hooks/useChartData'
import { SummaryTab } from './components/SummaryTab'
import { TimeSeriesTab } from './components/TimeSeriesTab'

// Chart.jsコンポーネントを登録
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
)

export const TokenAnalyticsModal: React.FC<TokenAnalyticsModalProps> = ({
  isOpen,
  onClose,
  messages,
  modelId
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('summary')

  // データ取得とチャートデータ生成
  const { analytics, loading, error } = useTokenAnalytics(messages, modelId)
  const { tokenChartData, costChartData, tokenTimeSeriesData, costTimeSeriesData } =
    useChartData(analytics)

  // タブ切り替え関数
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  // ローディング状態
  if (loading) {
    return (
      <Modal show={isOpen} onClose={onClose} size="6xl" dismissible className="dark:bg-gray-900">
        <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
          <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
            <h2 className="text-xl font-bold dark:text-white">{t('Token Usage Analytics')}</h2>
          </Modal.Header>
          <Modal.Body className="max-h-[80vh] overflow-y-auto dark:bg-gray-900 rounded-b-lg">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('Calculating analytics...')}</p>
              </div>
            </div>
          </Modal.Body>
        </div>
      </Modal>
    )
  }

  // エラー状態
  if (error) {
    return (
      <Modal show={isOpen} onClose={onClose} size="6xl" dismissible className="dark:bg-gray-900">
        <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
          <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
            <h2 className="text-xl font-bold dark:text-white">{t('Token Usage Analytics')}</h2>
          </Modal.Header>
          <Modal.Body className="max-h-[80vh] overflow-y-auto dark:bg-gray-900 rounded-b-lg">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 dark:text-red-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('Error calculating analytics')}: {error}
                </p>
              </div>
            </div>
          </Modal.Body>
        </div>
      </Modal>
    )
  }

  return (
    <Modal show={isOpen} onClose={onClose} size="6xl" dismissible className="dark:bg-gray-900">
      <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
        <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
          <h2 className="text-xl font-bold dark:text-white">{t('Token Usage Analytics')}</h2>
        </Modal.Header>
        <Modal.Body className="max-h-[80vh] overflow-y-auto dark:bg-gray-900 rounded-b-lg">
          {/* セッション全体の統計 */}
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700/80 rounded-lg border border-transparent dark:border-gray-600 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('Session Summary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {t('Total Tokens')}:{' '}
                  <span className="font-medium dark:text-white">
                    {analytics.tokenUsage.totalTokens.toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {t('Total Cost')}:{' '}
                  <span className="font-medium dark:text-white">
                    {formatCurrency(analytics.costAnalysis.totalCost)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {t('Model')}: <span className="font-medium dark:text-white">{modelId}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {t('Messages')}:{' '}
                  <span className="font-medium dark:text-white">{messages.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('summary')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-500'
                }`}
              >
                {t('Summary')}
              </button>
              <button
                onClick={() => handleTabChange('timeSeries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'timeSeries'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-500'
                }`}
              >
                {t('Time Series Analysis')}
              </button>
            </nav>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'summary' && (
            <SummaryTab
              analytics={analytics}
              tokenChartData={tokenChartData}
              costChartData={costChartData}
            />
          )}

          {activeTab === 'timeSeries' && (
            <TimeSeriesTab
              analytics={analytics}
              tokenTimeSeriesData={tokenTimeSeriesData}
              costTimeSeriesData={costTimeSeriesData}
            />
          )}

          {/* 注意書き */}
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <p>
              {t(
                'Note: Token usage and cost calculations are estimates based on the available metadata.'
              )}
            </p>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  )
}
