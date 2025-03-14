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
