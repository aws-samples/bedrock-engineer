import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MdExpandMore } from 'react-icons/md'

interface ReasoningContentProps {
  content: any
  isLoading?: boolean
}

// スクロールイベントをデバウンスする関数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 秒数表示のためのユーティリティ関数
const formatElapsedSeconds = (seconds: number): string => {
  return `${seconds}s`
}

export const ReasoningContent: React.FC<ReasoningContentProps> = ({
  content,
  isLoading = false
}) => {
  // デフォルトでは閉じた状態
  const [isExpanded, setIsExpanded] = useState(false)
  // ユーザーが手動でスクロールしたかどうかのフラグ
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  // 前回のスクロール更新時間を追跡
  const lastScrollTimeRef = useRef<number>(0)
  // アニメーションフレーム用のID
  const scrollAnimationRef = useRef<number | null>(null)
  // 経過秒数を追跡する
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  // 思考時間のカウンターを表示するかどうか
  const [showThinkingCounter, setShowThinkingCounter] = useState(false)
  // 思考開始時間を追跡する
  const thinkingStartTimeRef = useRef<number | null>(null)
  // 秒数表示のトランジション状態
  const [counterTransition, setCounterTransition] = useState(false)

  // テキストコンテンツを抽出（再帰的に処理）- メモ化
  const extractTextContent = useCallback((data: any): string => {
    // nullまたはundefinedの場合は空文字を返す
    if (data == null) return ''

    // 直接文字列ならそのまま返す
    if (typeof data === 'string') {
      return data
    }

    // オブジェクトの場合、特定のプロパティを検索
    if (typeof data === 'object') {
      // textプロパティの処理（直接アクセスする場合はstringであることを確認）
      if ('text' in data && typeof data.text === 'string') {
        return data.text
      }

      // textプロパティが入れ子のオブジェクトの場合は再帰的に処理
      if ('text' in data && typeof data.text === 'object') {
        return extractTextContent(data.text)
      }

      // reasoningTextプロパティがある場合
      if ('reasoningText' in data && typeof data.reasoningText === 'string') {
        return data.reasoningText
      }

      // contentプロパティがある場合
      if ('content' in data && typeof data.content === 'string') {
        return data.content
      }

      // 「text」や「signature」などの特定のキーを持つオブジェクトの場合
      // textの値を優先的に返す
      if ('text' in data) {
        return String(data.text || '')
      }

      // すべてのキーに対して再帰的に処理し、最初に見つかった非空の文字列を返す
      for (const key of Object.keys(data)) {
        const extracted = extractTextContent(data[key])
        if (extracted) return extracted
      }
    }

    // それ以外の場合は空文字列を返す（または文字列に変換）
    return String(data || '')
  }, [])

  const textContent = useMemo(() => extractTextContent(content), [content, extractTextContent])
  const textAreaRef = useRef<HTMLDivElement>(null)

  // スクロール位置がボトムに近いかどうかをチェック
  const isNearBottom = useCallback((): boolean => {
    if (!textAreaRef.current) return true

    const { scrollTop, scrollHeight, clientHeight } = textAreaRef.current
    // ボトムから20px以内ならボトムに近いと見なす
    const scrollThreshold = 20
    return scrollHeight - scrollTop - clientHeight <= scrollThreshold
  }, [])

  // スムーズスクロール関数
  const smoothScrollToBottom = useCallback(() => {
    if (!textAreaRef.current || scrollAnimationRef.current !== null) return

    const startTime = performance.now()
    const startScrollTop = textAreaRef.current.scrollTop
    const targetScrollTop = textAreaRef.current.scrollHeight
    const duration = 300 // スクロール期間（ms）

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      if (elapsedTime >= duration) {
        if (textAreaRef.current) {
          textAreaRef.current.scrollTop = targetScrollTop
        }
        scrollAnimationRef.current = null
        return
      }

      // イージング関数 - easeOutQuad
      const progress = elapsedTime / duration
      const easeProgress = -progress * (progress - 2)

      if (textAreaRef.current) {
        const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easeProgress
        textAreaRef.current.scrollTop = currentScrollTop
      }

      scrollAnimationRef.current = requestAnimationFrame(animateScroll)
    }

    scrollAnimationRef.current = requestAnimationFrame(animateScroll)
  }, [])

  // スクロールアニメーションのキャンセル
  const cancelScrollAnimation = useCallback(() => {
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }
  }, [])

  // スクロールイベントハンドラ（デバウンス適用）
  const handleScroll = useMemo(
    () =>
      debounce(() => {
        // スクロール中はアニメーションをキャンセル
        cancelScrollAnimation()

        // スロットリングの適用（16ms = 約60fps）
        const now = Date.now()
        if (now - lastScrollTimeRef.current < 16) return
        lastScrollTimeRef.current = now

        if (textAreaRef.current) {
          // ボトムに近い場合、ユーザースクロールフラグをリセット
          if (isNearBottom()) {
            setUserHasScrolled(false)
          } else {
            setUserHasScrolled(true)
          }
        }
      }, 200),
    [isNearBottom, cancelScrollAnimation]
  ) // 200msのデバウンス

  // スクロールイベントリスナーの設定と解除
  useEffect(() => {
    const textArea = textAreaRef.current
    if (textArea) {
      textArea.addEventListener('scroll', handleScroll)
      return () => {
        textArea.removeEventListener('scroll', handleScroll)
        cancelScrollAnimation()
      }
    }
    return () => {} // 空の関数を返して、すべてのパスで戻り値があることを保証
  }, [handleScroll, cancelScrollAnimation])

  // テキストが追加されるたびに自動スクロール（ユーザーがスクロールしていない場合のみ）
  useEffect(() => {
    if (textAreaRef.current && isExpanded && !userHasScrolled) {
      // 現在のスクロール位置がすでにボトム近くならすぐにスクロール、そうでなければスムーズスクロール
      if (isNearBottom()) {
        textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight
      } else {
        smoothScrollToBottom()
      }
    }
  }, [textContent, isExpanded, userHasScrolled, isNearBottom, smoothScrollToBottom])

  // 展開状態が変更されたとき、ユーザースクロールフラグをリセット
  useEffect(() => {
    if (isExpanded) {
      setUserHasScrolled(false)
      if (textAreaRef.current) {
        // スムーズにスクロール
        smoothScrollToBottom()
      }
    } else {
      // 閉じるときはアニメーションをキャンセル
      cancelScrollAnimation()
    }

    return () => {
      // クリーンアップ時にアニメーションをキャンセル
      cancelScrollAnimation()
    }
  }, [isExpanded, smoothScrollToBottom, cancelScrollAnimation])

  // コンポーネント間マウント時とアンマウント時にアニメーションをクリーンアップ
  useEffect(() => {
    return () => {
      cancelScrollAnimation()
    }
  }, [cancelScrollAnimation])

  // 思考時間の追跡と秒数表示を管理
  useEffect(() => {
    let secondsTimer: ReturnType<typeof setInterval> | null = null
    let initialDelayTimer: ReturnType<typeof setTimeout> | null = null

    if (isLoading) {
      // ローディング開始時に思考開始時間を記録
      if (thinkingStartTimeRef.current === null) {
        thinkingStartTimeRef.current = Date.now()
      }

      // 5秒後に秒数カウンターの表示を開始
      initialDelayTimer = setTimeout(() => {
        if (isLoading) {
          setShowThinkingCounter(true)

          // 1秒ごとに秒数を更新
          secondsTimer = setInterval(() => {
            const currentTime = Date.now()
            const startTime = thinkingStartTimeRef.current || currentTime
            const seconds = Math.floor((currentTime - startTime) / 1000)

            // トランジションアニメーションのために
            setCounterTransition(true)
            setTimeout(() => {
              setElapsedSeconds(seconds)
              setCounterTransition(false)
            }, 150) // 150msのトランジション時間
          }, 1000)
        }
      }, 5000) // 5秒後に秒数表示を開始
    } else {
      // ローディングが終わったらリセット
      thinkingStartTimeRef.current = null
      setShowThinkingCounter(false)
      setElapsedSeconds(0)
    }

    // クリーンアップ関数
    return () => {
      if (initialDelayTimer) clearTimeout(initialDelayTimer)
      if (secondsTimer) clearInterval(secondsTimer)
    }
  }, [isLoading])

  // データが空の場合かつローディング中でなければ表示しない
  if (!textContent && !isLoading) {
    return null
  }

  const ReasoningText = useCallback(() => {
    if (!isLoading) {
      return <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Reasoning</span>
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 bg-[length:200%_100%] animate-gradient-x bg-clip-text text-transparent">
          Reasoning
        </span>
        {showThinkingCounter && (
          <span
            className={`text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-150 ease-in-out`}
          >
            {formatElapsedSeconds(elapsedSeconds)}
          </span>
        )}
      </div>
    )
  }, [isLoading, showThinkingCounter, elapsedSeconds, counterTransition])

  return (
    <div>
      <div
        className="flex items-center space-x-1 cursor-pointer mb-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ReasoningText />
        <MdExpandMore
          className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''} text-gray-500 text-xs`}
          size={14}
        />
      </div>

      {/* 展開可能なコンテンツ */}
      <div
        className={`transition-all duration-300 rounded-lg overflow-hidden ${
          isExpanded
            ? 'max-h-[25rem] opacity-100 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 backdrop-blur-sm'
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3">
          {textContent && (
            <div
              ref={textAreaRef}
              className="pb-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-light overflow-y-auto pr-2 max-h-[25rem] will-change-scroll transform-gpu"
            >
              {textContent}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
