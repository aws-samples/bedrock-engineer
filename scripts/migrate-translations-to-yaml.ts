import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

// 翻訳ファイルを直接インポート
// Note: ts-nodeでは動的importが難しいため、直接requireで対応
const importTranslation = (locale: string) => {
  try {
    // CommonJSとして直接インポート
    const translation = require(`../src/renderer/src/i18n/locales/${locale}`).default
    return translation
  } catch (error) {
    console.error(`Failed to import ${locale} translation:`, error)
    return null
  }
}

// メイン処理
async function main() {
  const locales = ['en', 'ja']
  const outputDir = path.resolve(__dirname, '../src/renderer/public/locales')

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 各言語の翻訳を処理
  for (const locale of locales) {
    try {
      console.log(`Processing ${locale} translations...`)
      const translation = importTranslation(locale)

      if (!translation) {
        console.error(`No translation data found for ${locale}`)
        continue
      }

      // YAMLに変換して保存
      const yamlContent = yaml.dump(translation, { indent: 2 })
      const outputPath = path.join(outputDir, `${locale}.yaml`)

      fs.writeFileSync(outputPath, yamlContent, 'utf8')
      console.log(`✅ Successfully written ${locale} translations to ${outputPath}`)
    } catch (error) {
      console.error(`Error processing ${locale} translations:`, error)
    }
  }

  console.log('Translation migration complete!')
}

// スクリプト実行
main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
