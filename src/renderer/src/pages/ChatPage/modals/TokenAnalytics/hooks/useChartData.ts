import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Analytics,
  createTokenChartData,
  createCostChartData,
  createTokenTimeSeriesData,
  createCostTimeSeriesData
} from '@renderer/lib/analytics'

export const useChartData = (analytics: Analytics) => {
  const { t } = useTranslation()

  // サマリータブ用のチャートデータ
  const tokenChartData = useMemo(
    () => createTokenChartData(analytics.tokenUsage, t),
    [analytics.tokenUsage, t]
  )

  const costChartData = useMemo(
    () => createCostChartData(analytics.costAnalysis, t),
    [analytics.costAnalysis, t]
  )

  // 時系列タブ用のチャートデータ
  const tokenTimeSeriesData = useMemo(
    () => createTokenTimeSeriesData(analytics.timeSeriesData, t),
    [analytics.timeSeriesData, t]
  )

  const costTimeSeriesData = useMemo(
    () => createCostTimeSeriesData(analytics.timeSeriesData, t),
    [analytics.timeSeriesData, t]
  )

  return {
    tokenChartData,
    costChartData,
    tokenTimeSeriesData,
    costTimeSeriesData
  }
}
