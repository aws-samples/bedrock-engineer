import { useCallback, useEffect, useState, useMemo } from 'react'
import { ToggleSwitch, Tooltip } from 'flowbite-react'
import { GrClearOption } from 'react-icons/gr'
import prompts from '../../prompts/prompts'
import { AiOutlineReload } from 'react-icons/ai'
import { autocompletion, completionKeymap } from '@codemirror/autocomplete'
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackProvider,
  useActiveCode,
  useSandpack,
  useSandpackNavigation
} from '@codesandbox/sandpack-react'

import { Loader } from '@renderer/components/Loader'
import useDataSourceConnectModal from './useDataSourceConnectModal'

import { motion } from 'framer-motion'
import { Style, SupportedTemplate, templates, TEMPLATES, supportedStyles } from './templates'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import { useAgentChat } from '../ChatPage/hooks/useAgentChat'
import { useSystemPromptModal } from '../ChatPage/modals/useSystemPromptModal'
import { extractCode, extractCodeBlock, replacePlaceholders } from './util'
import useWebsiteGeneratorSettings from '@renderer/hooks/useWebsiteGeneratorSetting'
import { WebsiteGeneratorProvider } from '@renderer/contexts/WebsiteGeneratorContext'
import { TemplateButton } from './components/TemplateButton'
import { Preview } from './components/Preview'
import { RecommendChanges } from './components/RecommendChanges'
import { StyleSelector } from './components/StyleSelector'
import { KnowledgeBaseConnectButton } from './components/KnowledgeBaseConnectButton'
import { RagLoader } from './components/RagLoader'
import { AttachedImage, TextArea } from '../ChatPage/components/InputForm/TextArea'
import { useRecommendChanges } from './hooks/useRecommendChanges'
import { WebLoader } from '../../components/WebLoader'
import { DeepSearchButton } from '../../components/DeepSearchButton'
import { ToolState } from '@/types/agent-chat'
import { LoaderWithReasoning } from './components/LoaderWithReasoning'
import { ContinueDevelopmentButton } from './components/ContinueDevelopmentButton'
import { generateContinueDevelopmentPrompt } from './utils/promptGenerator'
import { useNavigate } from 'react-router'

export default function WebsiteGeneratorPage() {
  const [template, setTemplate] = useState<SupportedTemplate['id']>('react-ts')

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <WebsiteGeneratorProvider>
      <SandpackProvider
        template={template}
        theme={isDark ? 'dark' : 'light'}
        files={templates[template].files}
        style={{
          height: 'calc(100vh - 16rem)'
        }}
        options={{
          externalResources: ['https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css'],
          initMode: 'user-visible',
          recompileMode: 'immediate',
          recompileDelay: 500,
          autorun: true,
          autoReload: true
        }}
        customSetup={{
          dependencies: templates[template].customSetup.dependencies
        }}
      >
        <WebsiteGeneratorPageContents template={template} setTemplate={setTemplate} />
      </SandpackProvider>
    </WebsiteGeneratorProvider>
  )
}

type WebsiteGeneratorPageContentsProps = {
  template: SupportedTemplate['id']
  setTemplate: (template: SupportedTemplate['id']) => void
}

function WebsiteGeneratorPageContents(props: WebsiteGeneratorPageContentsProps) {
  const { template, setTemplate } = props
  const { sandpack } = useSandpack()
  const { runSandpack } = sandpack
  const { updateCode, code } = useActiveCode()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { recommendChanges, recommendLoading, getRecommendChanges, refleshRecommendChanges } =
    useRecommendChanges()

  const [showCode, setShowCode] = useState(false)
  const [userInput, setUserInput] = useState('')
  const { currentLLM: llm, sendMsgKey, getAgentTools } = useSetting()
  // 継続開発ボタン表示の制御状態
  const [showContinueDevelopmentButton, setShowContinueDevelopmentButton] = useState(false)

  const handleClickShowCode = () => {
    setShowCode(!showCode)
  }

  const [styleType, setStyleType] = useState<Style>({
    label: 'Tailwind.css',
    value: 'tailwind'
  })

  const {
    show: showDataSourceConnectModal,
    handleClose: handleCloseDataSourceConnectModal,
    handleOpen: handleOpenDataSourceConnectModal,
    DataSourceConnectModal
  } = useDataSourceConnectModal()
  const { knowledgeBases, enableKnowledgeBase, enableSearch, setEnableSearch } =
    useWebsiteGeneratorSettings()

  // テンプレートに応じたエージェントIDの選択
  const getAgentIdForTemplate = (template: SupportedTemplate['id']): string => {
    const agentMap = {
      'react-ts': 'reactGeneratorAgent',
      'vue-ts': 'vueGeneratorAgent',
      svelte: 'svelteGeneratorAgent'
    }
    return agentMap[template]
  }

  // ウェブサイト生成用のエージェントID（テンプレートに応じて動的に変更）
  const websiteAgentId = getAgentIdForTemplate(template)

  // テンプレート固有のシステムプロンプトを直接使用
  const systemPrompt = useMemo(() => {
    // テンプレート固有のプロンプトを直接使用
    const templateSpecificPrompt = prompts.WebsiteGenerator.system[template]({
      styleType: styleType.value,
      libraries: Object.keys(templates[template].customSetup.dependencies),
      ragEnabled: enableKnowledgeBase,
      tavilySearchEnabled: enableSearch
    })

    // Knowledge Basesのプレースホルダーを置換
    return replacePlaceholders(templateSpecificPrompt, knowledgeBases)
  }, [template, styleType.value, enableKnowledgeBase, enableSearch, knowledgeBases])
  const sessionId = undefined

  // Website Generator Agent で利用可能なツールを定義
  const websiteAgentTools = useMemo(() => {
    const tools: ToolState[] = []
    // agentIdからツールを取得
    const agentTools = getAgentTools(websiteAgentId)

    // 検索機能が有効な場合、tavilySearch ツールを追加
    if (enableSearch) {
      const searchTools = agentTools.filter(
        (tool) => tool.toolSpec?.name === 'tavilySearch' && tool.enabled
      )
      tools.push(...searchTools)
    }

    // Knowledge Base機能が有効な場合、retrieve ツールを追加
    if (enableKnowledgeBase) {
      const retrieveTools = agentTools.filter(
        (tool) => tool.toolSpec?.name === 'retrieve' && tool.enabled
      )
      tools.push(...retrieveTools)
    }

    return tools
  }, [enableSearch, enableKnowledgeBase, getAgentTools, websiteAgentId])

  const options = {
    enableHistory: false,
    tools: websiteAgentTools // 明示的にツール設定を渡す
  }

  const {
    messages,
    loading,
    executingTool,
    latestReasoningText,
    handleSubmit,
    clearChat: initChat
  } = useAgentChat(llm?.modelId, systemPrompt, websiteAgentId, sessionId, options)

  // テンプレート変更時にチャットをリセット
  useEffect(() => {
    initChat() // エージェントが変わったらチャット履歴をクリア
  }, [websiteAgentId, initChat])

  const onSubmit = (input: string, images: AttachedImage[]) => {
    handleSubmit(input, images)
    setUserInput('')
  }

  const lastText = messages[messages.length - 1]?.role === 'assistant' ? extractCode(messages) : ''

  const {
    show: showSystemPromptModal,
    handleClose: handleCloseSystemPromptModal,
    handleOpen: handleOpenSystemPromptModal,
    SystemPromptModal
  } = useSystemPromptModal()

  useEffect(() => {
    if (!loading && messages.length > 0 && lastText) {
      getRecommendChanges(lastText)
    }
  }, [loading, messages])

  const { refresh } = useSandpackNavigation()

  const handleRefresh = useCallback(async () => {
    refresh()

    const c = templates[template].files[templates[template].mainFile]?.code
    updateCode(c)
    setUserInput('')
    setStyleType({
      label: 'Tailwind.css',
      value: 'tailwind'
    })
    refleshRecommendChanges()
    initChat()
    runSandpack()
  }, [template, updateCode, initChat, runSandpack])

  useEffect(() => {
    if (messages?.length > 0) {
      updateCode(lastText)
      if (!loading) {
        runSandpack()
        // ウェブサイトの生成が完了したら継続開発ボタンを表示する
        setShowContinueDevelopmentButton(true)
      }
    }
  }, [loading, lastText])

  const [isComposing, setIsComposing] = useState(false)

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // Agent Chatに遷移して継続開発するための処理
  const handleContinueDevelopment = useCallback(() => {
    try {
      // プロンプト生成
      const prompt = generateContinueDevelopmentPrompt(
        sandpack.files,
        template,
        styleType,
        userInput
      )

      // コードが抽出できない場合のチェック
      if (!prompt) {
        console.error('Failed to generate prompt: No code content extracted')
        return
      }

      // Agent Chatページに遷移し、プロンプトをクエリパラメータで渡す
      navigate(`/chat?prompt=${encodeURIComponent(prompt)}&agent=softwareAgent`)
    } catch (error) {
      console.error('Error generating prompt or navigating:', error)
    }
  }, [sandpack.files, template, styleType, userInput, navigate])

  const filterdMessages = messages.filter((m) => {
    if (m?.content === undefined) {
      return false
    }

    const hasToolBlock = m?.content.some((c) => {
      return 'toolUse' in c || 'toolResult' in c
    })

    if (hasToolBlock) {
      return false
    }

    return true
  })

  // getLoader関数をuseCallbackでメモ化して不要な再レンダリングを防止
  const getLoader = useCallback(
    (tool: string | null) => {
      let loader

      if (tool === 'tavilySearch') {
        loader = <WebLoader />
      } else if (tool === 'retrieve') {
        loader = <RagLoader />
      } else {
        loader = <Loader />
      }

      return <LoaderWithReasoning reasoningText={latestReasoningText}>{loader}</LoaderWithReasoning>
    },
    [latestReasoningText]
  )

  return (
    <div className={'flex flex-col p-3 h-[calc(100vh-11rem)] overflow-y-auto'}>
      {/* Modals */}
      <SystemPromptModal
        isOpen={showSystemPromptModal}
        onClose={handleCloseSystemPromptModal}
        systemPrompt={systemPrompt}
      />
      <DataSourceConnectModal
        isOpen={showDataSourceConnectModal}
        onClose={handleCloseDataSourceConnectModal}
      />

      {/* Header */}
      <div className="flex pb-2 justify-between">
        <span className="font-bold flex flex-col gap-2 w-full">
          <div className="flex justify-between">
            <h1 className="content-center dark:text-white text-lg">Website Generator</h1>
            <span
              className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700"
              onClick={handleOpenSystemPromptModal}
            >
              SYSTEM_PROMPT
            </span>
          </div>
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {TEMPLATES.map((fw) => (
                <TemplateButton
                  {...fw}
                  key={fw.id}
                  isSelected={template === fw.id}
                  onSelect={setTemplate}
                  onRefresh={handleRefresh}
                />
              ))}
              <div className="ml-8 flex gap-2 items-center max-w-[40%] overflow-x-auto">
                {filterdMessages.map((_m, index) => {
                  return (
                    index % 2 !== 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        key={index}
                        className="p-2 bg-gray-200 rounded text-gray-500 cursor-pointer hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
                        onClick={async () => {
                          const code = extractCodeBlock(
                            filterdMessages[index]?.content?.map((i) => i.text).join('') ?? ''
                          )
                          if (code) {
                            updateCode(code[0], true)
                            setUserInput(
                              filterdMessages[index - 1]?.content?.map((i) => i.text).join('') ?? ''
                            )
                            runSandpack()
                          }
                        }}
                      >
                        v{(index + 1) / 2}
                      </motion.span>
                    )
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {/* 継続開発ボタン - コンパクト版をヘッダーに配置 */}
              {showContinueDevelopmentButton && messages.length > 0 && !loading && (
                <ContinueDevelopmentButton
                  visible={true}
                  onContinue={handleContinueDevelopment}
                  disabled={loading}
                  compact={true}
                />
              )}

              <Tooltip content="re:run" placement="bottom" animation="duration-500">
                <button
                  className="cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={runSandpack}
                >
                  <AiOutlineReload className="text-xl" />
                </button>
              </Tooltip>
            </div>
          </div>
        </span>
      </div>

      {/* Sandpack Editor and Previewer */}
      <SandpackLayout
        style={{
          display: 'flex',
          gap: '1rem',
          backgroundColor: isDark
            ? 'rgb(17 24 39 / var(--tw-bg-opacity))'
            : 'rgb(243 244 246 / var(--tw-bg-opacity))',
          border: 'none',
          height: '85%',
          zIndex: '0'
        }}
      >
        {showCode && (
          <SandpackCodeEditor
            style={{
              height: '100%',
              borderRadius: '0px 8px 8px 0px',
              overflowX: 'scroll',
              maxWidth: '50vw',
              gridColumn: '2 / 4'
            }}
            showInlineErrors={true}
            showTabs={true}
            showLineNumbers
            showRunButton={true}
            extensions={[autocompletion()]}
            extensionsKeymap={[completionKeymap as any]}
          />
        )}

        {loading ? (
          <div
            className={`flex ${showCode ? 'w-[50%]' : 'w-[100%]'} h-[100%] justify-center items-center content-center align-center`}
          >
            {getLoader(executingTool)}
          </div>
        ) : (
          <Preview isDark={isDark} code={code} />
        )}
      </SandpackLayout>

      {/* Buttom Input Field Block */}
      <div className="flex gap-2 fixed bottom-0 left-[5rem] right-5 bottom-3 z-10">
        <div className="relative w-full">
          <div className="flex gap-2 justify-between pb-2">
            <div className="overflow-x-auto flex-grow max-w-[70%]">
              <RecommendChanges
                loading={recommendLoading}
                recommendations={recommendChanges}
                onSelect={setUserInput}
                loadingText={t('addRecommend')}
              />
            </div>

            <div className="flex gap-3 items-center">
              <DeepSearchButton
                enableDeepSearch={enableSearch}
                handleToggleDeepSearch={() => setEnableSearch(!enableSearch)}
              />
              <KnowledgeBaseConnectButton
                enableKnowledgeBase={enableKnowledgeBase}
                handleOpenDataSourceConnectModal={handleOpenDataSourceConnectModal}
              />

              <StyleSelector
                currentStyle={styleType}
                styles={supportedStyles[template] || []}
                onSelect={setStyleType}
              />

              <Tooltip content="show code" placement="bottom" animation="duration-500">
                <ToggleSwitch
                  checked={showCode}
                  onChange={handleClickShowCode}
                  color="gray"
                ></ToggleSwitch>
              </Tooltip>

              <Tooltip content="clear" placement="bottom" animation="duration-500">
                <button
                  className="cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleRefresh}
                >
                  <GrClearOption className="text-xl" />
                </button>
              </Tooltip>
            </div>
          </div>

          <TextArea
            value={userInput}
            onChange={setUserInput}
            disabled={loading}
            onSubmit={(input, attachedImages) => onSubmit(input, attachedImages)}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
          />
        </div>
      </div>
    </div>
  )
}
