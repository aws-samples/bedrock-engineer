import { useCallback } from 'react'
import { ContentBlock } from '@aws-sdk/client-bedrock-runtime'
import { generateMessageId } from '@/types/chat/metadata'
import { IdentifiableMessage } from '@/types/chat/message'
import { ToolName } from '@/types/tools'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export interface UseToolExecutionProps {
  guardrailSettings: {
    enabled: boolean
    guardrailIdentifier?: string
    guardrailVersion?: string
  }
  setExecutingTool: (tool: ToolName | null) => void
}

export interface UseToolExecutionReturn {
  executeToolsRecursively: (
    contentBlocks: ContentBlock[],
    currentMessages: any[],
    persistMessage: (message: IdentifiableMessage) => Promise<IdentifiableMessage>,
    streamChat: (props: any, messages: any[]) => Promise<string | undefined>,
    modelId: string,
    systemPrompt?: string,
    enabledTools?: any[]
  ) => Promise<void>
}

export const useToolExecution = ({
  guardrailSettings,
  setExecutingTool
}: UseToolExecutionProps): UseToolExecutionReturn => {
  const { t } = useTranslation()

  const executeToolsRecursively = useCallback(
    async (
      contentBlocks: ContentBlock[],
      currentMessages: any[],
      persistMessage: (message: IdentifiableMessage) => Promise<IdentifiableMessage>,
      streamChat: (props: any, messages: any[]) => Promise<string | undefined>,
      modelId: string,
      systemPrompt?: string,
      enabledTools: any[] = []
    ) => {
      const contentBlock = contentBlocks.find((block) => block.toolUse)
      if (!contentBlock) {
        return
      }

      const toolResults: ContentBlock[] = []
      for (const contentBlock of contentBlocks) {
        if (Object.keys(contentBlock).includes('toolUse')) {
          const toolUse = contentBlock.toolUse
          if (toolUse?.name) {
            try {
              const toolInput = {
                type: toolUse.name,
                ...(toolUse.input as any)
              }
              setExecutingTool(toolInput.type)
              const toolResult = await window.api.bedrock.executeTool(toolInput)
              setExecutingTool(null)

              // ツール実行結果用のContentBlockを作成
              let resultContentBlock: ContentBlock
              if (Object.prototype.hasOwnProperty.call(toolResult, 'name')) {
                resultContentBlock = {
                  toolResult: {
                    toolUseId: toolUse.toolUseId,
                    content: [{ json: toolResult as any }],
                    status: 'success'
                  }
                }
              } else {
                resultContentBlock = {
                  toolResult: {
                    toolUseId: toolUse.toolUseId,
                    content: [{ text: toolResult as any }],
                    status: 'success'
                  }
                }
              }

              // GuardrailがActive状態であればチェック実行
              if (
                guardrailSettings.enabled &&
                guardrailSettings.guardrailIdentifier &&
                guardrailSettings.guardrailVersion
              ) {
                try {
                  console.log('Applying guardrail to tool result')
                  // ツール結果をガードレールで検証
                  const toolResultText =
                    typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)

                  console.log({ toolResultText })
                  // ツール結果をGuardrailで評価
                  const guardrailResult = await window.api.bedrock.applyGuardrail({
                    guardrailIdentifier: guardrailSettings.guardrailIdentifier,
                    guardrailVersion: guardrailSettings.guardrailVersion,
                    source: 'OUTPUT', // ツールからの出力をチェック
                    content: [
                      {
                        text: {
                          text: toolResultText
                        }
                      }
                    ]
                  })
                  console.log({ guardrailResult })

                  // ガードレールが介入した場合は代わりにエラーメッセージを使用
                  if (guardrailResult.action === 'GUARDRAIL_INTERVENED') {
                    console.warn('Guardrail intervened for tool result', guardrailResult)
                    let errorMessage = t('guardrail.toolResult.blocked')

                    // もしガードレールが出力を提供していれば、それを使用
                    if (guardrailResult.outputs && guardrailResult.outputs.length > 0) {
                      const output = guardrailResult.outputs[0]
                      if (output.text) {
                        errorMessage = output.text
                      }
                    }

                    // エラーステータスのツール結果を作成
                    resultContentBlock = {
                      toolResult: {
                        toolUseId: toolUse.toolUseId,
                        content: [{ text: errorMessage }],
                        status: 'error'
                      }
                    }

                    toast(t('guardrail.intervention'), {
                      icon: '⚠️',
                      style: {
                        backgroundColor: '#FEF3C7', // Light yellow background
                        color: '#92400E', // Amber text color
                        border: '1px solid #F59E0B' // Amber border
                      }
                    })
                  }
                } catch (guardrailError) {
                  console.error('Error applying guardrail to tool result:', guardrailError)
                  // ガードレールエラー時は元のツール結果を使用し続ける
                }
              }

              // 最終的なツール結果をコレクションに追加
              toolResults.push(resultContentBlock)
            } catch (e: any) {
              console.error(e)
              toolResults.push({
                toolResult: {
                  toolUseId: toolUse.toolUseId,
                  content: [{ text: e.toString() }],
                  status: 'error'
                }
              })
            }
          }
        }
      }

      const toolResultMessage: IdentifiableMessage = {
        role: 'user',
        content: toolResults,
        id: generateMessageId()
      }
      currentMessages.push(toolResultMessage)
      await persistMessage(toolResultMessage)

      const stopReason = await streamChat(
        {
          messages: currentMessages,
          modelId,
          system: systemPrompt ? [{ text: systemPrompt }] : undefined,
          toolConfig: enabledTools.length ? { tools: enabledTools } : undefined
        },
        currentMessages
      )

      if (stopReason === 'tool_use') {
        const lastMessage = currentMessages[currentMessages.length - 1].content
        if (lastMessage) {
          await executeToolsRecursively(
            lastMessage,
            currentMessages,
            persistMessage,
            streamChat,
            modelId,
            systemPrompt,
            enabledTools
          )
          return
        }
      }
    },
    [guardrailSettings, setExecutingTool, t]
  )

  return {
    executeToolsRecursively
  }
}
