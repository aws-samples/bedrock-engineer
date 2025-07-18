import { ConfigStore } from '../store'

export interface ContentChunk {
  index: number
  total: number
  content: string
  metadata?: {
    url?: string
    filePath?: string
    timestamp: number
    tokenLimit?: number
  }
}

export class ContentChunker {
  private static readonly MAX_CHUNK_SIZE = 50000 // 約50,000文字（Claude 3 Haikuの制限を考慮）
  private static readonly CHARS_PER_TOKEN = 4 // 簡易的なトークン推定（文字数 ÷ 4）

  private store: ConfigStore

  constructor(store: ConfigStore) {
    this.store = store
  }

  static splitContent(
    content: string,
    metadata: { url?: string },
    option?: { cleaning?: boolean }
  ): ContentChunk[] {
    const chunks: ContentChunk[] = []
    const timestamp = Date.now()

    // option のデフォルトは false
    if (option?.cleaning) {
      content = this.extractMainContent(content)
    }

    // コンテンツを適切なサイズに分割
    const totalChunks = Math.ceil(content.length / this.MAX_CHUNK_SIZE)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.MAX_CHUNK_SIZE
      const end = Math.min((i + 1) * this.MAX_CHUNK_SIZE, content.length)

      chunks.push({
        index: i + 1,
        total: totalChunks,
        content: content.slice(start, end),
        metadata: {
          ...metadata,
          timestamp
        }
      })
    }

    return chunks
  }

  /**
   * トークン数ベースでコンテンツを分割
   */
  static splitContentByTokenLimit(
    content: string,
    maxTokens: number,
    metadata?: { url?: string; filePath?: string }
  ): ContentChunk[] {
    const chunks: ContentChunk[] = []
    const timestamp = Date.now()

    // トークン数から文字数の上限を計算（安全のため80%を使用）
    const maxCharsPerChunk = Math.floor(maxTokens * this.CHARS_PER_TOKEN * 0.8)

    // コンテンツを適切なサイズに分割
    const totalChunks = Math.ceil(content.length / maxCharsPerChunk)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * maxCharsPerChunk
      const end = Math.min((i + 1) * maxCharsPerChunk, content.length)

      chunks.push({
        index: i + 1,
        total: totalChunks,
        content: content.slice(start, end),
        metadata: {
          ...metadata,
          timestamp,
          tokenLimit: maxTokens
        }
      })
    }

    return chunks
  }

  /**
   * store設定に基づいてコンテンツを分割
   */
  splitContent(content: string, metadata?: { url?: string; filePath?: string }): ContentChunk[] {
    const inferenceParams = this.store.get('inferenceParams')
    const maxTokens = inferenceParams?.maxTokens || 4096
    return ContentChunker.splitContentByTokenLimit(content, maxTokens, metadata)
  }

  /**
   * コンテンツの推定トークン数を計算
   */
  static estimateToken(content: string): number {
    return Math.ceil(content.length / this.CHARS_PER_TOKEN)
  }

  /**
   * store設定に基づいてコンテンツが制限を超えるかチェック
   */
  isContentTooLarge(content: string): boolean {
    const inferenceParams = this.store.get('inferenceParams')
    const maxTokens = inferenceParams?.maxTokens || 4096
    const estimatedTokens = ContentChunker.estimateToken(content)
    return estimatedTokens > maxTokens
  }

  public static extractMainContent(html: string): string {
    // 基本的なHTMLクリーニング
    const content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // スクリプトの削除
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // スタイルの削除
      .replace(/<[^>]+>/g, '\n') // タグを改行に変換
      .replace(/&nbsp;/g, ' ') // HTMLエンティティの変換
      .replace(/\s+/g, ' ') // 連続する空白の削除
      .trim()

    return content
  }
}
