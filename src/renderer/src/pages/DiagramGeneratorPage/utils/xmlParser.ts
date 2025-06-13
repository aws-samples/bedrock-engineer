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
 * AIの出力からDrawIO XMLと説明テキストを抽出する関数
 * XMLと説明文を分離して返す
 *
 * @param content アシスタントの回答テキスト
 * @returns XMLと説明文を含むオブジェクト
 */
export const extractDiagramContent = (content: string): { xml: string; explanation: string } => {
  if (!content) return { xml: '', explanation: '' }

  // DrawIO XMLを抽出
  const xml = extractDrawioXml(content)

  if (!xml) {
    return { xml: '', explanation: content.trim() }
  }

  // XMLを説明文から除外する
  let explanation = content

  // 直接XMLタグが含まれている場合
  if (content.includes(xml)) {
    explanation = content.replace(xml, '').trim()
  } else {
    // コードブロック内にXMLがある場合
    const xmlCodeBlockRegex = /```(?:xml)?[\s\S]*?```/i
    const codeBlockMatch = content.match(xmlCodeBlockRegex)

    if (codeBlockMatch && codeBlockMatch[0]) {
      explanation = content.replace(codeBlockMatch[0], '').trim()
    }
  }

  return { xml, explanation }
}
