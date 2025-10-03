import useSetting from '@renderer/hooks/useSetting'
import { getWebsiteRecommendations } from '@renderer/lib/api'
import { getLightProcessingModelId } from '@renderer/lib/modelSelection'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export const useRecommendChanges = () => {
  const {
    t,
    i18n: { language }
  } = useTranslation()
  const examplePrompts = [
    {
      title: t('ecSiteTitle'),
      value: t('ecSiteValue')
    },
    {
      title: t('ecSiteAdminTitle'),
      value: t('ecSiteAdminValue')
    },
    {
      title: t('healthFitnessSiteTitle'),
      value: t('healthFitnessSiteValue')
    },
    {
      title: t('drawingGraphTitle'),
      value: t('drawingGraphValue')
    },
    {
      title: t('todoAppTitle'),
      value: t('todoAppValue')
    },
    {
      title: t('codeTransformTitle'),
      value: t('codeTransformValue')
    }
  ]
  const [recommendChanges, setRecommendChanges] = useState(examplePrompts)
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

  const refleshRecommendChanges = () => {
    setRecommendChanges(examplePrompts)
  }

  return {
    recommendChanges,
    setRecommendChanges,
    recommendLoading,
    getRecommendChanges,
    refleshRecommendChanges
  }
}
