import { useChatHistory } from '@renderer/contexts/ChatHistoryContext'
import { SessionMetadata } from '@/types/chat/history'
import { extractDiagramContent } from '../utils/xmlParser'
import {
  getDiagramMetadataList,
  saveDiagramMetadata,
  generateDiagramTitle,
  DiagramMetadata
} from '../utils/diagramMetadata'

export const useDiagramHistory = () => {
  const { getSession } = useChatHistory()

  // ダイアグラム関連のセッションのみをフィルタリング（メタデータベース）
  const getDiagramSessions = (): SessionMetadata[] => {
    const diagramMetadata = getDiagramMetadataList()

    // メタデータからSessionMetadataに変換
    return diagramMetadata.map((metadata) => ({
      id: metadata.sessionId,
      title: metadata.title,
      agentId: `${metadata.diagramMode}Agent`,
      createdAt: metadata.createdAt,
      updatedAt: metadata.createdAt,
      messageCount: 0, // メタデータのみなので0とする
      modelId: 'unknown' // メタデータのみなので未知とする
    }))
  }

  // ダイアグラム生成完了時にメタデータを保存
  const saveDiagramSession = (
    sessionId: string,
    prompt: string,
    explanation: string,
    diagramMode: string
  ) => {
    const title = generateDiagramTitle(prompt, explanation)
    const metadata: DiagramMetadata = {
      sessionId,
      title,
      createdAt: Date.now(),
      diagramMode,
      hasXml: true
    }

    saveDiagramMetadata(metadata)
  }

  // セッションからダイアグラム情報を取得
  const getDiagramFromSession = (sessionId: string) => {
    try {
      const session = getSession(sessionId)
      if (!session) return null

      // 最後のアシスタントメッセージからXMLと説明文を直接抽出
      const lastAssistantMessage = session.messages.filter((msg) => msg.role === 'assistant').pop()

      if (!lastAssistantMessage?.content) return null

      const rawContent = lastAssistantMessage.content
        .map((c) => ('text' in c ? c.text : ''))
        .join('')

      // XMLパーサーを使用してXMLと説明文を分離
      const { xml, explanation } = extractDiagramContent(rawContent)

      if (!xml) return null

      return {
        xml,
        explanation: explanation || '',
        diagramMode: 'aws' // デフォルトモード
      }
    } catch (error) {
      console.warn(`Error getting diagram from session ${sessionId}:`, error)
      return null
    }
  }

  // 説明文を指定した文字数で切り詰める
  const truncateExplanation = (explanation: string, maxLength: number = 200): string => {
    if (explanation.length <= maxLength) return explanation

    // 単語の途中で切れないように、最後のスペースまでで切り詰める
    const truncated = explanation.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')

    if (lastSpaceIndex > maxLength * 0.8) {
      // 80%以上の位置にスペースがある場合
      return truncated.substring(0, lastSpaceIndex) + '...'
    }

    return truncated + '...'
  }

  return {
    getDiagramSessions,
    getDiagramFromSession,
    truncateExplanation,
    saveDiagramSession
  }
}
