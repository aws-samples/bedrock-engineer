import { useState, useRef, useEffect } from 'react'
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
import { AwsCliButton } from '@renderer/components/AwsCliButton'
import { extractDrawioXml, extractExplanationText } from './utils/xmlParser'
import MD from '@renderer/components/Markdown/MD'
import { AWSResearchLoader } from '@renderer/components/AWSResearchLoader'
import { useSystemPromptModal } from '../ChatPage/modals/useSystemPromptModal'

export default function AwsDiagramGeneratorPage() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const [userInput, setUserInput] = useState('')
  const [xml, setXml] = useState(exampleDiagrams['serverless'])
  const [isComposing, setIsComposing] = useState(false)
  const drawioRef = useRef<DrawIoEmbedRef>(null)
  const {
    currentLLM: llm,
    sendMsgKey,
    enabledTools,
    allowedCommands,
    setAllowedCommands
  } = useSetting()

  // 検索機能の状態
  const [enableSearch, setEnableSearch] = useState(false)

  // AWS CLI機能の状態
  const [enableAwsCli, setEnableAwsCli] = useState(false)

  // 履歴管理用の状態
  const [diagramHistory, setDiagramHistory] = useState<
    { xml: string; prompt: string; explanation: string }[]
  >([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)

  const { recommendDiagrams, recommendLoading, getRecommendDiagrams } = useRecommendDiagrams()

  const {
    t,
    i18n: { language }
  } = useTranslation()
  const defaultExplanationText = t('defaultExplanation')
  const [explanationText, setExplanationText] = useState(defaultExplanationText) // 説明文を保存する状態変数
  const [showExplanation, setShowExplanation] = useState(false) // 説明文の表示/非表示を切り替える状態変数

  const getSystemPrompt = () => {
    const basePrompt = `You are an expert in creating AWS architecture diagrams.

1. First, provide a brief explanation of what information you're going to collect
2. Then, execute AWS CLI commands step by step to gather information
3. Finally, create a draw.io compatible XML diagram that represents the AWS architecture

**Here is Rules:**
- Use appropriate AWS icons and connect them with meaningful relationships
- Group resources by region in the diagram
- The diagram should be clear, professional, and follow AWS architecture best practices
- Respond in the following languages: ${language}
${enableSearch ? '- If you need additional information, use the tavilySearch tool' : ''}
${
  enableAwsCli
    ? `- If you need to analyze your current AWS environment, use the executeCommand tool to run AWS CLI commands.
    - **Available AWS CLI commands for resource discovery:**
      - aws ec2 describe-regions
      - aws ec2 describe-instances --region <region>
      - aws ec2 describe-vpcs --region <region>
      - aws ec2 describe-subnets --region <region>
      - aws ec2 describe-security-groups --region <region>
      - aws s3api list-buckets
      - aws rds describe-db-instances --region <region>
      - aws lambda list-functions --region <region>
      - aws apigateway get-rest-apis --region <region>
      - aws dynamodb list-tables --region <region>
      - aws elbv2 describe-load-balancers --region <region>
`
    : ''
}

${
  enableAwsCli
    ? `**When analyzing AWS environments, you will:**
1. First, get a list of available regions using 'aws ec2 describe-regions'
2. For each region, collect resource information using AWS CLI commands
3. Create a comprehensive diagram showing the AWS architecture`
    : ''
}

**Here is example diagramm's xml**:
\`\`\`
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
\`\`\`
`
    return basePrompt
  }

  const systemPrompt = getSystemPrompt()

  // 検索ツールを設定
  const tools = enabledTools.filter(
    (tool) =>
      (enableSearch && tool.toolSpec?.name === 'tavilySearch') ||
      (enableAwsCli && tool.toolSpec?.name === 'executeCommand')
  )

  const { messages, loading, handleSubmit, executingTool } = useAgentChat(
    llm?.modelId,
    systemPrompt,
    tools,
    undefined,
    { enableHistory: false }
  )

  useEffect(() => {
    if (enableAwsCli) {
      // AWS CLIコマンドの定義
      const awsCommands = [
        {
          pattern: 'aws ec2 describe-regions --output json',
          description: 'Get AWS regions list'
        },
        {
          pattern: 'aws ec2 describe-instances --region *',
          description: 'Get EC2 instances in a region'
        },
        {
          pattern: 'aws ec2 describe-vpcs --region *',
          description: 'Get VPCs in a region'
        },
        {
          pattern: 'aws ec2 describe-subnets --region *',
          description: 'Get subnets in a region'
        },
        {
          pattern: 'aws ec2 describe-security-groups --region *',
          description: 'Get security groups in a region'
        },
        {
          pattern: 'aws s3api list-buckets',
          description: 'List S3 buckets'
        },
        {
          pattern: 'aws rds describe-db-instances --region *',
          description: 'Get RDS instances in a region'
        },
        {
          pattern: 'aws lambda list-functions --region *',
          description: 'Get Lambda functions in a region'
        },
        {
          pattern: 'aws apigateway get-rest-apis --region *',
          description: 'Get API Gateway APIs in a region'
        },
        {
          pattern: 'aws dynamodb list-tables --region *',
          description: 'Get DynamoDB tables in a region'
        },
        {
          pattern: 'aws elbv2 describe-load-balancers --region *',
          description: 'Get load balancers in a region'
        }
      ]

      // 既存のコマンドと重複しないものだけを追加
      const newCommands = awsCommands.filter(
        (newCmd) => !allowedCommands.some((existingCmd) => existingCmd.pattern === newCmd.pattern)
      )

      if (newCommands.length > 0) {
        setAllowedCommands([...allowedCommands, ...newCommands])
      }
    } else {
      // AWS CLI機能が無効な場合は、AWS CLIコマンドを許可リストから削除
      setAllowedCommands(allowedCommands.filter((cmd) => !cmd.pattern.startsWith('aws ')))
    }
  }, [enableAwsCli])

  const onSubmit = (input: string) => {
    handleSubmit(input)
    setUserInput('')
    // 履歴から選択していた場合はリセット
    setSelectedHistoryIndex(null)
  }

  const {
    show: showSystemPromptModal,
    handleClose: handleCloseSystemPromptModal,
    handleOpen: handleOpenSystemPromptModal,
    SystemPromptModal
  } = useSystemPromptModal()

  // 最後のアシスタントメッセージから XML を取得して draw.io に設定
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()

    if (lastAssistantMessage?.content) {
      const rawContent = lastAssistantMessage.content
        .map((c) => ('text' in c ? c.text : ''))
        .join('')

      // 説明文を抽出して状態に保存（ストリーミング中でも更新）
      const explanation = extractExplanationText(rawContent)

      // TODO: Tool の実行結果表示は後日
      // // 直前のツール実行結果を取得
      // const getLastToolResults = () => {
      //   for (let i = messages.length - 1; i >= 0; i--) {
      //     const message = messages[i]
      //     if (message.role === 'user' && message.content) {
      //       const toolResults = message.content.filter((c: ContentBlock) => {
      //         return c.toolResult
      //       })
      //       if (toolResults.length > 0) {
      //         return toolResults
      //       }
      //     }
      //   }
      //   return null
      // }

      // const lastToolResults = getLastToolResults()
      // console.log(lastToolResults)

      // // ツール実行結果があれば説明文に追加
      // const explanationWithToolResult = lastToolResults
      //   ? `${explanation}\n\n## Last Tool Execution Results\n${lastToolResults
      //       .map((result) => `### \`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``)
      //       .join('\n\n')}`
      //   : explanation

      // setExplanationText(explanationWithToolResult)

      // XMLパーサーを使用して有効なDrawIO XMLだけを抽出
      const xml = extractDrawioXml(rawContent)

      // ローディングが終わり、XMLが取得できた場合のみ図を更新
      if (!loading && xml && drawioRef.current) {
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
              const newHistory = [...prev, { xml, prompt: userPrompt, explanation }]
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
          setExplanationText(historyItem.explanation)
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
            <span
              className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700"
              onClick={handleOpenSystemPromptModal}
            >
              SYSTEM_PROMPT
            </span>
            <SystemPromptModal
              isOpen={showSystemPromptModal}
              onClose={handleCloseSystemPromptModal}
              systemPrompt={systemPrompt}
            />
          </div>
          <div className="flex justify-between">
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
            {showExplanation ? (
              <button
                onClick={() => setShowExplanation(false)}
                className="whitespace-pre bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-4 rounded-md self-start hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('hide', '非表示')}
              </button>
            ) : (
              <button
                onClick={() => setShowExplanation(true)}
                className="whitespace-pre bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-4 rounded-md self-start hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t('showExplanation', '説明を表示')}
              </button>
            )}
          </div>
        </span>
      </div>

      <div className="flex-1 rounded-lg">
        <div className="flex w-full h-full gap-4">
          {/* 左側: Draw.io エディタ */}
          <div className="flex-1 h-full">
            {loading ? (
              <div className="flex h-full justify-center items-center border border-gray-200 dark:border-gray-700">
                {executingTool === 'tavilySearch' ? (
                  <WebLoader />
                ) : executingTool === 'executeCommand' ? (
                  <AWSResearchLoader />
                ) : (
                  <Loader />
                )}
              </div>
            ) : (
              <div className="w-full h-full border border-gray-200 dark:border-gray-700">
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

          {/* 右側: 説明文エリア */}
          {showExplanation && (
            <div className="w-1/3 h-full flex flex-col">
              {/* 説明文表示エリア */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto h-full">
                {loading ? (
                  <div className="text-gray-600 dark:text-gray-300 animate-pulse">
                    <MD>{explanationText || 'Generating Explanation...'}</MD>
                  </div>
                ) : (
                  <MD>{explanationText}</MD>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 fixed bottom-0 left-20 right-5 bottom-3">
        <div className="relative w-full">
          <div className="flex gap-2 justify-between pb-2">
            <RecommendDiagrams
              loading={recommendLoading}
              recommendations={recommendDiagrams}
              onSelect={setUserInput}
              loadingText={t('addRecommend', 'Generating recommendations...')}
            />

            <div className="flex gap-3 items-center">
              <DeepSearchButton
                enableDeepSearch={enableSearch}
                handleToggleDeepSearch={() => {
                  setEnableSearch(!enableSearch)
                }}
              />
              <AwsCliButton
                enableAwsCli={enableAwsCli}
                handleToggleAwsCli={() => {
                  setEnableAwsCli(!enableAwsCli)
                }}
              />
            </div>
          </div>

          <TextArea
            value={userInput}
            onChange={setUserInput}
            disabled={loading}
            onSubmit={(input) => onSubmit(input)}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
          />
        </div>
      </div>
    </div>
  )
}
