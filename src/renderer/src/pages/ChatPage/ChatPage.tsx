import React, { useEffect, useState, useCallback, useRef } from 'react'
import AILogo from '../../assets/images/icons/ai.svg'
import { MessageList } from './components/MessageList'
import InputFormContainer, { InputFormContainerRef } from './components/InputFormContainer'
import { ExampleScenarios } from './components/ExampleScenarios'
import { useAgentChat } from './hooks/useAgentChat'
import { AgentSelector } from './components/AgentSelector'
import useSetting from '@renderer/hooks/useSetting'
import useScroll from '@renderer/hooks/useScroll'
import { useIgnoreFileModal } from './modals/useIgnoreFileModal'
import { useToolSettingModal } from './modals/useToolSettingModal'
import { useAgentSettingsModal } from './modals/useAgentSettingsModal'
import { FiChevronRight, FiBarChart2 } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { AttachedImage } from './components/InputForm/TextArea'
import { ChatHistory } from './components/ChatHistory'
import { useSystemPromptModal } from './modals/useSystemPromptModal'
import { useTokenAnalyticsModal } from './modals/useTokenAnalyticsModal'
import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { useLocation } from 'react-router'

export default function ChatPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const {
    currentLLM: llm,
    projectPath,
    selectDirectory,
    sendMsgKey,
    selectedAgentId,
    setSelectedAgentId,
    agents,
    currentAgent,
    currentAgentSystemPrompt: systemPrompt
  } = useSetting()

  const currentScenarios = currentAgent?.scenarios || []
  const inputFormRef = useRef<InputFormContainerRef>(null)

  const {
    messages,
    loading,
    reasoning,
    handleSubmit,
    currentSessionId,
    setCurrentSessionId,
    clearChat,
    setMessages,
    stopGeneration
  } = useAgentChat(llm?.modelId, systemPrompt, selectedAgentId)

  // 送信ハンドラをuseCallbackでメモ化
  const onSubmit = useCallback(
    (input: string, images: AttachedImage[]) => {
      handleSubmit(input, images)
    },
    [handleSubmit]
  )

  const { deleteMessage } = useChatHistory()

  const handleDeleteMessage = (index: number) => {
    // メッセージの配列のコピーを作成
    const updatedMessages = [...messages]

    // メッセージを削除
    updatedMessages.splice(index, 1)

    // 更新されたメッセージの配列を設定
    setMessages(updatedMessages)

    // チャット履歴が有効な場合は、対応するメッセージを削除
    if (currentSessionId) {
      deleteMessage(currentSessionId, index)
    }
  }

  const { scrollToBottom } = useScroll()
  const {
    show: showIgnoreFileModal,
    handleClose: handleCloseIgnoreFileModal,
    handleOpen: handleOpenIgnoreFileModal,
    IgnoreFileModal
  } = useIgnoreFileModal()

  const {
    show: showAgentSettingModal,
    handleOpen: openAgentSettingsModal,
    handleClose: handleCloseAgentSettingsModal,
    AgentSettingsModal
  } = useAgentSettingsModal()

  const {
    show: showSystemPromptModal,
    handleClose: handleCloseSystemPromptModal,
    handleOpen: handleOpenSystemPromptModal,
    SystemPromptModal
  } = useSystemPromptModal()

  const {
    show: showTokenAnalyticsModal,
    handleClose: handleCloseTokenAnalyticsModal,
    handleOpen: handleOpenTokenAnalyticsModal,
    TokenAnalyticsModal
  } = useTokenAnalyticsModal()

  const {
    show: showToolSettingModal,
    handleClose: handleCloseToolSettingModal,
    handleOpen: handleOpenToolSettingModal,
    ToolSettingModal
  } = useToolSettingModal()

  // クリアハンドラをuseCallbackでメモ化
  const handleClearChat = useCallback(() => {
    if (window.confirm(t('confirmClearChat'))) {
      clearChat()
    }
  }, [clearChat, t])

  // シナリオ選択ハンドラ
  const handleSelectScenario = useCallback((scenario: string) => {
    // テキストエリアに選択したシナリオを設定
    if (inputFormRef.current) {
      inputFormRef.current.setInputText(scenario)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [loading, messages.length])

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const DEFAULT_TEXTAREA_HEIGHT = 72 // Default height (3 lines * 24px)

  const [textareaHeight, setTextareaHeight] = useState(DEFAULT_TEXTAREA_HEIGHT)

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  // URLパラメータからプロンプトとエージェントを自動設定
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const promptFromUrl = searchParams.get('prompt')
    const agentFromUrl = searchParams.get('agent')

    if (promptFromUrl && inputFormRef.current) {
      // プロンプトをテキストエリアに設定
      inputFormRef.current.setInputText(decodeURIComponent(promptFromUrl))

      // 指定されたエージェントに切り替え
      if (agentFromUrl && agents.find((a) => a.id === agentFromUrl)) {
        setSelectedAgentId(agentFromUrl)
      }

      // URLパラメータをクリア（同じリンクを再度クリックした時の対応）
      const newUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, '', newUrl)
    }
  }, [location.search, agents, setSelectedAgentId])

  return (
    <React.Fragment>
      <div className="flex p-3 h-[calc(100vh-11rem)]">
        <div className="flex-1 flex flex-col">
          {/* ヘッダー - 固定 */}
          <div className="flex justify-between items-center">
            <AgentSelector
              agents={agents}
              selectedAgent={selectedAgentId}
              onOpenSettings={openAgentSettingsModal}
            />

            <div className="flex items-center gap-2">
              <FiBarChart2
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                onClick={handleOpenTokenAnalyticsModal}
                title={t('View Token Analytics')}
                size={16}
              />
              <span
                className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={handleOpenSystemPromptModal}
              >
                SYSTEM_PROMPT
              </span>
            </div>
          </div>

          {/* Modals */}
          <SystemPromptModal
            isOpen={showSystemPromptModal}
            onClose={handleCloseSystemPromptModal}
            systemPrompt={systemPrompt}
          />
          <TokenAnalyticsModal
            isOpen={showTokenAnalyticsModal}
            onClose={handleCloseTokenAnalyticsModal}
            messages={messages}
            modelId={llm?.modelId || ''}
          />
          <AgentSettingsModal
            isOpen={showAgentSettingModal}
            onClose={handleCloseAgentSettingsModal}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
          <ToolSettingModal isOpen={showToolSettingModal} onClose={handleCloseToolSettingModal} />
          <IgnoreFileModal isOpen={showIgnoreFileModal} onClose={handleCloseIgnoreFileModal} />

          {/* メインコンテンツエリア - フレックス成長 */}
          <div className="flex flex-row flex-1 min-h-0">
            {/* チャット履歴サイドパネル */}
            <div
              className={`dark:bg-gray-900 transition-all duration-300 ${
                isHistoryOpen ? 'w-96' : 'w-0'
              } overflow-y-auto`}
            >
              <ChatHistory
                onSessionSelect={handleSessionSelect}
                currentSessionId={currentSessionId}
              />
            </div>

            {/* チャット履歴トグルバー */}
            <div className="flex items-center">
              <div
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-4 h-16 dark:bg-gray-900 hover:dark:bg-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center justify-center transition-colors duration-200 rounded-lg m-2"
                title={t('Toggle chat history')}
              >
                <FiChevronRight
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isHistoryOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* メッセージエリア - スクロール可能 */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Adjusts the bottom padding of the message area based on the height of the text area */}
              <div
                className="flex-1 overflow-y-auto mb-2"
                style={{
                  // Additional padding is applied only when the text area grows larger
                  // This ensures that as the text area gets taller, the bottom padding of the message area increases by the same amount
                  paddingBottom: `${textareaHeight - DEFAULT_TEXTAREA_HEIGHT * 2}px`
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col pt-12 h-full w-full justify-center items-center content-center align-center gap-1">
                    <div className="flex flex-row gap-3 items-center mb-2">
                      <div className="h-6 w-6">
                        <AILogo />
                      </div>
                      <h1 className="text-lg font-bold dark:text-white">Agent Chat</h1>
                    </div>
                    <div className="text-gray-400">{t(currentAgent?.description ?? '')}</div>
                    {currentAgent && (
                      <ExampleScenarios
                        scenarios={currentScenarios}
                        onSelectScenario={handleSelectScenario}
                      />
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <MessageList
                      messages={messages}
                      loading={loading}
                      reasoning={reasoning}
                      deleteMessage={handleDeleteMessage}
                    />
                  </div>
                )}
              </div>

              {/* 入力フォーム - 固定 */}
              <div className="mt-2 dark:border-gray-700 bg-white dark:bg-gray-800">
                <InputFormContainer
                  ref={inputFormRef}
                  loading={loading}
                  projectPath={projectPath}
                  sendMsgKey={sendMsgKey}
                  onSubmit={onSubmit}
                  onOpenToolSettings={handleOpenToolSettingModal}
                  onSelectDirectory={selectDirectory}
                  onOpenIgnoreModal={handleOpenIgnoreFileModal}
                  onClearChat={handleClearChat}
                  onStopGeneration={stopGeneration}
                  hasMessages={messages.length > 0}
                  onHeightChange={setTextareaHeight}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
