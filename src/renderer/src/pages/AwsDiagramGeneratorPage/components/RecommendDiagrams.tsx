import React from 'react'
import { motion } from 'framer-motion'
import LoadingDotsLottie from '@renderer/pages/WebsiteGeneratorPage/LoadingDots.lottie'
import { useTranslation } from 'react-i18next'

interface Recommendation {
  title: string
  value: string
}

interface RecommendDiagramsProps {
  loading: boolean
  recommendations: Recommendation[]
  onSelect: (value: string) => void
  loadingText?: string
}

export const RecommendDiagrams: React.FC<RecommendDiagramsProps> = ({
  loading,
  recommendations,
  onSelect,
  loadingText
}) => {
  const { t } = useTranslation()
  const defaultLoadingText = t('generatingRecommendations', 'Generating recommendations...')
  if (loading) {
    return (
      <div className="flex gap-1 justify-center items-center text-gray-700 dark:text-gray-200">
        <LoadingDotsLottie className="h-[2rem]" />
        <span className="text-gray-700 dark:text-gray-200">
          {loadingText || defaultLoadingText}
        </span>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {recommendations?.map((recommendation, index) => (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          key={recommendation.title}
          className="
            cursor-pointer
            rounded-full
            border
            p-2
            text-xs
            text-gray-700
            dark:text-gray-200
            hover:border-gray-400
            hover:bg-gray-100
            dark:hover:bg-gray-700
            dark:hover:border-gray-500
            transition-colors
            duration-200
          "
          onClick={() => onSelect(recommendation.value)}
        >
          {recommendation.title}
        </motion.button>
      ))}
    </div>
  )
}
