/**
 * DrawIO用のXMLを抽出するユーティリティ関数
 * アシスタントの回答から<mxfile>タグで囲まれたXML部分だけを抽出する
 *
 * @param content アシスタントの回答テキスト
 * @returns 抽出されたXML文字列、見つからない場合は空文字列
 */
export const extractDrawioXml = (content: string): string => {
  if (!content) return ''

  // <mxfile>タグの開始と終了を探す
  const mxfileStartRegex = /<mxfile[^>]*>/i
  const mxfileEndRegex = /<\/mxfile>/i

  const startMatch = content.match(mxfileStartRegex)
  const endMatch = content.match(mxfileEndRegex)

  if (startMatch && endMatch && startMatch.index !== undefined && endMatch.index !== undefined) {
    // <mxfile>タグの開始から</mxfile>の終わりまでを抽出
    const startIndex = startMatch.index
    const endIndex = endMatch.index + '</mxfile>'.length
    return content.substring(startIndex, endIndex)
  }

  // XMLコードブロック内にある可能性をチェック
  const xmlCodeBlockRegex = /```(?:xml)?\s*(<mxfile[\s\S]*?<\/mxfile>)\s*```/i
  const codeBlockMatch = content.match(xmlCodeBlockRegex)

  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1]
  }

  // 最後の手段として、<mxGraphModel>タグを探す（部分的なXMLの場合）
  const mxGraphModelRegex = /<mxGraphModel[\s\S]*?<\/mxGraphModel>/i
  const graphModelMatch = content.match(mxGraphModelRegex)

  if (graphModelMatch) {
    // <mxGraphModel>タグが見つかった場合、最小限のmxfile構造で包む
    return `<mxfile host="Electron" modified="${new Date().toISOString()}" type="device">
  <diagram>
    ${graphModelMatch[0]}
  </diagram>
</mxfile>`
  }

  return ''
}

/**
 * 生成AIの回答から説明文テキストを抽出するユーティリティ関数
 * XMLを除いた部分を説明文として抽出する
 * ストリーミング中の不完全なXMLも適切に処理する
 *
 * @param content アシスタントの回答テキスト
 * @returns 抽出された説明文テキスト
 */
export const extractExplanationText = (content: string): string => {
  if (!content) return ''

  // 説明文を取得するための処理
  let explanation = content

  // 1. 完全なXMLブロックを検出して除去
  // <mxfile>タグの開始と終了を探す
  const mxfileStartRegex = /<mxfile[^>]*>/i
  const mxfileEndRegex = /<\/mxfile>/i

  const startMatch = explanation.match(mxfileStartRegex)
  const endMatch = explanation.match(mxfileEndRegex)

  if (startMatch && endMatch && startMatch.index !== undefined && endMatch.index !== undefined) {
    // 完全なXMLブロックが見つかった場合
    const startIndex = startMatch.index
    const endIndex = endMatch.index + '</mxfile>'.length

    // 前後の説明文を結合
    const beforeXml = explanation.substring(0, startIndex).trim()
    const afterXml = explanation.substring(endIndex).trim()
    explanation = beforeXml + (beforeXml && afterXml ? '\n\n' : '') + afterXml
  } else if (startMatch && startMatch.index !== undefined) {
    // 開始タグだけが見つかった場合（ストリーミング中）
    // 開始タグより前の部分だけを説明文として扱う
    explanation = explanation.substring(0, startMatch.index).trim()
  }

  // 2. コードブロック内のXMLを処理
  const xmlCodeBlockRegex = /```(?:xml)?\s*(?:<mxfile[\s\S]*?<\/mxfile>)\s*```/i
  const codeBlockMatch = explanation.match(xmlCodeBlockRegex)

  if (codeBlockMatch && codeBlockMatch.index !== undefined) {
    // コードブロック内の完全なXMLが見つかった場合
    const beforeBlock = explanation.substring(0, codeBlockMatch.index).trim()
    const afterBlock = explanation.substring(codeBlockMatch.index + codeBlockMatch[0].length).trim()
    explanation = beforeBlock + (beforeBlock && afterBlock ? '\n\n' : '') + afterBlock
  } else {
    // 不完全なコードブロックを検出（ストリーミング中）
    const incompleteCodeBlockRegex = /```(?:xml)?\s*(?:<mxfile[\s\S]*?)$/i
    const incompleteMatch = explanation.match(incompleteCodeBlockRegex)

    if (incompleteMatch && incompleteMatch.index !== undefined) {
      // 不完全なコードブロックの開始位置までを説明文として扱う
      explanation = explanation.substring(0, incompleteMatch.index).trim()
    }
  }

  // 3. <mxGraphModel>タグを処理
  const mxGraphModelRegex = /<mxGraphModel[\s\S]*?<\/mxGraphModel>/i
  const graphModelMatch = explanation.match(mxGraphModelRegex)

  if (graphModelMatch && graphModelMatch.index !== undefined) {
    // 完全な<mxGraphModel>タグが見つかった場合
    const beforeModel = explanation.substring(0, graphModelMatch.index).trim()
    const afterModel = explanation
      .substring(graphModelMatch.index + graphModelMatch[0].length)
      .trim()
    explanation = beforeModel + (beforeModel && afterModel ? '\n\n' : '') + afterModel
  } else {
    // 不完全な<mxGraphModel>タグを検出（ストリーミング中）
    const incompleteMxGraphModelRegex = /<mxGraphModel[\s\S]*?$/i
    const incompleteModelMatch = explanation.match(incompleteMxGraphModelRegex)

    if (incompleteModelMatch && incompleteModelMatch.index !== undefined) {
      // 不完全なタグの開始位置までを説明文として扱う
      explanation = explanation.substring(0, incompleteModelMatch.index).trim()
    }
  }

  // 残っているコードブロックのマークダウン記法を除去
  explanation = explanation
    .replace(/```xml/g, '')
    .replace(/```/g, '')
    .trim()

  return explanation
}
