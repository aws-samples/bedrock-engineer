/**
 * CDK実装用プロンプト生成ユーティリティ
 *
 * ステートマシン定義（ASL: Amazon States Language）を元に、
 * Agent ChatでCDK実装するためのプロンプトを生成する機能を提供します。
 */

/**
 * CDK実装用プロンプトを生成する
 *
 * @param aslDefinition ステートマシン定義（JSON文字列または対応するオブジェクト）
 * @param userDescription ユーザーの説明やコメント（オプション）
 * @returns CDK実装用のプロンプト文字列
 */
export const generateCDKImplementPrompt = (
  aslDefinition: string | object,
  userDescription?: string
): string => {
  // ASL定義が文字列でない場合は整形してJSON文字列に変換
  let aslJson: string =
    typeof aslDefinition === 'string' ? aslDefinition : JSON.stringify(aslDefinition, null, 2)

  // ASL定義がJSON文字列として有効かチェック
  try {
    if (typeof aslDefinition === 'string') {
      // 入力が既にJSON文字列の場合は整形する
      const parsed = JSON.parse(aslDefinition)
      aslJson = JSON.stringify(parsed, null, 2)
    }
  } catch (error) {
    console.error('Invalid ASL definition:', error)
    // フォールバック: エラーがあっても元の文字列を使用
    aslJson = typeof aslDefinition === 'string' ? aslDefinition : JSON.stringify(aslDefinition)
  }

  // ユーザーの説明がある場合は追加
  const descriptionSection = userDescription
    ? `\n\n## Additional Information\n${userDescription}`
    : ''

  // プロンプト全体を構築
  return `# Step Functions CDK Implementation

The following is an ASL (Amazon States Language) definition for a Step Functions state machine.
Please create code to implement this state machine using AWS CDK.

## State Machine Definition

\`\`\`json
${aslJson}
\`\`\`${descriptionSection}

## Requirements

Please implement the above state machine definition using AWS CDK (TypeScript). Include the following points in your implementation:

1. Import necessary libraries
2. Define the state machine within a CDK stack
3. Create required resources (Lambda functions, DynamoDB tables, etc.)
4. Implement states and configure transitions
5. Set up necessary IAM roles and policies

Please provide fully functional code with explanations where necessary.
`
}

/**
 * CDK実装用の日本語プロンプトを生成する
 *
 * @param aslDefinition ステートマシン定義（JSON文字列または対応するオブジェクト）
 * @param userDescription ユーザーの説明やコメント（オプション）
 * @returns CDK実装用の日本語プロンプト文字列
 */
export const generateCDKImplementPromptJa = (
  aslDefinition: string | object,
  userDescription?: string
): string => {
  // ASL定義が文字列でない場合は整形してJSON文字列に変換
  let aslJson: string =
    typeof aslDefinition === 'string' ? aslDefinition : JSON.stringify(aslDefinition, null, 2)

  // ASL定義がJSON文字列として有効かチェック
  try {
    if (typeof aslDefinition === 'string') {
      // 入力が既にJSON文字列の場合は整形する
      const parsed = JSON.parse(aslDefinition)
      aslJson = JSON.stringify(parsed, null, 2)
    }
  } catch (error) {
    console.error('Invalid ASL definition:', error)
    // フォールバック: エラーがあっても元の文字列を使用
    aslJson = typeof aslDefinition === 'string' ? aslDefinition : JSON.stringify(aslDefinition)
  }

  // ユーザーの説明がある場合は追加
  const descriptionSection = userDescription ? `\n\n## 追加情報\n${userDescription}` : ''

  // 日本語プロンプト全体を構築
  return `# Step Functions のCDK実装

以下に示すのは、Step Functions ステートマシンのASL（Amazon States Language）定義です。
このステートマシンをAWS CDKを使って実装するコードを作成してください。

## ステートマシン定義

\`\`\`json
${aslJson}
\`\`\`${descriptionSection}

## 依頼内容

上記のステートマシン定義を AWS CDK（TypeScript）で実装してください。実装には以下の点を含めてください：

1. 必要なライブラリのインポート
2. CDKスタック内でのステートマシンの定義
3. 必要なリソース（Lambda関数、DynamoDBテーブルなど）の作成
4. ステートの実装と遷移の設定
5. 必要なIAMロールとポリシーの設定

コードは完全に動作するものを提供し、必要に応じて説明を加えてください。
`
}
