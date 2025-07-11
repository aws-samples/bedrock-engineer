/**
 * プロジェクトパスを適切に短縮する関数
 * @param path - 元のパス文字列
 * @param maxLength - 最大文字数（デフォルト: 40）
 * @returns 短縮されたパス文字列
 */
export const truncateProjectPath = (path: string, maxLength: number = 40): string => {
  if (!path || path.length <= maxLength) {
    return path
  }

  // ホームディレクトリの置換（~/を使用）
  const homePath = path.replace(/^\/Users\/[^/]+/, '~')
  if (homePath.length <= maxLength) {
    return homePath
  }

  // パスを区切り文字で分割
  const parts = homePath.split('/')

  // 末尾の重要部分（プロジェクト名など）を保持
  if (parts.length > 3) {
    const lastParts = parts.slice(-2).join('/')
    const truncated = `.../${lastParts}`

    // それでも長すぎる場合は末尾から切り取り
    if (truncated.length > maxLength) {
      return `...${lastParts.substring(lastParts.length - (maxLength - 3))}`
    }

    return truncated
  }

  // 単純な末尾切り取り
  return `${homePath.substring(0, maxLength - 3)}...`
}

/**
 * パスの表示用フォーマットを決定する
 * @param path - 元のパス文字列
 * @param variant - 表示形式（'card' | 'table'）
 * @returns フォーマットされたパス情報
 */
export const formatProjectPath = (path: string, variant: 'card' | 'table') => {
  if (!path) {
    return {
      displayPath: '',
      fullPath: '',
      needsTruncation: false
    }
  }

  const maxLength = variant === 'card' ? 35 : 25
  const displayPath = truncateProjectPath(path, maxLength)
  const needsTruncation = path.length > maxLength

  return {
    displayPath,
    fullPath: path,
    needsTruncation
  }
}

/**
 * プロジェクトパスからプロジェクト名を抽出する
 * @param path - プロジェクトパス
 * @returns プロジェクト名
 */
export const extractProjectName = (path: string): string => {
  if (!path) return ''

  const parts = path.split('/')
  return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown Project'
}
