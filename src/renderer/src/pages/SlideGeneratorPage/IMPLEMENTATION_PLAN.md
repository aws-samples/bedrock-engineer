# SlideGeneratorPage 実装計画

## 概要

PowerPoint風のプレゼンテーション作成機能を実装する。AI生成によるスライド作成とWebプレビュー、エクスポート機能を提供。

## アーキテクチャ設計

### 1. ディレクトリ構造

```
src/renderer/src/pages/SlideGeneratorPage/
├── SlideGeneratorPage.tsx              # メインコンポーネント
├── IMPLEMENTATION_PLAN.md              # 実装計画（本ファイル）
├── TODO.md                            # TODOリスト
├── components/
│   ├── SlidePreview.tsx               # スライドプレビュー
│   ├── SlideNavigation.tsx            # スライド間ナビゲーション
│   ├── TemplateSelector.tsx           # テンプレート選択
│   ├── SlideEditor.tsx                # 個別スライド編集
│   ├── ElementEditor.tsx              # 要素編集
│   └── ExportButton.tsx               # ダウンロード機能
├── hooks/
│   ├── useSlideGenerator.tsx          # スライド生成ロジック
│   ├── useSlideNavigation.tsx         # ナビゲーション制御
│   └── useSlideEditor.tsx             # 編集機能
├── templates/
│   ├── templates.ts                   # テンプレート定義
│   └── defaultSlides.ts               # デフォルトスライド
├── types/
│   ├── slide.ts                       # スライド型定義
│   └── element.ts                     # 要素型定義
└── utils/
    ├── slideParser.ts                 # JSON→スライド変換
    ├── slideExporter.ts               # エクスポート機能
    └── slideValidator.ts              # スライド検証
```

### 2. 型システム設計

#### 基本Slide型

```typescript
interface Slide {
  id: string
  type: 'title' | 'content' | 'section' | 'conclusion'
  title?: string
  subtitle?: string
  elements: ContentElement[]
  layout: SlideLayout
  background?: BackgroundConfig
  notes?: string
}
```

#### ContentElement型

```typescript
interface ContentElement {
  id: string
  type: 'text' | 'image' | 'list' | 'chart' | 'shape' | 'table'
  position: { x: number; y: number } // 0-100%
  size: { width: number; height: number } // 0-100%
  zIndex?: number
  rotation?: number
  opacity?: number
  props: ElementProps
}
```

### 3. 主要機能

#### スライド生成機能

- AI Agent（slideGeneratorAgent）によるJSON構造出力
- テンプレートベースの初期スライド生成
- ユーザー入力からの自動スライド作成

#### プレビュー機能

- リアルタイムスライドプレビュー
- スライド間ナビゲーション（前へ/次へ）
- フルスクリーンプレゼンテーションモード

#### 編集機能

- 要素のドラッグ&ドロップ移動
- 要素のリサイズ
- テキスト・画像・リスト・チャートの編集
- レイヤー順序変更

#### エクスポート機能

- PDF出力（html2canvas + jsPDF）
- PowerPoint出力（pptxgen.js）
- HTML出力（standalone）

### 4. AI統合戦略

#### プロンプト設計

```
以下のJSON形式でスライドを生成してください：
{
  "presentation": {
    "title": "プレゼンテーションタイトル",
    "slides": [...]
  }
}
```

#### Agent設定

- `slideGeneratorAgent` を新規作成
- システムプロンプトでJSON出力を強制
- 既存のWebsiteGeneratorと同様のパターンで実装

### 5. 技術スタック

- **UI Framework**: React + TypeScript
- **スタイリング**: Tailwind CSS + Flowbite
- **状態管理**: React Context（SlideGeneratorContext）
- **スライドレンダリング**: CSS Grid + Absolute Positioning
- **エクスポート**: jsPDF, pptxgen.js, html2canvas
- **ドラッグ&ドロップ**: React DnD
- **アイコン**: React Icons

## 実装フェーズ

### Phase 1: 基盤構築

1. 型定義ファイル作成
2. 基本ページ構造作成
3. ルーティング設定
4. Context設定

### Phase 2: コア機能

1. テンプレートシステム
2. スライドプレビュー機能
3. 基本ナビゲーション
4. AI Agent統合

### Phase 3: 編集機能

1. 要素選択・移動・リサイズ
2. テキスト編集
3. 画像挿入
4. リスト・チャート編集

### Phase 4: エクスポート機能

1. PDF出力
2. PowerPoint出力
3. HTML出力

### Phase 5: 最適化・ポリッシュ

1. パフォーマンス最適化
2. ユーザビリティ改善
3. エラーハンドリング
4. テスト実装

## 注意事項

- コンテキスト長制限を考慮し、段階的実装を徹底
- 既存コードパターンとの一貫性を保持
- i18n対応を忘れずに実装
- エラーハンドリングを各段階で実装
- パフォーマンスを意識した実装
