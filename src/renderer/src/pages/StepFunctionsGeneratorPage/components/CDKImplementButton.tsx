import { memo } from 'react'
import { motion } from 'framer-motion'
import { FaAws } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

interface CDKImplementButtonProps {
  visible: boolean
  onImplement: () => void
  disabled?: boolean
}

/**
 * CDK実装ボタンコンポーネント
 *
 * ステートマシン定義が生成された場合に表示され、
 * クリックするとAgent ChatページでCDK実装プロンプトが実行される
 */
const CDKImplementButtonComponent = ({
  visible,
  onImplement,
  disabled = false
}: CDKImplementButtonProps) => {
  const { t } = useTranslation()

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-3 border-t border-gray-200 dark:border-gray-700"
    >
      <button
        onClick={onImplement}
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
        <FaAws className="text-lg" />
        <span>{t('Implement with AWS CDK', 'AWS CDKで実装する')}</span>
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {t('Continue with CDK implementation', 'CDKでステートマシンを実装します')}
      </p>
    </motion.div>
  )
}

// メモ化してpropsが変更されない限り再レンダリングしない
export const CDKImplementButton = memo(CDKImplementButtonComponent)
CDKImplementButton.displayName = 'CDKImplementButton'