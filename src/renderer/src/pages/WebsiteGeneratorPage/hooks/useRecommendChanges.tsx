import useSetting from '@renderer/hooks/useSetting'
import { getWebsiteRecommendations } from '@renderer/lib/api'
import { getLightProcessingModelId } from '@renderer/lib/modelSelection'
import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Fisher-Yatesシャッフルアルゴリズムを使用したランダム選択
const getRandomPrompts = <T,>(prompts: T[], count: number): T[] => {
  const shuffled = [...prompts]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

export const useRecommendChanges = () => {
  const {
    t,
    i18n: { language }
  } = useTranslation()

  // 常に表示する固定プロンプト
  const fixedPrompt = useMemo(() => ({ title: t('ecSiteTitle'), value: t('ecSiteValue') }), [t])

  // ランダム選択用のプロンプトリスト（固定プロンプトを除く59個）
  const allExamplePrompts = useMemo(
    () => [
      // 既存のプロンプト (5個)
      { title: t('ecSiteAdminTitle'), value: t('ecSiteAdminValue') },
      { title: t('healthFitnessSiteTitle'), value: t('healthFitnessSiteValue') },
      { title: t('drawingGraphTitle'), value: t('drawingGraphValue') },
      { title: t('todoAppTitle'), value: t('todoAppValue') },
      { title: t('codeTransformTitle'), value: t('codeTransformValue') },
      // ECサイト系 (8個)
      { title: t('fashionEcSiteTitle'), value: t('fashionEcSiteValue') },
      { title: t('bookStoreTitle'), value: t('bookStoreValue') },
      { title: t('handmadeMarketTitle'), value: t('handmadeMarketValue') },
      { title: t('foodEcSiteTitle'), value: t('foodEcSiteValue') },
      { title: t('furnitureEcSiteTitle'), value: t('furnitureEcSiteValue') },
      { title: t('cosmeticEcSiteTitle'), value: t('cosmeticEcSiteValue') },
      { title: t('petShopTitle'), value: t('petShopValue') },
      { title: t('digitalGoodsTitle'), value: t('digitalGoodsValue') },
      // コーポレート・ビジネス系 (10個)
      { title: t('itCorporateTitle'), value: t('itCorporateValue') },
      { title: t('startupLpTitle'), value: t('startupLpValue') },
      { title: t('recruitingSiteTitle'), value: t('recruitingSiteValue') },
      { title: t('irPageTitle'), value: t('irPageValue') },
      { title: t('serviceLpTitle'), value: t('serviceLpValue') },
      { title: t('contactFormTitle'), value: t('contactFormValue') },
      { title: t('pricingPageTitle'), value: t('pricingPageValue') },
      { title: t('companyBlogTitle'), value: t('companyBlogValue') },
      { title: t('pressReleaseTitle'), value: t('pressReleaseValue') },
      { title: t('partnerPageTitle'), value: t('partnerPageValue') },
      // メディア・コンテンツ系 (10個)
      { title: t('newsSiteTitle'), value: t('newsSiteValue') },
      { title: t('recipeSiteTitle'), value: t('recipeSiteValue') },
      { title: t('travelGuideTitle'), value: t('travelGuideValue') },
      { title: t('movieReviewTitle'), value: t('movieReviewValue') },
      { title: t('musicStreamingTitle'), value: t('musicStreamingValue') },
      { title: t('podcastPlatformTitle'), value: t('podcastPlatformValue') },
      { title: t('onlineMagazineTitle'), value: t('onlineMagazineValue') },
      { title: t('photoGalleryTitle'), value: t('photoGalleryValue') },
      { title: t('videoSharingTitle'), value: t('videoSharingValue') },
      { title: t('qaCommunityTitle'), value: t('qaCommunityValue') },
      // アプリケーション系 (10個)
      { title: t('calendarAppTitle'), value: t('calendarAppValue') },
      { title: t('noteAppTitle'), value: t('noteAppValue') },
      { title: t('projectManagementTitle'), value: t('projectManagementValue') },
      { title: t('chatAppTitle'), value: t('chatAppValue') },
      { title: t('emailClientTitle'), value: t('emailClientValue') },
      { title: t('timeTrackerTitle'), value: t('timeTrackerValue') },
      { title: t('budgetAppTitle'), value: t('budgetAppValue') },
      { title: t('fileManagerTitle'), value: t('fileManagerValue') },
      { title: t('crmDashboardTitle'), value: t('crmDashboardValue') },
      // データ可視化・ダッシュボード系 (10個)
      { title: t('salesDashboardTitle'), value: t('salesDashboardValue') },
      { title: t('analyticsDashboardTitle'), value: t('analyticsDashboardValue') },
      { title: t('monitoringDashboardTitle'), value: t('monitoringDashboardValue') },
      { title: t('socialMediaAnalyticsTitle'), value: t('socialMediaAnalyticsValue') },
      { title: t('inventoryDashboardTitle'), value: t('inventoryDashboardValue') },
      { title: t('kpiDashboardTitle'), value: t('kpiDashboardValue') },
      { title: t('userBehaviorTitle'), value: t('userBehaviorValue') },
      { title: t('financialReportTitle'), value: t('financialReportValue') },
      { title: t('serverMonitoringTitle'), value: t('serverMonitoringValue') },
      // 専門分野系 (10個)
      { title: t('learningPlatformTitle'), value: t('learningPlatformValue') },
      { title: t('medicalBookingTitle'), value: t('medicalBookingValue') },
      { title: t('realEstateTitle'), value: t('realEstateValue') },
      { title: t('restaurantBookingTitle'), value: t('restaurantBookingValue') },
      { title: t('eventPlatformTitle'), value: t('eventPlatformValue') },
      { title: t('freelanceMatchingTitle'), value: t('freelanceMatchingValue') },
      { title: t('votingSystemTitle'), value: t('votingSystemValue') },
      { title: t('crowdfundingTitle'), value: t('crowdfundingValue') },
      { title: t('portfolioSiteTitle'), value: t('portfolioSiteValue') }
    ],
    [t]
  )

  const [recommendChanges, setRecommendChanges] = useState(() => [
    fixedPrompt,
    ...getRandomPrompts(allExamplePrompts, 5)
  ])
  const [recommendLoading, setRecommendLoading] = useState(false)
  const { currentLLM: llm, lightProcessingModel } = useSetting()

  const getRecommendChanges = useCallback(
    async (websiteCode: string) => {
      setRecommendLoading(true)

      try {
        const result = await getWebsiteRecommendations({
          websiteCode,
          language,
          modelId: getLightProcessingModelId(llm, lightProcessingModel)
        })

        setRecommendChanges(result.recommendations)
      } catch (e) {
        console.error('Error getting recommend changes:', e)
      } finally {
        setRecommendLoading(false)
      }
    },
    [llm, lightProcessingModel, language]
  )

  const refleshRecommendChanges = useCallback(() => {
    setRecommendChanges([fixedPrompt, ...getRandomPrompts(allExamplePrompts, 5)])
  }, [allExamplePrompts, fixedPrompt])

  return {
    recommendChanges,
    setRecommendChanges,
    recommendLoading,
    getRecommendChanges,
    refleshRecommendChanges
  }
}
