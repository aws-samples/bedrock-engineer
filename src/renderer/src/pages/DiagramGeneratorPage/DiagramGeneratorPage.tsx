import { useState, useRef, useEffect, useMemo } from 'react'
import { DrawIoEmbed, DrawIoEmbedRef } from 'react-drawio'
import { useAgentChat } from '../ChatPage/hooks/useAgentChat'
import { TextArea, AttachedImage } from '../ChatPage/components/InputForm/TextArea'
import useSetting from '@renderer/hooks/useSetting'
import { Loader } from '@renderer/components/Loader'
import { exampleDiagrams } from './example-diagrams'
import { useRecommendDiagrams } from './hooks/useRecommendDiagrams'
import { RecommendDiagrams } from './components/RecommendDiagrams'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { WebLoader } from '../../components/WebLoader'
import { DeepSearchButton } from '@renderer/components/DeepSearchButton'
import {
  extractDiagramContent,
  extractDrawioXml,
  filterXmlFromStreamingContent,
  containsXmlTags,
  isXmlComplete
} from './utils/xmlParser'
import {
  calculateXmlProgress,
  calculateTimeBasedProgress,
  getProgressMessage
} from './utils/progressCalculator'
import { DIAGRAM_GENERATOR_SYSTEM_PROMPT } from '../ChatPage/constants/DEFAULT_AGENTS'
import { LoaderWithReasoning } from './components/LoaderWithReasoning'
import { DiagramExplanationView } from './components/DiagramExplanationView'
import { MdOutlineArticle } from 'react-icons/md'
import { Tooltip } from 'flowbite-react'

export default function DiagramGeneratorPage() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const [userInput, setUserInput] = useState('')
  const [xml, setXml] = useState(exampleDiagrams['serverless'])
  const [isComposing, setIsComposing] = useState(false)
  const drawioRef = useRef<DrawIoEmbedRef>(null)
  const { currentLLM: llm, sendMsgKey, getAgentTools, enabledTavilySearch } = useSetting()

  // 検索機能の状態
  const [enableSearch, setEnableSearch] = useState(false)

  // 履歴管理用の状態
  const [diagramHistory, setDiagramHistory] = useState<
    { xml: string; explanation: string; prompt: string }[]
  >([])
  // 説明文の表示・非表示を切り替えるためのフラグ
  const [showExplanation, setShowExplanation] = useState(true)
  // 説明文を保持する状態
  const [diagramExplanation, setDiagramExplanation] = useState<string>('')
  // ストリーミング中の説明文を保持する状態
  const [streamingExplanation, setStreamingExplanation] = useState<string>('')
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)

  // 進捗管理用の状態
  const [generationStartTime, setGenerationStartTime] = useState<number>(0)
  const [xmlProgress, setXmlProgress] = useState<number>(0)
  const [progressMessage, setProgressMessage] = useState<string>('')

  // XML生成専用の状態管理
  const [xmlLoading, setXmlLoading] = useState(false)
  const [hasValidXml, setHasValidXml] = useState(false)
  // 新しいリクエスト状態フラグ
  const [isNewRequest, setIsNewRequest] = useState(false)

  const { recommendDiagrams, recommendLoading, getRecommendDiagrams } = useRecommendDiagrams()

  const {
    t,
    i18n: { language }
  } = useTranslation()

  // カスタムシステムプロンプトを定義 - 言語設定と検索機能の有効化に対応
  const getSystemPrompt = () => {
    // デフォルトのプロンプトをベースに言語設定と検索機能の状態に応じて調整
    let basePrompt = DIAGRAM_GENERATOR_SYSTEM_PROMPT

    // 言語設定を追加
    basePrompt = basePrompt.replace(
      'Respond in the following languages included in the user request.',
      `Respond in the following languages: ${language}.`
    )

    // 検索機能が無効の場合、関連する部分を削除
    if (!enableSearch) {
      basePrompt = basePrompt.replace(
        "* If the user's request requires specific information, use the tavilySearch tool to gather up-to-date information before creating the diagram.",
        ''
      )
    }

    return basePrompt
  }

  const systemPrompt = getSystemPrompt()

  // ダイアグラム生成用のエージェントID
  const diagramAgentId = 'diagramGeneratorAgent'

  // Diagram Generator Agent で利用可能なツールを定義
  // enableSearch が true の場合のみ tavilySearch ツールを有効にする
  const diagramAgentTools = useMemo(() => {
    const agentTools = getAgentTools(diagramAgentId)

    if (enableSearch) {
      // diagramAgentIdからツールを取得し、tavilySearch ツールをフィルタリング
      return agentTools.filter((tool) => tool.toolSpec?.name === 'tavilySearch' && tool.enabled)
    }

    return agentTools
  }, [enableSearch, getAgentTools, diagramAgentId])

  const { messages, loading, handleSubmit, executingTool, latestReasoningText } = useAgentChat(
    llm?.modelId,
    systemPrompt,
    diagramAgentId,
    undefined,
    {
      enableHistory: false,
      tools: diagramAgentTools // 明示的にツール設定を渡す
    }
  )

  const onSubmit = (input: string, images?: AttachedImage[]) => {
    handleSubmit(input, images)
    setUserInput('')
    // 履歴から選択していた場合はリセット
    setSelectedHistoryIndex(null)
    // 生成開始時間を記録
    setGenerationStartTime(Date.now())
    setXmlProgress(0)
    setProgressMessage('')
    // XML生成状態をリセット
    setXmlLoading(true)
    setHasValidXml(false)
    // 新しいリクエスト開始フラグを設定
    setIsNewRequest(true)
    // 既存のダイアグラムをクリアして即座にローダーを表示
    setXml('')
    setDiagramExplanation('')
  }

  // システムプロンプトを検索状態に応じて更新
  useEffect(() => {
    // systemPromptは関数から取得するため、enableSearchが変更されたときに再レンダリングされる
  }, [enableSearch])

  // ストリーミング中の説明文を抽出・更新
  useEffect(() => {
    if (loading && messages.length > 0) {
      const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()
      if (lastAssistantMessage?.content) {
        const currentText = lastAssistantMessage.content
          .map((c) => ('text' in c ? c.text : ''))
          .join('')

        // ストリーミング中の部分的なテキストを設定
        setStreamingExplanation(currentText)

        // ストリーミング中にXMLが利用可能になったら即座に反映
        if (xmlLoading && !hasValidXml && drawioRef.current) {
          const extractedXml = extractDrawioXml(currentText)
          console.log('[DEBUG] XML extraction attempt:', {
            xmlLoading,
            hasValidXml,
            drawioRefExists: !!drawioRef.current,
            extractedXmlLength: extractedXml?.length || 0,
            containsXmlTags: containsXmlTags(currentText),
            isXmlComplete: isXmlComplete(currentText),
            textPreview: currentText.substring(0, 200) + '...'
          })

          if (extractedXml) {
            try {
              console.log('[DEBUG] Loading XML to drawio:', extractedXml.substring(0, 200) + '...')
              drawioRef.current.load({ xml: extractedXml })
              setXml(extractedXml)
              setHasValidXml(true)
              setXmlLoading(false)
              console.log('[DEBUG] XML loaded successfully, updated states')
            } catch (error) {
              console.error('Failed to load streaming XML:', error)
            }
          }
        }
      }
    } else if (!loading) {
      // ローディングが終了したらストリーミング状態をクリア
      setStreamingExplanation('')
      setXmlProgress(0)
      setProgressMessage('')
      // XML状態もリセット
      setXmlLoading(false)
      setHasValidXml(false)
      // 新しいリクエスト状態もリセット
      setIsNewRequest(false)
    }
  }, [messages, loading, xmlLoading, hasValidXml])

  // XMLステートの変更を監視してdrawioに反映
  useEffect(() => {
    if (xml && drawioRef.current) {
      console.log('[DEBUG] XML state changed, updating drawio:', xml.substring(0, 200) + '...')
      try {
        drawioRef.current.load({ xml })
        console.log('[DEBUG] DrawIO updated successfully')
      } catch (error) {
        console.error('[DEBUG] Failed to update DrawIO with new XML:', error)
      }
    }
  }, [xml])

  // XML生成状態を判定
  const isXmlGenerating = useMemo(() => {
    if (loading && streamingExplanation) {
      return containsXmlTags(streamingExplanation) && !isXmlComplete(streamingExplanation)
    }
    return false
  }, [loading, streamingExplanation])

  // XML生成進捗の計算と更新
  useEffect(() => {
    if (loading && isXmlGenerating && streamingExplanation) {
      // XMLの進捗を計算
      const baseProgress = calculateXmlProgress(streamingExplanation)

      // 時間ベースの補正を適用
      const timeAdjustedProgress =
        generationStartTime > 0
          ? calculateTimeBasedProgress(generationStartTime, baseProgress)
          : baseProgress

      setXmlProgress(timeAdjustedProgress)
      setProgressMessage(getProgressMessage(timeAdjustedProgress))
    } else if (!loading) {
      // 生成完了時は100%に設定
      if (xmlProgress > 0) {
        setXmlProgress(100)
        setProgressMessage('ダイアグラム生成完了')

        // 少し遅延してからリセット
        setTimeout(() => {
          setXmlProgress(0)
          setProgressMessage('')
        }, 1000)
      }
    }
  }, [loading, isXmlGenerating, streamingExplanation, generationStartTime, xmlProgress])

  // XMLタグを除去した説明文
  const filteredExplanation = useMemo(() => {
    if (loading && streamingExplanation) {
      return filterXmlFromStreamingContent(streamingExplanation)
    }
    return streamingExplanation
  }, [loading, streamingExplanation])

  // 最後のアシスタントメッセージから XML を取得して draw.io に設定
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()

    if (lastAssistantMessage?.content && !loading && drawioRef.current) {
      const rawContent = lastAssistantMessage.content
        .map((c) => ('text' in c ? c.text : ''))
        .join('')

      // XMLと説明文を分離するパーサーを使用
      const { xml, explanation } = extractDiagramContent(rawContent)
      const validXml = xml || rawContent

      if (validXml) {
        try {
          drawioRef.current.load({ xml: validXml })
          setXml(validXml)
          // 説明文を設定
          setDiagramExplanation(explanation)
          // Generate new recommendations based on the current diagram
          getRecommendDiagrams(validXml)

          // 履歴に追加
          if (lastUserMessage?.content) {
            const userPrompt = lastUserMessage.content
              .map((c) => ('text' in c ? c.text : ''))
              .join('')
            setDiagramHistory((prev) => {
              const newHistory = [...prev, { xml: validXml, explanation, prompt: userPrompt }]
              // 最大10つまで保持
              return newHistory.slice(-10)
            })
          }
        } catch (error) {
          console.error('Failed to load diagram:', error)
          // XMLの解析に失敗した場合、エラーメッセージをコンソールに表示
          console.error('Invalid XML content:', rawContent)
        }
      }
    }
  }, [messages, loading])

  // 履歴からダイアグラムを読み込む関数
  const loadDiagramFromHistory = (index: number) => {
    if (diagramHistory[index]) {
      const historyItem = diagramHistory[index]
      if (drawioRef.current) {
        try {
          drawioRef.current.load({ xml: historyItem.xml })
          setXml(historyItem.xml)
          setDiagramExplanation(historyItem.explanation)
          setUserInput(historyItem.prompt)
          setSelectedHistoryIndex(index)
        } catch (error) {
          console.error('Failed to load diagram from history:', error)
        }
      }
    }
  }

  // 説明文表示の切り替え
  const toggleExplanationView = () => {
    setShowExplanation(!showExplanation)
  }

  return (
    <div className="flex flex-col p-3 h-[calc(100vh-14rem)]">
      {/* Header */}
      <div className="flex pb-2 justify-between">
        <span className="font-bold flex flex-col gap-2 w-full">
          <div className="flex justify-between">
            <h1 className="content-center dark:text-white text-lg">Diagram Generator</h1>
          </div>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {diagramHistory.map((_history, index) => (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  key={index}
                  className={`p-1 px-3 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 dark:text-white ${
                    selectedHistoryIndex === index
                      ? 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-600'
                  }`}
                  onClick={() => loadDiagramFromHistory(index)}
                >
                  {index + 1}
                </motion.span>
              ))}
              {diagramHistory.length === 0 && (
                <span className="text-sm text-gray-800 dark:text-gray-400 font-medium">
                  Turn your ideas into visuals. Easily make diagrams, blueprints, flowcharts, and
                  other visual materials you need.
                </span>
              )}
            </div>
          </div>
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 rounded-lg">
        <div
          className="w-full h-[calc(calc(100vh-14rem)-5rem)] flex overflow-y-auto"
          style={{
            gap: '1rem',
            backgroundColor: isDark
              ? 'rgb(17 24 39 / var(--tw-bg-opacity))'
              : 'rgb(243 244 246 / var(--tw-bg-opacity))',
            border: 'none'
          }}
        >
          {/* 図の表示エリア - 左側 */}
          <div className={`h-full ${showExplanation ? 'w-2/3' : 'w-full'} relative`}>
            {/* DrawIoEmbedを常にマウントしておく */}
            <div
              style={{
                visibility: xmlLoading || (loading && !xml) ? 'hidden' : 'visible',
                width: '100%',
                height: '100%'
              }}
            >
              <DrawIoEmbed
                ref={drawioRef}
                xml={xml}
                configuration={{
                  defaultLibraries: 'aws4;aws3;aws3d',
                  sidebarWidth: 140
                }}
                urlParameters={{
                  dark: isDark,
                  lang: language
                }}
              />
            </div>

            {/* ローダーをオーバーレイとして表示 */}
            {(() => {
              const shouldShowLoader = isNewRequest || xmlLoading || (loading && !xml)
              return shouldShowLoader ? (
                <div className="absolute inset-0 flex h-full justify-center items-center flex-col bg-gray-50 dark:bg-gray-900">
                  <LoaderWithReasoning
                    reasoningText={latestReasoningText}
                    progress={isXmlGenerating ? xmlProgress : undefined}
                    progressMessage={isXmlGenerating ? progressMessage : undefined}
                    showProgress={isXmlGenerating}
                  >
                    {executingTool === 'tavilySearch' ? <WebLoader /> : <Loader />}
                  </LoaderWithReasoning>
                </div>
              ) : null
            })()}
          </div>

          {/* 説明文の表示エリア - 右側 */}
          {showExplanation && (
            <div className="w-1/3 h-full">
              <DiagramExplanationView
                explanation={
                  loading && filteredExplanation
                    ? filteredExplanation
                    : diagramExplanation || 'ダイアグラムの説明がここに表示されます。'
                }
                isStreaming={loading && filteredExplanation.length > 0}
                isVisible={showExplanation}
                onClose={toggleExplanationView}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 fixed bottom-0 left-[5rem] right-5 bottom-3">
        <div className="relative w-full">
          <div className="flex gap-2 justify-between pb-2">
            <div className="overflow-x-auto flex-grow w-full">
              <RecommendDiagrams
                loading={recommendLoading}
                recommendations={recommendDiagrams}
                onSelect={setUserInput}
                loadingText={t('addRecommend', 'Generating recommendations...')}
              />
            </div>

            <div className="flex gap-3 items-center">
              {enabledTavilySearch && (
                <DeepSearchButton
                  enableDeepSearch={enableSearch}
                  handleToggleDeepSearch={() => setEnableSearch(!enableSearch)}
                />
              )}
              {/* 説明文表示切り替えボタン */}
              <Tooltip content={showExplanation ? 'Hide' : 'Show'} animation="duration-500">
                <button
                  className={`cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    showExplanation ? 'bg-gray-200 dark:bg-gray-700' : ''
                  }`}
                  onClick={toggleExplanationView}
                >
                  <MdOutlineArticle className="text-xl" />
                </button>
              </Tooltip>
            </div>
          </div>

          <TextArea
            value={userInput}
            onChange={setUserInput}
            disabled={loading}
            onSubmit={onSubmit}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
          />
        </div>
      </div>
    </div>
  )
}
