import { chatPage } from './chat'
import { awsDiagramGenerator } from './awsDiagramGenerator'
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
  translationSettings: '翻訳設定'
}

const SettingPage = {
  Setting: '設定',
  'Config Directory': 'アプリの設定',
  'Config Directory Description': 'アプリの設定が保存されるディレクトリです。',
  'Project Setting': 'プロジェクト設定',
  'Agent Chat': 'エージェントチャット',
  'Tavily Search API Key': 'Tavily 検索 API キー',
  tavilySearchApiKeyPlaceholder: 'tvly-xxxxxxxxxxxxxxx',
  tavilySearchUrl: 'https://tavily.com/',
  'Learn more about Tavily Search, go to':
    'Tavily Searchについて詳しく知るには、こちらをご覧ください',
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
  'Invalid model': '無効なモデル'
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
  'permissionHelp.tooltip': '許可ダイヤログが繰り返し表示される？'
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

const ja = {
  ...HomePage,
  ...SettingPage,
  ...StepFunctionsGeneratorPage,
  ...chatPage.ja,
  ...SpeakPage,
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
  ...thinkingMode.ja,
  ...agentDirectory.ja,
  ...AgentFormTabs,
  ...planActMode.ja
}

export default ja
