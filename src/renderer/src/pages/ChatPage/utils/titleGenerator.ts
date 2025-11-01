import { converse } from '@renderer/lib/api'
import toast from 'react-hot-toast'

export async function generateSessionTitle(
  session: { id: string; messages: any[] },
  modelId: string,
  t: any
): Promise<string | null> {
  // エラーログで使用するため、関数スコープで宣言
  let joinedMsgs = ''

  try {
    if (!session) {
      throw new Error('Session not found')
    }

    // チャット履歴から会話内容を取得
    const recentMessages = session.messages || []

    // セッションにメッセージがない場合は早期リターン
    if (recentMessages.length === 0) {
      console.warn('No messages found in session for title generation')
      return null
    }

    const messages = recentMessages.map((m) => ({
      role: m.role,
      content: m.content
    }))

    const system = [
      {
        text:
          'You are an assistant who summarizes the contents of the conversation and gives it a title.' +
          'Generate a title according to the following conditions:\n' +
          '- !Important: Up to 15 characters long\n' +
          '- !Important: Output the title only (no explanation required)' +
          '- Do not use decorative words\n' +
          '- Express the essence of the conversation succinctly\n'
      }
    ]

    // messages の配列に含まれるテキスト要素を結合する（上限 1000 文字）
    // textプロパティが存在するブロックのみを抽出
    joinedMsgs = messages
      .map((m) =>
        m.content
          ?.filter((v) => 'text' in v && v.text) // textプロパティがある場合のみ
          .map((v) => v.text)
          .join('\n')
      )
      .filter(Boolean) // 空文字列を除外
      .join('\n')
      .slice(0, 1000)

    // テキストコンテンツが空の場合は早期リターン
    if (!joinedMsgs.trim()) {
      console.warn('No text content found in messages for title generation')
      return null
    }

    // 軽量処理用モデルまたは現在のモデルを使用
    // modelIdはuseLightProcessingModelから取得されたものを使用
    const response = await converse({
      modelId: modelId,
      system,
      inferenceConfig: {
        // Claude 3.7 Sonnetの場合、thinking.budget_tokensより大きい値を設定
        maxTokens: modelId?.includes('claude-3-7-sonnet') ? 32768 : 4096,
        temperature: 0.5
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              text: joinedMsgs
            }
          ]
        }
      ]
    })

    // レスポンスからテキスト要素のみを抽出
    const textContent = response.output.message.content.find((item) => 'text' in item)
    if (textContent && 'text' in textContent) {
      return textContent.text
    } else {
      console.warn('No text content found in response:', response)
      return null
    }
  } catch (error: any) {
    // エラーの詳細をログ出力
    console.error('Failed to generate AI title:', {
      error: error.message || error,
      errorDetails: error,
      modelId,
      sessionId: session.id,
      messageCount: session.messages?.length,
      hasTextContent: !!joinedMsgs?.trim()
    })

    // ユーザーには簡潔なエラーメッセージを表示
    toast.error(t('Failed to generate title'))
    return null
  }
}
