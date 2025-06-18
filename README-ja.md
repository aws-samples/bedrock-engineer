Language: [English](./README.md) / [Japanese](./README-ja.md)

> [!IMPORTANT]

# 🧙 Bedrock Engineer

Bedrock Engineer は、[Amazon Bedrock](https://aws.amazon.com/bedrock/) を活用したソフトウェア開発タスクのための AI アシスタントです。大規模な言語モデルと実際のファイルシステム操作、Web検索機能などを含む自律的な AI エージェントがあなたの開発を支援します。

## 💻 デモ

https://github.com/user-attachments/assets/f6ed028d-f3c3-4e2c-afff-de2dd9444759

## 🍎 はじめに

Bedrock Engineer はネイティブアプリです。アプリをダウンロードするか、ソースコードをビルドして使用してください。

### Download

MacOS:

[<img src="https://img.shields.io/badge/Download_FOR_MAC_(DMG)-Latest%20Release-blue?style=for-the-badge&logo=apple" alt="Download Latest Release" height="40">](https://github.com/aws-samples/bedrock-engineer/releases/latest/download/bedrock-engineer-1.15.2.dmg)

[<img src="https://img.shields.io/badge/Download_FOR_MAC_(PKG)-Latest%20Release-blue?style=for-the-badge&logo=apple" alt="Download Latest Release" height="40">](https://github.com/aws-samples/bedrock-engineer/releases/latest/download/bedrock-engineer-1.15.2.pkg)

Windows:

[<img src="https://img.shields.io/badge/Download_FOR_WINDOWS-Latest%20Release-blue?style=for-the-badge" alt="Download Latest Release" height="40">](https://github.com/aws-samples/bedrock-engineer/releases/latest/download/bedrock-engineer-1.15.2-setup.exe)

MacOS に最適化されていますが、Windows, Linux OS でもビルドして使用できます。不具合がある場合、issue に起票ください。

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

```bash
npm ci
```

次に、アプリケーションパッケージをビルドします。

```bash
npm run build:mac
```

または

```bash
npm run build:win
```

または

```bash
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
- 🛡️ ガードレール対応
- 💡 軽量処理用モデルによるコスト最適化

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

左下の Tools アイコンをクリックして、エージェントが使用できるツールを選択します。ツールはエージェントごとに個別に設定できます。

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
| `recognizeImage`     | Amazon Bedrockの画像認識機能を使用して画像を分析します。物体検出、テキスト検出、シーン理解、画像キャプション生成などの様々な分析タイプをサポートしています。ローカルファイルの画像を処理できます。コンテンツモデレーション、アクセシビリティ機能、自動タグ付け、ビジュアル検索アプリケーションなどに活用できる詳細な分析結果を提供します。                     |
| `generateVideo`      | Amazon Nova Reelを使用して動画を生成します。テキストプロンプトや画像から現実的で高品質な動画を作成します。TEXT_VIDEO（6秒）、MULTI_SHOT_AUTOMATED（12-120秒）、MULTI_SHOT_MANUALモードをサポートし、ジョブARNを即座に返してステータス追跡が可能です。S3設定が必要です。                                                                                        |
| `checkVideoStatus`   | 実行ARNを使用して動画生成ジョブのステータスを確認します。現在のステータス、完了時刻、完了時のS3の場所を返します。動画生成ジョブの進行状況を監視するために使用します。                                                                                                                                                                                          |
| `downloadVideo`      | 実行ARNを使用してS3から完成した動画をダウンロードします。ジョブステータスからS3の場所を自動的に取得し、指定されたローカルパスまたはプロジェクトディレクトリにダウンロードします。checkVideoStatusでステータスが「Completed」と表示された場合にのみ使用してください。                                                                                           |
| `retrieve`           | Amazon Bedrock Knowledge Baseを使用して情報を検索します。指定されたナレッジベースから関連情報を取得します。                                                                                                                                                                                                                                                    |
| `invokeBedrockAgent` | 指定されたAmazon Bedrock Agentと対話します。エージェントIDとエイリアスIDを使用して対話を開始し、セッションIDを使用して会話を継続できます。Pythonコード分析やチャットなど、様々なユースケースに対応したファイル分析機能も提供します。                                                                                                                           |
| `invokeFlow`         | Amazon Bedrock Flowsを実行してカスタムデータ処理パイプラインを実現します。エージェント固有のフロー設定と複数の入力データ型（文字列、数値、真偽値、オブジェクト、配列）をサポートします。柔軟な入出力処理により、複雑なワークフローやカスタマイズされたデータ処理シーケンスの自動化を可能にします。データ変換、多段階処理、他のAWSサービスとの統合に最適です。  |

#### 💻 システムコマンド & コード実行

| ツール名          | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `executeCommand`  | コマンドの実行やプロセスへの入力送信を管理します。2つの動作モードがあり、1)コマンドと作業ディレクトリを指定して新規プロセスを開始、2)既存のプロセスIDを指定して標準入力を送信できます。セキュリティ上の理由から、許可されたコマンドのみが実行可能で、設定で指定されたシェルを使用します。登録されていないコマンドは実行できません。データベースに接続するコマンド、APIを実行するコマンド、別の AI エージェントを呼び出すコマンドなどを登録することで、エージェントの能力を拡張することができます。 |
| `codeInterpreter` | セキュアなDocker環境でPythonコードを実行します。データサイエンス用ライブラリがプリインストールされた環境で、セキュリティのためインターネットアクセスなしでコードを実行できます。2つの環境をサポート：「basic」（numpy、pandas、matplotlib、requests）、「datascience」（scikit-learn、scipy、seabornなどを含む完全なMLスタック）。入力ファイルは/data/ディレクトリに読み取り専用でマウント可能です。生成されたファイルは自動的に検出・報告されます。データ分析、可視化、ML実験に最適です。         |
| `screenCapture`   | 現在の画面をキャプチャしてPNG画像ファイルとして保存します。オプションでAIビジョンモデル（Claude/Nova）を使用してキャプチャした画像を分析し、テキスト内容の抽出、UI要素の識別、デバッグやドキュメント作成のための詳細な視覚的説明を提供します。プラットフォーム固有の権限が必要です（macOS：システム環境設定でScreen Recording権限が必要）。                                                                                                                                                        |
| `cameraCapture`   | HTML5 getUserMedia APIを使用してPCのカメラから画像をキャプチャし、画像ファイルとして保存します。異なる品質設定（低、中、高）と形式（JPG、PNG）をサポートします。オプションでAIを使用してキャプチャした画像を分析し、テキスト内容の抽出、オブジェクトの識別、分析やドキュメント作成のための詳細な視覚的説明を提供します。ブラウザ設定でカメラアクセス権限が必要です。                                                                                                                               |

<details>
<summary>Tips for Integrate Bedrock Agents</summary>

### APT (Agent Preparation Toolkit) を活用する

[Agent Preparation Toolkit](https://github.com/aws-samples/agent-preparation-toolkit) を使用することで、Amazon Bedrock Agents を使ってすぐに Agent を動かすことができます。

</details>

### MCP (Model Context Protocol) クライアント統合

Model Context Protocol (MCP) クライアント統合により、Bedrock Engineerは外部のMCPサーバーに接続し、強力な外部ツールを動的にロードして使用することができるようになりました。この統合により、AIアシスタントがMCPサーバーが提供するツールにアクセスして利用できるようになり、その能力が拡張されます。

## Agent Directory

Agent Directoryは、優れたコントリビューターによって作成されたAIエージェントを発見してすぐに使用できるコンテンツハブです。様々なタスクや専門分野向けに設計された厳選済みのエージェントコレクションを提供しています。

![agent-directory](./assets/agent-directory.png)

### 機能

- **コレクションの閲覧** - コミュニティによって作成された専門的なエージェントの拡大するライブラリを探索
- **検索とフィルタリング** - 検索機能またはタグによるフィルタリングを使用して、ニーズに合ったエージェントを素早く発見
- **詳細情報の表示** - 各エージェントの作成者、システムプロンプト、対応ツール、使用シナリオなどの包括的な情報を確認
- **ワンクリック追加** - ワンクリックで任意のエージェントを個人コレクションに追加し、すぐに使用開始
- **エージェントの投稿** - コントリビューターになって、あなたのカスタムエージェントをコミュニティと共有

### Agent Directoryの使い方

1. **閲覧と検索** - 検索バーを使用して特定のエージェントを見つけるか、コレクション全体を閲覧
2. **タグでフィルタリング** - タグをクリックしてカテゴリ、専門分野、機能によりエージェントをフィルタリング
3. **詳細を表示** - 任意のエージェントを選択して、システムプロンプト全文、対応ツール、使用シナリオを確認
4. **コレクションに追加** - 「マイエージェントに追加」をクリックして、個人コレクションにエージェントを追加

### エージェントの追加方法

コントリビューターになって、あなたのカスタムエージェントをコミュニティと共有しましょう：

1. カスタムエージェントを共有ファイルとしてエクスポート
2. 作者としてGitHubユーザー名を追加（推奨）
3. プルリクエストまたはGitHub Issueでエージェントを提出

Agent Directoryに貢献することで、Bedrock Engineerの機能を向上させる専門的なAIエージェントの貴重なリソース構築に協力できます。

## Nova Sonic Voice Chat

Amazon Nova Sonicを活用したリアルタイム音声会話機能です。AIエージェントと自然な音声でやり取りできます。

![voice-chat-page](./assets/voice-chat-page.png)

### 主な機能

- 🎤 **リアルタイム音声入力**: マイクを使ってAIと自然な会話
- 🗣️ **複数音声選択**: 3種類の音声特性から選択可能
  - Tiffany: 温かく親しみやすい
  - Amy: 冷静で落ち着いている
  - Matthew: 自信に満ち、威厳的
- 🤖 **エージェントカスタマイズ**: Agent Chatと同様にカスタムエージェントが利用可能
- 🛠️ **ツール実行**: エージェントが音声会話中にツールを実行
- 🌐 **多言語対応**: 現在は英語のみサポート、将来的に他言語対応予定

Nova Sonic Voice Chatを使用することで、従来のテキストベースのやり取りとは異なる、より自然で直感的なAIとの対話体験を提供します。音声によるコミュニケーションにより、効率的で親しみやすいAIアシスタント体験が可能になります。

### 重複した許可ダイヤログの解決

OS の許可ダイヤログ（マイクロフォンアクセスなど）が重複して表示される場合、アプリケーションをビルド・インストールした後に以下のコマンドを実行してアドホック署名を追加することで、この問題を解決できます：

```bash
sudo codesign --force --deep --sign - "/Applications/Bedrock Engineer.app"
```

このコマンドは、アプリケーションにアドホックコード署名を適用し、システムの許可ダイヤログが重複して表示される問題を防ぎます。

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
