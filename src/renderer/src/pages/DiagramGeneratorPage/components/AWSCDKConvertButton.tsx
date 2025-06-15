import { memo } from 'react'
import { motion } from 'framer-motion'
import { FaAws } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

interface AWSCDKConvertButtonProps {
  visible: boolean
  onConvert: () => void
  disabled?: boolean
}

/**
 * AWS CDK変換ボタンコンポーネント
 *
 * AWS関連要素が検出された場合に表示され、
 * クリックするとAgent ChatページでCDK変換プロンプトが実行される
 */
const AWSCDKConvertButtonComponent = ({
  visible,
  onConvert,
  disabled = false
}: AWSCDKConvertButtonProps) => {
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
        onClick={onConvert}
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
        <span>{t('Convert to AWS CDK', 'Agent ChatでAWS CDKに変換')}</span>
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {t('AWS architecture detected', 'AWS構成が検出されました')}
      </p>
    </motion.div>
  )
}

// メモ化してpropsが変更されない限り再レンダリングしない
export const AWSCDKConvertButton = memo(AWSCDKConvertButtonComponent)
AWSCDKConvertButton.displayName = 'AWSCDKConvertButton'
