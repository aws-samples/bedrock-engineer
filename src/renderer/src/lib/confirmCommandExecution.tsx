import { createRoot, Root } from 'react-dom/client'
import { Modal } from 'flowbite-react'
import i18n from '@renderer/i18n/config'

export const COMMAND_DENIED_MESSAGE = 'User denied execution of this command.'

interface CommandRequest {
  command?: string
  cwd?: string
  pid?: number
  stdin?: string
}

/**
 * executeCommand ツールの入力かどうか（新規コマンド or 既存プロセスへの stdin 送信）
 */
export const needsCommandConfirmation = (toolInput: { type?: string }): boolean =>
  toolInput.type === 'executeCommand'

// ExecuteCommandTool と同じ条件で stdin 送信かどうかを判定する（pid と stdin があれば stdin 送信が優先される）
const isStdinRequest = (request: CommandRequest): boolean => 'pid' in request && 'stdin' in request

// 表示中の確認モーダル（中断時にまとめて拒否するため）
const pendingConfirmations = new Set<(allowed: boolean) => void>()

/**
 * 表示中の確認モーダルをすべて閉じて拒否扱いにする（生成停止・画面遷移時）
 */
export const cancelPendingCommandConfirmations = (): void => {
  for (const finish of [...pendingConfirmations]) {
    finish(false)
  }
}

interface DialogProps {
  request: CommandRequest
  onResult: (allowed: boolean) => void
}

const ConfirmCommandDialog = ({ request, onResult }: DialogProps) => {
  const t = i18n.t.bind(i18n)
  const isStdin = isStdinRequest(request)
  return (
    <Modal show size="2xl" onClose={() => onResult(false)}>
      <Modal.Header>{t('confirmCommand.title')}</Modal.Header>
      <Modal.Body>
        <p className="text-sm text-gray-700 dark:text-white pb-2">
          {t(isStdin ? 'confirmCommand.descriptionStdin' : 'confirmCommand.description')}
        </p>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
          {t(isStdin ? 'confirmCommand.stdin' : 'confirmCommand.command')}
          {isStdin && request.pid !== undefined ? ` (pid: ${request.pid})` : ''}
        </p>
        <pre className="whitespace-pre-wrap break-all max-h-64 overflow-auto p-3 mb-3 rounded bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
          {isStdin ? request.stdin : request.command}
        </pre>
        {request.cwd && (
          <>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
              {t('confirmCommand.cwd')}
            </p>
            <pre className="whitespace-pre-wrap break-all p-3 rounded bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white">
              {request.cwd}
            </pre>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-end gap-2 w-full">
          <button
            onClick={() => onResult(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            {t('confirmCommand.deny')}
          </button>
          <button
            onClick={() => onResult(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {t('confirmCommand.allow')}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}

// 確認モーダルを 1 件ずつ表示するための待ち行列（並列のツール呼び出しでモーダルが重ならないように）
let confirmationQueue: Promise<void> = Promise.resolve()

/**
 * コマンド実行前にユーザー確認モーダルを表示する。Allow で true、Deny/閉じる で false。
 * 複数の確認が同時に要求された場合は順番に 1 件ずつ表示する。
 * timeoutMs を指定した場合、要求から時間内に応答がなければ拒否扱いで閉じる（表示待ちの間も含む）。
 */
export const confirmCommandExecution = (
  request: CommandRequest,
  options: { timeoutMs?: number } = {}
): Promise<boolean> =>
  new Promise((resolve) => {
    let root: Root | undefined
    let container: HTMLDivElement | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let finished = false
    let releaseQueue: () => void = () => {}
    const onResult = (allowed: boolean) => {
      if (finished) return
      finished = true
      if (timer) clearTimeout(timer)
      pendingConfirmations.delete(onResult)
      root?.unmount()
      container?.remove()
      releaseQueue()
      resolve(allowed)
    }
    pendingConfirmations.add(onResult)
    if (options.timeoutMs !== undefined) {
      timer = setTimeout(() => onResult(false), options.timeoutMs)
    }

    confirmationQueue = confirmationQueue.then(
      () =>
        new Promise<void>((release) => {
          // 表示待ちの間に拒否・タイムアウト済みなら表示しない
          if (finished) {
            release()
            return
          }
          releaseQueue = release
          container = document.createElement('div')
          document.body.appendChild(container)
          root = createRoot(container)
          root.render(<ConfirmCommandDialog request={request} onResult={onResult} />)
        })
    )
  })
