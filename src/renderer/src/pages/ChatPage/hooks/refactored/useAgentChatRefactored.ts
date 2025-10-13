import { useMemo, useCallback, useEffect } from 'react'
import { ImageFormat } from '@aws-sdk/client-bedrock-runtime'
import { ToolState } from '@/types/agent-chat'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { isMcpTool } from '@/types/tools'
import { useAgentTools } from '../useAgentTools'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { notificationService } from '@renderer/services/NotificationService'
// Import type will be resolved from the original location
type AttachedImage = {
  file: File
  base64: string
}

// 分割されたフックをインポート
import { useMessages } from './useMessages'
import { useRequestControl } from './useRequestControl'
import { useChatUIState } from './useChatUIState'
import { useSessionManager } from './useSessionManager'
import { useToolExecution } from './useToolExecution'
import { useStreamChat } from './useStreamChat'

export const useAgentChatRefactored = (
  modelId: string,
  systemPrompt?: string,
  agentId?: string,
  sessionId?: string,
  options?: {
    enableHistory?: boolean
    tools?: ToolState[]
  }
) => {
  const { enableHistory = true, tools: explicitTools } = options || {}
  const { t } = useTranslation()

  const {
    notification,
    contextLength,
    guardrailSettings,
    getAgentTools,
    agents,
    enablePromptCache
  } = useSettings()

  // エージェントIDからツール設定を取得
  const rawEnabledTools = useMemo(() => {
    if (explicitTools) {
      return explicitTools.filter((tool) => tool.enabled)
    } else if (agentId) {
      const currentAgent = agents.find((a) => a.id === agentId)
      const hasMcpServers = currentAgent?.mcpServers && currentAgent.mcpServers.length > 0
      const agentTools = getAgentTools(agentId).filter((tool) => tool.enabled)

      return agentTools.filter((tool) => {
        const toolName = tool.toolSpec?.name
        if (!toolName) return false

        if (toolName === 'tavilySearch') {
          const tavilyApiKey = window.store.get('tavilySearch')?.apikey
          return !!tavilyApiKey && tavilyApiKey.length > 0
        }

        if (isMcpTool(toolName)) {
          if (!hasMcpServers) {
            console.warn(
              `MCP tool "${toolName}" is enabled but no MCP servers are configured. Tool will be disabled.`
            )
            return false
          }
        }
        return true
      })
    }
    return []
  }, [agentId, getAgentTools, explicitTools, agents])

  const enabledTools = useAgentTools(rawEnabledTools)

  // 分割されたフックを使用
  const requestControl = useRequestControl()
  const uiState = useChatUIState()
  const sessionManager = useSessionManager({
    modelId,
    systemPrompt,
    sessionId,
    enableHistory
  })

  const messagesHook = useMessages({
    enableHistory,
    modelId,
    enabledTools
  })

  const toolExecution = useToolExecution({
    guardrailSettings,
    setExecutingTool: uiState.setExecutingTool
  })

  const streamChat = useStreamChat({
    contextLength,
    enablePromptCache,
    setMessages: messagesHook.setMessages,
    setReasoning: uiState.setReasoning,
    setLatestReasoningText: uiState.setLatestReasoningText,
    persistMessage: async (msg, sessionId) => {
      const targetSessionId = sessionId || sessionManager.currentSessionId
      if (targetSessionId) {
        return await messagesHook.persistMessage(msg, targetSessionId)
      }
      return msg
    }
  })

  // セッション初期化時にメッセージを同期
  useEffect(() => {
    if (sessionManager.currentSessionId && enableHistory) {
      // セッションからメッセージを読み込む処理をここに追加
      // 現在の実装では useChatHistory から直接取得する必要がある
    }
  }, [sessionManager.currentSessionId, enableHistory])

  const stopGeneration = useCallback(() => {
    requestControl.abortCurrentRequest()

    if (messagesHook.messages.length > 0) {
      // 不完全なtoolUse/toolResultペアを削除するロジック
      const updatedMessages = [...messagesHook.messages]
      const toolUseIds = new Map<string, { useIndex: number; resultIndex: number }>()

      updatedMessages.forEach((msg, msgIndex) => {
        if (!msg.content) return

        msg.content.forEach((content) => {
          if ('toolUse' in content && content.toolUse?.toolUseId) {
            const toolUseId = content.toolUse.toolUseId
            const entry = toolUseIds.get(toolUseId) || { useIndex: -1, resultIndex: -1 }
            entry.useIndex = msgIndex
            toolUseIds.set(toolUseId, entry)
          }

          if ('toolResult' in content && content.toolResult?.toolUseId) {
            const toolUseId = content.toolResult.toolUseId
            const entry = toolUseIds.get(toolUseId) || { useIndex: -1, resultIndex: -1 }
            entry.resultIndex = msgIndex
            toolUseIds.set(toolUseId, entry)
          }
        })
      })

      const indicesToDelete = new Set<number>()
      toolUseIds.forEach(({ useIndex, resultIndex }) => {
        if (useIndex >= 0 && resultIndex === -1) {
          indicesToDelete.add(useIndex)
        }
      })

      const sortedIndicesToDelete = [...indicesToDelete].sort((a, b) => b - a)
      if (sortedIndicesToDelete.length > 0) {
        for (const index of sortedIndicesToDelete) {
          updatedMessages.splice(index, 1)
        }
        messagesHook.setMessages(updatedMessages)
        toast.success(t('Generation stopped'))
      } else {
        toast.success(t('Generation stopped'))
      }
    }

    uiState.setLoading(false)
    uiState.setExecutingTool(null)
  }, [requestControl, messagesHook, uiState, t])

  const handleSubmit = useCallback(
    async (userInput: string, attachedImages?: AttachedImage[]) => {
      if (!userInput && (!attachedImages || attachedImages.length === 0)) {
        return toast.error('Please enter a message or attach images')
      }

      if (!modelId) {
        return toast.error('Please select a model')
      }

      try {
        uiState.setLoading(true)
        const currentMessages = [...messagesHook.messages]

        const imageContents: any =
          attachedImages?.map((image) => ({
            image: {
              format: image.file.type.split('/')[1] as ImageFormat,
              source: {
                bytes: image.base64
              }
            }
          })) ?? []

        const textContent = guardrailSettings.enabled
          ? {
              guardContent: {
                text: {
                  text: userInput
                }
              }
            }
          : {
              text: userInput
            }

        const content = imageContents.length > 0 ? [...imageContents, textContent] : [textContent]

        const userMessage = await messagesHook.addUserMessage(
          content,
          sessionManager.currentSessionId
        )
        currentMessages.push(userMessage)

        const abortController = requestControl.createNewAbortController()

        await streamChat.streamChat(
          {
            messages: currentMessages,
            modelId,
            system: systemPrompt ? [{ text: systemPrompt }] : undefined,
            toolConfig: enabledTools.length ? { tools: enabledTools } : undefined
          },
          currentMessages,
          abortController.signal
        )

        const lastMessage = currentMessages[currentMessages.length - 1]
        if (lastMessage.content?.find((v) => v.toolUse)) {
          if (lastMessage.content) {
            await toolExecution.executeToolsRecursively(
              lastMessage.content,
              currentMessages,
              async (msg) => {
                if (sessionManager.currentSessionId) {
                  return await messagesHook.persistMessage(msg, sessionManager.currentSessionId)
                }
                return msg
              },
              streamChat.streamChat,
              modelId,
              systemPrompt,
              enabledTools
            )
          }
        }

        // タイトル生成のチェック
        await sessionManager.generateTitleForCurrentSession(messagesHook.messages)

        // 通知の表示
        if (notification) {
          const lastAssistantMessage = currentMessages
            .filter((msg) => msg.role === 'assistant')
            .pop()
          let notificationBody = ''

          if (lastAssistantMessage?.content) {
            const textContent = lastAssistantMessage.content
              .filter((content) => 'text' in content)
              .map((content) => (content as { text: string }).text)
              .join(' ')

            notificationBody = textContent
              .split(/[.。]/)
              .filter((sentence) => sentence.trim().length > 0)
              .slice(0, 2)
              .join('. ')
              .trim()

            if (notificationBody.length > 100) {
              notificationBody = notificationBody.substring(0, 100) + '...'
            }
          }

          if (!notificationBody) {
            notificationBody = t('notification.messages.chatComplete.body')
          }

          await notificationService.showNotification(
            t('notification.messages.chatComplete.title'),
            {
              body: notificationBody,
              silent: false
            }
          )
        }
      } catch (error: any) {
        console.error('Error in handleSubmit:', error)
        toast.error(error.message || 'An error occurred')
      } finally {
        uiState.setLoading(false)
        uiState.setExecutingTool(null)
      }

      return // Add explicit return for TypeScript
    },
    [
      modelId,
      systemPrompt,
      enabledTools,
      guardrailSettings,
      messagesHook,
      sessionManager,
      requestControl,
      streamChat,
      toolExecution,
      uiState,
      notification,
      t
    ]
  )

  const clearChat = useCallback(async () => {
    requestControl.abortCurrentRequest()
    await sessionManager.clearSession()
    messagesHook.clearMessages()
  }, [requestControl, sessionManager, messagesHook])

  return {
    messages: messagesHook.messages,
    loading: uiState.loading,
    reasoning: uiState.reasoning,
    executingTool: uiState.executingTool,
    latestReasoningText: uiState.latestReasoningText,
    handleSubmit,
    setMessages: messagesHook.setMessages,
    currentSessionId: sessionManager.currentSessionId,
    setCurrentSessionId: sessionManager.setCurrentSessionId,
    clearChat,
    stopGeneration
  }
}
