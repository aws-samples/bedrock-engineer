import { useState, useRef, useCallback, useEffect } from 'react'
import { useSocketConnection, SocketEvents } from './useSocketConnection'
import { useAudioRecorder } from './useAudioRecorder'
import { useAudioPlayer } from './useAudioPlayer'
import { ChatHistoryManager, ChatHistory } from '../lib/ChatHistoryManager'
import { ToolState } from 'src/types/agent-chat'

export type SpeakChatStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'ready'
  | 'recording'
  | 'processing'
  | 'error'

export interface ErrorState {
  type: 'connection' | 'recording' | 'audio' | 'unknown'
  message: string
  timestamp: number
}

export interface ThinkingState {
  waitingForUserTranscription: boolean
  waitingForAssistantResponse: boolean
}

export interface ToolExecutionState {
  isExecuting: boolean
  currentTool?: {
    toolName: string
    toolUseId: string
  }
  lastResult?: {
    toolName: string
    result: any
  }
}

export interface UseSpeakChatReturn {
  // Status
  status: SpeakChatStatus
  isConnected: boolean
  isRecording: boolean
  thinkingState: ThinkingState
  toolExecutionState: ToolExecutionState
  errorState: ErrorState | null

  // Chat history
  chat: ChatHistory

  // Controls
  connect: () => void
  disconnect: () => void
  startRecording: () => Promise<void>
  stopRecording: () => void

  // Configuration
  systemPrompt: string
  setSystemPrompt: (prompt: string) => void
}

const DEFAULT_SYSTEM_PROMPT =
  'You are a friend. The user and you will engage in a spoken ' +
  'dialog exchanging the transcripts of a natural real-time conversation. Keep your responses short, ' +
  'generally two or three sentences for chatty scenarios.'

export function useSpeakChat(
  serverUrl?: string,
  agentSystemPrompt?: string,
  agentTools?: ToolState[],
  selectedVoiceId?: string
): UseSpeakChatReturn {
  const [status, setStatus] = useState<SpeakChatStatus>('disconnected')

  // エージェントのシステムプロンプトを音声会話用に調整
  const enhancedAgentPrompt = agentSystemPrompt
    ? `${agentSystemPrompt}\n\nAdditional instructions for voice conversation: Keep your responses short and natural, generally two or three sentences for chatty scenarios. Speak as if you are having a real-time conversation.`
    : DEFAULT_SYSTEM_PROMPT

  const [systemPrompt, setSystemPrompt] = useState<string>(enhancedAgentPrompt)
  const [chat, setChat] = useState<ChatHistory>({ history: [] })
  const [thinkingState, setThinkingState] = useState<ThinkingState>({
    waitingForUserTranscription: false,
    waitingForAssistantResponse: false
  })
  const [toolExecutionState, setToolExecutionState] = useState<ToolExecutionState>({
    isExecuting: false
  })
  const [errorState, setErrorState] = useState<ErrorState | null>(null)

  // Session management
  const sessionInitializedRef = useRef<boolean>(false)
  const transcriptionReceivedRef = useRef<boolean>(false)
  const displayAssistantTextRef = useRef<boolean>(false)
  const roleRef = useRef<string>('')

  // Chat history management
  const chatRef = useRef<ChatHistory>(chat)
  const chatHistoryManagerRef = useRef<ChatHistoryManager | null>(null)

  // Update chat ref when chat changes
  useEffect(() => {
    chatRef.current = chat
  }, [chat])

  // Update system prompt when agent system prompt changes
  useEffect(() => {
    const enhancedPrompt = agentSystemPrompt
      ? `${agentSystemPrompt}\n\nAdditional instructions for voice conversation: Keep your responses short and natural, generally two or three sentences for chatty scenarios. Speak as if you are having a real-time conversation.`
      : DEFAULT_SYSTEM_PROMPT
    setSystemPrompt(enhancedPrompt)
  }, [agentSystemPrompt])

  // Initialize chat history manager
  useEffect(() => {
    if (!chatHistoryManagerRef.current) {
      // Pass chatRef directly instead of creating a new object
      chatHistoryManagerRef.current = ChatHistoryManager.getInstance(chatRef, setChat)
    } else {
      // Update the manager's references to ensure they stay in sync
      ChatHistoryManager.getInstance(chatRef, setChat)
    }
  }, [setChat])

  // Base64 to Float32Array conversion
  const base64ToFloat32Array = useCallback((base64String: string): Float32Array => {
    try {
      const binaryString = window.atob(base64String)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const int16Array = new Int16Array(bytes.buffer)
      const float32Array = new Float32Array(int16Array.length)
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0
      }

      return float32Array
    } catch (error) {
      console.error('Error in base64ToFloat32Array:', error)
      throw error
    }
  }, [])

  // Socket event handlers
  const socketEvents: Partial<SocketEvents> = {
    contentStart: (data) => {
      console.log('Content start received:', data)
      roleRef.current = data.role

      if (data.type === 'TEXT') {
        if (data.role === 'USER') {
          // When user's text content starts, hide user thinking indicator
          setThinkingState((prev) => ({ ...prev, waitingForUserTranscription: false }))
        } else if (data.role === 'ASSISTANT') {
          // When assistant's text content starts, hide assistant thinking indicator
          setThinkingState((prev) => ({ ...prev, waitingForAssistantResponse: false }))

          // Default to showing assistant text
          displayAssistantTextRef.current = true

          try {
            if (data.additionalModelFields) {
              const additionalFields = JSON.parse(data.additionalModelFields)
              console.log('[contentStart] Assistant additionalModelFields:', additionalFields)

              // Only hide text if explicitly marked as non-displayable
              const isSpeculative = additionalFields.generationStage === 'SPECULATIVE'
              console.log('[contentStart] isSpeculative:', isSpeculative)
            }
          } catch (e) {
            console.error('Error parsing additionalModelFields:', e)
            // On error, default to showing the text
            displayAssistantTextRef.current = true
          }
        }
      } else if (data.type === 'AUDIO') {
        // When audio content starts, we may need to show user thinking indicator
        if (status === 'recording') {
          setThinkingState((prev) => ({ ...prev, waitingForUserTranscription: true }))
        }
      }
    },

    textOutput: (data) => {
      console.log('Received text output:', data)

      if (roleRef.current === 'USER') {
        // When user text is received, show thinking indicator for assistant response
        transcriptionReceivedRef.current = true

        // Add user message to chat
        if (chatHistoryManagerRef.current) {
          chatHistoryManagerRef.current.addTextMessage({
            role: data.role,
            message: data.content
          })
        }

        // Show assistant thinking indicator after user text appears
        setThinkingState((prev) => ({ ...prev, waitingForAssistantResponse: true }))
      } else if (roleRef.current === 'ASSISTANT') {
        console.log(
          '[textOutput] Assistant text received, displayAssistantTextRef:',
          displayAssistantTextRef.current
        )
        if (displayAssistantTextRef.current) {
          if (chatHistoryManagerRef.current) {
            chatHistoryManagerRef.current.addTextMessage({
              role: data.role,
              message: data.content
            })
          }
        } else {
          console.log('[textOutput] Skipping assistant text (not displaying)')
        }
      }
    },

    audioOutput: (data) => {
      if (data.content) {
        try {
          const audioData = base64ToFloat32Array(data.content)
          audioPlayer.playAudio(audioData)
        } catch (error) {
          console.error('Error processing audio data:', error)
        }
      }
    },

    contentEnd: (data) => {
      console.log('Content end received:', data)

      if (data.type === 'TEXT') {
        if (roleRef.current === 'USER') {
          // When user's text content ends, make sure assistant thinking is shown
          setThinkingState((prev) => ({
            ...prev,
            waitingForUserTranscription: false,
            waitingForAssistantResponse: true
          }))
        } else if (roleRef.current === 'ASSISTANT') {
          // When assistant's text content ends, prepare for user input in next turn
          setThinkingState((prev) => ({ ...prev, waitingForAssistantResponse: false }))
        }

        // Handle stop reasons - only call endTurn for actual END_TURN, not PARTIAL_TURN
        if (data.stopReason && data.stopReason.toUpperCase() === 'END_TURN') {
          if (chatHistoryManagerRef.current) {
            chatHistoryManagerRef.current.endTurn()
          }
        } else if (data.stopReason && data.stopReason.toUpperCase() === 'INTERRUPTED') {
          console.log('Interrupted by user')
          audioPlayer.bargeIn()
        }
        // Note: PARTIAL_TURN is ignored - don't call endTurn() for partial turns
      } else if (data.type === 'AUDIO') {
        // When audio content ends, we may need to show user thinking indicator
        if (status === 'recording') {
          setThinkingState((prev) => ({ ...prev, waitingForUserTranscription: true }))
        }
      }
    },

    streamComplete: () => {
      console.log('Stream completed')
      setStatus('ready')
    },

    toolUse: (data) => {
      console.log('Tool use started:', data)
      setToolExecutionState({
        isExecuting: true,
        currentTool: {
          toolName: data.toolName,
          toolUseId: data.toolUseId
        }
      })
    },

    toolResult: (data) => {
      console.log('Tool result received:', data)
      setToolExecutionState((prev) => ({
        isExecuting: false,
        lastResult: {
          toolName: prev.currentTool?.toolName || data.toolName || 'unknown',
          result: data.result
        }
      }))
    },

    error: (error) => {
      console.error('Socket error:', error)
      setStatus('error')

      // Set detailed error state based on the error content
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown error'
      setErrorState({
        type: 'connection',
        message: errorMessage,
        timestamp: Date.now()
      })
    }
  }

  // Initialize socket connection
  const socket = useSocketConnection(serverUrl, socketEvents)

  // Initialize audio recorder
  const audioRecorder = useAudioRecorder({
    onAudioData: (audioData) => {
      socket.sendAudioInput(audioData)
    }
  })

  // Initialize audio player
  const audioPlayer = useAudioPlayer()

  // Initialize session
  const initializeSession = useCallback(async () => {
    if (sessionInitializedRef.current) return

    try {
      console.log('Initializing session...')

      // Nova Sonicで使用するツールを準備（有効なツールのみ）
      const enabledTools = agentTools?.filter((tool) => tool.enabled) || []

      // Send events in sequence
      socket.sendPromptStart(enabledTools, selectedVoiceId)
      socket.sendSystemPrompt(systemPrompt)
      socket.sendAudioStart()

      sessionInitializedRef.current = true
      setStatus('ready')
      console.log('Session initialized successfully')
    } catch (error) {
      console.error('Failed to initialize session:', error)
      setStatus('error')
    }
  }, [socket, systemPrompt, agentTools])

  // Connect to server
  const connect = useCallback(async () => {
    try {
      setStatus('connecting')
      console.log('Starting connection process...')

      // Initialize audio player FIRST and wait for completion
      console.log('Initializing audio player before socket connection...')
      await audioPlayer.start()
      console.log('Audio player initialized successfully, proceeding with socket connection')

      // Only connect socket after audio player is ready
      socket.connect()
      console.log('Socket connection initiated')
    } catch (error) {
      console.error('Failed to initialize audio player during connection:', error)
      setStatus('error')
      // Don't proceed with socket connection if audio player fails
    }
  }, [socket, audioPlayer])

  // Disconnect from server
  const disconnect = useCallback(() => {
    socket.disconnect()
    audioRecorder.stopRecording()
    audioPlayer.stop()
    sessionInitializedRef.current = false
    setStatus('disconnected')

    // Clear chat history on disconnect
    if (chatHistoryManagerRef.current) {
      chatHistoryManagerRef.current.clearHistory()
    }
  }, [socket, audioRecorder, audioPlayer])

  // Start recording
  const startRecording = useCallback(async () => {
    if (socket.status !== 'connected') {
      console.warn('Cannot start recording: not connected to server')
      return
    }

    // Initialize session if needed
    if (!sessionInitializedRef.current) {
      await initializeSession()
    }

    try {
      await audioRecorder.startRecording()
      setStatus('recording')

      // Show user thinking indicator when starting to record
      transcriptionReceivedRef.current = false
      setThinkingState((prev) => ({ ...prev, waitingForUserTranscription: true }))

      console.log('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      setStatus('error')
    }
  }, [socket.status, audioRecorder, initializeSession])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (audioRecorder.isRecording) {
      audioRecorder.stopRecording()
      setStatus('processing')

      // Tell server to finalize processing
      socket.sendStopAudio()

      // Don't call endTurn here - let the server-side events handle it properly
      console.log('Recording stopped')
    }
  }, [audioRecorder, socket])

  // Monitor connection during recording and handle disconnections
  useEffect(() => {
    if (audioRecorder.isRecording && socket.status !== 'connected') {
      console.warn('Socket disconnected during recording, stopping recording')
      stopRecording()
      setStatus('error')
      setErrorState({
        type: 'connection',
        message: 'Connection lost during recording',
        timestamp: Date.now()
      })
    }
  }, [socket.status, audioRecorder.isRecording, stopRecording])

  // Update status based on socket connection
  useEffect(() => {
    switch (socket.status) {
      case 'connecting':
        setStatus('connecting')
        setErrorState(null) // Clear any previous errors when attempting to connect
        break
      case 'connected':
        setStatus('connected')
        setErrorState(null) // Clear errors on successful connection
        break
      case 'disconnected':
        setStatus('disconnected')
        sessionInitializedRef.current = false
        // Only set error if it wasn't a user-initiated disconnect
        if (status !== 'disconnected') {
          setErrorState({
            type: 'connection',
            message: 'Connection lost',
            timestamp: Date.now()
          })
        }
        break
      case 'error':
        setStatus('error')
        setErrorState({
          type: 'connection',
          message: 'Connection error occurred',
          timestamp: Date.now()
        })
        break
    }
  }, [socket.status, status])

  return {
    status,
    isConnected: socket.status === 'connected',
    isRecording: audioRecorder.isRecording,
    thinkingState,
    toolExecutionState,
    errorState,
    chat,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    systemPrompt,
    setSystemPrompt
  }
}
