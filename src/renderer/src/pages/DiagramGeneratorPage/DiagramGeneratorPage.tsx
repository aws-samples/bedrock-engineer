import { useState, useRef, useEffect, useMemo } from 'react'
import { DrawIoEmbed, DrawIoEmbedRef } from 'react-drawio'
import { useAgentChat } from '../ChatPage/hooks/useAgentChat'
import { TextArea } from '../ChatPage/components/InputForm/TextArea'
import useSetting from '@renderer/hooks/useSetting'
import { Loader } from '@renderer/components/Loader'
import { exampleDiagrams } from './example-diagrams'
import { useRecommendDiagrams } from './hooks/useRecommendDiagrams'
import { RecommendDiagrams } from './components/RecommendDiagrams'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { WebLoader } from '../../components/WebLoader'
import { DeepSearchButton } from '@renderer/components/DeepSearchButton'
import { extractDrawioXml } from './utils/xmlParser'

export default function DiagramGeneratorPage() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const [userInput, setUserInput] = useState('')
  const [xml, setXml] = useState(exampleDiagrams['serverless'])
  const [isComposing, setIsComposing] = useState(false)
  const drawioRef = useRef<DrawIoEmbedRef>(null)
  const { currentLLM: llm, sendMsgKey, enabledTools } = useSetting()

  // 検索機能の状態
  const [enableSearch, setEnableSearch] = useState(false)

  // 履歴管理用の状態
  const [diagramHistory, setDiagramHistory] = useState<{ xml: string; prompt: string }[]>([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)

  const { recommendDiagrams, recommendLoading, getRecommendDiagrams } = useRecommendDiagrams()

  const {
    t,
    i18n: { language }
  } = useTranslation()

  const getSystemPrompt = () => {
    const basePrompt = `You are an expert in creating AWS architecture diagrams.
When I describe a system, create a draw.io compatible XML diagram that represents the AWS architecture.

<rules>
* Please output only the XML content without any explanation or markdown formatting.
* Use appropriate AWS icons and connect them with meaningful relationships.
* The diagram should be clear, professional, and follow AWS architecture best practices.
* If you really can't express it, you can use a simple diagram with just rectangular blocks and lines.
* Try to keep ids and styles to a minimum and reduce the length of the prompt.
* Respond in the following languages: ${language}.
${enableSearch ? "* If the user's request requires specific information, use the tavilySearch tool to gather up-to-date information before creating the diagram." : ''}
</rules>

Here is example diagramm's xml:
<mxfile host="Electron" modified="2024-04-26T02:57:38.411Z" agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/21.6.5 Chrome/114.0.5735.243 Electron/25.3.1 Safari/537.36" etag="CPq7MrTHzLtlZ4ReLAo3" version="21.6.5" type="device">
  <diagram name="ページ1" id="x">
    <mxGraphModel dx="1194" dy="824" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="x-1" value="AWS Cloud" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;" vertex="1" parent="1">
          <mxGeometry x="260" y="220" width="570" height="290" as="geometry" />
        </mxCell>
        <mxCell id="x-2" value="AWS Lambda" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#F78E04;gradientDirection=north;fillColor=#D05C17;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;" vertex="1" parent="x-1">
          <mxGeometry x="270" y="110" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="x-4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="x-1" source="x-3" target="x-2">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-3" value="Amazon API Gateway" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#FF4F8B;gradientDirection=north;fillColor=#BC1356;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway;" vertex="1" parent="x-1">
          <mxGeometry x="90" y="110" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="x-7" value="Amazon DynamoDB" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#4D72F3;gradientDirection=north;fillColor=#3334B9;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb;" vertex="1" parent="x-1">
          <mxGeometry x="450" y="110" width="78" height="78" as="geometry" />
        </mxCell>
        <mxCell id="x-6" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="x-5" target="x-3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="x-5" value="Users" style="sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3D;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.users;" vertex="1" parent="1">
          <mxGeometry x="100" y="330" width="78" height="78" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`
    return basePrompt
  }

  const systemPrompt = getSystemPrompt()

  // 検索ツール用のカスタムエージェントID（実際には存在しない仮想ID）
  const diagramAgentId = 'diagramGenerator'

  // Diagram Generator Agent で利用可能なツールを定義
  // enableSearch が true の場合のみ tavilySearch ツールを有効にする
  const diagramAgentTools = useMemo(() => {
    if (!enableSearch) return []

    // enabledTools から tavilySearch ツールのみをフィルタリング
    return enabledTools.filter((tool) => tool.toolSpec?.name === 'tavilySearch')
  }, [enableSearch, enabledTools])

  const { messages, loading, handleSubmit, executingTool } = useAgentChat(
    llm?.modelId,
    systemPrompt,
    diagramAgentId,
    undefined,
    {
      enableHistory: false,
      tools: diagramAgentTools // 明示的にツール設定を渡す
    }
  )

  const onSubmit = (input: string) => {
    handleSubmit(input)
    setUserInput('')
    // 履歴から選択していた場合はリセット
    setSelectedHistoryIndex(null)
  }

  // システムプロンプトを検索状態に応じて更新
  useEffect(() => {
    // systemPromptは関数から取得するため、enableSearchが変更されたときに再レンダリングされる
  }, [enableSearch])

  // 最後のアシスタントメッセージから XML を取得して draw.io に設定
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()

    if (lastAssistantMessage?.content && !loading && drawioRef.current) {
      const rawContent = lastAssistantMessage.content
        .map((c) => ('text' in c ? c.text : ''))
        .join('')
      // XMLパーサーを使用して有効なDrawIO XMLだけを抽出
      const xml = extractDrawioXml(rawContent) || rawContent

      if (xml) {
        try {
          drawioRef.current.load({ xml })
          setXml(xml)
          // Generate new recommendations based on the current diagram
          getRecommendDiagrams(xml)

          // 履歴に追加
          if (lastUserMessage?.content) {
            const userPrompt = lastUserMessage.content
              .map((c) => ('text' in c ? c.text : ''))
              .join('')
            setDiagramHistory((prev) => {
              const newHistory = [...prev, { xml, prompt: userPrompt }]
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
          setUserInput(historyItem.prompt)
          setSelectedHistoryIndex(index)
        } catch (error) {
          console.error('Failed to load diagram from history:', error)
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] overflow-y-auto">
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
            </div>
          </div>
        </span>
      </div>

      <div className="flex-1 rounded-lg">
        {loading ? (
          <div className="flex h-[95%] justify-center items-center flex-col">
            {executingTool === 'tavilySearch' ? <WebLoader /> : <Loader />}
          </div>
        ) : (
          <div className="w-full h-[95%] border border-gray-200">
            <DrawIoEmbed
              ref={drawioRef}
              xml={xml}
              configuration={{
                defaultLibraries: 'aws4;aws3;aws3d'
              }}
              urlParameters={{
                dark: isDark,
                lang: language
              }}
            />
          </div>
        )}
      </div>

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
              <DeepSearchButton
                enableDeepSearch={enableSearch}
                handleToggleDeepSearch={() => setEnableSearch(!enableSearch)}
              />
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
