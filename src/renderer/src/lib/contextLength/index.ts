import type { Message } from '@aws-sdk/client-bedrock-runtime'

/**
 * コンテキストの長さを制限し、重要なメッセージを保持する関数
 *
 * この関数は以下の条件を満たすメッセージを保持します：
 * 1. 最新の `contextLength` 件のメッセージ
 * 2. ToolUseとToolResultのペアを維持するために必要なメッセージ
 * 3. reasoningContent を含むメッセージ
 * 4. reasoningContent を含むメッセージに関連する ToolUse と ToolResult のペア
 *
 * @param messages 全てのメッセージ配列
 * @param contextLength 保持するコンテキストの長さ
 * @returns 制限されたコンテキストを持つメッセージ配列
 */
export function limitContextLength(messages: Message[], contextLength: number): Message[] {
  if (!contextLength || contextLength <= 0 || messages.length <= contextLength) {
    return messages
  }

  // ToolUseとToolResultのペアを特定するためのマップ
  const toolUseIdMap = new Map<string, boolean>()
  const toolResultIdMap = new Map<string, boolean>()

  // 最新のメッセージから必要なToolUseIdとToolResultIdを収集
  const recentMessages = messages.slice(-contextLength)
  recentMessages.forEach((message) => {
    if (message.content) {
      message.content.forEach((block) => {
        if (block.toolUse?.toolUseId) {
          toolUseIdMap.set(block.toolUse.toolUseId, true)
        }
        if (block.toolResult?.toolUseId) {
          toolResultIdMap.set(block.toolResult.toolUseId, true)
        }
      })
    }
  })

  // reasoningContent を含むメッセージと、関連する ToolUse のIDを収集
  const reasoningToolIds = new Set<string>()
  messages.forEach((message) => {
    if (message.content) {
      const hasReasoning = message.content.some((block) => block.reasoningContent)
      if (hasReasoning) {
        message.content.forEach((block) => {
          if (block.toolUse?.toolUseId) {
            reasoningToolIds.add(block.toolUse.toolUseId)
          }
        })
      }
    }
  })

  // 古いメッセージから必要なメッセージを見つける
  const olderMessages = messages.slice(0, -contextLength)
  const requiredOlderMessages = olderMessages.filter((message) => {
    if (!message.content) return false

    return message.content.some((block) => {
      // reasoningContent を含むメッセージ
      if (block.reasoningContent) {
        return true
      }

      // ToolResultに対応するToolUseが最新メッセージまたはreasoningContentに含まれている場合
      if (
        block.toolResult?.toolUseId &&
        (toolUseIdMap.has(block.toolResult.toolUseId) ||
          reasoningToolIds.has(block.toolResult.toolUseId))
      ) {
        return true
      }

      // ToolUseに対応するToolResultが最新メッセージに含まれている場合
      if (block.toolUse?.toolUseId && toolResultIdMap.has(block.toolUse.toolUseId)) {
        return true
      }

      // reasoningContent に関連する ToolUse
      if (block.toolUse?.toolUseId && reasoningToolIds.has(block.toolUse.toolUseId)) {
        return true
      }

      return false
    })
  })

  // 必要なメッセージと最新のメッセージを結合
  return [...requiredOlderMessages, ...recentMessages]
}
