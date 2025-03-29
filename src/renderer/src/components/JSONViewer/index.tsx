import React from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

interface JSONViewerProps {
  /**
   * 表示対象のJSONデータ
   */
  data: any
  /**
   * タイトル（オプション）
   */
  title?: string
  /**
   * 最大高さ（CSS値）
   */
  maxHeight?: string
  /**
   * コピーボタンを表示するかどうか
   */
  showCopyButton?: boolean
}

/**
 * シンタックスハイライトを適用したJSONビューアーコンポーネント
 */
export const JSONViewer: React.FC<JSONViewerProps> = ({
  data,
  title = 'JSON Data',
  maxHeight = '400px',
  showCopyButton = true
}) => {
  const { t } = useTranslation()

  // JSONをハイライト適用して整形する
  const highlightedJson = React.useMemo(() => {
    const jsonStr = JSON.stringify(data, null, 2)

    return (
      jsonStr
        // キーの色を変更（"key": の部分）
        .replace(/"([^"]+)":/g, '<span class="text-indigo-600 dark:text-indigo-400">"$1"</span>:')
        // 文字列値の色を変更（": "value" の部分）
        .replace(/: "([^"]*)"/g, ': <span class="text-green-600 dark:text-green-400">"$1"</span>')
        // 数値の色を変更
        .replace(/: (\\d+)(,?)/g, ': <span class="text-blue-600 dark:text-blue-400">$1</span>$2')
        // ブール値の色を変更
        .replace(
          /: (true|false)(,?)/g,
          ': <span class="text-yellow-600 dark:text-yellow-400">$1</span>$2'
        )
        // nullの色を変更
        .replace(
          /: (null)(,?)/g,
          ': <span class="text-purple-600 dark:text-purple-400">$1</span>$2'
        )
    )
  }, [data])

  // クリップボードにJSONをコピー
  const handleCopy = () => {
    navigator.clipboard
      .writeText(JSON.stringify(data, null, 2))
      .then(() => toast.success(t('Copied to clipboard')))
      .catch(() => toast.error(t('Failed to copy')))
  }

  return (
    <div className="json-viewer">
      {title && (
        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {title}
        </h4>
      )}

      <div className="relative group">
        <pre
          className={`
            bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm font-mono
            overflow-auto whitespace-pre border
            border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200
            scrollbar scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600
            scrollbar-track-gray-100 dark:scrollbar-track-gray-800
          `}
          style={{ maxHeight }}
          dangerouslySetInnerHTML={{ __html: highlightedJson }}
        />

        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 p-1.5 rounded-md
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            title={t('Copy JSON')}
            aria-label={t('Copy JSON')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default JSONViewer
