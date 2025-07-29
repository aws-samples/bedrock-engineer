import { chatPage } from './chat'
import { awsDiagramGenerator } from './awsDiagramGenerator'
import { stepFunctionGenerator } from './stepFunctionGenerator'
import { websiteGenerator } from './websiteGenerator'
import {
  iamPolicy,
  notificationSettings,
  bedrockSettings,
  agentSettings,
  agentToolsSettings,
  promptCacheSettings,
  tokenAnalyticsSettings,
  lightModelSettings
} from './settings'
import { thinkingMode } from './thinkingMode'
import { agentDirectory } from './agentDirectory'
import { planActMode } from './planActMode'

const HomePage = {
  'set your aws credential':
    'Bedrock に接続する設定をします。設定画面から AWS Credentials（リージョン、アクセスキー、シークレットアクセスキー）を入力してください。',
  'Welcome to Bedrock Engineer': 'Bedrock Engineer にようこそ',
  'This is AI assistant of software development tasks':
    '私は、ソフトウェア開発タスクに特化したAIアシスタントです',
  'This is AI assistant for business analysis and planning':
    '私は、ビジネス分析と計画立案に特化したAIアシスタントです',
  'This is AI assistant for content creation and documentation':
    '私は、コンテンツ作成とドキュメント作成に特化したAIアシスタントです',
  'This is AI assistant for data analysis and visualization':
    '私は、データ分析と可視化に特化したAIアシスタントです',
  'This is AI assistant for project management and organization':
    '私は、プロジェクト管理と組織運営に特化したAIアシスタントです',
  'This is AI assistant that helps streamline your workflow':
    '私は、あなたのワークフローを効率化するAIアシスタントです',
  'This is AI assistant for creative problem solving':
    '私は、創造的な問題解決に特化したAIアシスタントです',
  'This is AI assistant for research and information gathering':
    '私は、研究と情報収集に特化したAIアシスタントです',
  'Start by the menu on the left or': '左のメニューから開始するか、次のショートカットが利用できます'
}

const Translation = {
  title: '翻訳',
  translating: '翻訳中...',
  error: 'エラー',
  retry: 'リトライ',
  formality: '敬語',
  profanity: '不適切表現フィルター',
  enableTranslation: '翻訳を有効にする',
  targetLanguage: '翻訳先言語',
  sourceLanguage: '翻訳元言語',
  'auto-detect': '自動検出',
  clearCache: '翻訳キャッシュをクリア',
  cacheStats: 'キャッシュ統計',
  translationSettings: '翻訳設定',

  // Proxy settings
  'Auto Detect': '自動検出',
  'Auto-detect system proxy when manual proxy is disabled':
    '手動プロキシが無効の場合、システムプロキシを自動検出',
  'Test Connection': '接続テスト',
  'Testing...': 'テスト中...',
  'Proxy connection successful': 'プロキシ接続成功',
  'Proxy connection failed': 'プロキシ接続失敗',
  'Error testing proxy connection': 'プロキシ接続テストエラー'
}

const SettingPage = {
  Setting: '設定',
  'Proxy Settings': 'プロキシ設定',
  'Enable Proxy': 'プロキシを有効にする',
  'Proxy Host': 'プロキシホスト',
  Port: 'ポート',
  Protocol: 'プロトコル',
  'Username (optional)': 'ユーザー名（オプション）',
  'Password (optional)': 'パスワード（オプション）',
  'Enter username': 'ユーザー名を入力',
  'Enter password': 'パスワードを入力',
  'Proxy settings will be applied to both AWS SDK connections and browser sessions. Please test your configuration to ensure proper connectivity.':
    'プロキシ設定はAWS SDK接続とブラウザセッションの両方に適用されます。設定後は接続テストを行って正常性を確認してください。',
  'Proxy settings will be applied to all AWS SDK connections. Please test your configuration to ensure connectivity.':
    'プロキシ設定はすべてのAWS SDK接続に適用されます。設定後は接続テストを行って接続性を確認してください。',
  'If proxy settings do not take effect, please try restarting the application.':
    'プロキシ設定が有効にならない場合は、アプリケーションの再起動をお試しください。',
  'Config Directory': 'アプリの設定',
  'Config Directory Description': 'アプリの設定が保存されるディレクトリです。',
  'Project Setting': 'プロジェクト設定',
  'Agent Chat': 'エージェントチャット',
  'Tavily Search API Key': 'Tavily 検索 API キー',
  tavilySearchApiKeyPlaceholder: 'tvly-xxxxxxxxxxxxxxx',
  tavilySearchUrl: 'https://tavily.com/',
  'Learn more about Tavily Search, go to':
    'Tavily Searchについて詳しく知るには、こちらをご覧ください',
  'Domain Settings': 'ドメイン設定',
  'Quick Presets': 'クイックプリセット',
  'Technical Sites': '技術サイト',
  'News Sites': 'ニュースサイト',
  'Academic Sites': '学術サイト',
  'Exclude Social Media': 'ソーシャルメディアを除外',
  'Include Domains': '含めるドメイン',
  'Exclude Domains': '除外するドメイン',
  'Domain Settings Help':
    '含めるドメインで特定のWebサイトに検索を制限し、除外するドメインで特定のWebサイトを除外できます。変更は自動的に保存されます。',
  'Learn more about domain settings at': 'ドメイン設定について詳しく知るには',
  'Clear All': 'すべて削除',
  'Context Length (number of messages to include in API requests)':
    'コンテキスト長（APIリクエストに含めるメッセージ数）',
  minContextLength: '1',
  contextLengthPlaceholder: '10',
  'Limiting context length reduces token usage but may affect conversation continuity':
    'コンテキスト長を制限するとトークン使用量は減りますが、会話の連続性に影響する可能性があります',
  'Amazon Bedrock': 'Amazon Bedrock',
  'LLM (Large Language Model)': 'LLM（大規模言語モデル）',
  'Inference Parameters': '推論パラメータ',
  'Max Tokens': '最大トークン数',
  Temperature: '温度',
  topP: 'トップP',
  'Advanced Setting': '詳細設定',
  'When writing a message, press': 'メッセージを書いているとき、',
  to: 'を押すと',
  'Send the message': 'メッセージを送信',
  'Start a new line (use': '改行（',
  'to send)': 'で送信）',
  'Invalid model': '無効なモデル',
  'Complete permissions for all Bedrock Engineer features including translation and video generation':
    '翻訳と動画生成を含む、Bedrock Engineer の全機能に対する完全な権限',
  'Minimal permissions for basic LLM interactions only': '基本的な LLM 対話のみに必要な最小限の権限'
}

const StepFunctionsGeneratorPage = {
  'What kind of step functions will you create?': 'どのようなステップ関数を作成しますか？',
  'Order processing workflow': '注文処理ワークフロー',
  '7 types of State': '7つの状態タイプ',
  'Nested Workflow': 'ネストされたワークフロー',
  'User registration process': 'ユーザー登録プロセス',
  'Distributed Map to process CSV in S3': 'S3のCSVを処理する分散マップ',
  'Create order processing workflow': '注文処理ワークフローを作成する',
  'Please implement a workflow that combines the following seven types':
    '以下の7つのタイプを組み合わせたワークフローを実装してください',
  'Create Nested Workflow example': 'ネストされたワークフローの例を作成する',
  'Implement the workflow for user registration processing': `ユーザー登録処理のワークフローを実装する

まず、Lambda を使って入力内容を確認します。
次に、入力内容に問題がなければ、情報を DynamoDB に保存します。
最後に、メールを送信します。メールの送信は Amazon SNS を使用します。
Lambda の入力内容が失敗した場合、DynamoDB は情報を保存せず、ユーザーにメールで通知します。
DynamoDB または SNS を使用する場合は、Lambda を使用せず、AWS ネイティブ統合を検討してください。
`,
  'Use the distributed map to repeat the row of the CSV file generated in S3': `S3で生成されたCSVファイルの行を繰り返すために分散マップを使用する
各行には注文と配送情報があります。
分散マッププロセッサはこれらの行のバッチを繰り返し、Lambda 関数を使用して注文を検出します。
その後、注文ごとに SQS キューにメッセージを送信します。`
}

const SpeakPage = {
  'Nova Sonic Chat': 'Nova Sonic チャット',
  'Voice conversation with AI': 'AIとの音声会話',
  'Voice Conversation': '音声会話',
  'Start speaking to begin the conversation': '話しかけて会話を開始してください',
  'Ready to chat': 'チャット準備完了',
  'Click "Start Speaking" to begin your voice conversation':
    '「話し始める」をクリックして音声会話を開始してください',
  'Conversation in progress...': '会話中...',
  'Conversation paused': '会話一時停止',
  'Scroll to bottom': '最下部にスクロール',
  'System Prompt': 'システムプロンプト',
  'Enter system prompt for the AI assistant...':
    'AIアシスタント用のシステムプロンプトを入力してください...',
  'Disconnect to edit the system prompt': 'システムプロンプトを編集するには切断してください',
  'This prompt will be sent when you connect to start the conversation':
    'このプロンプトは接続時に会話を開始するために送信されます',
  'Connection error. Please try reconnecting.': '接続エラーです。再接続してください。',
  'Reload Page': 'ページを再読み込み',
  Disconnected: '切断済み',
  'Connecting...': '接続中...',
  Connected: '接続済み',
  Ready: '準備完了',
  'Recording...': '録音中...',
  'Processing...': '処理中...',
  Error: 'エラー',
  Connect: '接続',
  Disconnect: '切断',
  'Start Speaking': '話し始める',
  'Stop Speaking': '話を止める',
  Recording: '録音中',
  Processing: '処理中',
  Listening: '聞き取り中',
  Thinking: '考え中',
  'Listening...': '聞き取り中...',
  'Thinking...': '考え中...',
  'Edit System Prompt': 'システムプロンプト編集',
  // Voice Selection
  'Select Voice': '音声を選択してください',
  'Start New Chat': '新しいチャットを始める',
  Cancel: 'キャンセルする',
  Voice: '音声',
  // Translation Settings in Voice Modal
  'Real-time Translation': 'リアルタイム翻訳',
  'Translate AI responses to your preferred language': 'AIの応答を希望する言語に翻訳します',
  'Target Language': '翻訳先言語',
  Selected: '選択中',
  'Translation Info': '翻訳について',
  'Only AI responses will be translated': 'AIの応答のみが翻訳されます',
  'Translation appears below the original message': '翻訳は元のメッセージの下に表示されます',
  'You can retry failed translations': '翻訳に失敗した場合は再試行できます',
  // Voice Descriptions
  'voice.tiffany.description': '温かく親しみやすい',
  'voice.tiffany.characteristics': '親近感があり共感的で、居心地の良い会話を作り出します',
  'voice.amy.description': '冷静で落ち着いている',
  'voice.amy.characteristics': '思慮深く慎重で、明確でバランスの取れた回答を提供します',
  'voice.matthew.description': '自信に満ち、威厳的',
  'voice.matthew.characteristics': '知識豊富で専門的、頼りがいのある印象を与えます',
  // Sample Text
  'Try talking like this': 'こんな風に話しかけてみましょう',
  'sample.noScenarios': 'サンプル会話がありません',
  'Nova Sonic currently supports English only': 'Nova Sonicは現在英語のみをサポートしています',
  // Permission Help Modal
  'permissionHelp.title': '重複した許可ダイヤログの解決',
  'permissionHelp.description': 'macOSでの重複した許可ダイヤログを解決するための情報',
  'permissionHelp.commandTitle': '解決コマンド',
  'permissionHelp.commandDescription':
    'OSの許可ダイヤログ（マイクロフォンアクセスなど）が重複して表示される場合、アプリケーションをビルド・インストールした後に以下のコマンドを実行してアドホック署名を追加することで、この問題を解決できます：',
  'permissionHelp.noteTitle': '注意',
  'permissionHelp.noteDescription':
    'このコマンドは、アプリケーションにアドホックコード署名を適用し、システムの許可ダイヤログが重複して表示される問題を防ぎます。',
  'permissionHelp.tooltip': '許可ダイヤログが繰り返し表示される？',

  // Voice Chat
  'voiceChat.regionWarning.title': 'Voice Chat機能が利用できません',
  'voiceChat.regionWarning.message':
    'Voice Chat（Nova Sonic）は現在のリージョン（{{currentRegion}}）では利用できません。対応リージョンに切り替えてください：{{supportedRegions}}',
  'voiceChat.regionWarning.openSettings': '設定を開く',
  'voiceChat.error.regionNotSupported':
    'Voice Chat機能は現在のリージョンでは利用できないか、権限に問題があります。AWSリージョン設定を確認してください。',
  'voiceChat.error.regionConnection':
    'Voice Chatサービスへの接続に失敗しました。リージョンの互換性の問題が考えられます。',
  'voiceChat.error.openSettings': '設定を開く',

  // Settings
  'settings.novaSonic.title': 'Voice Chat (Nova Sonic)',
  'settings.novaSonic.checking': '可用性を確認中...',
  'settings.novaSonic.available': '利用可能',
  'settings.novaSonic.notAvailable': '利用不可',
  'settings.novaSonic.refresh': 'ステータスを更新',
  'settings.novaSonic.currentRegion': '現在のリージョン: {{region}}',
  'settings.novaSonic.supportedRegions': '対応リージョン: {{regions}}',
  'Voice Chat Status': 'Voice Chatステータス'
}

const WebsiteGeneratorPage = {
  addRecommend: 'おすすめの追加機能を考え中',
  ecSiteTitle: '観葉植物のECサイト',
  ecSiteValue: `次の条件で、鉢植えの植物に特化した EC ウェブサイトの基本構造とレイアウトを作成してください。
<Conditions>
- レイアウトは Amazon.com のようなものにする。
- EC ウェブサイトの名前は "Green Village" とする。
- グリーンの配色テーマを使用する。
- 植物をカード形式で表示するセクションを追加する。
- ショッピングカートに追加する機能を作成する。
- 現在のショッピングカートの中身を確認し、合計金額を計算する機能を作成する。
</Conditions>
`,
  ecSiteAdminTitle: 'ECサイトの管理画面',
  ecSiteAdminValue: `以下の条件で、観葉植物を専門に取り扱うECサイトの管理画面を作ってください。
<条件>
- EC サイトの名前は「Green Village」です。
- グリーン系のカラーテーマにしてください。
- 直近の注文を表示するテーブルがあり、発注などのステータスを管理できます
- ダミーデータを表示してください
</条件>
前の出力に続けて、サイドバーナビゲーションを追加してください`,
  healthFitnessSiteTitle: 'フィットネスサイト',
  healthFitnessSiteValue: `次の条件で、健康とフィットネスのウェブサイトの基本構造とレイアウトを作成してください。
<Conditions>
- レイアウトは Amazon.com のようなものにする。
- ウェブサイトの名前は "FitLife" とする。
- 赤い配色テーマを使用する。
- 健康とフィットネスのブログを表示するセクションを追加する。
- キーワードで健康とフィットネスのコンテンツを検索する機能を作成する。
- ブログにコメントを追加する機能を作成する。
- 記事にはサムネイル画像をつける
</Conditions>
`,
  drawingGraphTitle: 'グラフの描画',
  drawingGraphValue: `ウェブサイト上で、次のデータをグラフで可視化してください。
購入データCSVファイル
customer_id,product_id,purchase_date,purchase_amount
C001,P001,2023-04-01,50.00
C002,P002,2023-04-02,75.00
C003,P003,2023-04-03,100.00
C001,P002,2023-04-04,60.00
C002,P001,2023-04-05,40.00
C003,P003,2023-04-06,90.00
C001,P001,2023-04-07,30.00
C002,P002,2023-04-08,80.00
C003,P001,2023-04-09,45.00
C001,P003,2023-04-10,120.00

このCSVファイルには以下の情報が含まれています。
- 'customer_id': 顧客 ID
- 'product_id': 製品 ID
- 'purchase_date': 購入日
- 'purchase_amount': 購入金額`,
  todoAppTitle: 'Todoアプリ',
  todoAppValue: 'シンプルな Todo アプリのウェブサイトを作成してください。',
  codeTransformTitle: 'コード変換',
  codeTransformValue: `以下のコードを変換してください。

using Android.App;
using Android.OS;
using Android.Support.V7.App;
using Android.Runtime;
using Android.Widget;
using System.Data.SQLite;
using System;
using Xamarin.Essentials;
using System.Linq;
namespace App2
{
[Activity(Label = "@string/app_name", Theme = "@style/AppTheme", MainLauncher = true)]
public class MainActivity : AppCompatActivity
{
protected override void OnCreate(Bundle savedInstanceState)
{
base.OnCreate(savedInstanceState);
Xamarin.Essentials.Platform.Init(this, savedInstanceState);
SetContentView(Resource.Layout.activity_main);
EditText input1 = FindViewById<EditText>(Resource.Id.Input1);
EditText input2 = FindViewById<EditText>(Resource.Id.Input2);
TextView total = FindViewById<TextView>(Resource.Id.Total);
Button totalButton = FindViewById<Button>(Resource.Id.TotalButton);
totalButton.Click += (sender, e) =>
{
total.Text = (int.Parse(input1.Text) + int.Parse(input2.Text)).ToString("#,0");
}
}
public override void OnRequestPermissionsResult(int requestCode, string[] permissions,
[GeneratedEnum] Android.Content.PM.Permission[] grantResults)
{
Xamarin.Essentials.Platform.OnRequestPermissionsResult(requestCode, permissions, grantResults);
base.OnRequestPermissionsResult(requestCode, permissions, grantResults);
}
}
}`
}

// New translations for MCP Server Settings tabs
const AgentFormTabs = {
  'Basic Settings': '基本設定',
  'MCP Servers': 'MCPサーバー',
  Tools: 'ツール',
  'MCP Server Settings': 'MCPサーバー設定',
  'Configure MCP servers for this agent to use MCP tools.':
    'このエージェントがMCPツールを使用するためのMCPサーバーを設定します。',
  'Register MCP servers first, then you can enable MCP tools in the Available Tools tab.':
    'まずMCPサーバーを登録し、その後ツールタブでMCPツールを有効にできます。',
  'Add New MCP Server': '新しいMCPサーバーを追加',
  'Edit MCP Server': 'MCPサーバーを編集',
  'Server Configuration (JSON)': 'サーバー設定（JSON）',
  'Add Server': 'サーバーを追加',
  'Update Server': 'サーバーを更新',
  'Server updated successfully': 'サーバーが正常に更新されました',
  'Multiple servers updated successfully': '複数のサーバーが正常に更新されました',
  'Registered MCP Servers': '登録済みMCPサーバー',
  'No MCP servers registered yet': 'まだMCPサーバーが登録されていません',
  'Required fields are missing or invalid. Check the JSON format.':
    '必須フィールドが不足しているか無効です。JSONフォーマットを確認してください。',
  'The "env" field must be an object.': '"env"フィールドはオブジェクト型である必要があります。',
  'A server with this name already exists.': 'この名前のサーバーは既に存在します。',
  'Invalid JSON format.': 'JSONフォーマットが無効です。',
  'No valid server configurations found': '有効なサーバー設定が見つかりませんでした',
  'Sample Config': '設定サンプル',
  'Export Current Config': '現在の設定をエクスポート',
  'Use claude_desktop_config.json format with mcpServers object containing server configurations.':
    'mcpServersオブジェクトを含むclaude_desktop_config.json形式を使用してください。',
  'Invalid format: Must use claude_desktop_config.json format with mcpServers object':
    '無効な形式: mcpServersオブジェクトを含むclaude_desktop_config.json形式を使用してください',
  'When editing, please include exactly one server in mcpServers':
    '編集時には、mcpServersに正確に1つのサーバーを含めてください',
  // MCPサーバー接続テスト関連
  'Test Connection': '接続テスト',
  'Test All Servers': '全サーバーをテスト',
  'Testing...': 'テスト中...',
  'Connection Status': '接続状態',
  success: '成功',
  failed: '失敗',
  total: '合計',
  'Clear Results': '結果をクリア',
  'Connection Successful': '接続成功',
  'Connection Failed': '接続失敗',
  'tools available': 'ツールが利用可能',
  'Startup time': '起動時間',
  Solution: '解決策',
  // Environment Context Settings
  'Environment Context Settings': '環境コンテキスト設定',
  'Choose which environment context sections to include in the system prompt. Basic context (project path, date) is always included.':
    'システムプロンプトに含める環境コンテキストセクションを選択してください。基本コンテキスト（プロジェクトパス、日付）は常に含まれます。',
  'Project Rule': 'プロジェクトルール',
  'Includes instructions to load project-specific rules from .bedrock-engineer/rules folder':
    'カスタムのコーディング規約、アーキテクチャガイドライン、特定の開発プラクティスがあるプロジェクトで作業する際に有効にしてください。AIが.bedrock-engineer/rulesフォルダからルールを自動的に読み込み、プロジェクトの規約に従って一貫性を保ちます。',
  'Visual Expression Rules': '視覚表現ルール',
  'Includes instructions for creating diagrams, images, and mathematical formulas':
    'AIに図表（フローチャート、アーキテクチャ図）の作成、画像生成、数式の記述をさせたい場合に有効にしてください。ドキュメント作成、技術説明、データ可視化、教育コンテンツの作成に役立ちます。',
  'TODO List Instruction': 'TODOリスト指示',
  'Includes instructions to create TODO lists for long-running tasks':
    '複雑で複数ステップからなるプロジェクトで、AIに大きなタスクを管理可能なアクションアイテムに分解してもらいたい場合に有効にしてください。プロジェクト計画、機能開発、リファクタリング、複数セッションにわたる作業で特に有用です。'
}

const CodeBlock = {
  Source: 'ソース',
  Preview: 'プレビュー',
  'Toggle View': 'ビューを切り替え',
  'Camera Capture': 'カメラキャプチャ',
  'Camera Device': 'カメラデバイス'
}

const FileChanges = {
  original: '元の内容',
  updated: '更新後の内容',
  added: '追加された内容',
  removed: '削除された内容',
  noChanges: '変更はありません',
  fileDiff: 'ファイル差分',
  copyOriginal: '元のテキストをコピー',
  copyUpdated: '更新後のテキストをコピー',
  originalTextCopied: '元のテキストをクリップボードにコピーしました',
  updatedTextCopied: '更新後のテキストをクリップボードにコピーしました',
  filePathCopied: 'ファイルパスをクリップボードにコピーしました',
  failedToCopy: 'テキストのコピーに失敗しました',
  lines: '行',
  changed: '変更',
  expand: '拡大',
  collapse: '折りたたむ'
}

const BackgroundAgent = {
  title: 'バックグラウンドエージェントスケジューラー',
  description: '指定した時間にAIエージェントを自動実行するスケジュール機能',
  pageDescription: 'スケジュールされたタスクを管理し、自動実行を設定できます',
  createTask: 'タスク作成',
  editTask: 'タスク編集',
  sessionContinuation: 'セッション継続',
  continueSessionPrompt: 'セッション継続プロンプト',

  // Sessions
  sessions: {
    title: 'セッション',
    newSession: '新規セッション',
    noSessions: 'セッションがありません',
    createNewSession: '新規セッションを作成してください',
    confirmDelete: 'このセッションを削除しますか？',
    deleteSession: 'セッション削除'
  },

  // New Session Modal
  newSession: {
    title: '新規セッション作成',
    modelSelection: 'モデル選択',
    agentSelection: 'エージェント選択',
    noAgent: 'エージェントなし',
    selectAgent: 'エージェントを選択してください。',
    cancel: 'キャンセル',
    create: '作成'
  },

  // CRON Presets
  cronPresets: {
    everyMinute: '毎分',
    every5Minutes: '5分ごと',
    everyHour: '毎時',
    dailyAt9AM: '毎日午前9時',
    weekdaysAt9AM: '平日午前9時',
    weeklyMondayAt9AM: '毎週月曜午前9時',
    monthlyFirst9AM: '毎月1日午前9時'
  },

  // Help Modal
  help: {
    title: 'Background Agent 作成ガイド',
    subtitle: '効果的な Background Agent を作成するためのベストプラクティス',
    tooltip: 'Background Agent について',

    concepts: {
      title: '基本概念',
      description: 'Background Agent は定期実行に適したタスクを自動化するための機能です：',
      item1: '明確で具体的な目標を持つタスクに最適',
      item2: 'ユーザーの入力を必要としない自動化可能なタスク',
      item3: '定期的な実行により価値を提供するタスク',
      item4: '結果を適切に記録・レポートできるタスク'
    },

    useCases: {
      title: '推奨されるユースケース',
      development: {
        title: '開発タスク',
        description:
          'プロジェクトの品質向上に役立つタスクです。コードベースの静的解析を行い、未使用のimportやコーディング規約違反を特定したり、テストスイートを定期実行してレグレッションを早期発見することができます。また、READMEやAPIドキュメントの更新チェックなど、開発チーム全体の生産性向上につながる作業の自動化が可能です。'
      },
      maintenance: {
        title: 'メンテナンスタスク',
        description:
          'システムの安定稼働を支援するタスクです。アプリケーションログやエラーログを定期的に分析し、潜在的な問題や異常なパターンを検出して早期対応を可能にします。定期的なヘルスチェックによってシステムのパフォーマンス監視を行ったり、データのバックアップ状態やストレージ使用量の確認など、運用面での安心を提供する作業を自動化できます。'
      },
      workflow: {
        title: 'ワークフロー支援',
        description:
          '日常業務を効率化するタスクです。業務開始前にメールをチェックして重要な案件を抽出し、優先順位付きの1日の作業計画を自動作成したり、週次でプロジェクトのタスクボードを確認して未完了タスクや期限間近なアイテムをレビューすることができます。会議前の資料準備や議題整理、定期的な進捗レポートの作成など、チーム全体の生産性向上を支援します。'
      },
      business: {
        title: '日常業務自動化',
        description:
          'ルーチンワークを自動化するタスクです。顧客からの問い合わせパターンを分析してFAQの更新提案を行ったり、営業データやプロジェクト指標を定期的に集計してダッシュボードを更新することができます。また、チームメンバーの稼働状況や成果物の進捗を確認してマネジメント向けのサマリーレポートを作成するなど、管理業務の効率化にも役立ちます。'
      }
    },

    prompts: {
      title: 'プロンプト設計のコツ',
      description:
        '効果的なBackgroundAgentを作成するためには、明確で具体的なプロンプトが重要です。「何を」「どのように」「どこで」「いつまでに」を明示し、期待する出力形式（レポート、サマリー、チェックリストなど）を指定してください。また、エラーが発生した場合の対応方法や、作業範囲の境界を明確に定義することで、予期しない動作を防ぎ、一貫した結果を得ることができます。'
    },

    bestPractices: {
      title: 'ベストプラクティス',
      item1: '小さく始めて段階的に改善する - 最初はシンプルなタスクから',
      item2: '明確な成功指標を設定する - 何を達成すべきかを定義',
      item3: '適切な実行頻度を選択する - 過度な実行を避ける',
      item4: 'ログとレポートを活用する - 実行結果を定期的に確認'
    }
  },

  // Tabs
  tabs: {
    tasks: 'タスク',
    stats: '統計'
  },

  // Form
  form: {
    title: 'スケジュールタスクの作成',
    taskName: 'タスク名',
    taskNamePlaceholder: 'タスク名を入力してください...',
    schedule: 'スケジュール',
    agent: 'エージェント',
    selectAgent: 'エージェントを選択',
    model: 'モデル',
    projectDirectory: 'プロジェクトディレクトリ',
    projectDirectoryPlaceholder: 'プロジェクトディレクトリのパスを入力してください...',
    projectDirectoryHelp: 'オプション: エージェントの作業ディレクトリを指定',
    selectProjectDirectory: 'プロジェクトディレクトリを選択',
    wakeWord: 'ウェイクワード（プロンプト）',
    wakeWordPlaceholder: 'エージェントに送信するプロンプトを入力してください...',
    maxTokens: '最大出力トークン',
    maxTokensHelp: 'モデルが生成できるトークンの最大数（選択されたモデルに依存）',
    wakeWordHelp: 'このメッセージがタスク実行時にエージェントに送信されます',
    cronHelp: 'Cron表記フォーマット: 分 時 日 月 曜日',
    enableTask: 'タスクを即座に有効にする',
    continueSession: 'セッションを継続する',
    continueSessionHelp:
      '有効にすると、前回のセッションに追加でメッセージを送信します。無効の場合は常に新しいセッションを開始します。',
    continueSessionPrompt: 'セッション継続時のプロンプト',
    continueSessionPromptPlaceholder: '前回の作業の続きを行ってください...',
    continueSessionPromptHelp:
      'セッション継続時に送信される専用プロンプト。空の場合は通常のウェイクワードが使用されます。',

    errors: {
      nameRequired: 'タスク名は必須です',
      cronRequired: 'スケジュールは必須です',
      agentRequired: 'エージェントの選択は必須です',
      modelRequired: 'モデルの選択は必須です',
      wakeWordRequired: 'ウェイクワードは必須です',
      invalidMaxTokens: '無効な最大トークン数です（1-64000）'
    }
  },

  // Task List
  scheduledTasks: 'スケジュールタスク',
  noTasks: 'スケジュールタスクがありません',
  noTasksDescription: '最初のスケジュールタスクを作成して開始しましょう',
  wakeWord: 'ウェイクワード',
  executions: '実行回数',
  lastRun: '最後の実行',
  nextRun: '次回実行',
  created: '作成日時',
  never: 'なし',

  // Task Actions
  executeManually: '今すぐ実行',
  testExecution: 'テスト実行',
  enable: '有効にする',
  disable: '無効にする',
  enableTask: 'タスクを有効にする',
  disableTask: 'タスクを無効にする',
  deleteTask: 'タスクを削除',
  confirmDeleteTask: 'このタスクを削除してもよろしいですか？',
  taskDetails: 'タスク詳細',

  // Status
  status: {
    active: '有効',
    disabled: '無効',
    error: 'エラー'
  },

  // Messages
  messages: {
    taskCreated: 'タスクを作成しました',
    taskUpdated: 'タスクを更新しました',
    taskCancelled: 'タスクを削除しました',
    taskEnabled: 'タスクを有効にしました',
    taskDisabled: 'タスクを無効にしました',
    taskExecuted: 'タスクを実行しました',
    taskExecutionFailed: 'タスクの実行に失敗しました',
    taskSkipped: 'タスクの実行をスキップしました（{{reason}}）',
    taskSkippedDuplicateExecution: 'タスクの実行をスキップしました（{{executionTime}}秒間実行中）',
    sessionContinued: 'セッションでの会話を継続しました'
  },

  // Execution details
  executionTime: '実行時間',
  messagesLabel: 'メッセージ',
  toolExecutions: 'ツール実行',
  error: 'エラー',

  // Statistics
  stats: {
    title: 'スケジューラー統計',
    totalTasks: '総タスク数',
    enabledTasks: '有効タスク数',
    disabledTasks: '無効タスク数',
    totalExecutions: '総実行回数',
    tasksWithErrors: 'エラーのあるタスク数',
    activeCronJobs: 'アクティブCronジョブ数',
    healthOverview: 'ヘルス概要',
    executionRate: '実行レート',
    successRate: '成功率',
    activeRate: 'アクティブ率',
    summary: '概要',
    active: 'アクティブ',
    errors: 'エラー',
    disabled: '無効'
  },

  lastError: '最後のエラー',

  // History
  viewExecutionHistory: '実行履歴を表示',
  history: {
    title: '実行履歴',
    viewHistory: '実行履歴を表示',
    totalExecutions: '総実行回数',
    successful: '成功',
    failed: '失敗',
    successRate: '成功率',
    filterStatus: 'ステータス',
    filterDate: '期間',
    all: 'すべて',
    successOnly: '成功のみ',
    failureOnly: '失敗のみ',
    allTime: '全期間',
    today: '今日',
    thisWeek: '今週',
    thisMonth: '今月',
    noHistory: '実行履歴がありません',
    executionSuccess: '実行成功',
    executionFailure: '実行失敗',
    duration: '実行時間',
    messages: 'メッセージ数',
    messageCount: 'メッセージ数',
    unknown: '不明',
    sessionHistory: 'セッション履歴',
    noMessages: 'メッセージがありません',
    user: 'ユーザー',
    assistant: 'アシスタント',
    executionHistoryList: '実行履歴',
    executionDetails: '実行詳細',
    sessionId: 'セッションID',
    toolExecution: 'ツール実行',
    toolResult: 'ツール結果',
    continueConversation: '会話を継続',
    showHistoryOnly: '履歴のみ表示',
    loadingMessages: 'メッセージを読み込み中...',
    enterMessage: 'メッセージを入力してください...',
    send: '送信',
    sendInstruction: 'Enterで送信、Shift+Enterで改行',
    selectExecutionHistory: '実行履歴を選択してください',
    success: '成功',
    failure: '失敗',
    running: '実行中'
  },

  // System Prompt
  systemPrompt: {
    title: 'システムプロンプト',
    show: 'システムプロンプトを表示',
    loading: 'システムプロンプトを読み込み中...',
    error: 'システムプロンプトの読み込みに失敗しました',
    empty: 'システムプロンプトがありません'
  },

  // Table View
  table: {
    name: 'タスク名',
    schedule: 'スケジュール',
    agent: 'エージェント',
    status: 'ステータス',
    lastRun: '最終実行',
    actions: 'アクション'
  },

  // UI Labels
  ui: {
    error: 'エラー',
    continuation: '継続',
    executionCount: '回実行',
    lastRun: '最終',
    details: '詳細',
    wakeWord: 'ウェイクワード',
    continuationPrompt: '継続プロンプト',
    created: '作成'
  },

  // Error messages
  errors: {
    fetchTasks: 'タスクの読み込みに失敗しました',
    fetchStats: '統計の読み込みに失敗しました',
    createTask: 'タスクの作成に失敗しました',
    cancelTask: 'タスクの削除に失敗しました',
    toggleTask: 'タスクの切り替えに失敗しました',
    executeTask: 'タスクの実行に失敗しました',
    fetchHistory: '実行履歴の読み込みに失敗しました',
    fetchSessionHistory: 'セッション履歴の読み込みに失敗しました',
    continueSession: 'セッションの継続に失敗しました',
    getSystemPrompt: 'システムプロンプトの取得に失敗しました'
  }
}

const IgnoreSettings = {
  title: 'ファイル除外設定',
  globalTab: 'グローバル設定',
  projectTab: 'プロジェクト固有設定',
  globalDescription: 'アプリ全体で適用される除外パターンを設定します。',
  globalPlaceholder: '.git\nnode_modules\n.vscode\n*.log\n.DS_Store\n...',
  projectDescription:
    'このプロジェクトでのみ適用される除外パターンを設定します。設定は .bedrock-engineer/.ignore ファイルに保存されます。',
  projectPath: 'プロジェクトパス',
  projectPlaceholder: 'node_modules\n.git\n*.log\n.DS_Store\ndist/\nbuild/\n...',
  loading: '読み込み中...',
  saving: '保存中...',
  save: '保存',
  loadError: 'ファイルの読み込みに失敗しました',
  saveError: 'ファイルの保存に失敗しました'
}

const ProjectIgnore = {
  title: 'プロジェクト固有の除外設定',
  description:
    'このプロジェクトで無視するファイルやフォルダのパターンを設定します。設定は .bedrock-engineer/.ignore ファイルに保存されます。',
  projectPath: 'プロジェクトパス',
  placeholder: 'node_modules\n.git\n*.log\n.DS_Store\n...',
  loading: '読み込み中...',
  saving: '保存中...',
  save: '保存',
  loadError: 'ファイルの読み込みに失敗しました',
  saveError: 'ファイルの保存に失敗しました'
}

const TodoModal = {
  'View TODO List': 'TODOリストを表示',
  'TODO List': 'TODOリスト',
  'No TODO List Available': 'TODOリストがありません',
  'Create a TODO list using the todoInit tool to see tasks here.':
    'todoInitツールを使用してTODOリストを作成すると、ここにタスクが表示されます。',
  'Project Overview': 'プロジェクト概要',
  'Overall Progress': '全体の進捗',
  'Total Tasks': '総タスク数',
  Pending: '未完了',
  'In Progress': '進行中',
  Completed: '完了',
  Cancelled: 'キャンセル済み',
  All: 'すべて',
  'No tasks found for this filter.': 'このフィルターでタスクが見つかりませんでした。',
  ID: 'ID',
  Created: '作成日時',
  Updated: '更新日時',
  'List created on': 'リスト作成日時',
  'Last updated': '最終更新'
}

const Common = {
  refresh: '更新',
  close: '閉じる',
  cancel: 'キャンセル',
  create: '作成',
  creating: '作成中...',
  update: '更新',
  updating: '更新中...',
  executing: '実行中...',
  enabled: '有効',
  disabled: '無効',
  minutes: '分',
  seconds: '秒'
}

const ja = {
  ...HomePage,
  ...SettingPage,
  ...StepFunctionsGeneratorPage,
  ...chatPage.ja,
  ...SpeakPage,
  ...FileChanges,
  ...WebsiteGeneratorPage,
  ...Translation,
  ...CodeBlock,
  ...iamPolicy.ja,
  ...notificationSettings.ja,
  ...bedrockSettings.ja,
  ...agentSettings.ja,
  ...agentToolsSettings.ja,
  ...promptCacheSettings.ja,
  ...tokenAnalyticsSettings.ja,
  ...lightModelSettings.ja,
  ...awsDiagramGenerator.ja,
  ...stepFunctionGenerator.ja,
  ...websiteGenerator.ja,
  ...thinkingMode.ja,
  ...agentDirectory.ja,
  ...AgentFormTabs,
  ...planActMode.ja,
  ...TodoModal,
  backgroundAgent: BackgroundAgent,
  ignoreSettings: IgnoreSettings,
  projectIgnore: ProjectIgnore,
  common: Common
}

export default ja
