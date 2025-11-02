import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TextArea, AttachedImage } from '../../ChatPage/components/InputForm/TextArea'
import { RecommendChanges } from '../../WebsiteGeneratorPage/components/RecommendChanges'

interface WelcomeScreenProps {
  userInput: string
  setUserInput: (value: string) => void
  onSubmit: (input: string, images: AttachedImage[]) => void
  disabled: boolean
  isComposing: boolean
  setIsComposing: (value: boolean) => void
  sendMsgKey: 'Enter' | 'Cmd+Enter'
  recommendChanges: { title: string; value: string }[]
  recommendLoading: boolean
}

export function WelcomeScreen({
  userInput,
  setUserInput,
  onSubmit,
  disabled,
  isComposing,
  setIsComposing,
  sendMsgKey,
  recommendChanges,
  recommendLoading
}: WelcomeScreenProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full px-8 gap-8"
    >
      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          {t('welcomeMessage')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">{t('welcomeDescription')}</p>
      </motion.div>

      {/* Recommend Changes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-4xl"
      >
        <div className="flex justify-center overflow-x-auto pb-4">
          <RecommendChanges
            loading={recommendLoading}
            recommendations={recommendChanges}
            onSelect={setUserInput}
            loadingText={t('addRecommend')}
          />
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-4xl"
      >
        <TextArea
          value={userInput}
          onChange={setUserInput}
          disabled={disabled}
          onSubmit={onSubmit}
          isComposing={isComposing}
          setIsComposing={setIsComposing}
          sendMsgKey={sendMsgKey}
          hidePlanActToggle={true}
        />
      </motion.div>
    </motion.div>
  )
}
