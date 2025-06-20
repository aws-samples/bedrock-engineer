export interface PreviewImageCacheItem {
  image: string
  timestamp: number
  xmlHash: string
}

/**
 * XMLの内容からハッシュ値を生成（キャッシュキーとして使用）
 */
export function generateXmlHash(xml: string): string {
  let hash = 0
  for (let i = 0; i < xml.length; i++) {
    const char = xml.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 32bit整数に変換
  }
  return hash.toString(36)
}

/**
 * Canvas要素を使用してダイアグラムの簡易プレビューを生成
 */
export async function generatePreviewImage(xml: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      // 簡易的なプレビュー画像を生成
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve('')
        return
      }

      // 背景を設定
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // XMLの内容から簡単な図形パターンを生成
      const xmlLength = xml.length
      const componentCount = Math.min(Math.floor(xmlLength / 500) + 1, 6)

      // ランダムシードとしてXMLハッシュを使用
      const hashStr = generateXmlHash(xml)
      const seed = Math.abs(parseInt(hashStr, 36)) % 1000

      for (let i = 0; i < componentCount; i++) {
        const x = 50 + (i % 3) * 120
        const y = 60 + Math.floor(i / 3) * 100

        // 色をXMLに基づいて決定
        const hue = (seed + i * 60) % 360
        ctx.fillStyle = `hsl(${hue}, 60%, 50%)`
        ctx.fillRect(x, y, 100, 60)

        // 白いテキスト
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Item ${i + 1}`, x + 50, y + 35)
      }

      // 接続線を描画
      ctx.strokeStyle = '#6c757d'
      ctx.lineWidth = 2
      ctx.beginPath()

      for (let i = 0; i < componentCount - 1; i++) {
        const x1 = 100 + (i % 3) * 120
        const y1 = 90 + Math.floor(i / 3) * 100
        const x2 = 100 + ((i + 1) % 3) * 120
        const y2 = 90 + Math.floor((i + 1) / 3) * 100

        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      }
      ctx.stroke()

      // Data URLとして返す
      resolve(canvas.toDataURL('image/png'))
    } catch (error) {
      console.error('Error generating preview image:', error)
      resolve('')
    }
  })
}

/**
 * プレビュー画像キャッシュの管理
 */
export class PreviewImageCache {
  private static readonly CACHE_KEY = 'diagram_preview_images'
  private static readonly MAX_CACHE_SIZE = 50 // 最大キャッシュ数
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7日間

  /**
   * キャッシュから画像を取得
   */
  static get(sessionId: string, xml: string): string | null {
    try {
      const cache = this.getCache()
      const xmlHash = generateXmlHash(xml)
      const cacheKey = `${sessionId}_${xmlHash}`
      const cachedItem = cache[cacheKey]

      if (cachedItem) {
        // キャッシュの有効期限をチェック
        if (Date.now() - cachedItem.timestamp < this.CACHE_EXPIRY) {
          return cachedItem.image
        } else {
          // 期限切れのアイテムを削除
          delete cache[cacheKey]
          this.saveCache(cache)
        }
      }
      return null
    } catch (error) {
      console.error('Error reading preview cache:', error)
      return null
    }
  }

  /**
   * 画像をキャッシュに保存
   */
  static set(sessionId: string, xml: string, image: string): void {
    try {
      const cache = this.getCache()
      const xmlHash = generateXmlHash(xml)
      const cacheKey = `${sessionId}_${xmlHash}`

      // 新しいアイテムを追加
      cache[cacheKey] = {
        image,
        timestamp: Date.now(),
        xmlHash
      }

      // キャッシュサイズが上限を超えた場合、古いものから削除
      const cacheEntries = Object.entries(cache)
      if (cacheEntries.length > this.MAX_CACHE_SIZE) {
        // タイムスタンプでソートして古いものから削除
        cacheEntries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
        const toDelete = cacheEntries.length - this.MAX_CACHE_SIZE
        for (let i = 0; i < toDelete; i++) {
          delete cache[cacheEntries[i][0]]
        }
      }

      this.saveCache(cache)
    } catch (error) {
      console.error('Error saving preview to cache:', error)
    }
  }

  /**
   * キャッシュ全体を取得
   */
  private static getCache(): Record<string, PreviewImageCacheItem> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      return cached ? JSON.parse(cached) : {}
    } catch (error) {
      console.error('Error parsing preview cache:', error)
      return {}
    }
  }

  /**
   * キャッシュを保存
   */
  private static saveCache(cache: Record<string, PreviewImageCacheItem>): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('Error saving preview cache:', error)
    }
  }

  /**
   * 特定のセッションのキャッシュを削除
   */
  static removeSession(sessionId: string): void {
    try {
      const cache = this.getCache()
      const keysToDelete = Object.keys(cache).filter((key) => key.startsWith(`${sessionId}_`))
      keysToDelete.forEach((key) => delete cache[key])
      this.saveCache(cache)
    } catch (error) {
      console.error('Error removing session from preview cache:', error)
    }
  }

  /**
   * キャッシュをクリア
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY)
    } catch (error) {
      console.error('Error clearing preview cache:', error)
    }
  }
}
