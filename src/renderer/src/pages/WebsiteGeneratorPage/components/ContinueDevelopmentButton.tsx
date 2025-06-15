import { memo } from 'react'
import { motion } from 'framer-motion'
import { FaCode } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'flowbite-react'

interface ContinueDevelopmentButtonProps {
  visible: boolean
  onContinue: () => void
  disabled?: boolean
  compact?: boolean
}

/**
 * 継続開発ボタンコンポーネント
 *
 * 生成されたウェブサイトを Agent Chat で継続的に開発するためのボタン
 * クリックすると Agent Chat ページに遷移し、ウェブサイトの実装を継続できる
 */
const ContinueDevelopmentButtonComponent = ({
  visible,
  onContinue,
  disabled = false,
  compact = false
}: ContinueDevelopmentButtonProps) => {
  const { t } = useTranslation()

  if (!visible) return null

  // Compact version for header
  if (compact) {
    return (
      <Tooltip
        content={t('Continue development in Agent Chat', 'Agent Chatで開発を続ける')}
        placement="bottom"
        animation="duration-500"
      >
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          onClick={onContinue}
          disabled={disabled}
          className={`
            cursor-pointer rounded-md py-1.5 px-2 transition-all duration-200
            ${
              disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
        >
          <FaCode className="text-xl" />
        </motion.button>
      </Tooltip>
    )
  }

  // Full version for bottom section
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-3 border-t border-gray-200 dark:border-gray-700"
    >
      <button
        onClick={onContinue}
        disabled={disabled}
        className={`
          w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
          font-medium text-white transition-all duration-200
          ${
            disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-md'
          }
        `}
      >
        <FaCode className="text-lg" />
        <span>{t('Continue development in Agent Chat', 'Agent Chatで開発を続ける')}</span>
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {t(
          'Continue implementing and enhancing this website with an agent',
          'エージェントでこのウェブサイトの実装・改善を続けましょう'
        )}
      </p>
    </motion.div>
  )
}

// メモ化してpropsが変更されない限り再レンダリングしない
export const ContinueDevelopmentButton = memo(ContinueDevelopmentButtonComponent)
ContinueDevelopmentButton.displayName = 'ContinueDevelopmentButton'
