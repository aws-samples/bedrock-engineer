import { memo } from 'react'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { MdOutlineContentCopy } from 'react-icons/md'
import { toast } from 'react-hot-toast'

type DiagramExplanationViewProps = {
  explanation: string
  isVisible: boolean
  onClose: () => void
}

/**
 * ダイアグラムの説明表示コンポーネント
 * 
 * ダイアグラムの説明文を表示し、閉じるボタンとコピーボタンを提供する
 */
const DiagramExplanationViewComponent = ({ explanation, isVisible, onClose }: DiagramExplanationViewProps) => {
  if (!isVisible || !explanation) {
    return null
  }

  const handleCopyExplanation = () => {
    navigator.clipboard.writeText(explanation)
    toast.success('説明をクリップボードにコピーしました')
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">図の説明</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyExplanation}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="説明をコピー"
          >
            <MdOutlineContentCopy className="text-gray-500 dark:text-gray-300" size={18} />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="閉じる"
          >
            <AiOutlineCloseCircle className="text-gray-500 dark:text-gray-300" size={18} />
          </button>
        </div>
      </div>

      {/* コンテンツ部分 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {explanation}
        </div>
      </div>
    </div>
  )
}

// メモ化してpropsが変更されない限り再レンダリングしない
export const DiagramExplanationView = memo(DiagramExplanationViewComponent)
DiagramExplanationView.displayName = 'DiagramExplanationView'