import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IdentifiableMessage } from '@/types/chat/message'
import { Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js'
import { Modal } from 'flowbite-react'
import { calculateCost, formatCurrency, modelPricing } from '@renderer/lib/pricing/modelPricing'

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

interface TokenAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  messages: IdentifiableMessage[]
  modelId: string
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
}

interface CostAnalysis {
  inputCost: number
  outputCost: number
  cacheReadCost: number
  cacheWriteCost: number
  totalCost: number
  cacheSavings: number // プロンプトキャッシュによる削減額
}

interface TimeSeriesDataPoint {
  timestamp: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  cacheReadCost: number
  cacheWriteCost: number
  totalCost: number
}

interface Analytics {
  tokenUsage: TokenUsage
  costAnalysis: CostAnalysis
  timeSeriesData: TimeSeriesDataPoint[]
}

// メッセージからトークン使用量とコストを計算する関数
const calculateAnalytics = (messages: IdentifiableMessage[], modelId: string): Analytics => {
  // 初期値を設定
  const tokenUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    totalTokens: 0
  }

  const costAnalysis: CostAnalysis = {
    inputCost: 0,
    outputCost: 0,
    cacheReadCost: 0,
    cacheWriteCost: 0,
    totalCost: 0,
    cacheSavings: 0
  }

  // 時系列データを格納する配列
  const timeSeriesData: TimeSeriesDataPoint[] = []

  // アシスタントメッセージのメタデータからトークン使用量を集計
  messages.forEach((message) => {
    if (message.role === 'assistant' && message.metadata?.converseMetadata?.usage) {
      const usage = message.metadata.converseMetadata.usage

      // トークン使用量を加算
      tokenUsage.inputTokens += usage.inputTokens || 0
      tokenUsage.outputTokens += usage.outputTokens || 0
      tokenUsage.cacheReadTokens += usage.cacheReadInputTokens || 0
      tokenUsage.cacheWriteTokens += usage.cacheWriteInputTokens || 0

      // メッセージごとのコスト計算
      const msgInputCost = calculateCost(modelId, usage.inputTokens || 0, 0, 0, 0)
      const msgOutputCost = calculateCost(modelId, 0, usage.outputTokens || 0, 0, 0)
      const msgCacheReadCost = calculateCost(modelId, 0, 0, usage.cacheReadInputTokens || 0, 0)
      const msgCacheWriteCost = calculateCost(modelId, 0, 0, 0, usage.cacheWriteInputTokens || 0)
      const msgTotalCost = msgInputCost + msgOutputCost + msgCacheReadCost + msgCacheWriteCost

      // タイムスタンプの取得（メタデータにタイムスタンプがない場合は現在時刻を使用）
      const timestamp = message.timestamp || Date.now()

      // 時系列データポイントを追加
      timeSeriesData.push({
        timestamp,
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        cacheReadTokens: usage.cacheReadInputTokens || 0,
        cacheWriteTokens: usage.cacheWriteInputTokens || 0,
        totalTokens:
          (usage.inputTokens || 0) +
          (usage.outputTokens || 0) +
          (usage.cacheReadInputTokens || 0) +
          (usage.cacheWriteInputTokens || 0),
        inputCost: msgInputCost,
        outputCost: msgOutputCost,
        cacheReadCost: msgCacheReadCost,
        cacheWriteCost: msgCacheWriteCost,
        totalCost: msgTotalCost
      })
    }
  })

  // 時系列データを時間順にソート
  timeSeriesData.sort((a, b) => a.timestamp - b.timestamp)

  // 合計トークン数を計算
  tokenUsage.totalTokens =
    tokenUsage.inputTokens +
    tokenUsage.outputTokens +
    tokenUsage.cacheReadTokens +
    tokenUsage.cacheWriteTokens

  // コスト計算
  if (modelId) {
    costAnalysis.inputCost = calculateCost(modelId, tokenUsage.inputTokens, 0, 0, 0)
    costAnalysis.outputCost = calculateCost(modelId, 0, tokenUsage.outputTokens, 0, 0)
    costAnalysis.cacheReadCost = calculateCost(modelId, 0, 0, tokenUsage.cacheReadTokens, 0)
    costAnalysis.cacheWriteCost = calculateCost(modelId, 0, 0, 0, tokenUsage.cacheWriteTokens)
    costAnalysis.totalCost =
      costAnalysis.inputCost +
      costAnalysis.outputCost +
      costAnalysis.cacheReadCost +
      costAnalysis.cacheWriteCost

    // キャッシュによる削減額の計算
    if (tokenUsage.cacheReadTokens > 0) {
      // モデルIDからモデルタイプを特定
      const pricing = Object.entries(modelPricing).find(([key]) => modelId.includes(key))?.[1]
      if (pricing) {
        // キャッシュがなかった場合のコスト (通常の入力トークン価格で計算)
        const costWithoutCache = (tokenUsage.cacheReadTokens * pricing.input) / 1000
        // 実際のキャッシュコスト
        const actualCacheCost = (tokenUsage.cacheReadTokens * pricing.cacheRead) / 1000
        // 削減額を計算
        costAnalysis.cacheSavings = costWithoutCache - actualCacheCost
      }
    }
  }

  return { tokenUsage, costAnalysis, timeSeriesData }
}

// トークン使用量グラフのデータを作成
const createTokenChartData = (tokenUsage: TokenUsage, t: any): ChartData<'pie'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')

  return {
    labels: [
      t('Input Tokens'),
      t('Output Tokens'),
      t('Cache Read Tokens'),
      t('Cache Write Tokens')
    ],
    datasets: [
      {
        data: [
          tokenUsage.inputTokens,
          tokenUsage.outputTokens,
          tokenUsage.cacheReadTokens,
          tokenUsage.cacheWriteTokens
        ],
        backgroundColor: isDarkMode
          ? [
              'rgba(96, 165, 250, 0.8)', // ブルー (blue-400)
              'rgba(94, 234, 212, 0.8)', // ティール (teal-300)
              'rgba(250, 204, 21, 0.8)', // イエロー (yellow-400)
              'rgba(251, 146, 60, 0.8)' // オレンジ (orange-400)
            ]
          : [
              'rgba(54, 162, 235, 0.7)', // 青
              'rgba(75, 192, 192, 0.7)', // 緑
              'rgba(255, 206, 86, 0.7)', // 黄
              'rgba(255, 159, 64, 0.7)' // オレンジ
            ],
        borderColor: isDarkMode
          ? [
              'rgba(147, 197, 253, 1)', // ブルー (blue-300)
              'rgba(153, 246, 228, 1)', // ティール (teal-200)
              'rgba(254, 240, 138, 1)', // イエロー (yellow-200)
              'rgba(254, 215, 170, 1)' // オレンジ (orange-200)
            ]
          : [
              'rgba(37, 99, 235, 1)', // ブルー (blue-600)
              'rgba(20, 184, 166, 1)', // ティール (teal-500)
              'rgba(234, 179, 8, 1)', // イエロー (yellow-500)
              'rgba(234, 88, 12, 1)' // オレンジ (orange-600)
            ],
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    ]
  }
}

// コスト分析グラフのデータを作成
const createCostChartData = (costAnalysis: CostAnalysis, t: any): ChartData<'pie'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')

  return {
    labels: [t('Input Cost'), t('Output Cost'), t('Cache Read Cost'), t('Cache Write Cost')],
    datasets: [
      {
        data: [
          costAnalysis.inputCost,
          costAnalysis.outputCost,
          costAnalysis.cacheReadCost,
          costAnalysis.cacheWriteCost
        ],
        backgroundColor: isDarkMode
          ? [
              'rgba(96, 165, 250, 0.8)', // ブルー (blue-400)
              'rgba(94, 234, 212, 0.8)', // ティール (teal-300)
              'rgba(250, 204, 21, 0.8)', // イエロー (yellow-400)
              'rgba(251, 146, 60, 0.8)' // オレンジ (orange-400)
            ]
          : [
              'rgba(54, 162, 235, 0.7)', // 青
              'rgba(75, 192, 192, 0.7)', // 緑
              'rgba(255, 206, 86, 0.7)', // 黄
              'rgba(255, 159, 64, 0.7)' // オレンジ
            ],
        borderColor: isDarkMode
          ? [
              'rgba(147, 197, 253, 1)', // ブルー (blue-300)
              'rgba(153, 246, 228, 1)', // ティール (teal-200)
              'rgba(254, 240, 138, 1)', // イエロー (yellow-200)
              'rgba(254, 215, 170, 1)' // オレンジ (orange-200)
            ]
          : [
              'rgba(37, 99, 235, 1)', // ブルー (blue-600)
              'rgba(20, 184, 166, 1)', // ティール (teal-500)
              'rgba(234, 179, 8, 1)', // イエロー (yellow-500)
              'rgba(234, 88, 12, 1)' // オレンジ (orange-600)
            ],
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    ]
  }
}

// 時系列トークン使用量グラフのデータを作成
const createTokenTimeSeriesData = (
  timeSeriesData: TimeSeriesDataPoint[],
  t: any
): ChartData<'line'> => {
  // 時間フォーマット関数
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const isDarkMode = document.documentElement.classList.contains('dark')

  // ダークモード用の明るい色セット
  const darkModeColors = {
    total: {
      border: 'rgba(45, 212, 191, 1)', // teal-400
      background: 'rgba(45, 212, 191, 0.2)'
    },
    input: {
      border: 'rgba(96, 165, 250, 1)', // blue-400
      background: 'rgba(96, 165, 250, 0.2)'
    },
    output: {
      border: 'rgba(251, 113, 133, 1)', // rose-400
      background: 'rgba(251, 113, 133, 0.2)'
    },
    cacheRead: {
      border: 'rgba(250, 204, 21, 1)', // yellow-400
      background: 'rgba(250, 204, 21, 0.2)'
    },
    cacheWrite: {
      border: 'rgba(192, 132, 252, 1)', // purple-400
      background: 'rgba(192, 132, 252, 0.2)'
    }
  }

  // ライトモード用の標準色セット
  const lightModeColors = {
    total: {
      border: 'rgba(20, 184, 166, 1)', // teal-500
      background: 'rgba(20, 184, 166, 0.2)'
    },
    input: {
      border: 'rgba(59, 130, 246, 1)', // blue-500
      background: 'rgba(59, 130, 246, 0.2)'
    },
    output: {
      border: 'rgba(244, 63, 94, 1)', // rose-500
      background: 'rgba(244, 63, 94, 0.2)'
    },
    cacheRead: {
      border: 'rgba(234, 179, 8, 1)', // yellow-500
      background: 'rgba(234, 179, 8, 0.2)'
    },
    cacheWrite: {
      border: 'rgba(168, 85, 247, 1)', // purple-500
      background: 'rgba(168, 85, 247, 0.2)'
    }
  }

  // モードに応じた色セットを選択
  const colors = isDarkMode ? darkModeColors : lightModeColors

  return {
    labels: timeSeriesData.map((data) => formatTime(data.timestamp)),
    datasets: [
      {
        label: t('Total Tokens'),
        data: timeSeriesData.map((data) => data.totalTokens),
        borderColor: colors.total.border,
        backgroundColor: colors.total.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Input Tokens'),
        data: timeSeriesData.map((data) => data.inputTokens),
        borderColor: colors.input.border,
        backgroundColor: colors.input.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Output Tokens'),
        data: timeSeriesData.map((data) => data.outputTokens),
        borderColor: colors.output.border,
        backgroundColor: colors.output.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Cache Read Tokens'),
        data: timeSeriesData.map((data) => data.cacheReadTokens),
        borderColor: colors.cacheRead.border,
        backgroundColor: colors.cacheRead.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Cache Write Tokens'),
        data: timeSeriesData.map((data) => data.cacheWriteTokens),
        borderColor: colors.cacheWrite.border,
        backgroundColor: colors.cacheWrite.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      }
    ]
  }
}

// 時系列コスト分析グラフのデータを作成
const createCostTimeSeriesData = (
  timeSeriesData: TimeSeriesDataPoint[],
  t: any
): ChartData<'line'> => {
  // 時間フォーマット関数
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const isDarkMode = document.documentElement.classList.contains('dark')

  // ダークモード用の明るい色セット
  const darkModeColors = {
    total: {
      border: 'rgba(45, 212, 191, 1)', // teal-400
      background: 'rgba(45, 212, 191, 0.2)'
    },
    input: {
      border: 'rgba(96, 165, 250, 1)', // blue-400
      background: 'rgba(96, 165, 250, 0.2)'
    },
    output: {
      border: 'rgba(251, 113, 133, 1)', // rose-400
      background: 'rgba(251, 113, 133, 0.2)'
    },
    cacheRead: {
      border: 'rgba(250, 204, 21, 1)', // yellow-400
      background: 'rgba(250, 204, 21, 0.2)'
    },
    cacheWrite: {
      border: 'rgba(192, 132, 252, 1)', // purple-400
      background: 'rgba(192, 132, 252, 0.2)'
    }
  }

  // ライトモード用の標準色セット
  const lightModeColors = {
    total: {
      border: 'rgba(20, 184, 166, 1)', // teal-500
      background: 'rgba(20, 184, 166, 0.2)'
    },
    input: {
      border: 'rgba(59, 130, 246, 1)', // blue-500
      background: 'rgba(59, 130, 246, 0.2)'
    },
    output: {
      border: 'rgba(244, 63, 94, 1)', // rose-500
      background: 'rgba(244, 63, 94, 0.2)'
    },
    cacheRead: {
      border: 'rgba(234, 179, 8, 1)', // yellow-500
      background: 'rgba(234, 179, 8, 0.2)'
    },
    cacheWrite: {
      border: 'rgba(168, 85, 247, 1)', // purple-500
      background: 'rgba(168, 85, 247, 0.2)'
    }
  }

  // モードに応じた色セットを選択
  const colors = isDarkMode ? darkModeColors : lightModeColors

  return {
    labels: timeSeriesData.map((data) => formatTime(data.timestamp)),
    datasets: [
      {
        label: t('Total Cost'),
        data: timeSeriesData.map((data) => data.totalCost),
        borderColor: colors.total.border,
        backgroundColor: colors.total.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Input Cost'),
        data: timeSeriesData.map((data) => data.inputCost),
        borderColor: colors.input.border,
        backgroundColor: colors.input.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Output Cost'),
        data: timeSeriesData.map((data) => data.outputCost),
        borderColor: colors.output.border,
        backgroundColor: colors.output.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Cache Read Cost'),
        data: timeSeriesData.map((data) => data.cacheReadCost),
        borderColor: colors.cacheRead.border,
        backgroundColor: colors.cacheRead.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      },
      {
        label: t('Cache Write Cost'),
        data: timeSeriesData.map((data) => data.cacheWriteCost),
        borderColor: colors.cacheWrite.border,
        backgroundColor: colors.cacheWrite.background,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.1
      }
    ]
  }
}

// 円グラフのオプション
const pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        color: document.documentElement.classList.contains('dark')
          ? '#e2e8f0' // gray-200に相当
          : '#718096',
        font: {
          weight: 'bold' // 凡例フォントを太くして視認性アップ
        }
      }
    },
    tooltip: {
      backgroundColor: () => {
        return document.documentElement.classList.contains('dark')
          ? 'rgba(30, 41, 59, 0.9)' // dark:bg-slate-800
          : 'rgba(255, 255, 255, 0.9)'
      },
      titleColor: () => {
        return document.documentElement.classList.contains('dark')
          ? '#f8fafc' // gray-50に相当
          : '#1e293b'
      },
      bodyColor: () => {
        return document.documentElement.classList.contains('dark')
          ? '#e2e8f0' // gray-200に相当
          : '#334155'
      },
      callbacks: {
        label: function (context) {
          const label = context.label || ''
          const value = context.raw as number
          return `${label}: ${value.toLocaleString()}`
        }
      }
    }
  }
}

// 折れ線グラフのオプション
const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: () => {
          return document.documentElement.classList.contains('dark')
            ? 'rgba(148, 163, 184, 0.1)' // dark:gray-400 with low opacity
            : 'rgba(203, 213, 225, 0.5)' // gray-300
        }
      },
      ticks: {
        color: () => {
          return document.documentElement.classList.contains('dark')
            ? '#cbd5e1' // gray-300
            : '#64748b' // gray-500
        }
      }
    },
    x: {
      grid: {
        color: () => {
          return document.documentElement.classList.contains('dark')
            ? 'rgba(148, 163, 184, 0.1)' // dark:gray-400 with low opacity
            : 'rgba(203, 213, 225, 0.5)' // gray-300
        }
      },
      ticks: {
        color: () => {
          return document.documentElement.classList.contains('dark')
            ? '#cbd5e1' // gray-300
            : '#64748b' // gray-500
        }
      }
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        padding: 20,
        color: document.documentElement.classList.contains('dark')
          ? '#e2e8f0' // gray-200
          : '#475569', // gray-600
        font: {
          weight: 'bold'
        }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: () => {
        return document.documentElement.classList.contains('dark')
          ? 'rgba(30, 41, 59, 0.9)' // dark:bg-slate-800
          : 'rgba(255, 255, 255, 0.9)'
      },
      titleColor: () => {
        return document.documentElement.classList.contains('dark')
          ? '#f8fafc' // gray-50に相当
          : '#1e293b'
      },
      bodyColor: () => {
        return document.documentElement.classList.contains('dark')
          ? '#e2e8f0' // gray-200に相当
          : '#334155'
      }
    },
    title: {
      display: true,
      text: '',
      color: document.documentElement.classList.contains('dark')
        ? '#f1f5f9' // gray-100
        : '#334155' // gray-700
    }
  }
}

// モーダルコンポーネント
export const TokenAnalyticsModal: React.FC<TokenAnalyticsModalProps> = ({
  isOpen,
  onClose,
  messages,
  modelId
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'summary' | 'timeSeries'>('summary')

  // メッセージからトークン使用量とコストを計算
  const analytics = useMemo(() => calculateAnalytics(messages, modelId), [messages, modelId])

  // グラフデータを作成
  const tokenChartData = useMemo(
    () => createTokenChartData(analytics.tokenUsage, t),
    [analytics.tokenUsage, t]
  )
  const costChartData = useMemo(
    () => createCostChartData(analytics.costAnalysis, t),
    [analytics.costAnalysis, t]
  )

  // 時系列グラフデータを作成
  const tokenTimeSeriesData = useMemo(
    () => createTokenTimeSeriesData(analytics.timeSeriesData, t),
    [analytics.timeSeriesData, t]
  )
  const costTimeSeriesData = useMemo(
    () => createCostTimeSeriesData(analytics.timeSeriesData, t),
    [analytics.timeSeriesData, t]
  )

  // タブ切り替え関数
  const handleTabChange = (tab: 'summary' | 'timeSeries') => {
    setActiveTab(tab)
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

          {/* サマリータブ */}
          {activeTab === 'summary' && (
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
                    <span className="font-medium">
                      {formatCurrency(analytics.costAnalysis.inputCost)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('Output Cost')}:{' '}
                    <span className="font-medium">
                      {formatCurrency(analytics.costAnalysis.outputCost)}
                    </span>
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
          )}

          {/* 時系列分析タブ */}
          {activeTab === 'timeSeries' && (
            <div className="space-y-6">
              {/* 時系列トークン使用量グラフ */}
              <div className="p-4 border dark:border-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  {t('Token Usage Over Time')}
                </h3>
                <div className="h-80">
                  {analytics.timeSeriesData.length > 0 ? (
                    <Line
                      data={tokenTimeSeriesData}
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            display: true,
                            text: t('Token Usage Trend')
                          }
                        }
                      }}
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
                    <Line
                      data={costTimeSeriesData}
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            display: true,
                            text: t('Cost Trend')
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      {t('No time series data available')}
                    </div>
                  )}
                </div>
              </div>

              {/* 累積トークン使用量とコスト */}
              <div className="p-4 border dark:border-gray-600 dark:bg-gray-700/20 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  {t('Cumulative Usage')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
                      <span>{t('Average Tokens per Message')}:</span>
                      <span className="font-medium dark:text-blue-200">
                        {analytics.timeSeriesData.length > 0
                          ? Math.round(
                              analytics.tokenUsage.totalTokens / analytics.timeSeriesData.length
                            ).toLocaleString()
                          : '0'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1">
                      <span>{t('Average Cost per Message')}:</span>
                      <span className="font-medium dark:text-teal-200">
                        {analytics.timeSeriesData.length > 0
                          ? formatCurrency(
                              analytics.costAnalysis.totalCost / analytics.timeSeriesData.length
                            )
                          : formatCurrency(0)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-600/50">
                      <span>{t('Token Usage Efficiency')}:</span>
                      <span className="font-medium dark:text-orange-200">
                        {analytics.tokenUsage.inputTokens > 0
                          ? `${((analytics.tokenUsage.outputTokens / analytics.tokenUsage.inputTokens) * 100).toFixed(1)}%`
                          : '0%'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-200 flex justify-between items-center py-1">
                      <span>{t('Cache Efficiency')}:</span>
                      <span className="font-medium dark:text-yellow-200">
                        {analytics.tokenUsage.inputTokens + analytics.tokenUsage.outputTokens > 0
                          ? `${((analytics.tokenUsage.cacheReadTokens / (analytics.tokenUsage.inputTokens + analytics.tokenUsage.outputTokens)) * 100).toFixed(1)}%`
                          : '0%'}
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

// モーダル表示のカスタムフック
export const useTokenAnalyticsModal = () => {
  const [show, setShow] = useState(false)

  const handleOpen = useCallback(() => {
    setShow(true)
  }, [])

  const handleClose = useCallback(() => {
    setShow(false)
  }, [])

  return {
    show,
    handleOpen,
    handleClose,
    TokenAnalyticsModal
  }
}
