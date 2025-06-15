# Bedrock Engineer CLI

Bedrock EngineerのCLIインターフェースを使用すると、ターミナルからエージェントを選択してチャットできます。

## インストール

```
npm install -g bedrock-engineer
```

または、リポジトリをクローンして開発モードで使用：

```
git clone https://github.com/aws-samples/bedrock-engineer.git
cd bedrock-engineer
npm install
npm run build:cli
npm link
```

## 使い方

### エージェント一覧を表示

```
bedrock-cli agents
```

または詳細情報を表示：

```
bedrock-cli agents -v
```

### エージェントとチャット (準備中)

```
bedrock-cli chat --agent software-developer
```

指定したエージェントIDとチャットセッションを開始します。

### ヘルプを表示

```
bedrock-cli --help
```

## 設定

CLI設定は以下のパスに保存されます：

- Linux/Mac: `~/.bedrock-engineer/cli-config.json`
- Windows: `%USERPROFILE%\.bedrock-engineer\cli-config.json`

## 機能

- エージェント一覧表示
- エージェント選択とチャット (近日公開)
- チャット履歴の管理 (近日公開)
- プロジェクト設定管理 (近日公開)

## 開発

CLIツールの開発には以下のコマンドを使用します：

```
# 開発モードで実行
npm run dev:cli

# ビルド
npm run build:cli

# 実行
npm run cli
```
