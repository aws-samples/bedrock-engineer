import React, { useEffect, useState } from 'react'
import AILogo from '../../assets/images/icons/ai.svg'
import { MessageList } from './components/MessageList'
import { InputForm } from './components/InputForm'
import { ExampleScenarios } from './components/ExampleScenarios'
import { useAgentChat } from './hooks/useAgentChat'
import { AgentSelector } from './components/AgentSelector'
import useSetting from '@renderer/hooks/useSetting'
import useScroll from '@renderer/hooks/useScroll'
import { useIgnoreFileModal } from './modals/useIgnoreFileModal'
import { useToolSettingModal } from './modals/useToolSettingModal'
import { useAgentSettingsModal } from './modals/useAgentSettingsModal'
import { FiSettings, FiChevronRight, FiInfo } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { AttachedImage } from './components/InputForm/TextArea'
import { ChatHistory } from './components/ChatHistory'
import { useSystemPromptModal } from './modals/useSystemPromptModal'

export default function ChatPage() {
  const [userInput, setUserInput] = useState('')
  const { t } = useTranslation()
  const {
    currentLLM: llm,
    projectPath,
    selectDirectory,
    sendMsgKey,
    selectedAgentId,
    setSelectedAgentId,
    agents,
    currentAgent,
    currentAgentSystemPrompt: systemPrompt,
    enabledTools
  } = useSetting()

  const currentScenarios = currentAgent?.scenarios || []

  const {
    messages,
    loading,
    handleSubmit,
    currentSessionId,
    setCurrentSessionId,
    clearChat,
    setMessages,
    isSummarized
  } = useAgentChat(
    llm?.modelId,
    systemPrompt,
    enabledTools?.filter((tool) => tool.enabled)
  )

  const onSubmit = (input: string, images: AttachedImage[]) => {
    handleSubmit(input, images)
    setUserInput('')
  }

  // ContentBlock単位での削除機能は不要になったため、handleUpdateMessageは削除

  const handleDeleteMessage = (index: number) => {
    // メッセージの配列のコピーを作成し、指定されたインデックスのメッセージを削除
    const updatedMessages = [...messages]
    updatedMessages.splice(index, 1)

    // 更新されたメッセージの配列を設定
    setMessages(updatedMessages)

    // チャット履歴が有効な場合は、対応するメッセージを削除
    if (currentSessionId) {
      window.chatHistory.deleteMessage(currentSessionId, index)
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
    show: showToolSettingModal,
    handleClose: handleCloseToolSettingModal,
    handleOpen: handleOpenToolSettingModal,
    ToolSettingModal
  } = useToolSettingModal()

  const handleClearChat = () => {
    if (window.confirm(t('confirmClearChat'))) {
      clearChat()
      setUserInput('')
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [loading, messages.length])

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId)
  }

  return (
    <React.Fragment>
      <div className="flex h-[calc(100vh-11rem)]">
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              {agents.length > 1 ? (
                <AgentSelector
                  agents={agents}
                  selectedAgent={selectedAgentId}
                  onSelectAgent={setSelectedAgentId}
                  openable={messages.length === 0}
                />
              ) : null}

              {/* 要約が使用されている場合に表示する通知 */}
              {isSummarized && (
                <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-md flex items-center">
                  <FiInfo className="h-3 w-3 mr-1" />
                  過去の会話を要約して使用しています
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openAgentSettingsModal}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                title={t('agent settings')}
              >
                <FiSettings className="w-5 h-5" />
              </button>
              <span
                className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700"
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
          <AgentSettingsModal
            isOpen={showAgentSettingModal}
            onClose={handleCloseAgentSettingsModal}
          />
          <ToolSettingModal isOpen={showToolSettingModal} onClose={handleCloseToolSettingModal} />
          <IgnoreFileModal isOpen={showIgnoreFileModal} onClose={handleCloseIgnoreFileModal} />

          <div className="flex flex-row h-full">
            {/* チャット履歴サイドパネル */}
            <div
              className={`dark:bg-gray-900 transition-all duration-300 ${
                isHistoryOpen ? 'w-96' : 'w-0'
              } overflow-y-scroll`}
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

            {/* メイン領域 */}
            <div className="flex flex-col gap-4 w-full overflow-y-scroll">
              {messages.length === 0 ? (
                <div className="flex flex-col pt-12 h-full w-full justify-center items-center content-center align-center gap-1">
                  <div className="flex flex-row gap-3 items-center mb-2">
                    <div className="h-6 w-6">
                      <AILogo />
                    </div>
                    <h1 className="text-lg font-bold dark:text-white">Agent Chat</h1>
                  </div>
                  <div className="text-gray-400">{currentAgent?.description}</div>
                  {currentAgent && (
                    <ExampleScenarios
                      scenarios={currentScenarios}
                      onSelectScenario={setUserInput}
                    />
                  )}
                </div>
              ) : null}
              <MessageList
                messages={messages}
                loading={loading}
                deleteMessage={handleDeleteMessage}
                summarized={isSummarized}
              />
            </div>
          </div>
          <InputForm
            userInput={userInput}
            loading={loading}
            projectPath={projectPath}
            sendMsgKey={sendMsgKey}
            onSubmit={(input, attachedImages) => onSubmit(input, attachedImages)}
            onChange={setUserInput}
            onOpenToolSettings={handleOpenToolSettingModal}
            onSelectDirectory={selectDirectory}
            onOpenIgnoreModal={handleOpenIgnoreFileModal}
            onClearChat={handleClearChat}
            hasMessages={messages.length > 0}
          />
        </div>
      </div>
    </React.Fragment>
  )
}
