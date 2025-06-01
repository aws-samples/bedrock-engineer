import React, { useEffect, useState } from 'react'
import { useSpeakChat } from './hooks/useSpeakChat'
import VoiceAILottie from '../WebsiteGeneratorPage/VoiceAI.lottie'
import { ChatDisplay } from './components/ChatDisplay'
import { CompactThinkingIndicator } from './components/ThinkingIndicator'
import { useSystemPromptModal } from './modals/useSystemPromptModal'

const API_ENDPOINT = window.store.get('apiEndpoint')

export const SpeakPage: React.FC = () => {
  const [showChat, setShowChat] = useState(false)

  const {
    status,
    isConnected,
    isRecording,
    thinkingState,
    chat,
    connect,
    startRecording,
    stopRecording,
    systemPrompt,
    setSystemPrompt
  } = useSpeakChat(API_ENDPOINT)

  // Auto-connect when component mounts
  useEffect(() => {
    // Only connect on initial mount
    const timer = setTimeout(() => {
      if (!isConnected && status === 'disconnected') {
        connect()
      }
    }, 100) // Small delay to ensure proper initialization

    return () => clearTimeout(timer)
  }, []) // Empty dependency array to run only once on mount

  const {
    show: showSystemPromptModal,
    handleClose: handleCloseSystemPromptModal,
    handleOpen: handleOpenSystemPromptModal,
    SystemPromptModal
  } = useSystemPromptModal()

  const handleStartRecording = async () => {
    try {
      await startRecording()
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  const canStartRecording =
    isConnected && (status === 'ready' || status === 'connected') && !isRecording
  const canStopRecording = isRecording

  if (showChat) {
    // Show full chat interface when needed
    return (
      <React.Fragment>
        <div className="flex h-screen flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Back to simple view button */}
              <button
                onClick={() => setShowChat(false)}
                className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← SIMPLE VIEW
              </button>
              {/* Thinking Indicator */}
              <CompactThinkingIndicator thinkingState={thinkingState} />
            </div>

            {/* System Prompt Button */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                onClick={handleOpenSystemPromptModal}
              >
                SYSTEM_PROMPT
              </span>
            </div>
          </div>

          {/* System Prompt Modal */}
          <SystemPromptModal
            isOpen={showSystemPromptModal}
            onClose={handleCloseSystemPromptModal}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            isConnected={isConnected}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chat Display */}
            <div className="flex-1 overflow-y-auto">
              <ChatDisplay
                chat={chat}
                thinkingState={thinkingState}
                className="h-full"
                audioControls={
                  <div className="flex items-center justify-center space-x-4 p-4">
                    {/* Start Recording Button */}
                    <button
                      onClick={handleStartRecording}
                      disabled={!canStartRecording}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium transition-all transform hover:scale-105 ${
                        canStartRecording
                          ? 'bg-green-500 hover:bg-green-600 shadow-md hover:shadow-lg'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      title={status === 'processing' ? 'Processing...' : 'Start Speaking'}
                    >
                      {status === 'processing' ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Stop Recording Button */}
                    <button
                      onClick={handleStopRecording}
                      disabled={!canStopRecording}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium transition-all transform hover:scale-105 ${
                        canStopRecording
                          ? 'bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      title="Stop Speaking"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </button>
                  </div>
                }
              />
            </div>
          </div>

          {/* Error Display */}
          {status === 'error' && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  Connection error. Please try reconnecting.
                </span>
              </div>
            </div>
          )}
        </div>
      </React.Fragment>
    )
  }

  // Simple view - main UI
  return (
    <React.Fragment>
      <div className="flex h-screen flex-col">
        {/* Top right settings button */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={handleOpenSystemPromptModal}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* System Prompt Modal */}
        <SystemPromptModal
          isOpen={showSystemPromptModal}
          onClose={handleCloseSystemPromptModal}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          isConnected={isConnected}
        />

        {/* Main content - centered AI icon */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <VoiceAILottie
              style={{ width: 240, height: 240 }}
              loop={isRecording || status === 'processing'}
              autoplay={isRecording || status === 'processing'}
            />
            {/* Thinking/Listening text below icon */}
            {(thinkingState.waitingForUserTranscription ||
              thinkingState.waitingForAssistantResponse) && (
              <span
                className={`text-lg font-semibold bg-[length:200%_100%] animate-gradient-x bg-clip-text text-transparent ${
                  thinkingState.waitingForUserTranscription
                    ? 'bg-gradient-to-r from-green-500 via-teal-500 to-blue-400'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400'
                }`}
              >
                {thinkingState.waitingForUserTranscription ? 'Listening' : 'Thinking'}
              </span>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="pb-16 flex items-center justify-center space-x-8">
          {/* Microphone button */}
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={
              !isConnected || (status !== 'ready' && status !== 'connected' && !isRecording)
            }
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium transition-all transform hover:scale-105 shadow-lg ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : canStartRecording
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>

          {/* Chat view button */}
          {chat.history.length > 0 && (
            <button
              onClick={() => setShowChat(true)}
              className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-medium transition-all transform hover:scale-105 shadow-lg"
              title="Show Chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Error Display */}
        {status === 'error' && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">
                Connection error. Please try reconnecting.
              </span>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  )
}

export default SpeakPage
