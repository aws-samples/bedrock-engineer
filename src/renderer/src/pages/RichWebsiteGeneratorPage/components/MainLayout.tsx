import { motion } from 'framer-motion'
import { ChatPanel } from './ChatPanel'
import { CodePreviewPanel } from './CodePreviewPanel'
import { SandpackFiles } from '@codesandbox/sandpack-react'
import { IdentifiableMessage } from '@/types/chat/message'
import { AttachedImage } from '../../ChatPage/components/InputForm/TextArea'

interface MainLayoutProps {
  // Chat panel props
  messages: IdentifiableMessage[]
  loading: boolean
  reasoning: boolean
  executingTools: Set<string>
  userInput: string
  onUserInputChange: (value: string) => void
  onSubmit: (input: string, images: AttachedImage[]) => void
  isComposing: boolean
  onComposingChange: (value: boolean) => void
  sendMsgKey: 'Enter' | 'Cmd+Enter'

  // View management props
  activeTab: 'code' | 'preview'
  onTabChange: (tab: 'code' | 'preview') => void
  isChatPanelVisible: boolean
  onToggleChatPanel: () => void

  // Code preview props
  files: SandpackFiles
  isDark: boolean
  code: string
  previewKey: number
  latestReasoningText: string
}

export function MainLayout({
  messages,
  loading,
  reasoning,
  executingTools,
  userInput,
  onUserInputChange,
  onSubmit,
  isComposing,
  onComposingChange,
  sendMsgKey,
  activeTab,
  onTabChange,
  isChatPanelVisible,
  onToggleChatPanel,
  files,
  isDark,
  code,
  previewKey,
  latestReasoningText
}: MainLayoutProps) {
  return (
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
          <ChatPanel
            messages={messages}
            loading={loading}
            reasoning={reasoning}
            executingTools={executingTools}
            userInput={userInput}
            onUserInputChange={onUserInputChange}
            onSubmit={onSubmit}
            isComposing={isComposing}
            onComposingChange={onComposingChange}
            sendMsgKey={sendMsgKey}
          />
        )}
      </div>

      {/* Right Side - Code/Preview Area */}
      <CodePreviewPanel
        activeTab={activeTab}
        onTabChange={onTabChange}
        isChatPanelVisible={isChatPanelVisible}
        onToggleChatPanel={onToggleChatPanel}
        files={files}
        loading={loading}
        isDark={isDark}
        code={code}
        previewKey={previewKey}
        executingTools={executingTools}
        latestReasoningText={latestReasoningText}
      />
    </motion.div>
  )
}
