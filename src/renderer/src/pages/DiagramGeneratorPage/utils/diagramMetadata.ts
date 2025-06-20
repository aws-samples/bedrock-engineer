// ダイアグラムメタデータの型定義
export interface DiagramMetadata {
  sessionId: string
  title: string
  createdAt: number
  diagramMode: string
  hasXml: boolean
}

const STORAGE_KEY = 'diagram-metadata'

// メタデータを保存
export const saveDiagramMetadata = (metadata: DiagramMetadata) => {
  try {
    const existing = getDiagramMetadataList()
    const updated = [metadata, ...existing.filter((item) => item.sessionId !== metadata.sessionId)]
    // 最大50件まで保持
    const limited = updated.slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  } catch (error) {
    console.warn('Failed to save diagram metadata:', error)
  }
}

// メタデータ一覧を取得
export const getDiagramMetadataList = (): DiagramMetadata[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to load diagram metadata:', error)
    return []
  }
}

// セッションのメタデータを削除
export const removeDiagramMetadata = (sessionId: string) => {
  try {
    const existing = getDiagramMetadataList()
    const filtered = existing.filter((item) => item.sessionId !== sessionId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.warn('Failed to remove diagram metadata:', error)
  }
}

// メタデータをクリア
export const clearDiagramMetadata = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear diagram metadata:', error)
  }
}

// タイトルを生成（プロンプトまたは説明文から）
export const generateDiagramTitle = (prompt: string, explanation: string = ''): string => {
  const source = prompt || explanation
  if (!source) return 'Untitled Diagram'

  // 最初の50文字を取得し、単語の途中で切れないようにする
  const truncated = source.substring(0, 50)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > 30) {
    return truncated.substring(0, lastSpace) + '...'
  }

  return truncated + (source.length > 50 ? '...' : '')
}
