import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { BsQuestionCircle } from 'react-icons/bs'
import { useSpeakChat } from './hooks/useSpeakChat'
import { VoiceAILottie } from '@renderer/components/VoiceAI'
import { ChatDisplay } from './components/ChatDisplay'
import { useSystemPromptModal } from '../ChatPage/modals/useSystemPromptModal'
import { useAgentSettingsModal } from '../ChatPage/modals/useAgentSettingsModal'
import { AgentSelector } from '../ChatPage/components/AgentSelector'
import { ViewToggleButton } from '@renderer/components/ViewToggleButton'
import { useSettings } from '@renderer/contexts/SettingsContext'
import useSetting from '@renderer/hooks/useSetting'
import { SpeakChatStatus, ThinkingState, ToolExecutionState } from './hooks/useSpeakChat'
import { VoiceSelector } from './components/VoiceSelector'
import { VoiceId } from './constants/voices'
import { SampleTextCarousel } from './components/SampleTextCarousel'
import { usePermissionHelpModal } from './components/PermissionHelpModal'
import { RegionWarningBanner } from './components/RegionWarningBanner'
import { checkNovaSonicRegionSupport, type RegionCheckResult } from '@renderer/lib/api/novaSonic'

const API_ENDPOINT = window.store.get('apiEndpoint')

// ============================================================================
// 共通コンポーネント定義
// ============================================================================

interface PageHeaderProps {
  agents: any[]
  selectedAgentId: string
  onOpenAgentSettings: () => void
  onOpenSystemPrompt: () => void
  onOpenVoiceSelector: () => void
  onOpenPermissionHelp: () => void
}

const PageHeader: React.FC<PageHeaderProps> = ({
  agents,
  selectedAgentId,
  onOpenAgentSettings,
  onOpenSystemPrompt,
  onOpenVoiceSelector,
  onOpenPermissionHelp
}) => {
  const { t } = useTranslation()

  // Check if running on macOS
  const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <AgentSelector
          agents={agents}
          selectedAgent={selectedAgentId}
          onOpenSettings={onOpenAgentSettings}
        />
      </div>
      <div className="flex items-center gap-2">
        {isMacOS && (
          <div className="relative mr-2 group">
            <BsQuestionCircle
              className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
              onClick={onOpenPermissionHelp}
            />
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 text-xs
                          font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100
                          transition-opacity duration-300 whitespace-nowrap pointer-events-none"
            >
              {t('permissionHelp.tooltip')}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"></div>
            </div>
          </div>
        )}
        <span
          className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          onClick={onOpenVoiceSelector}
        >
          VOICE
        </span>
        <span
          className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
          onClick={onOpenSystemPrompt}
        >
          SYSTEM_PROMPT
        </span>
      </div>
    </div>
  )
}

interface RecordingButtonProps {
  isRecording: boolean
  canStartRecording: boolean
  canStopRecording: boolean
  status: SpeakChatStatus
  onStart: () => void
  onStop: () => void
  size?: 'small' | 'large'
}

const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  canStartRecording,
  canStopRecording,
  status,
  onStart,
  onStop,
  size = 'large'
}) => {
  const sizeClass = size === 'large' ? 'w-16 h-16' : 'w-12 h-12'
  const iconSize = size === 'large' ? 'w-6 h-6' : 'w-5 h-5'

  if (isRecording) {
    return (
      <button
        onClick={onStop}
        disabled={!canStopRecording}
        className={`${sizeClass} rounded-full flex items-center justify-center font-medium transition-colors border ${
          canStopRecording
            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 dark:border-red-800'
            : 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
        }`}
        title="Stop Recording"
      >
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={onStart}
      disabled={!canStartRecording}
      className={`${sizeClass} rounded-full flex items-center justify-center font-medium transition-colors border ${
        canStartRecording
          ? size === 'large'
            ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
            : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-800'
          : 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
      }`}
      title={status === 'processing' ? 'Processing...' : 'Start Recording'}
    >
      {status === 'processing' ? (
        <svg
          className={`${iconSize} animate-spin`}
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
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      )}
    </button>
  )
}

interface ThinkingIndicatorProps {
  thinkingState: ThinkingState
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ thinkingState }) => {
  if (!thinkingState.waitingForUserTranscription && !thinkingState.waitingForAssistantResponse) {
    return null
  }

  const isListening = thinkingState.waitingForUserTranscription
  const text = isListening ? 'Listening' : 'Thinking'
  const gradientClass = isListening
    ? 'bg-gradient-to-r from-green-500 via-teal-500 to-blue-400'
    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400'

  return (
    <span
      className={`text-lg font-semibold bg-[length:200%_100%] animate-gradient-x bg-clip-text text-transparent ${gradientClass}`}
    >
      {text}
    </span>
  )
}

interface ErrorDisplayProps {
  status: SpeakChatStatus
  errorState: any
  onOpenSettings?: () => void
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ status, errorState, onOpenSettings }) => {
  const { t } = useTranslation()

  if (status !== 'error') return null

  const handleReload = () => {
    window.location.reload()
  }

  // Check if this is a region-related error
  const isRegionRelatedError = (message: string): boolean => {
    const regionKeywords = [
      'region',
      'nova sonic',
      'nova-sonic',
      'not available',
      'unauthorized',
      'access denied',
      'forbidden',
      'ValidationException',
      'UnauthorizedOperation'
    ]
    return regionKeywords.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()))
  }

  // Get error message based on error state
  const getErrorMessage = () => {
    if (errorState) {
      const baseMessage = errorState.message || 'An unknown error occurred'

      // Check for region-specific errors
      if (isRegionRelatedError(baseMessage)) {
        return t('voiceChat.error.regionNotSupported', {
          defaultValue:
            'Voice Chat is not available in the current region or there are permission issues. Please check your AWS region settings.',
          message: baseMessage.slice(0, 100) // Limit message length
        })
      }

      switch (errorState.type) {
        case 'connection':
          return baseMessage.includes('region') ||
            baseMessage.includes('Nova Sonic') ||
            baseMessage.includes('nova-sonic')
            ? t('voiceChat.error.regionConnection', {
                defaultValue:
                  'Failed to connect to Voice Chat service. This may be due to region compatibility issues.',
                originalMessage: baseMessage
              })
            : baseMessage || 'Connection error occurred'
        case 'recording':
          return baseMessage || 'Recording error occurred'
        case 'audio':
          return baseMessage || 'Audio processing error occurred'
        default:
          return baseMessage
      }
    }
    return 'Connection error. Please try reconnecting.'
  }

  // Get error icon based on error type
  const getErrorIcon = () => {
    if (errorState?.type === 'recording') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }

  const isRegionError = errorState && isRegionRelatedError(errorState.message || '')

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start space-x-2">
        {getErrorIcon()}
        <div className="flex flex-col space-y-1 flex-1">
          <span className="text-sm font-medium">{getErrorMessage()}</span>
          {errorState?.timestamp && (
            <span className="text-xs text-red-200">
              {new Date(errorState.timestamp).toLocaleTimeString()}
            </span>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {isRegionError && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded transition-colors"
              >
                {t('voiceChat.error.openSettings', 'Open Settings')}
              </button>
            )}
            <button
              onClick={handleReload}
              className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition-colors"
            >
              {t('common.reload', 'Reload Page')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FixedElementsProps {
  showChat: boolean
  onToggleChat: (show: boolean) => void
  status: SpeakChatStatus
  errorState: any
  onOpenSettings?: () => void
}

const FixedElements: React.FC<FixedElementsProps> = ({
  showChat,
  onToggleChat,
  status,
  errorState,
  onOpenSettings
}) => (
  <>
    <div className={`fixed right-4 z-50 ${status === 'error' ? 'bottom-20' : 'bottom-4'}`}>
      <ViewToggleButton isDetailView={showChat} onToggle={onToggleChat} />
    </div>
    <ErrorDisplay status={status} errorState={errorState} onOpenSettings={onOpenSettings} />
  </>
)

// ============================================================================
// ビュー別コンポーネント
// ============================================================================

interface SimpleViewProps {
  isRecording: boolean
  canStartRecording: boolean
  canStopRecording: boolean
  status: SpeakChatStatus
  thinkingState: ThinkingState
  onStartRecording: () => void
  onStopRecording: () => void
  currentAgentScenarios?: Array<{ title: string; content: string }>
  chat: any
}

const SimpleView: React.FC<SimpleViewProps> = ({
  isRecording,
  canStartRecording,
  canStopRecording,
  status,
  thinkingState,
  onStartRecording,
  onStopRecording,
  currentAgentScenarios = [],
  chat
}) => {
  const hasMessages = chat && chat.history && chat.history.length > 0

  return (
    <>
      {/* Main content - centered AI icon */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <VoiceAILottie
            style={{ width: 240, height: 240 }}
            loop={isRecording || status === 'processing'}
            autoplay={isRecording || status === 'processing'}
          />
          <ThinkingIndicator thinkingState={thinkingState} />

          {/* Sample Text Animation */}
          <SampleTextCarousel
            scenarios={currentAgentScenarios}
            isVisible={!hasMessages}
            className="mt-4"
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pb-16 flex items-center justify-center">
        <RecordingButton
          isRecording={isRecording}
          canStartRecording={canStartRecording}
          canStopRecording={canStopRecording}
          status={status}
          onStart={onStartRecording}
          onStop={onStopRecording}
          size="large"
        />
      </div>
    </>
  )
}

interface DetailViewProps {
  chat: any
  thinkingState: ThinkingState
  toolExecutionState: ToolExecutionState
  canStartRecording: boolean
  canStopRecording: boolean
  status: SpeakChatStatus
  onStartRecording: () => void
  onStopRecording: () => void
}

const DetailView: React.FC<DetailViewProps> = ({
  chat,
  thinkingState,
  toolExecutionState,
  canStartRecording,
  canStopRecording,
  status,
  onStartRecording,
  onStopRecording
}) => (
  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
    <div className="flex-1 overflow-y-auto">
      <ChatDisplay
        chat={chat}
        thinkingState={thinkingState}
        toolExecutionState={toolExecutionState}
        className="h-full"
        audioControls={
          <div className="flex items-center justify-center space-x-4 p-4">
            <RecordingButton
              isRecording={false}
              canStartRecording={canStartRecording}
              canStopRecording={false}
              status={status}
              onStart={onStartRecording}
              onStop={onStopRecording}
              size="small"
            />
            <RecordingButton
              isRecording={true}
              canStartRecording={false}
              canStopRecording={canStopRecording}
              status={status}
              onStart={onStartRecording}
              onStop={onStopRecording}
              size="small"
            />
          </div>
        }
      />
    </div>
  </div>
)

// ============================================================================
// メインコンポーネント
// ============================================================================

export const SpeakPage: React.FC = () => {
  const navigate = useNavigate()
  const [showChat, setShowChat] = useState(false)
  const [showVoiceSelector, setShowVoiceSelector] = useState(false)
  const [regionCheck, setRegionCheck] = useState<RegionCheckResult | null>(null)
  const [regionCheckLoading, setRegionCheckLoading] = useState(true)
  const [showRegionWarning, setShowRegionWarning] = useState(true)
  const {
    currentAgentSystemPrompt,
    selectedAgentId,
    getAgentTools,
    selectedVoiceId,
    setSelectedVoiceId,
    currentAgent
  } = useSettings()
  const { agents, setSelectedAgentId } = useSetting()

  // 現在のエージェントのツール情報を取得
  const agentTools = getAgentTools(selectedAgentId)

  const {
    status,
    isConnected,
    isRecording,
    thinkingState,
    toolExecutionState,
    errorState,
    chat,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    systemPrompt
  } = useSpeakChat(API_ENDPOINT, currentAgentSystemPrompt, agentTools, selectedVoiceId)

  // Check region support when component mounts
  useEffect(() => {
    const checkRegionSupport = async () => {
      try {
        setRegionCheckLoading(true)
        const result = await checkNovaSonicRegionSupport()
        setRegionCheck(result)

        // If region is supported, show warning banner only briefly if there was an error
        if (result.isSupported && !result.error) {
          setShowRegionWarning(false)
        }
      } catch (error) {
        console.error('Failed to check region support:', error)
        setRegionCheck({
          isSupported: false,
          currentRegion: 'unknown',
          supportedRegions: ['us-east-1', 'us-west-2'],
          error: 'Failed to check region support'
        })
      } finally {
        setRegionCheckLoading(false)
      }
    }

    checkRegionSupport()
  }, [])

  // Auto-connect when component mounts (only if region is supported)
  useEffect(() => {
    // Only proceed with connection if region check is complete and region is supported
    if (regionCheckLoading || !regionCheck) {
      return
    }

    if (!regionCheck.isSupported) {
      console.log('SpeakPage: Skipping connection - Nova Sonic not supported in current region')
      return
    }

    // Only connect on initial mount and if not already connected
    const timer = setTimeout(() => {
      if (!isConnected && status === 'disconnected') {
        console.log('SpeakPage: Attempting to connect to server...')
        connect()
      } else {
        console.log('SpeakPage: Skipping connection (already connected or connecting)', {
          isConnected,
          status
        })
      }
    }, 100) // Small delay to ensure proper initialization

    return () => {
      clearTimeout(timer)
      console.log('SpeakPage: Component unmounting')
    }
  }, [regionCheck, regionCheckLoading, isConnected, status, connect])

  const {
    show: showSystemPromptModal,
    handleClose: handleCloseSystemPromptModal,
    handleOpen: handleOpenSystemPromptModal,
    SystemPromptModal
  } = useSystemPromptModal()

  const {
    show: showAgentSettingModal,
    handleOpen: openAgentSettingsModal,
    handleClose: handleCloseAgentSettingsModal,
    AgentSettingsModal
  } = useAgentSettingsModal()

  const { PermissionHelpModal, openModal: openPermissionHelpModal } = usePermissionHelpModal()

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

  // Voice selector handlers
  const handleOpenVoiceSelector = () => {
    setShowVoiceSelector(true)
  }

  const handleCloseVoiceSelector = () => {
    setShowVoiceSelector(false)
  }

  const handleSelectVoice = (voiceId: VoiceId) => {
    setSelectedVoiceId(voiceId)
  }

  const handleStartNewChatWithVoice = () => {
    // チャット履歴をクリアして新しいチャットを開始
    if (isConnected) {
      disconnect()
    }
    setShowVoiceSelector(false)
    // 少し遅延してから接続を開始
    setTimeout(() => {
      connect()
    }, 100)
  }

  const handleOpenSettings = () => {
    // Navigate to settings page using React Router
    navigate('/setting')
  }

  const handleDismissRegionWarning = () => {
    setShowRegionWarning(false)
  }

  const canStartRecording =
    isConnected &&
    (status === 'ready' || status === 'connected') &&
    !isRecording &&
    regionCheck?.isSupported === true
  const canStopRecording = isRecording

  const commonProps = {
    isRecording,
    canStartRecording,
    canStopRecording,
    status,
    thinkingState,
    onStartRecording: handleStartRecording,
    onStopRecording: handleStopRecording
  }

  return (
    <div className="flex p-3 h-full">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <PageHeader
          agents={agents}
          selectedAgentId={selectedAgentId}
          onOpenAgentSettings={openAgentSettingsModal}
          onOpenSystemPrompt={handleOpenSystemPromptModal}
          onOpenVoiceSelector={handleOpenVoiceSelector}
          onOpenPermissionHelp={openPermissionHelpModal}
        />

        {/* Region Warning Banner */}
        {!regionCheckLoading && regionCheck && !regionCheck.isSupported && showRegionWarning && (
          <RegionWarningBanner
            currentRegion={regionCheck.currentRegion}
            supportedRegions={regionCheck.supportedRegions}
            onDismiss={handleDismissRegionWarning}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {/* Main Content */}
        {showChat ? (
          <DetailView chat={chat} toolExecutionState={toolExecutionState} {...commonProps} />
        ) : (
          <SimpleView
            {...commonProps}
            currentAgentScenarios={currentAgent?.scenarios || []}
            chat={chat}
          />
        )}

        {/* Modals */}
        <SystemPromptModal
          isOpen={showSystemPromptModal}
          onClose={handleCloseSystemPromptModal}
          systemPrompt={systemPrompt}
        />

        <AgentSettingsModal
          isOpen={showAgentSettingModal}
          onClose={handleCloseAgentSettingsModal}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
        />

        {/* Voice Selector Modal */}
        <VoiceSelector
          isOpen={showVoiceSelector}
          selectedVoiceId={selectedVoiceId as VoiceId}
          onSelectVoice={handleSelectVoice}
          onStartNewChat={handleStartNewChatWithVoice}
          onCancel={handleCloseVoiceSelector}
        />

        {/* Permission Help Modal */}
        <PermissionHelpModal />

        {/* Fixed Elements */}
        <FixedElements
          showChat={showChat}
          onToggleChat={setShowChat}
          status={status}
          errorState={errorState}
          onOpenSettings={handleOpenSettings}
        />
      </div>
    </div>
  )
}

export default SpeakPage
