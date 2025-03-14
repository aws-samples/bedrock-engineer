Language: [English](./README.md) / [Japanese](./README-ja.md)

# 🧙 Bedrock Engineer

Bedrock Engineer は、[Amazon Bedrock](https://aws.amazon.com/bedrock/) を活用したソフトウェア開発タスクのための AI アシスタントです。大規模な言語モデルと実際のファイルシステム操作、Web検索機能などを含む自律的な AI エージェントがあなたの開発を支援します。

## 💻 デモ

https://github.com/user-attachments/assets/788583b6-148b-4e9d-9015-c24ad4be6162

## 🍎 はじめに

Bedrock Engineer はネイティブアプリです。アプリをダウンロードするか、ソースコードをビルドして使用してください。

### Download

MacOS:

[<img src="https://img.shields.io/badge/Download_FOR_MAC-Latest%20Release-blue?style=for-the-badge&logo=apple" alt="Download Latest Release" height="40">](https://github.com/aws-samples/bedrock-engineer/releases/latest/download/bedrock-engineer-1.4.1.dmg)

<details>
<summary>Tips for Installation</summary>

### Installation

1. 最新リリースをダウンロードします
2. DMG ファイルを開き、アプリをアプリケーション フォルダにドラッグします
3. アプリを起動し、AWS 認証情報を設定します
4. システム環境設定を開き、[セキュリティとプライバシー] をクリックして、下にスクロールして「このまま開く」ボタンをクリックして、アプリを開きます。

### Opening the Application

「Apple が悪意のあるソフトウェアをチェックできないため、「Bedrock Engineer」を開くことができません」と表示される場合:

1. システム環境設定を開きます
2. プライバシーとセキュリティをクリックします
3. 下にスクロールして、「Mac を保護するために、Bedrock Engineer がブロックされました」の横にある「とにかく開く」をクリックします。

アプリケーション起動時に設定ファイルエラーが発生する場合、以下の設定ファイルを確認ください。設定ファイルを削除してアプリケーションを再起動し直しても起動できない場合、issue に起票ください。

`/Users/{{username}}/Library/Application Support/bedrock-engineer/config.json`

</details>

### ビルド

まず、npmモジュールをインストールします。

```
npm install
```

次に、アプリケーションパッケージをビルドします。

```
npm run build:mac
```

または

```
npm run build:win
```

または

```
npm run build:linux
```

`dist`ディレクトリに保存されたアプリケーションを使用します。

## エージェントチャット

開発ができる自律的な AI エージェントが、あなたの開発を支援します。これは [Cline](https://github.com/cline/cline) のような AI アシスタントに似た機能を提供していますが、VS Code のようなエディタに依存しない独自の UI を備えています。これにより、Bedrock Engineer のエージェントチャット機能では、よりリッチな図解と対話型の体験が可能になります。また、エージェントのカスタマイズ機能により、開発以外のユースケースにおいても、エージェントを活用することができます。

- 💬 人間のような Amazon Nova, Claude, Meta llama モデルとの対話型チャットインターフェース。
- 📁 ファイルシステム操作（フォルダ作成、ファイル作成、ファイル読み/書き）
- 🔍 Tavily APIを使用したWeb検索機能
- 🏗️ プロジェクト構造の作成と管理
- 🧐 コード分析と改善提案
- 📝 コードの生成と実行
- 📊 データ分析と可視化
- 💡 エージェントのカスタマイズと管理
- 🛠️ ツールのカスタマイズと管理
- 🔄 チャット履歴の管理
- 🌐 多言語対応

| ![agent-chat-diagram](./assets/agent-chat-diagram.png) | ![agent-chat-search](./assets/agent-chat-search.png) |
| :----------------------------------------------------: | :--------------------------------------------------: |
|                    コード分析と図解                    |            Tavily API を使用した Web 検索            |

### エージェントを選択する

左上のメニューからエージェントを選択します。デフォルトでは汎用的なソフトウェア開発に特化した Software Developer, プログラミング学習を支援する Programming Mentor, サービスやプロダクトの構想段階を支援する Product Designer を搭載しています。

![select-agents](./assets/select-agents.png)

### エージェントをカスタマイズする

エージェントの設定をカスタマイズします。エージェントの名前と説明を入力し、システムプロンプトを入力します。システムプロンプトはエージェントの振る舞いを決定する重要な要素です。エージェントの目的や規制事項、役割、使用できるツールと使うタイミングを明確にしておくことで、より適切な回答を得ることができます。

![custom-agents](./assets/custom-agents.png)

### ツールを選択する／カスタマイズする

左下の Tools アイコンをクリックして、エージェントが使用できるツールを選択します。

![select-tools](./assets/select-tools.png)

サポートしているツールは以下の通りです。

#### 📂 ファイルシステム操作

| ツール名       | 説明                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createFolder` | プロジェクト構造内に新しいディレクトリを作成します。指定されたパスに新規フォルダを作成します。                                                                           |
| `writeToFile`  | 既存のファイルに内容を書き込みます。ファイルが存在しない場合は作成され、既存の場合は内容が更新されます。                                                                 |
| `readFiles`    | 複数のファイルの内容を一度に読み取ります。テキストファイルおよびExcelファイル（.xlsx, .xls）に対応しており、Excelファイルは自動的にCSV形式に変換されます。               |
| `listFiles`    | ディレクトリ構造を階層形式で表示します。すべてのサブディレクトリとファイルを含む包括的なプロジェクト構造を取得できます。設定で指定された無視ファイルパターンに従います。 |
| `moveFile`     | ファイルを別の場所に移動します。プロジェクト構造内でのファイル整理に使用します。                                                                                         |
| `copyFile`     | ファイルを別の場所に複製します。プロジェクト構造内でファイルの複製が必要な場合に使用します。                                                                             |

#### 🌐 Web & 検索操作

| ツール名       | 説明                                                                                                                                                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tavilySearch` | Tavily APIを使用してウェブ検索を実行します。最新の情報や追加のコンテキストが必要な場合に使用します。APIキーが必要です。                                                                                                                                                                             |
| `fetchWebsite` | 指定されたURLからコンテンツを取得します。大きなコンテンツは自動的に管理可能なチャンクに分割されます。初回呼び出しでチャンク数の概要を取得し、必要に応じて特定のチャンクを取得できます。GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONSメソッドをサポートし、カスタムヘッダーやボディの設定が可能です。 |

#### 🤖 Amazon Bedrock 統合機能

| ツール名             | 説明                                                                                                                                                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateImage`      | Amazon Bedrock で提供される LLM を使用して画像を生成します。デフォルトでstability.sd3-5-large-v1:0を使用し、Stability.aiモデルとAmazonモデルの両方をサポートします。Titanモデル用の特定のアスペクト比とサイズをサポートし、PNG、JPEG、WebP形式での出力が可能です。決定論的な生成のためのシード値の指定や、ネガティブプロンプトによる除外要素の指定も可能です。 |
| `retrieve`           | Amazon Bedrock Knowledge Baseを使用して情報を検索します。指定されたナレッジベースから関連情報を取得します。                                                                                                                                                                                                                                                    |
| `invokeBedrockAgent` | 指定されたAmazon Bedrock Agentと対話します。エージェントIDとエイリアスIDを使用して対話を開始し、セッションIDを使用して会話を継続できます。Pythonコード分析やチャットなど、様々なユースケースに対応したファイル分析機能も提供します。                                                                                                                           |

#### 💻 システムコマンド実行

| ツール名         | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `executeCommand` | コマンドの実行やプロセスへの入力送信を管理します。2つの動作モードがあり、1)コマンドと作業ディレクトリを指定して新規プロセスを開始、2)既存のプロセスIDを指定して標準入力を送信できます。セキュリティ上の理由から、許可されたコマンドのみが実行可能で、設定で指定されたシェルを使用します。登録されていないコマンドは実行できません。データベースに接続するコマンド、APIを実行するコマンド、別の AI エージェントを呼び出すコマンドなどを登録することで、エージェントの能力を拡張することができます。 |
|                  |

<details>
<summary>Tips for Integrate Bedrock Agents</summary>

### APT (Agent Preparation Toolkit) を活用する

[Agent Preparation Toolkit](https://github.com/aws-samples/agent-preparation-toolkit) を使用することで、Amazon Bedrock Agents を使ってすぐに Agent を動かすことができます。

</details>

## Website Generator

ウェブサイトを描画するソースコードを生成し、リアルタイムにプレビューします。現在は以下のライブラリに対応しています。また、追加で指示を与えることで対話的にコードを生成することができます。

- React.js（w/ Typescript）
- Vue.js（w/ Typescript）
- Svelte.js
- Vanilla.js

以下は Website Generator によって生成された画面の例です。

| ![website-gen](./assets/website-generator.png) | ![website-gen-data](./assets/website-generator-data-visualization.png) | ![website-gen-healthcare](./assets/website-generator-healthcare.png) |
| :--------------------------------------------: | :--------------------------------------------------------------------: | :------------------------------------------------------------------: |
|               観葉植物のECサイト               |                           データの可視化API                            |                          ヘルスケアのブログ                          |

また、以下のスタイルがプリセットとしてサポートされています。

- インラインスタイリング
- Tailwind.css
- Material UI（Reactモードのみ）

### Agentic-RAG 機能

Amazon Bedrock の Knowledge Base に接続することで、任意のデザインシステム、プロジェクトソースコード、Webサイトのスタイルなどを参照してウェブサイトを生成できます。

事前に Knowledge Base にソースコードとクロールしたWebページを保存する必要があります。Knowledge Base にソースコードを登録する際は、[gpt-repositoy-loader](https://github.com/mpoon/gpt-repository-loader) などの方法を使用してLLMが簡単に理解できる形式に変換することをお勧めします。Figma のデザインファイルは HTML, CSS の形式にエクスポートしたものを Knowledge Base に登録することで参照可能になります。

画面下部の「Connect」ボタンをクリックし、ナレッジベースIDを入力してください。

### ウェブ検索エージェント機能

Website Generator には、ウェブ検索機能を活用したコード生成エージェントが統合されています。この機能により、最新のライブラリ情報、デザイントレンド、コーディングベストプラクティスを参照しながら、より洗練されたウェブサイトを生成できます。検索機能を使用するには、画面下部の「Search」ボタンをクリックして有効化してください。

## Step Functions Generator

AWS Step Functions の ASL 定義を生成し、リアルタイムにプレビューします。

![step-functions-generator](./assets/step-functions-generator.png)

## Diagram Generator

自然言語の説明からAWSアーキテクチャ図を簡単に作成できます。Diagram GeneratorはAmazon Bedrockの強力な言語モデルを活用して、テキスト説明からプロフェッショナルなAWSアーキテクチャ図を生成します。

主な機能：

- 🏗️ 自然言語の説明からAWSアーキテクチャ図を生成
- 🔍 Web検索機能を統合し、最新情報に基づいた正確な図を作成
- 💾 図の履歴を保存して簡単に参照・改善
- 🔄 図の改善に関するインテリジェントな推奨事項を取得
- 🎨 AWSアーキテクチャアイコンを使用したプロフェッショナルな図のスタイリング
- 🌐 多言語対応

生成された図はdraw.io互換のXML形式で作成されるため、必要に応じてさらに編集やカスタマイズが可能です。

![diagram-generator](./assets/diagram-generator.png)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=aws-samples/bedrock-engineer&type=Date)](https://star-history.com/#aws-samples/bedrock-engineer&Date)

## Security

詳細については、[CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) を参照してください。

## ライセンス

This library is licensed under the MIT-0 License. See the LICENSE file.

このソフトウェアは [Lottie Files](https://lottiefiles.com/free-animation/robot-futuristic-ai-animated-xyiArJ2DEF) を使用しています。
