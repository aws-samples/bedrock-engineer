import { useState, useEffect } from 'react'
import { SandpackProvider, useActiveCode, useSandpack } from '@codesandbox/sandpack-react'
import { RichWebsiteGeneratorProvider } from './contexts/RichWebsiteGeneratorContext'
import useSetting from '@renderer/hooks/useSetting'
import { templates } from '../WebsiteGeneratorPage/templates'
import { WelcomeScreen } from './components/WelcomeScreen'
import { MainLayout } from './components/MainLayout'
import { useRecommendChanges } from '../WebsiteGeneratorPage/hooks/useRecommendChanges'
import { AnimatePresence } from 'framer-motion'
import { useWebsiteGeneratorChat } from './hooks/useWebsiteGeneratorChat'
import { useViewManagement } from './hooks/useViewManagement'
import { useSandpackSync } from './hooks/useSandpackSync'

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
  const { sandpack } = useSandpack()
  const { runSandpack } = sandpack
  const { currentLLM: llm, sendMsgKey } = useSetting()
  const { code } = useActiveCode()
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const [isComposing, setIsComposing] = useState(false)

  // Custom hooks
  const chat = useWebsiteGeneratorChat(llm?.modelId)
  const viewManagement = useViewManagement()
  const { recommendChanges, recommendLoading } = useRecommendChanges()

  // Sandpack sync with auto-preview on completion
  const { previewKey } = useSandpackSync(
    chat.loading,
    chat.messages.length,
    chat.hasStartedGeneration,
    runSandpack,
    () => viewManagement.handleTabChange('preview')
  )

  // Auto-refresh preview when switching to preview tab
  useEffect(() => {
    if (viewManagement.activeTab === 'preview') {
      runSandpack()
    }
  }, [viewManagement.activeTab, runSandpack])

  return (
    <AnimatePresence mode="wait">
      {!chat.hasStartedGeneration ? (
        <div key="welcome" className="h-[calc(100vh)] p-3">
          <WelcomeScreen
            userInput={chat.userInput}
            setUserInput={chat.setUserInput}
            onSubmit={chat.onSubmit}
            disabled={chat.loading}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
            recommendChanges={recommendChanges}
            recommendLoading={recommendLoading}
          />
        </div>
      ) : (
        <MainLayout
          key="main"
          messages={chat.messages}
          loading={chat.loading}
          reasoning={Array.isArray(chat.reasoning) && chat.reasoning.length > 0}
          executingTools={chat.executingTools}
          userInput={chat.userInput}
          onUserInputChange={chat.setUserInput}
          onSubmit={chat.onSubmit}
          isComposing={isComposing}
          onComposingChange={setIsComposing}
          sendMsgKey={sendMsgKey}
          activeTab={viewManagement.activeTab}
          onTabChange={viewManagement.handleTabChange}
          isChatPanelVisible={viewManagement.isChatPanelVisible}
          onToggleChatPanel={viewManagement.toggleChatPanel}
          files={sandpack.files}
          isDark={isDark}
          code={code}
          previewKey={previewKey}
          latestReasoningText={chat.latestReasoningText}
        />
      )}
    </AnimatePresence>
  )
}
