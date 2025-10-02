import useSetting from '@renderer/hooks/useSetting'
import { converse } from '@renderer/lib/api'
import { getLightProcessingModelId } from '@renderer/lib/modelSelection'
import prompts from '@renderer/prompts/prompts'
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
    async (websiteCode: string, retryCount = 0) => {
      const MAX_RETRIES = 3

      if (retryCount >= MAX_RETRIES) {
        console.error('Maximum retry attempts reached for recommendation changes')
        setRecommendLoading(false)
        return
      }

      setRecommendLoading(true)

      try {
        const result = await converse({
          modelId: getLightProcessingModelId(llm, lightProcessingModel),
          system: [{ text: t(prompts.WebsiteGenerator.recommend.system, { language }) }],
          messages: [{ role: 'user', content: [{ text: websiteCode }] }],
          inferenceConfig: {
            maxTokens: 4096,
            temperature: 0.5
          }
        })

        // 安全なnullチェック
        if (!result?.output?.message?.content?.[0]?.text) {
          throw new Error('Invalid response structure from API')
        }

        const recommendChanges = result.output.message.content[0].text
        const json = JSON.parse(recommendChanges)
        setRecommendChanges(json)
        setRecommendLoading(false)
      } catch (e) {
        console.error(
          `Error getting recommend changes (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
          e
        )
        // エラー時は明示的にloadingをfalseにしてから再試行
        setRecommendLoading(false)

        // 再試行前に短い遅延を入れて無限ループを防止
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return getRecommendChanges(websiteCode, retryCount + 1)
        }
      }
    },
    [llm, lightProcessingModel, t, language]
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
