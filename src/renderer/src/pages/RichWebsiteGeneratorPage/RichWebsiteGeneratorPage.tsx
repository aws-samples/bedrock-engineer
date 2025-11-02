import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackLayout,
  SandpackFileExplorer,
  useActiveCode,
  useSandpack
} from '@codesandbox/sandpack-react'
import { useAgentChat } from '../ChatPage/hooks/useAgentChat'
import {
  RichWebsiteGeneratorProvider,
  useRichWebsiteGenerator
} from './contexts/RichWebsiteGeneratorContext'
import { SANDPACK_TOOL_SPECS } from './toolSpecs'
import { ToolState } from '@/types/agent-chat'
import { ToolInput } from '@/types/tools'
import useSetting from '@renderer/hooks/useSetting'
import { TextArea, AttachedImage } from '../ChatPage/components/InputForm/TextArea'
import { templates } from '../WebsiteGeneratorPage/templates'
import { Preview } from '../WebsiteGeneratorPage/components/Preview'
import { MessageList } from '../ChatPage/components/MessageList'
import { ViewToggle } from './components/ViewToggle'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useRecommendChanges } from '../WebsiteGeneratorPage/hooks/useRecommendChanges'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from '@renderer/components/Loader'
import { LoaderWithReasoning } from '../WebsiteGeneratorPage/components/LoaderWithReasoning'
import { RagLoader } from '../WebsiteGeneratorPage/components/RagLoader'
import { WebLoader } from '../../components/WebLoader'

// Layout constants
const LAYOUT_CONSTANTS = {
  FILE_EXPLORER_WIDTH: '250px'
} as const

export default function RichWebsiteGeneratorPage() {
  const [template] = useState<'react-ts'>('react-ts')
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <SandpackProvider
      template={template}
      theme={isDark ? 'dark' : 'light'}
      files={templates[template].files}
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
      <RichWebsiteGeneratorProvider>
        <RichWebsiteGeneratorPageContents />
      </RichWebsiteGeneratorProvider>
    </SandpackProvider>
  )
}

function RichWebsiteGeneratorPageContents() {
  const { sandpackOperations, lastUpdate } = useRichWebsiteGenerator()
  const { sandpack } = useSandpack()
  const { runSandpack } = sandpack
  const { currentLLM: llm, sendMsgKey } = useSetting()
  const [userInput, setUserInput] = useState('')
  const { code } = useActiveCode()
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const [previewKey, setPreviewKey] = useState(0)
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false)

  // RecommendChanges hook
  const { recommendChanges, recommendLoading } = useRecommendChanges()

  // lastUpdate が変更されたら、Sandpackを再実行
  useEffect(() => {
    if (lastUpdate > 0) {
      console.log('Sandpack files updated at:', new Date(lastUpdate).toISOString())
      // ファイル更新時にSandpackを再実行
      runSandpack()
    }
  }, [lastUpdate, runSandpack])

  // システムプロンプトの生成
  const systemPrompt = useMemo(() => {
    return `You are a React expert assistant specialized in generating multi-file React applications.

Your task is to create a complete, production-ready React application by generating multiple files.

AVAILABLE TOOLS:
- sandpackCreateFile: Create a new file in the Sandpack environment
- sandpackUpdateFile: Update an existing file's content
- sandpackDeleteFile: Remove a file
- sandpackListFiles: List all files in the project
- sandpackReadFile: Read a file's content

FILE STRUCTURE GUIDELINES:
- Follow standard React project structure
- Typical structure: /src/components/, /src/utils/, /src/hooks/, etc.
- Always create complete, working files
- Keep components modular and reusable

WORKFLOW:
1. First, use sandpackListFiles to understand the current project state
2. Plan your file structure based on the user's requirements
3. Create files one by one using sandpackCreateFile
4. You can create multiple files in parallel by using multiple tool calls
5. Verify your work by reading files back if needed

IMPORTANT RULES:
- Each file should be complete and syntactically correct
- Include all necessary imports
- Follow React best practices
- Use TypeScript for type safety
- Use Tailwind CSS for styling
- DO NOT USE ARBITRARY VALUES in Tailwind (e.g., h-[600px])
- Use a consistent color palette

CRITICAL: react-icons Library Usage Rules
- When using react-icons, ALWAYS use the correct import format with icon name prefixes
- Each icon set has its own prefix (Fa, Fi, Md, Tb, Hi, Bs, etc.)
- Correct examples:
  - import { FaShoppingCart, FaBars } from 'react-icons/fa'
  - import { FiSettings, FiHome } from 'react-icons/fi'
- WRONG examples (these will cause errors):
  - ❌ import { ShoppingCart, Menu } from 'react-icons/fa'

Remember: You're working with Sandpack's virtual file system, not the local file system.


Good Pattern:
import React, { useState } from 'react';
import Header from './src/components/Header';
import Sidebar from './src/components/Sidebar';
import ProductGrid from './src/components/ProductGrid';
import Cart from './src/components/Cart';
import { CartProvider } from './src/context/CartContext';
import './styles.css';

function App() {
  const [showCart, setShowCart] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header onCartClick={() => setShowCart(!showCart)} />

        <div className="flex max-w-screen-2xl mx-auto">
          <Sidebar />

          <main className="flex-1 p-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                鉢植え植物コレクション
              </h1>
              <p className="text-gray-600">
                あなたの空間を彩る、厳選された鉢植え植物
              </p>
            </div>

            <ProductGrid />
          </main>
        </div>

        {showCart && (
          <Cart onClose={() => setShowCart(false)} />
        )}
      </div>
    </CartProvider>
  );
}

export default App;

`
  }, [])

  // カスタムツールエグゼキューターの定義
  const customToolExecutor = useCallback(
    async (toolInput: ToolInput) => {
      console.log(
        '[customToolExecutor] Executing tool:',
        toolInput.type,
        'for path:',
        (toolInput as any).path
      )

      switch (toolInput.type) {
        case 'sandpackCreateFile':
          return await sandpackOperations.createFile(toolInput.path, toolInput.content)
        case 'sandpackUpdateFile':
          return await sandpackOperations.updateFile(
            toolInput.path,
            toolInput.originalText,
            toolInput.updatedText
          )
        case 'sandpackDeleteFile':
          return await sandpackOperations.deleteFile(toolInput.path)
        case 'sandpackListFiles':
          return await sandpackOperations.listFiles()
        case 'sandpackReadFile':
          return await sandpackOperations.readFile(toolInput.path)
        default:
          throw new Error(`Unknown Sandpack tool: ${toolInput.type}`)
      }
    },
    [sandpackOperations]
  )

  // Sandpack ツールの ToolState 配列を作成
  const sandpackTools: ToolState[] = useMemo(() => {
    return SANDPACK_TOOL_SPECS.map((tool) => ({
      enabled: true,
      ...tool
    }))
  }, [])

  // useAgentChat の呼び出し
  const { messages, loading, reasoning, executingTools, handleSubmit, latestReasoningText } =
    useAgentChat(llm?.modelId, systemPrompt, 'richWebsiteGeneratorAgent', undefined, {
      enableHistory: false,
      tools: sandpackTools,
      customToolExecutor
    })

  // 前回のloading状態を保持するref
  const prevLoadingRef = useRef(loading)

  // getLoader関数
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

  const onSubmit = (input: string, images: AttachedImage[]) => {
    setHasStartedGeneration(true)
    handleSubmit(input, images)
    setUserInput('')
  }

  const [isComposing, setIsComposing] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview')
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(true)

  // Preview に切り替えた際に Sandpack を自動的に再実行
  useEffect(() => {
    if (activeTab === 'preview') {
      // プレビューに切り替えたときにPreviewコンポーネントを強制的に再マウント
      setPreviewKey((prev) => prev + 1)
    }
  }, [activeTab])

  // 会話完了時に自動的にPreviewタブに切り替え
  useEffect(() => {
    // loadingがtrueからfalseに変わった瞬間のみ実行（会話完了時）
    if (prevLoadingRef.current && !loading && messages.length > 0 && hasStartedGeneration) {
      // Sandpackを再実行
      runSandpack()
      // 常にPreviewタブに切り替え
      setActiveTab('preview')
      // Previewを強制的に再マウント
      setPreviewKey((prev) => prev + 1)
    }
    // 現在のloading状態を保存
    prevLoadingRef.current = loading
  }, [loading, messages.length, hasStartedGeneration, runSandpack])

  return (
    <AnimatePresence mode="wait">
      {!hasStartedGeneration ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-[calc(100vh)] p-3"
        >
          <WelcomeScreen
            userInput={userInput}
            setUserInput={setUserInput}
            onSubmit={onSubmit}
            disabled={loading}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
            recommendChanges={recommendChanges}
            recommendLoading={recommendLoading}
          />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex h-[calc(100vh)] gap-3 p-3 overflow-hidden"
        >
          {/* Left Side - Chat Area */}
          <div
            className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
              isChatPanelVisible ? 'w-1/2 opacity-100' : 'w-0 opacity-0'
            }`}
          >
            {isChatPanelVisible && (
              <>
                {/* Header */}
                <div className="flex pb-2 justify-between items-center">
                  <h1 className="font-bold dark:text-white text-lg">Rich Website Generator</h1>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {loading && 'Generating...'}
                    {executingTools.size > 0 && ` (${Array.from(executingTools).join(', ')})`}
                  </div>
                </div>

                {/* Message List Area - Scrollable */}
                <div className="flex-1 overflow-y-auto mb-3 min-h-0">
                  <MessageList
                    messages={messages}
                    loading={loading}
                    reasoning={reasoning}
                    deleteMessage={undefined}
                  />
                </div>

                {/* Input Area - Fixed at bottom */}
                <div className="flex-shrink-0">
                  <TextArea
                    value={userInput}
                    onChange={setUserInput}
                    disabled={loading}
                    onSubmit={onSubmit}
                    isComposing={isComposing}
                    setIsComposing={setIsComposing}
                    sendMsgKey={sendMsgKey}
                    hidePlanActToggle={true}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Side - Code/Preview Area */}
          <div className="flex flex-col flex-1 min-w-0 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out">
            {/* Tab Header */}
            <div className="flex items-center p-2 border-b dark:border-gray-700">
              <ViewToggle
                activeView={activeTab}
                onViewChange={setActiveTab}
                isChatPanelVisible={isChatPanelVisible}
                onToggleChatPanel={() => setIsChatPanelVisible(!isChatPanelVisible)}
                files={sandpack.files}
                loading={loading}
              />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'code' ? (
                <SandpackLayout
                  style={{
                    height: '100%',
                    backgroundColor: isDark
                      ? 'rgb(17 24 39 / var(--tw-bg-opacity))'
                      : 'rgb(243 244 246 / var(--tw-bg-opacity))',
                    border: 'none'
                  }}
                >
                  <SandpackFileExplorer
                    style={{
                      height: '100%',
                      minWidth: LAYOUT_CONSTANTS.FILE_EXPLORER_WIDTH,
                      maxWidth: LAYOUT_CONSTANTS.FILE_EXPLORER_WIDTH
                    }}
                  />
                  <SandpackCodeEditor
                    style={{
                      height: '100%',
                      flex: 1
                    }}
                    showInlineErrors={true}
                    showTabs={true}
                    showLineNumbers
                    showRunButton={true}
                  />
                </SandpackLayout>
              ) : loading ? (
                <div className="flex w-full h-full justify-center items-center">
                  {getLoader(executingTools.size > 0 ? Array.from(executingTools)[0] : null)}
                </div>
              ) : (
                <div className="h-full" key={previewKey}>
                  <Preview isDark={isDark} code={code} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
