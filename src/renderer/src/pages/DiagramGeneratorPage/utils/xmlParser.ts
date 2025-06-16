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

/**
 * ストリーミング中のテキストからXMLタグを除外する関数
 * XMLタグやコードブロックを除去して、純粋な説明文のみを返す
 *
 * @param content ストリーミング中のテキスト
 * @returns XMLタグを除去したテキスト
 */
export const filterXmlFromStreamingContent = (content: string): string => {
  if (!content) return ''

  let filteredContent = content

  // XMLコードブロックを除去
  filteredContent = filteredContent.replace(/```(?:xml)?[\s\S]*?```/gi, '')

  // 直接的なXMLタグ（<mxfile>, <mxGraphModel>など）を除去
  filteredContent = filteredContent.replace(/<mxfile[\s\S]*?<\/mxfile>/gi, '')
  filteredContent = filteredContent.replace(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/gi, '')

  // 部分的なXMLタグも除去（ストリーミング中に途切れている可能性）
  filteredContent = filteredContent.replace(/<mxfile[\s\S]*$/gi, '')
  filteredContent = filteredContent.replace(/<mxGraphModel[\s\S]*$/gi, '')
  filteredContent = filteredContent.replace(/<diagram[\s\S]*$/gi, '')
  filteredContent = filteredContent.replace(/<mxCell[\s\S]*$/gi, '')

  return filteredContent.trim()
}

/**
 * テキストにXMLタグが含まれているかを検出する関数
 *
 * @param content 検査するテキスト
 * @returns XMLタグが含まれている場合true
 */
export const containsXmlTags = (content: string): boolean => {
  if (!content) return false

  // XMLタグの存在をチェック
  const xmlPatterns = [/<mxfile/i, /<mxGraphModel/i, /<diagram/i, /```(?:xml)?/i]

  return xmlPatterns.some((pattern) => pattern.test(content))
}

/**
 * XML生成が完了しているかを判定する関数
 *
 * @param content 検査するテキスト
 * @returns XML生成が完了している場合true
 */
export const isXmlComplete = (content: string): boolean => {
  if (!content) return false

  // </mxfile>タグで終了している、またはコードブロックが閉じている
  return content.includes('</mxfile>') || /```[\s\S]*?```/.test(content)
}


/**
 * 2つのDrawIO XMLを結合する関数
 * 継続生成時に前回のXMLと新しいXMLを統合する
 *
 * @param previousXml 前回生成されたXML
 * @param newXml 新たに生成されたXML
 * @returns 結合されたXML文字列
 */
export const mergeDrawioXml = (previousXml: string, newXml: string): string => {
  if (!previousXml) return newXml
  if (!newXml) return previousXml

  try {
    // XMLからmxGraphModelを抽出
    const extractMxGraphModel = (xml: string) => {
      const mxGraphModelRegex = /<mxGraphModel[\s\S]*?<\/mxGraphModel>/i
      const match = xml.match(mxGraphModelRegex)
      return match ? match[0] : null
    }

    // 各XMLからmxGraphModelを取得
    const previousModel = extractMxGraphModel(previousXml)
    const newModel = extractMxGraphModel(newXml)

    if (!previousModel || !newModel) {
      // いずれかのXMLが不正な場合は新しいXMLを返す
      return newXml || previousXml
    }

    // mxGraphModel内のmxCellを抽出
    const extractCells = (model: string) => {
      const cellsRegex = /<mxCell[\s\S]*?\/>/g
      return model.match(cellsRegex) || []
    }

    const previousCells = extractCells(previousModel)
    const newCells = extractCells(newModel)

    // 重複を避けるためIDをチェック
    const getIdFromCell = (cell: string) => {
      const idMatch = cell.match(/id="([^"]*)"/)
      return idMatch ? idMatch[1] : null
    }

    const existingIds = new Set(previousCells.map(getIdFromCell).filter(Boolean))
    const uniqueNewCells = newCells.filter(cell => {
      const id = getIdFromCell(cell)
      return id && !existingIds.has(id)
    })

    // 結合されたセルリストを作成
    const allCells = [...previousCells, ...uniqueNewCells]

    // 新しいmxGraphModelを構築
    const mxGraphModelStart = previousModel.match(/<mxGraphModel[^>]*>/i)?.[0] || "<mxGraphModel>"
    const rootStart = previousModel.match(/<root>/i)?.[0] || "<root>"
    const rootEnd = "</root>"
    const mxGraphModelEnd = "</mxGraphModel>"

    const mergedModel = `${mxGraphModelStart}
    ${rootStart}
      ${allCells.join("
      ")}
    ${rootEnd}
  ${mxGraphModelEnd}`

    // 元のXMLの外側構造を保持
    const xmlHeader = previousXml.match(/<mxfile[^>]*>/i)?.[0] || "<mxfile>"
    const diagramStart = previousXml.match(/<diagram[^>]*>/i)?.[0] || "<diagram>"
    const diagramEnd = "</diagram>"
    const xmlEnd = "</mxfile>"

    return `${xmlHeader}
  ${diagramStart}
    ${mergedModel}
  ${diagramEnd}
${xmlEnd}`
  } catch (error) {
    console.error("Error merging DrawIO XML:", error)
    // エラーが発生した場合は新しいXMLを返す
    return newXml || previousXml
  }
}

/**
 * XMLの内容を結合するヘルパー関数
 * 説明文も考慮して結合を行う
 *
 * @param previousContent 前回の内容（XML + 説明）
 * @param newContent 新しい内容（XML + 説明）
 * @returns 結合された内容
 */
export const mergeDiagramContent = (
  previousContent: { xml: string; explanation: string },
  newContent: { xml: string; explanation: string }
): { xml: string; explanation: string } => {
  const mergedXml = mergeDrawioXml(previousContent.xml, newContent.xml)
  const mergedExplanation = previousContent.explanation + "

" + newContent.explanation

  return {
    xml: mergedXml,
    explanation: mergedExplanation.trim()
  }
}
