/**
 * ウェブサイト継続開発用プロンプト生成ユーティリティ
 * 
 * 生成されたウェブサイトコードを元に、Agent Chat で継続開発するための
 * プロンプトを生成する機能を提供します。
 */

import { SandpackBundlerFiles } from '@codesandbox/sandpack-client'
import { extractWebsiteCode, getMainFilePaths } from './websiteCodeExtractor'
import { Style, SupportedTemplate } from '../templates'

/**
 * ウェブサイト継続開発用プロンプトを生成する
 * 
 * @param files サンドボックスのファイル構造
 * @param template 現在使用中のテンプレート
 * @param styleType 現在使用中のスタイルタイプ
 * @param userDescription ユーザーが入力した説明（オプション）
 * @returns 開発継続用のプロンプト文字列
 */
export const generateContinueDevelopmentPrompt = (
  files: SandpackBundlerFiles,
  template: SupportedTemplate['id'],
  styleType: Style,
  userDescription?: string
): string => {
  // ウェブサイトコードの抽出
  const codeContent = extractWebsiteCode(files)
  const mainFilePaths = getMainFilePaths(files)
  
  // テンプレート情報の整形
  const templateInfo = `テンプレート: ${template}, スタイル: ${styleType.label}`
  
  // 主要ファイル情報
  const mainFilesInfo = mainFilePaths.length > 0 
    ? `主要ファイル: ${mainFilePaths.join(', ')}` 
    : ''
  
  // ユーザー説明
  const descriptionSection = userDescription 
    ? `\n\n## ウェブサイトの概要\n${userDescription}` 
    : ''
  
  // プロンプト全体を構築
  return `# ウェブサイト継続開発

以下のコードは、WebsiteGenerator で生成された初期ウェブサイトです。
このウェブサイトをさらに改善・機能拡張する手助けをお願いします。

${templateInfo}
${mainFilesInfo}
${descriptionSection}

## 現在のウェブサイトコード

${codeContent}

## 依頼内容

このウェブサイトに対して以下の改善や機能追加を行いたいです：
1. UI/UXの改善
2. レスポンシブデザインの最適化
3. 機能の追加・拡張

どのような改善が可能か提案してください。また、特定の機能やデザイン変更をリクエストした場合は、それに対応するコード実装を提供してください。`
}

/**
 * ウェブサイト継続開発用の日本語プロンプトを生成する
 * 
 * @param files サンドボックスのファイル構造
 * @param template 現在使用中のテンプレート
 * @param styleType 現在使用中のスタイルタイプ
 * @param userDescription ユーザーが入力した説明（オプション）
 * @returns 開発継続用の日本語プロンプト文字列
 */
export const generateContinueDevelopmentPromptJa = (
  files: SandpackBundlerFiles,
  template: SupportedTemplate['id'],
  styleType: Style,
  userDescription?: string
): string => {
  // ウェブサイトコードの抽出
  const codeContent = extractWebsiteCode(files)
  const mainFilePaths = getMainFilePaths(files)
  
  // テンプレート情報の整形
  const templateInfo = `テンプレート: ${template}, スタイル: ${styleType.label}`
  
  // 主要ファイル情報
  const mainFilesInfo = mainFilePaths.length > 0 
    ? `主要ファイル: ${mainFilePaths.join(', ')}` 
    : ''
  
  // ユーザー説明
  const descriptionSection = userDescription 
    ? `\n\n## ウェブサイトの概要\n${userDescription}` 
    : ''
  
  // プロンプト全体を構築
  return `# ウェブサイト継続開発

以下のコードは、WebsiteGenerator で生成された初期ウェブサイトです。
このウェブサイトをさらに改善・機能拡張する手助けをお願いします。

${templateInfo}
${mainFilesInfo}
${descriptionSection}

## 現在のウェブサイトコード

${codeContent}

## 依頼内容

このウェブサイトに対して以下の改善や機能追加を行いたいです：
1. UI/UXの改善
2. レスポンシブデザインの最適化
3. 機能の追加・拡張

どのような改善が可能か提案してください。また、特定の機能やデザイン変更をリクエストした場合は、それに対応するコード実装を提供してください。`
}