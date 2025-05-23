import { converse } from '@renderer/lib/api'
import toast from 'react-hot-toast'

export async function generateSessionTitle(
  session: { id: string; messages: any[] },
  modelId: string,
  t: any
): Promise<string | null> {
  try {
    if (!session) {
      throw new Error('Session not found')
    }

    // チャット履歴から会話内容を取得
    const recentMessages = session.messages || []
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
    const joinedMsgs = messages
      .map((m) => m.content?.map((v) => v.text).join('\n'))
      .join('\n')
      .slice(0, 1000)

    // 現在設定されているモデルを使用
    const response = await converse({
      modelId: modelId ?? 'anthropic.claude-3-haiku-20240307-v1:0',
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
  } catch (error) {
    console.error('Failed to generate AI title:', error)
    toast.error(t('Failed to generate title'))
    return null
  }
}
