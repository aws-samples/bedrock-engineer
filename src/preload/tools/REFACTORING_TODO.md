# Tools Module Refactoring TODO List

## 実装計画書

### 背景と目的

`tools.ts`と`toolService.ts`が煩雑になってきたため、以下の目的でリファクタリングを実施：

- コードの構造化と責任の分離
- 型安全性の向上
- エラーハンドリングとロギングの統一
- 拡張性と保守性の向上

### アーキテクチャ概要

```
/src/preload/tools/
├── base/              # 基底クラスと共通型
│   ├── types.ts       # 共通型定義
│   ├── errors.ts      # 統一エラークラス
│   └── BaseTool.ts    # 抽象基底クラス
├── common/            # 共通コンポーネント
│   ├── ChunkManager.ts # チャンク処理
│   ├── StoreManager.ts # ストアアクセス
│   └── Logger.ts      # ロギング
├── handlers/          # ツール実装
│   ├── filesystem/    # ファイルシステム関連
│   ├── bedrock/       # AWS Bedrock関連
│   ├── web/           # Web関連
│   ├── command/       # コマンド実行
│   ├── thinking/      # 思考ツール
│   └── mcp/           # MCP統合
├── registry.ts        # ツール登録システム
├── index.ts           # 新エントリーポイント
├── tools.ts           # 旧実装（互換性のため一時保持）
└── toolService.ts     # 旧実装（互換性のため一時保持）
```

### 実装方針

1. **段階的移行**: 既存機能を壊さないよう、新旧システムを共存させながら移行
2. **互換性レイヤー**: `executeTool`関数で新旧システムを自動切り替え
3. **統一インターフェース**: すべてのツールが`BaseTool`を継承
4. **依存性注入**: ツールは`ToolDependencies`を通じて共通機能にアクセス

### 各ツールの実装パターン

```typescript
export class XxxTool extends BaseTool<InputType, OutputType> {
  readonly name = 'toolName'
  readonly description = 'Tool description'

  protected validateInput(input: InputType): ValidationResult
  protected async executeInternal(input: InputType): Promise<OutputType>
  protected shouldReturnErrorAsString(): boolean // 互換性用
  protected sanitizeInputForLogging(input: InputType): any // ログ用
}
```

### 継続作業のための情報

- **現在の進捗**: Phase 2.4完了（34/40項目、85%）
- **次の作業**: Phase 2.2 - Bedrock関連ツールの移行
- **参考実装**:
  - シンプルなツール: `ThinkTool.ts`
  - ファイル操作: `WriteToFileTool.ts`
  - チャンク処理: `ReadFilesTool.ts`
  - 外部API連携: `TavilySearchTool.ts`
  - 複雑な状態管理: `ExecuteCommandTool.ts`

## Phase 1: 基盤整備 (Foundation)

### 1.1 ディレクトリ構造の作成

- [x] `/src/preload/tools/base/` ディレクトリ作成
- [x] `/src/preload/tools/common/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/filesystem/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/bedrock/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/web/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/command/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/thinking/` ディレクトリ作成
- [x] `/src/preload/tools/handlers/mcp/` ディレクトリ作成

### 1.2 基底クラスと共通型の実装

- [x] `base/types.ts` - 共通型定義
- [x] `base/errors.ts` - 統一エラークラス
- [x] `base/BaseTool.ts` - 抽象基底クラス

### 1.3 共通コンポーネントの実装

- [x] `common/ChunkManager.ts` - チャンク処理の統一管理
- [x] `common/StoreManager.ts` - ストアアクセスの統一管理
- [x] `common/Logger.ts` - ロギングヘルパー

### 1.4 ツールレジストリの実装

- [x] `registry.ts` - ツール登録・管理システム
- [x] `index.ts` - 新しいエントリーポイント

## Phase 2: 段階的移行 (Gradual Migration)

### 2.1 ファイルシステム関連ツール

- [x] `handlers/filesystem/CreateFolderTool.ts`
- [x] `handlers/filesystem/ReadFilesTool.ts`
- [x] `handlers/filesystem/WriteToFileTool.ts`
- [x] `handlers/filesystem/ApplyDiffEditTool.ts`
- [x] `handlers/filesystem/ListFilesTool.ts`
- [x] `handlers/filesystem/MoveFileTool.ts`
- [x] `handlers/filesystem/CopyFileTool.ts`
- [x] `handlers/filesystem/index.ts` - エクスポートとファクトリ関数

### 2.2 Bedrock関連ツール

- [x] `handlers/bedrock/GenerateImageTool.ts`
- [x] `handlers/bedrock/RecognizeImageTool.ts`
- [x] `handlers/bedrock/RetrieveTool.ts`
- [x] `handlers/bedrock/InvokeBedrockAgentTool.ts`
- [x] `handlers/bedrock/InvokeFlowTool.ts`
- [x] `handlers/bedrock/index.ts` - エクスポートとファクトリ関数

### 2.3 Web関連ツール

- [x] `handlers/web/TavilySearchTool.ts`
- [x] `handlers/web/FetchWebsiteTool.ts`
- [x] `handlers/web/index.ts` - エクスポートとファクトリ関数

### 2.4 その他のツール

- [x] `handlers/command/ExecuteCommandTool.ts`
- [x] `handlers/command/index.ts` - エクスポートとファクトリ関数
- [x] `handlers/thinking/ThinkTool.ts`
- [x] `handlers/thinking/index.ts` - エクスポートとファクトリ関数
- [x] `handlers/mcp/McpToolAdapter.ts`
- [x] `handlers/mcp/index.ts` - エクスポートとファクトリ関数

## Phase 3: 完全移行 (Complete Migration)

### 3.1 旧実装の削除

- [x] 旧 `tools.ts` の完全削除
- [x] 旧 `toolService.ts` の完全削除
- [x] すべてのインポートパスの更新

### 3.2 テストの更新

- [ ] 既存テストの動作確認
- [ ] 新しい構造に合わせたテストの更新
- [ ] 新規テストの追加

### 3.3 ドキュメントの更新

- [ ] README の更新
- [ ] 型定義の更新
- [ ] 使用例の更新

## 進捗管理

### 現在のステータス

- 開始日: 2025/01/24
- 現在のフェーズ: Phase 3.1 完了（完全移行達成）
- 完了項目: 43/45

### 注意事項

- 各ステップ完了後、必ず `npm run lint:fix` と `npm run typecheck` を実行
- 既存の機能を壊さないよう、段階的に移行
- テストを維持しながら作業を進める
