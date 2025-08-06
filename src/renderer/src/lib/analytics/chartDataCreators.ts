import { ChartData } from 'chart.js'
import { TokenUsage, CostAnalysis, TimeSeriesDataPoint } from './types'
import { getPieChartColors, getChartColors } from './colorThemes'
import { formatTime } from './chartConfig'

// トークン使用量グラフのデータを作成
export const createTokenChartData = (tokenUsage: TokenUsage, t: any): ChartData<'pie'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const pieColors = getPieChartColors(isDarkMode)

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
        backgroundColor: pieColors.backgroundColor,
        borderColor: pieColors.borderColor,
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    ]
  }
}

// コスト分析グラフのデータを作成
export const createCostChartData = (costAnalysis: CostAnalysis, t: any): ChartData<'pie'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const pieColors = getPieChartColors(isDarkMode)

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
        backgroundColor: pieColors.backgroundColor,
        borderColor: pieColors.borderColor,
        borderWidth: 2,
        hoverBorderWidth: 3
      }
    ]
  }
}

// 時系列トークン使用量グラフのデータを作成
export const createTokenTimeSeriesData = (
  timeSeriesData: TimeSeriesDataPoint[],
  t: any
): ChartData<'line'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const colors = getChartColors(isDarkMode)

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
export const createCostTimeSeriesData = (
  timeSeriesData: TimeSeriesDataPoint[],
  t: any
): ChartData<'line'> => {
  const isDarkMode = document.documentElement.classList.contains('dark')
  const colors = getChartColors(isDarkMode)

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
