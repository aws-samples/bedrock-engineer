import { ReactNode, memo } from 'react'
import { ReasoningTextDisplay } from './ReasoningTextDisplay'
import { ProgressBar } from './ProgressBar'

type LoaderWithReasoningProps = {
  children: ReactNode
  reasoningText: string
  progress?: number
  progressMessage?: string
  showProgress?: boolean
}

const LoaderWithReasoningComponent = ({
  children,
  reasoningText,
  progress,
  progressMessage,
  showProgress = false
}: LoaderWithReasoningProps) => {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* ローダーコンポーネント (WebLoader, RagLoader, etc.) */}
      {children}

      {/* 進捗バー表示 */}
      {showProgress && progress !== undefined && (
        <div className="flex justify-center w-full">
          <ProgressBar
            progress={progress}
            message={progressMessage}
            showPercentage={true}
            className="mt-2"
          />
        </div>
      )}

      {/* ReasoningTextDisplay - 中央に配置 */}
      <div className="flex justify-center w-full">
        {reasoningText && <ReasoningTextDisplay text={reasoningText} />}
      </div>
    </div>
  )
}

// メモ化してpropsが変更されない限り再レンダリングしない
export const LoaderWithReasoning = memo(LoaderWithReasoningComponent)
LoaderWithReasoning.displayName = 'LoaderWithReasoning'
