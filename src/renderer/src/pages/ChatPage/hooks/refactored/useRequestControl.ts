import { useRef, useCallback, useEffect } from 'react'

export interface UseRequestControlReturn {
  abortCurrentRequest: () => void
  createNewAbortController: () => AbortController
  getCurrentSignal: () => AbortSignal | null
  isRequestActive: () => boolean
}

export const useRequestControl = (): UseRequestControlReturn => {
  const abortController = useRef<AbortController | null>(null)

  // 現在の通信を中断する関数
  const abortCurrentRequest = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
  }, [])

  // 新しい AbortController を作成する関数
  const createNewAbortController = useCallback(() => {
    // 既存のコントローラーがあれば中断
    abortCurrentRequest()
    
    // 新しい AbortController を作成
    abortController.current = new AbortController()
    return abortController.current
  }, [abortCurrentRequest])

  // 現在のシグナルを取得
  const getCurrentSignal = useCallback((): AbortSignal | null => {
    return abortController.current?.signal || null
  }, [])

  // リクエストがアクティブかどうかを判定
  const isRequestActive = useCallback((): boolean => {
    return abortController.current !== null && !abortController.current.signal.aborted
  }, [])

  // コンポーネントのアンマウント時にアクティブな通信を中断
  useEffect(() => {
    return () => {
      abortCurrentRequest()
    }
  }, [abortCurrentRequest])

  return {
    abortCurrentRequest,
    createNewAbortController,
    getCurrentSignal,
    isRequestActive
  }
}