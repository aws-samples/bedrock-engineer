import { KnowledgeBase } from '@/types/agent-chat'
import { Message } from '@aws-sdk/client-bedrock-runtime'

// コードブロックを抽出する関数
export const extractCodeBlock = (text: string): string[] => {
  const blocks: string[] = []

  // 開始位置を検出
  const startMatches = text.match(/```\w*\n/g)
  if (!startMatches) {
    return [text]
  }

  let remainingText = text
  startMatches.forEach((startMatch) => {
    const startIndex = remainingText.indexOf(startMatch)
    if (startIndex === -1) return

    // コードブロックの開始位置以降のテキストを取得
    const afterStart = remainingText.slice(startIndex + startMatch.length)

    // 次のコードブロック開始位置または終了位置を探す
    const nextStartIndex = afterStart.indexOf('```\n')
    const nextBlockStart = afterStart.indexOf('```', 1) // 直後の```は除外

    let codeBlock: string
    if (nextStartIndex === -1 && nextBlockStart === -1) {
      // 閉じバッククォートが見つからない場合は残りすべてをコードとして扱う
      codeBlock = afterStart
    } else if (
      nextStartIndex !== -1 &&
      (nextBlockStart === -1 || nextStartIndex < nextBlockStart)
    ) {
      // 終了バッククォートが見つかった場合
      codeBlock = afterStart.slice(0, nextStartIndex)
    } else {
      // 次のブロック開始が見つかった場合
      codeBlock = afterStart.slice(0, nextBlockStart)
    }

    blocks.push(codeBlock.trim())
    remainingText = afterStart.slice(codeBlock.length)
  })

  return blocks
}

export const extractCode = (messages: Message[]): string => {
  const lastText =
    messages[messages.length - 1]?.role === 'assistant'
      ? (messages[messages.length - 1]?.content
          ?.map((i) => {
            return i.text
          })
          .join('')
          .split('\n')
          .reduce((acc: string[], line, index) => {
            if (index < 5) {
              // 最初の5行は空白行を除去
              if (line.trim() !== '') {
                acc.push(line)
              }
            } else {
              // 残りの行はそのまま追加
              acc.push(line)
            }
            return acc
          }, [])
          .join('\n') ?? '')
      : ''

  const codeBlocks = extractCodeBlock(lastText)
  return codeBlocks.join('\n')
}

export const replacePlaceholders = (text: string, knowledgeBases: KnowledgeBase[]) => {
  return text.replace(/{{knowledgeBases}}/g, JSON.stringify(knowledgeBases))
}
