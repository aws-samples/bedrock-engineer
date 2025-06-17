# 🛠️ Troubleshooting Guide / トラブルシューティングガイド

Language: [English](#english) / [Japanese](#japanese)

## English

This guide helps you resolve common issues when using Bedrock Engineer.

### Table of Contents

1. [Installation & Startup Issues](#installation--startup-issues)
2. [AWS Authentication Setup](#aws-authentication-setup)
3. [Agent Chat Issues](#agent-chat-issues)
4. [Voice Chat (Nova Sonic) Issues](#voice-chat-nova-sonic-issues)
5. [Website Generator Issues](#website-generator-issues)
6. [Network & Connection Issues](#network--connection-issues)
7. [Performance Issues](#performance-issues)
8. [Data & Settings Management](#data--settings-management)
9. [Frequently Asked Questions (FAQ)](#frequently-asked-questions-faq)

---

### Installation & Startup Issues

#### App won't start after installation

**Problem**: The application doesn't launch or crashes immediately.

**Solutions**:
1. **macOS**: Check if you're seeing the "malicious software" warning
   - Open System Preferences → Privacy & Security
   - Scroll down and click "Open Anyway" next to the Bedrock Engineer warning
   
2. **Configuration file corruption**:
   - Delete the configuration file: `~/Library/Application Support/bedrock-engineer/config.json` (macOS)
   - Restart the application

![App startup error dialog](./images/app-startup-error.png)
*Screenshot: App startup error dialog - Add screenshot showing typical startup error message*

#### "Malicious software" warning on macOS

**Problem**: macOS shows "Bedrock Engineer can't be opened because Apple cannot check it for malicious software"

**Solution**:
1. Right-click on the application and select "Open"
2. Or go to System Preferences → Privacy & Security → Click "Open Anyway"

![macOS security warning dialog](./images/macos-security-warning.png)
*Screenshot: macOS security warning - Add screenshot showing the "malicious software" warning dialog*

#### Duplicate permission dialogs

**Problem**: Multiple system permission dialogs appear repeatedly.

**Solution**:
Run this command in Terminal after installation:
```bash
sudo codesign --force --deep --sign - "/Applications/Bedrock Engineer.app"
```

---

### AWS Authentication Setup

#### Authentication credentials not configured

**Problem**: "AWS credentials not found" or authentication errors.

**Solutions**:
1. **Configure AWS credentials**:
   - Set up AWS CLI: `aws configure`
   - Or set environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - Or use IAM roles (for EC2 instances)

2. **Check required permissions**:
   - Ensure your AWS user/role has access to Amazon Bedrock
   - Required permissions: `bedrock:InvokeModel`, `bedrock:ListFoundationModels`

![AWS configuration screen](./images/aws-configuration.png)
*Screenshot: AWS configuration screen - Add screenshot showing the AWS credentials setup interface*

#### Bedrock access denied errors

**Problem**: "Access denied" when trying to use Bedrock models.

**Solution**:
1. Go to AWS Console → Amazon Bedrock → Model access
2. Request access to the models you want to use (Claude, Nova, etc.)
3. Wait for approval (usually takes a few minutes)

![Bedrock model access page](./images/bedrock-model-access.png)
*Screenshot: Bedrock model access page - Add screenshot showing the AWS Bedrock console model access request page*

---

### Agent Chat Issues

#### Chat responses are slow or hang

**Problem**: Agent takes too long to respond or stops responding.

**Solutions**:
1. **Check your internet connection**
2. **Verify AWS credentials and Bedrock access**
3. **Try a different model** (e.g., switch from Claude to Nova)
4. **Reduce context length** by starting a new chat session

#### File operation errors

**Problem**: Agent cannot create, read, or modify files.

**Solutions**:
1. **Check file permissions** in the working directory
2. **Ensure the path exists** before file operations
3. **Verify disk space** availability

#### Web search not working

**Problem**: Tavily API search functionality fails.

**Solution**:
1. **Configure Tavily API key**:
   - Get an API key from [Tavily](https://tavily.com/)
   - Add it to your environment or app settings
2. **Check internet connectivity**

---

### Voice Chat (Nova Sonic) Issues

#### Microphone access denied

**Problem**: Voice chat cannot access the microphone.

**Solutions**:
1. **macOS**: System Preferences → Privacy & Security → Microphone → Enable Bedrock Engineer
2. **Windows**: Settings → Privacy → Microphone → Allow apps to access microphone
3. **Browser**: Allow microphone access when prompted

![Microphone permission settings](./images/microphone-permissions.png)
*Screenshot: Microphone permission settings - Add screenshot showing system microphone permission settings on macOS/Windows*

#### Voice recognition not working

**Problem**: Speech is not being recognized or converted to text.

**Solutions**:
1. **Check microphone levels** in system settings
2. **Try speaking closer to the microphone**
3. **Ensure a quiet environment** for better recognition
4. **Switch voice chat language** settings if available

#### Poor audio quality

**Problem**: Voice output is distorted or unclear.

**Solutions**:
1. **Check system audio settings**
2. **Update audio drivers**
3. **Try different voice options** (Tiffany, Amy, Matthew)

---

### Website Generator Issues

#### Preview not displaying

**Problem**: Generated website preview is blank or not loading.

**Solutions**:
1. **Check for JavaScript errors** in the console
2. **Try a different framework** (React, Vue, Svelte)
3. **Simplify the generated code** by providing clearer instructions

#### Library loading errors

**Problem**: External libraries or dependencies fail to load.

**Solutions**:
1. **Check internet connection** for CDN resources
2. **Use inline styling** instead of external CSS frameworks
3. **Verify library versions** are compatible

#### Knowledge Base connection failed

**Problem**: Cannot connect to Amazon Bedrock Knowledge Base.

**Solution**:
1. **Verify Knowledge Base ID** is correct
2. **Check IAM permissions** for Knowledge Base access
3. **Ensure Knowledge Base is in the same AWS region**

---

### Network & Connection Issues

#### Proxy configuration

**Problem**: Application cannot connect through corporate proxy.

**Solution**:
Set proxy environment variables:
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

#### Firewall blocking connections

**Problem**: Firewall blocks connections to AWS services.

**Solution**:
1. **Allow outbound HTTPS traffic** to AWS domains
2. **Whitelist AWS IP ranges** if necessary
3. **Configure firewall exceptions** for the application

---

### Performance Issues

#### High memory usage

**Problem**: Application consumes too much RAM.

**Solutions**:
1. **Restart the application** regularly
2. **Clear chat history** periodically
3. **Close unused features** (website generator, etc.)
4. **Reduce concurrent operations**

#### Slow response times

**Problem**: All operations are slower than expected.

**Solutions**:
1. **Check system resources** (CPU, memory, disk)
2. **Use lighter language models** when available
3. **Optimize network connection**
4. **Close other resource-intensive applications**

---

### Data & Settings Management

#### Backup chat history

**Solution**:
Chat history is stored in:
- **macOS**: `~/Library/Application Support/bedrock-engineer/`
- **Windows**: `%APPDATA%/bedrock-engineer/`
- **Linux**: `~/.config/bedrock-engineer/`

#### Reset application settings

**Solution**:
Delete the configuration directory:
- **macOS**: `~/Library/Application Support/bedrock-engineer/`
- **Windows**: `%APPDATA%/bedrock-engineer/`
- **Linux**: `~/.config/bedrock-engineer/`

#### Export/Import agent configurations

**Solution**:
Use the "Export Agent" and "Import Agent" buttons in the agent customization interface.

---

### Frequently Asked Questions (FAQ)

#### Q: What languages are supported?
A: Currently supports English and Japanese. Voice chat is English-only for now.

#### Q: How much does it cost to use?
A: You pay only for AWS Bedrock usage. Refer to [Amazon Bedrock pricing](https://aws.amazon.com/bedrock/pricing/).

#### Q: Is my data secure?
A: Yes, all data processing happens through your AWS account. No data is sent to third parties except AWS.

#### Q: Can I use custom models?
A: Currently supports models available in Amazon Bedrock. Custom model support may be added in future versions.

#### Q: Why is the application so large?
A: It's an Electron app with multiple AI capabilities built-in, which requires significant resources.

---

## Japanese

このガイドは、Bedrock Engineer使用時の一般的な問題を解決するためのものです。

### 目次

1. [インストール・起動関連の問題](#インストール起動関連の問題)
2. [AWS認証設定](#aws認証設定)
3. [エージェントチャットの問題](#エージェントチャットの問題)
4. [音声チャット（Nova Sonic）の問題](#音声チャットnova-sonicの問題)
5. [ウェブサイト生成の問題](#ウェブサイト生成の問題)
6. [ネットワーク・接続の問題](#ネットワーク接続の問題)
7. [パフォーマンスの問題](#パフォーマンスの問題)
8. [データ・設定管理](#データ設定管理)
9. [よくある質問（FAQ）](#よくある質問faq)

---

### インストール・起動関連の問題

#### アプリがインストール後に起動しない

**問題**: アプリケーションが起動しない、または即座にクラッシュする。

**解決方法**:
1. **macOS**: "悪意のあるソフトウェア"警告が表示されていないか確認
   - システム環境設定 → プライバシーとセキュリティ
   - 下にスクロールして、Bedrock Engineer の警告の横にある「とにかく開く」をクリック
   
2. **設定ファイルの破損**:
   - 設定ファイルを削除: `~/Library/Application Support/bedrock-engineer/config.json` (macOS)
   - アプリケーションを再起動

![アプリ起動エラーダイアログ](./images/app-startup-error.png)
*スクリーンショット: アプリ起動エラーダイアログ - 典型的な起動エラーメッセージを示すスクリーンショットを追加*

#### macOSでの「悪意のあるソフトウェア」警告

**問題**: macOSが「Apple が悪意のあるソフトウェアをチェックできないため、Bedrock Engineer を開くことができません」と表示する

**解決方法**:
1. アプリケーションを右クリックして「開く」を選択
2. またはシステム環境設定 → プライバシーとセキュリティ → 「とにかく開く」をクリック

![macOSセキュリティ警告ダイアログ](./images/macos-security-warning.png)
*スクリーンショット: macOSセキュリティ警告 - "悪意のあるソフトウェア"警告ダイアログを示すスクリーンショットを追加*

#### 重複する許可ダイアログ

**問題**: システム許可ダイアログが繰り返し表示される。

**解決方法**:
インストール後にターミナルで以下のコマンドを実行:
```bash
sudo codesign --force --deep --sign - "/Applications/Bedrock Engineer.app"
```

---

### AWS認証設定

#### 認証情報が設定されていない

**問題**: "AWS認証情報が見つかりません"または認証エラー。

**解決方法**:
1. **AWS認証情報の設定**:
   - AWS CLIの設定: `aws configure`
   - または環境変数の設定: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - またはIAMロールの使用（EC2インスタンスの場合）

2. **必要な権限の確認**:
   - AWSユーザー/ロールがAmazon Bedrockにアクセスできることを確認
   - 必要な権限: `bedrock:InvokeModel`, `bedrock:ListFoundationModels`

![AWS設定画面](./images/aws-configuration.png)
*スクリーンショット: AWS設定画面 - AWS認証情報設定インターフェースを示すスクリーンショットを追加*

#### Bedrockアクセス拒否エラー

**問題**: Bedrockモデルを使用しようとすると「アクセス拒否」エラー。

**解決方法**:
1. AWSコンソール → Amazon Bedrock → モデルアクセス に移動
2. 使用したいモデル（Claude、Novaなど）へのアクセスをリクエスト
3. 承認を待つ（通常数分）

![Bedrockモデルアクセスページ](./images/bedrock-model-access.png)
*スクリーンショット: Bedrockモデルアクセスページ - AWS Bedrockコンソールのモデルアクセス要求ページを示すスクリーンショットを追加*

---

### エージェントチャットの問題

#### チャット応答が遅い、または停止する

**問題**: エージェントの応答に時間がかかる、または応答が停止する。

**解決方法**:
1. **インターネット接続の確認**
2. **AWS認証情報とBedrockアクセスの確認**
3. **別のモデルを試す**（例：ClaudeからNovaに変更）
4. **新しいチャットセッションを開始**してコンテキスト長を減らす

#### ファイル操作エラー

**問題**: エージェントがファイルの作成、読み込み、変更ができない。

**解決方法**:
1. **作業ディレクトリのファイル権限を確認**
2. **ファイル操作前にパスが存在することを確認**
3. **ディスク容量を確認**

#### Web検索が機能しない

**問題**: Tavily API検索機能が失敗する。

**解決方法**:
1. **Tavily APIキーを設定**:
   - [Tavily](https://tavily.com/)からAPIキーを取得
   - 環境変数またはアプリ設定に追加
2. **インターネット接続を確認**

---

### 音声チャット（Nova Sonic）の問題

#### マイクアクセスが拒否される

**問題**: 音声チャットがマイクにアクセスできない。

**解決方法**:
1. **macOS**: システム環境設定 → プライバシーとセキュリティ → マイク → Bedrock Engineerを有効化
2. **Windows**: 設定 → プライバシー → マイク → アプリがマイクにアクセスすることを許可
3. **ブラウザ**: プロンプトが表示されたらマイクアクセスを許可

![マイク許可設定](./images/microphone-permissions.png)
*スクリーンショット: マイク許可設定 - macOS/Windowsのシステムマイク許可設定を示すスクリーンショットを追加*

#### 音声認識が機能しない

**問題**: 音声がテキストに変換されない。

**解決方法**:
1. **システム設定でマイクレベルを確認**
2. **マイクに近づいて話す**
3. **静かな環境で話す**
4. **音声チャット言語設定を変更**（利用可能な場合）

#### 音声品質が悪い

**問題**: 音声出力が歪んでいる、または不明瞭。

**解決方法**:
1. **システム音声設定を確認**
2. **オーディオドライバを更新**
3. **異なる音声オプションを試す**（Tiffany、Amy、Matthew）

---

### ウェブサイト生成の問題

#### プレビューが表示されない

**問題**: 生成されたウェブサイトプレビューが空白または読み込まれない。

**解決方法**:
1. **コンソールでJavaScriptエラーを確認**
2. **異なるフレームワークを試す**（React、Vue、Svelte）
3. **より明確な指示を提供**してコードを簡素化

#### ライブラリ読み込みエラー

**問題**: 外部ライブラリや依存関係の読み込みに失敗。

**解決方法**:
1. **CDNリソースのインターネット接続を確認**
2. **外部CSSフレームワークの代わりにインラインスタイリングを使用**
3. **ライブラリバージョンの互換性を確認**

#### Knowledge Base接続失敗

**問題**: Amazon Bedrock Knowledge Baseに接続できない。

**解決方法**:
1. **Knowledge Base IDが正しいことを確認**
2. **Knowledge BaseアクセスのIAM権限を確認**
3. **Knowledge Baseが同一AWSリージョンにあることを確認**

---

### ネットワーク・接続の問題

#### プロキシ設定

**問題**: アプリケーションが企業プロキシ経由で接続できない。

**解決方法**:
プロキシ環境変数を設定:
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

#### ファイアウォールによる接続ブロック

**問題**: ファイアウォールがAWSサービスへの接続をブロック。

**解決方法**:
1. **AWSドメインへのHTTPS送信トラフィックを許可**
2. **必要に応じてAWS IPレンジをホワイトリスト化**
3. **アプリケーションのファイアウォール例外を設定**

---

### パフォーマンスの問題

#### 高メモリ使用量

**問題**: アプリケーションが過度にRAMを消費。

**解決方法**:
1. **定期的にアプリケーションを再起動**
2. **定期的にチャット履歴をクリア**
3. **未使用機能を閉じる**（ウェブサイト生成など）
4. **同時操作を減らす**

#### 応答時間が遅い

**問題**: すべての操作が予想より遅い。

**解決方法**:
1. **システムリソースを確認**（CPU、メモリ、ディスク）
2. **利用可能な場合は軽量言語モデルを使用**
3. **ネットワーク接続を最適化**
4. **他のリソース集約的なアプリケーションを閉じる**

---

### データ・設定管理

#### チャット履歴のバックアップ

**解決方法**:
チャット履歴は以下に保存されます:
- **macOS**: `~/Library/Application Support/bedrock-engineer/`
- **Windows**: `%APPDATA%/bedrock-engineer/`
- **Linux**: `~/.config/bedrock-engineer/`

#### アプリケーション設定のリセット

**解決方法**:
設定ディレクトリを削除:
- **macOS**: `~/Library/Application Support/bedrock-engineer/`
- **Windows**: `%APPDATA%/bedrock-engineer/`
- **Linux**: `~/.config/bedrock-engineer/`

#### エージェント設定のエクスポート/インポート

**解決方法**:
エージェントカスタマイズインターフェースの「エージェントのエクスポート」および「エージェントのインポート」ボタンを使用。

---

### よくある質問（FAQ）

#### Q: サポートされている言語は？
A: 現在、英語と日本語をサポート。音声チャットは現在英語のみ。

#### Q: 使用コストは？
A: AWS Bedrockの使用料金のみ。[Amazon Bedrock料金](https://aws.amazon.com/jp/bedrock/pricing/)を参照。

#### Q: データは安全ですか？
A: はい、すべてのデータ処理はあなたのAWSアカウントを通じて行われます。AWS以外の第三者にデータは送信されません。

#### Q: カスタムモデルは使用できますか？
A: 現在はAmazon Bedrockで利用可能なモデルをサポート。カスタムモデルサポートは将来のバージョンで追加予定。

#### Q: なぜアプリケーションが大きいのですか？
A: 複数のAI機能が組み込まれたElectronアプリであり、相当なリソースが必要です。

---

## Contributing

If you encounter issues not covered in this guide, please:
1. Check the [GitHub Issues](https://github.com/aws-samples/bedrock-engineer/issues)
2. Create a new issue with detailed information
3. Consider contributing to this troubleshooting guide

このガイドで解決されない問題が発生した場合：
1. [GitHub Issues](https://github.com/aws-samples/bedrock-engineer/issues)を確認
2. 詳細情報を含む新しいissueを作成
3. このトラブルシューティングガイドへの貢献を検討