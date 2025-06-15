/**
 * ウェブサイト生成コードの処理ユーティリティ
 *
 * サンドボックス内のコードを取得し、Agent Chat での継続開発に適した形式に整形する関数を提供します。
 */

import { SandpackBundlerFiles } from '@codesandbox/sandpack-client'

/**
 * sandpackのファイル構造からコード情報を抽出する
 *
 * @param files サンドボックスのファイル構造
 * @returns 整形されたコード文字列
 */
export const extractWebsiteCode = (files: SandpackBundlerFiles): string => {
  if (!files) {
    return ''
  }

  // ファイル内容を取得して整形する
  const codeBlocks: string[] = []

  // ファイル名のソート（見やすさのため）
  const filePaths = Object.keys(files).sort()

  for (const filePath of filePaths) {
    const fileContent = files[filePath]

    // オブジェクトの場合は code プロパティから内容を取得
    const content = typeof fileContent === 'object' ? fileContent.code || '' : fileContent

    if (content && content.trim() !== '') {
      // ファイルのヘッダーとコンテンツをマークダウン形式で追加
      codeBlocks.push(
        `## ファイル: ${filePath}\n\`\`\`${getFileExtension(filePath)}\n${content}\n\`\`\``
      )
    }
  }

  return codeBlocks.join('\n\n')
}

/**
 * ファイルパスから言語識別子を取得
 *
 * @param filePath ファイルパス
 * @returns マークダウンのフェンスブロックで使用する言語識別子
 */
const getFileExtension = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'js':
      return 'javascript'
    case 'jsx':
      return 'jsx'
    case 'ts':
      return 'typescript'
    case 'tsx':
      return 'tsx'
    case 'css':
      return 'css'
    case 'html':
      return 'html'
    case 'json':
      return 'json'
    default:
      return extension || ''
  }
}

/**
 * サンドボックスのファイル構造から主要なファイルパスを特定
 *
 * @param files サンドボックスのファイル構造
 * @returns 主要なファイルパスのリスト
 */
export const getMainFilePaths = (files: SandpackBundlerFiles): string[] => {
  if (!files) {
    return []
  }

  const filePaths = Object.keys(files)

  // 重要ファイルを特定（例：App、index、main等の名前を持つファイル）
  const mainFiles = filePaths.filter((path) => {
    const pathLower = path.toLowerCase()
    return (
      pathLower.includes('/app.') ||
      pathLower.includes('/index.') ||
      pathLower.includes('/main.') ||
      pathLower.endsWith('/app/page.tsx') || // Next.js
      pathLower.includes('component')
    )
  })

  // 特定のファイルタイプを優先
  const priorityOrder = ['.tsx', '.jsx', '.ts', '.js', '.css', '.html']

  return mainFiles.sort((a, b) => {
    const extA = a.split('.').pop()?.toLowerCase() || ''
    const extB = b.split('.').pop()?.toLowerCase() || ''
    return priorityOrder.indexOf(`.${extA}`) - priorityOrder.indexOf(`.${extB}`)
  })
}
