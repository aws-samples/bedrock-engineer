# MCP サーバー設定

Model Context Protocol (MCP) クライアント統合により、Bedrock Engineerは外部のMCPサーバーに接続し、強力な外部ツールを動的にロードして使用することができます。この統合により、AIアシスタントがMCPサーバーが提供するツールにアクセスして利用できるようになり、その能力が拡張されます。

## 設定形式

MCP サーバーの設定は、Claude Desktop互換の`claude_desktop_config.json`形式を使用します。設定はエージェント編集モーダルの「MCPサーバー」セクションから行うことができます。

MCP サーバーは以下の2つの形式で設定できます：

### 1. コマンド形式（ローカルサーバー）

```json
{
  "mcpServers": {
    "サーバー名": {
      "command": "実行コマンド",
      "args": ["引数1", "引数2"],
      "env": {
        "環境変数名": "値"
      }
    }
  }
}
```

### 2. URL形式（リモートサーバー）

```json
{
  "mcpServers": {
    "サーバー名": {
      "url": "https://example.com/mcp-endpoint"
    }
  }
}
```

## 設定例

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "~/"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "DeepWiki": {
      "url": "https://mcp.deepwiki.com/sse"
    }
  }
}
```

## よく使用されるMCPサーバー

- **fetch**: Web上のコンテンツを取得するツール
- **filesystem**: ファイルシステム操作ツール
- **DeepWiki**: ナレッジベース検索ツール
- **git**: Git操作ツール
- **postgres**: PostgreSQLデータベース操作ツール

## 設定手順

1. エージェント編集モーダルを開く
2. 「MCPサーバー」タブを選択
3. 「新しいMCPサーバーを追加」ボタンをクリック
4. 上記のJSON形式で設定を入力
5. 「接続テスト」で接続をテスト
6. 設定を保存

## トラブルシューティング

**接続エラーが発生する場合：**
- コマンドパスが正しいか確認
- 必要な依存関係がインストールされているか確認
- 環境変数が正しく設定されているか確認

**設定エラーが発生する場合：**
- JSON形式が正しいか確認
- `mcpServers`オブジェクトが含まれているか確認
- サーバー名が重複していないか確認