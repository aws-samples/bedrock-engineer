import { Slide, PresentationTheme } from '../types/slide'
import {
  createDefaultTextProps,
  createDefaultListProps,
  createDefaultShapeProps
} from '../types/element'

export interface SlideTemplate {
  id: string
  name: string
  description: string
  category: 'business' | 'education' | 'creative' | 'simple'
  thumbnail?: string
  slides: Slide[]
  theme?: Partial<PresentationTheme>
}

// 共通のテーマ設定
export const themes = {
  business: {
    primaryColor: '#667EEA',
    secondaryColor: '#764BA2',
    backgroundColor: '#FFFFFF',
    textColor: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  education: {
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  creative: {
    primaryColor: '#DC2626',
    secondaryColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#FFFFFF',
    fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  simple: {
    primaryColor: '#6B7280',
    secondaryColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    textColor: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  }
}

// テンプレート定義
export const slideTemplates: SlideTemplate[] = [
  // ビジネスプレゼンテーション
  {
    id: 'business-presentation',
    name: 'ビジネスプレゼンテーション',
    description: '企業向けの標準的なプレゼンテーション',
    category: 'business',
    theme: themes.business,
    slides: [
      // タイトルスライド
      {
        id: 'title-slide',
        type: 'title',
        title: 'ビジネスプレゼンテーション',
        subtitle: 'プロフェッショナル・企業向け',
        elements: [
          // 背景装飾円形1
          {
            id: 'bg-circle-1',
            type: 'shape',
            position: { x: -5, y: -5 },
            size: { width: 35, height: 35 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.6
          },
          // 背景装飾円形2
          {
            id: 'bg-circle-2',
            type: 'shape',
            position: { x: 75, y: 70 },
            size: { width: 25, height: 25 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.4
          },
          // 背景装飾矩形
          {
            id: 'bg-rect',
            type: 'shape',
            position: { x: 60, y: 15 },
            size: { width: 45, height: 25 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 0,
              borderRadius: 20
            },
            zIndex: 1,
            opacity: 0.7,
            rotation: 15
          },
          // メインタイトル
          {
            id: 'main-title',
            type: 'text',
            position: { x: 8, y: 25 },
            size: { width: 84, height: 25 },
            props: {
              ...createDefaultTextProps(),
              content: 'ビジネスプレゼンテーション',
              fontSize: 52,
              fontWeight: 'bold',
              align: 'left',
              color: '#FFFFFF',
              lineHeight: 1.2,
              letterSpacing: -1
            },
            zIndex: 10
          },
          // サブタイトル
          {
            id: 'subtitle',
            type: 'text',
            position: { x: 8, y: 55 },
            size: { width: 60, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'プロフェッショナル・企業向けテンプレート',
              fontSize: 22,
              fontWeight: 'normal',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.4
            },
            zIndex: 10
          },
          // 日付
          {
            id: 'date',
            type: 'text',
            position: { x: 8, y: 75 },
            size: { width: 40, height: 8 },
            props: {
              ...createDefaultTextProps(),
              content: new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              fontSize: 16,
              fontWeight: 'lighter',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.7)'
            },
            zIndex: 10
          },
          // アクセント線
          {
            id: 'accent-line',
            type: 'shape',
            position: { x: 8, y: 50 },
            size: { width: 12, height: 0.5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#F59E0B',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 135,
            from: '#667EEA',
            to: '#764BA2'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // アジェンダスライド
      {
        id: 'agenda-slide',
        type: 'content',
        title: 'アジェンダ',
        elements: [
          // 背景装飾円形
          {
            id: 'bg-circle',
            type: 'shape',
            position: { x: 80, y: -10 },
            size: { width: 30, height: 30 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.5
          },
          // アクセント線
          {
            id: 'accent-line-top',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 8, height: 0.4 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#F59E0B',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'agenda-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'アジェンダ',
              fontSize: 38,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // リスト
          {
            id: 'agenda-list',
            type: 'list',
            position: { x: 15, y: 40 },
            size: { width: 70, height: 50 },
            props: {
              ...createDefaultListProps(),
              items: [
                { id: '1', text: '現状分析と市場調査' },
                { id: '2', text: '課題の特定と優先順位付け' },
                { id: '3', text: '解決策の提案と評価' },
                { id: '4', text: '実施計画とタイムライン' },
                { id: '5', text: 'まとめと次のステップ' }
              ],
              fontSize: 22,
              color: 'rgba(255, 255, 255, 0.95)',
              spacing: 15,
              lineHeight: 1.5
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 135,
            from: '#667EEA',
            to: '#764BA2'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // コンテンツスライド
      {
        id: 'content-slide',
        type: 'content',
        title: 'メインコンテンツ',
        elements: [
          // 背景装飾図形1
          {
            id: 'bg-shape-1',
            type: 'shape',
            position: { x: -10, y: 60 },
            size: { width: 20, height: 20 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.7
          },
          // 背景装飾図形2
          {
            id: 'bg-shape-2',
            type: 'shape',
            position: { x: 85, y: 10 },
            size: { width: 15, height: 15 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0,
              borderRadius: 8
            },
            zIndex: 1,
            opacity: 0.4,
            rotation: 25
          },
          // アクセント線
          {
            id: 'accent-line-content',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 8, height: 0.4 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#F59E0B',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'content-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'メインコンテンツ',
              fontSize: 38,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // コンテンツテキスト
          {
            id: 'content-text',
            type: 'text',
            position: { x: 10, y: 40 },
            size: { width: 45, height: 40 },
            props: {
              ...createDefaultTextProps(),
              content:
                '重要なビジネスポイントを効果的に伝えるための内容をここに記載します。\n\n• データドリブンなアプローチ\n• 戦略的思考と実行力\n• 継続的な改善と成長',
              fontSize: 20,
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.95)'
            },
            zIndex: 10
          },
          // ビジュアル要素
          {
            id: 'content-visual',
            type: 'shape',
            position: { x: 60, y: 35 },
            size: { width: 30, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderStyle: 'solid',
              borderRadius: 12
            },
            zIndex: 5
          },
          // ビジュアル内アイコン風
          {
            id: 'visual-icon',
            type: 'shape',
            position: { x: 72, y: 50 },
            size: { width: 6, height: 6 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#F59E0B',
              borderWidth: 0
            },
            zIndex: 6
          }
        ],
        layout: {
          template: 'two-column',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 135,
            from: '#667EEA',
            to: '#764BA2'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },

  // 教育用プレゼンテーション
  {
    id: 'education-presentation',
    name: '教育用プレゼンテーション',
    description: '教育・学習向けのプレゼンテーション',
    category: 'education',
    theme: themes.education,
    slides: [
      // タイトルスライド
      {
        id: 'edu-title-slide',
        type: 'title',
        title: '学習・教育プログラム',
        subtitle: '知識の探求と成長の旅',
        elements: [
          // 背景装飾円形1（本をイメージ）
          {
            id: 'bg-book-1',
            type: 'shape',
            position: { x: -8, y: -8 },
            size: { width: 40, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 0,
              borderRadius: 8
            },
            zIndex: 1,
            opacity: 0.6,
            rotation: 12
          },
          // 背景装飾円形2
          {
            id: 'bg-circle-edu',
            type: 'shape',
            position: { x: 78, y: 65 },
            size: { width: 28, height: 28 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.5
          },
          // 装飾的な三角形（学術的な印象）
          {
            id: 'bg-triangle',
            type: 'shape',
            position: { x: 65, y: 12 },
            size: { width: 20, height: 20 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'triangle',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.7,
            rotation: -15
          },
          // メインタイトル
          {
            id: 'edu-main-title',
            type: 'text',
            position: { x: 8, y: 22 },
            size: { width: 84, height: 28 },
            props: {
              ...createDefaultTextProps(),
              content: '学習・教育プログラム',
              fontSize: 50,
              fontWeight: 'bold',
              align: 'left',
              color: '#FFFFFF',
              lineHeight: 1.2,
              letterSpacing: -0.5
            },
            zIndex: 10
          },
          // サブタイトル
          {
            id: 'edu-subtitle',
            type: 'text',
            position: { x: 8, y: 55 },
            size: { width: 65, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: '知識の探求と成長の旅へようこそ',
              fontSize: 24,
              fontWeight: 'normal',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.4
            },
            zIndex: 10
          },
          // 日付・セッション情報
          {
            id: 'edu-session-info',
            type: 'text',
            position: { x: 8, y: 75 },
            size: { width: 50, height: 8 },
            props: {
              ...createDefaultTextProps(),
              content: `${new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} セッション`,
              fontSize: 16,
              fontWeight: 'lighter',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.75)'
            },
            zIndex: 10
          },
          // アクセント線（グリーン）
          {
            id: 'edu-accent-line',
            type: 'shape',
            position: { x: 8, y: 50 },
            size: { width: 15, height: 0.6 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#10B981',
              borderWidth: 0,
              borderRadius: 3
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 120,
            from: '#059669',
            to: '#047857'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 学習目標スライド
      {
        id: 'edu-objectives-slide',
        type: 'content',
        title: '学習目標',
        elements: [
          // 背景装飾要素1
          {
            id: 'bg-edu-shape-1',
            type: 'shape',
            position: { x: -5, y: 70 },
            size: { width: 18, height: 18 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 0,
              borderRadius: 4
            },
            zIndex: 1,
            opacity: 0.6,
            rotation: 20
          },
          // 背景装飾要素2
          {
            id: 'bg-edu-shape-2',
            type: 'shape',
            position: { x: 82, y: 5 },
            size: { width: 22, height: 22 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.4
          },
          // アクセント線
          {
            id: 'edu-objectives-accent',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 10, height: 0.5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#10B981',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'objectives-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: '学習目標',
              fontSize: 38,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // 学習目標リスト
          {
            id: 'objectives-list',
            type: 'list',
            position: { x: 15, y: 40 },
            size: { width: 70, height: 50 },
            props: {
              ...createDefaultListProps(),
              items: [
                { id: '1', text: '基本概念の理解と知識の定着' },
                { id: '2', text: '実践的なスキルの習得と応用' },
                { id: '3', text: '批判的思考力の向上' },
                { id: '4', text: '問題解決能力の育成' },
                { id: '5', text: '継続学習への意欲向上' }
              ],
              fontSize: 22,
              color: 'rgba(255, 255, 255, 0.95)',
              spacing: 12,
              lineHeight: 1.5
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 120,
            from: '#059669',
            to: '#047857'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // コンテンツスライド
      {
        id: 'edu-content-slide',
        type: 'content',
        title: '学習内容',
        elements: [
          // 背景装飾（ノートブック風）
          {
            id: 'bg-notebook',
            type: 'shape',
            position: { x: -12, y: 45 },
            size: { width: 25, height: 35 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderStyle: 'solid',
              borderRadius: 6
            },
            zIndex: 1,
            opacity: 0.7,
            rotation: -8
          },
          // 背景装飾（電球アイコン風）
          {
            id: 'bg-lightbulb',
            type: 'shape',
            position: { x: 85, y: 8 },
            size: { width: 16, height: 16 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.5
          },
          // アクセント線
          {
            id: 'edu-content-accent',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 10, height: 0.5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#10B981',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'content-title-edu',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: '学習内容',
              fontSize: 38,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // 左カラム：テキスト内容
          {
            id: 'edu-content-text',
            type: 'text',
            position: { x: 10, y: 40 },
            size: { width: 45, height: 40 },
            props: {
              ...createDefaultTextProps(),
              content:
                '効果的な学習を実現するために重要な要素を探ります。\n\n📚 理論と実践の統合\n🎯 個別学習スタイルの理解\n💡 創造的思考の促進\n🤝 協働学習の重要性',
              fontSize: 20,
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.95)'
            },
            zIndex: 10
          },
          // 右カラム：ビジュアル要素
          {
            id: 'edu-visual-container',
            type: 'shape',
            position: { x: 60, y: 35 },
            size: { width: 30, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.25)',
              borderStyle: 'solid',
              borderRadius: 15
            },
            zIndex: 5
          },
          // ビジュアル内要素1
          {
            id: 'edu-visual-icon-1',
            type: 'shape',
            position: { x: 68, y: 45 },
            size: { width: 5, height: 5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#10B981',
              borderWidth: 0
            },
            zIndex: 6
          },
          // ビジュアル内要素2
          {
            id: 'edu-visual-icon-2',
            type: 'shape',
            position: { x: 78, y: 55 },
            size: { width: 5, height: 5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#10B981',
              borderWidth: 0
            },
            zIndex: 6
          },
          // ビジュアル内要素3
          {
            id: 'edu-visual-icon-3',
            type: 'shape',
            position: { x: 73, y: 65 },
            size: { width: 5, height: 5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#10B981',
              borderWidth: 0
            },
            zIndex: 6
          }
        ],
        layout: {
          template: 'two-column',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 120,
            from: '#059669',
            to: '#047857'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },

  // クリエイティブプレゼンテーション
  {
    id: 'creative-presentation',
    name: 'クリエイティブプレゼンテーション',
    description: '創造性と革新性を表現するダイナミックなデザイン',
    category: 'creative',
    theme: themes.creative,
    slides: [
      // タイトルスライド
      {
        id: 'creative-title-slide',
        type: 'title',
        title: 'クリエイティブ・イノベーション',
        subtitle: 'アイデアが世界を変える',
        elements: [
          // 背景装飾星形1
          {
            id: 'bg-star-1',
            type: 'shape',
            position: { x: -10, y: -8 },
            size: { width: 35, height: 35 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'star',
              fillColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.7,
            rotation: 25
          },
          // 背景装飾ダイアモンド
          {
            id: 'bg-diamond',
            type: 'shape',
            position: { x: 80, y: 65 },
            size: { width: 30, height: 30 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'diamond',
              fillColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.6,
            rotation: 45
          },
          // 背景装飾三角形群
          {
            id: 'bg-triangle-1',
            type: 'shape',
            position: { x: 65, y: 8 },
            size: { width: 18, height: 18 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'triangle',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.8,
            rotation: -30
          },
          {
            id: 'bg-triangle-2',
            type: 'shape',
            position: { x: 75, y: 18 },
            size: { width: 12, height: 12 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'triangle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.6,
            rotation: 60
          },
          // メインタイトル
          {
            id: 'creative-main-title',
            type: 'text',
            position: { x: 8, y: 20 },
            size: { width: 84, height: 30 },
            props: {
              ...createDefaultTextProps(),
              content: 'クリエイティブ・イノベーション',
              fontSize: 54,
              fontWeight: 'bold',
              align: 'left',
              color: '#FFFFFF',
              lineHeight: 1.1,
              letterSpacing: -1.5
            },
            zIndex: 10
          },
          // サブタイトル
          {
            id: 'creative-subtitle',
            type: 'text',
            position: { x: 8, y: 55 },
            size: { width: 70, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'アイデアが世界を変える力となる',
              fontSize: 26,
              fontWeight: 'normal',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.3
            },
            zIndex: 10
          },
          // 日付・イベント情報
          {
            id: 'creative-event-info',
            type: 'text',
            position: { x: 8, y: 75 },
            size: { width: 50, height: 8 },
            props: {
              ...createDefaultTextProps(),
              content: `${new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} クリエイティブセッション`,
              fontSize: 16,
              fontWeight: 'lighter',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.8)'
            },
            zIndex: 10
          },
          // アクセント線（オレンジ）
          {
            id: 'creative-accent-line',
            type: 'shape',
            position: { x: 8, y: 50 },
            size: { width: 18, height: 0.8 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#F59E0B',
              borderWidth: 0,
              borderRadius: 4
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 45,
            from: '#DC2626',
            to: '#EA580C'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // アイデア・コンセプトスライド
      {
        id: 'creative-ideas-slide',
        type: 'content',
        title: 'アイデア・コンセプト',
        elements: [
          // 背景装飾（創造的なパターン）
          {
            id: 'bg-creative-pattern-1',
            type: 'shape',
            position: { x: -8, y: 60 },
            size: { width: 25, height: 25 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'star',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.5,
            rotation: -20
          },
          {
            id: 'bg-creative-pattern-2',
            type: 'shape',
            position: { x: 85, y: 5 },
            size: { width: 20, height: 20 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'diamond',
              fillColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.6,
            rotation: 30
          },
          // アクセント線
          {
            id: 'creative-ideas-accent',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 12, height: 0.6 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#F59E0B',
              borderWidth: 0,
              borderRadius: 3
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'ideas-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'アイデア・コンセプト',
              fontSize: 40,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // アイデアリスト
          {
            id: 'ideas-list',
            type: 'list',
            position: { x: 15, y: 40 },
            size: { width: 70, height: 50 },
            props: {
              ...createDefaultListProps(),
              items: [
                { id: '1', text: '🎨 デザイン思考によるアプローチ' },
                { id: '2', text: '💡 ブレインストーミングと発想法' },
                { id: '3', text: '🚀 プロトタイピングと実験' },
                { id: '4', text: '🔄 反復的改善プロセス' },
                { id: '5', text: '✨ イノベーションの創出' }
              ],
              fontSize: 22,
              color: 'rgba(255, 255, 255, 0.95)',
              spacing: 14,
              lineHeight: 1.5
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 45,
            from: '#DC2626',
            to: '#EA580C'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // クリエイティブプロセススライド
      {
        id: 'creative-process-slide',
        type: 'content',
        title: 'クリエイティブプロセス',
        elements: [
          // 背景装飾（アートブラシ風）
          {
            id: 'bg-brush-stroke',
            type: 'shape',
            position: { x: -15, y: 40 },
            size: { width: 30, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0,
              borderRadius: 15
            },
            zIndex: 1,
            opacity: 0.7,
            rotation: -12
          },
          // 背景装飾（クリエイティブツール風）
          {
            id: 'bg-creative-tool',
            type: 'shape',
            position: { x: 88, y: 8 },
            size: { width: 15, height: 15 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderStyle: 'solid'
            },
            zIndex: 1,
            opacity: 0.6
          },
          // アクセント線
          {
            id: 'creative-process-accent',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 12, height: 0.6 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#F59E0B',
              borderWidth: 0,
              borderRadius: 3
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'process-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'クリエイティブプロセス',
              fontSize: 40,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // 左カラム：プロセス説明
          {
            id: 'process-content',
            type: 'text',
            position: { x: 10, y: 40 },
            size: { width: 45, height: 40 },
            props: {
              ...createDefaultTextProps(),
              content:
                '創造的なアイデアを形にするためのプロセスを探ります。\n\n🎯 問題の定義と理解\n🌟 アイデアの発散と収束\n🛠️ プロトタイプの作成\n📊 検証と改善',
              fontSize: 20,
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.95)'
            },
            zIndex: 10
          },
          // 右カラム：ビジュアル要素
          {
            id: 'process-visual-container',
            type: 'shape',
            position: { x: 60, y: 35 },
            size: { width: 30, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderStyle: 'solid',
              borderRadius: 18
            },
            zIndex: 5
          },
          // ビジュアル内装飾1（星）
          {
            id: 'process-visual-star',
            type: 'shape',
            position: { x: 68, y: 45 },
            size: { width: 6, height: 6 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'star',
              fillColor: '#F59E0B',
              borderWidth: 0
            },
            zIndex: 6
          },
          // ビジュアル内装飾2（ダイアモンド）
          {
            id: 'process-visual-diamond',
            type: 'shape',
            position: { x: 78, y: 55 },
            size: { width: 5, height: 5 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'diamond',
              fillColor: '#F59E0B',
              borderWidth: 0
            },
            zIndex: 6
          },
          // ビジュアル内装飾3（円）
          {
            id: 'process-visual-circle',
            type: 'shape',
            position: { x: 73, y: 65 },
            size: { width: 4, height: 4 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#F59E0B',
              borderWidth: 0
            },
            zIndex: 6
          }
        ],
        layout: {
          template: 'two-column',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 45,
            from: '#DC2626',
            to: '#EA580C'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  },

  // シンプルプレゼンテーション
  {
    id: 'simple-presentation',
    name: 'シンプルプレゼンテーション',
    description: 'ミニマルで洗練されたデザイン',
    category: 'simple',
    theme: themes.simple,
    slides: [
      // タイトルスライド
      {
        id: 'simple-title-slide',
        type: 'title',
        title: 'ミニマル・エレガンス',
        subtitle: '洗練されたシンプルなデザイン',
        elements: [
          // 背景装飾円形1（ミニマル）
          {
            id: 'bg-minimal-circle-1',
            type: 'shape',
            position: { x: -12, y: -12 },
            size: { width: 50, height: 50 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.5
          },
          // 背景装飾円形2
          {
            id: 'bg-minimal-circle-2',
            type: 'shape',
            position: { x: 85, y: 75 },
            size: { width: 25, height: 25 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.12)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.4
          },
          // ミニマル装飾矩形
          {
            id: 'bg-minimal-rect',
            type: 'shape',
            position: { x: 70, y: 8 },
            size: { width: 20, height: 20 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0,
              borderRadius: 6
            },
            zIndex: 1,
            opacity: 0.6,
            rotation: 20
          },
          // メインタイトル
          {
            id: 'simple-main-title',
            type: 'text',
            position: { x: 8, y: 28 },
            size: { width: 84, height: 25 },
            props: {
              ...createDefaultTextProps(),
              content: 'ミニマル・エレガンス',
              fontSize: 48,
              fontWeight: 'bold',
              align: 'left',
              color: '#FFFFFF',
              lineHeight: 1.2,
              letterSpacing: -0.8
            },
            zIndex: 10
          },
          // サブタイトル
          {
            id: 'simple-subtitle',
            type: 'text',
            position: { x: 8, y: 58 },
            size: { width: 65, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: '洗練されたシンプルなデザインの美学',
              fontSize: 22,
              fontWeight: 'normal',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.4
            },
            zIndex: 10
          },
          // 日付・イベント情報
          {
            id: 'simple-event-info',
            type: 'text',
            position: { x: 8, y: 78 },
            size: { width: 50, height: 8 },
            props: {
              ...createDefaultTextProps(),
              content: `${new Date().toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} プレゼンテーション`,
              fontSize: 16,
              fontWeight: 'lighter',
              align: 'left',
              color: 'rgba(255, 255, 255, 0.7)'
            },
            zIndex: 10
          },
          // アクセント線（シンプル）
          {
            id: 'simple-accent-line',
            type: 'shape',
            position: { x: 8, y: 53 },
            size: { width: 14, height: 0.4 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#9CA3AF',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 160,
            from: '#6B7280',
            to: '#4B5563'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // コンテンツスライド
      {
        id: 'simple-content-slide',
        type: 'content',
        title: 'シンプルな美学',
        elements: [
          // 背景装飾（ミニマル）
          {
            id: 'bg-simple-shape-1',
            type: 'shape',
            position: { x: -8, y: 65 },
            size: { width: 22, height: 22 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.5
          },
          {
            id: 'bg-simple-shape-2',
            type: 'shape',
            position: { x: 88, y: 12 },
            size: { width: 16, height: 16 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 0,
              borderRadius: 4
            },
            zIndex: 1,
            opacity: 0.4,
            rotation: 25
          },
          // アクセント線
          {
            id: 'simple-content-accent',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 8, height: 0.4 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#9CA3AF',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'simple-content-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'シンプルな美学',
              fontSize: 36,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // 左カラム：コンテンツ
          {
            id: 'simple-main-content',
            type: 'text',
            position: { x: 10, y: 40 },
            size: { width: 45, height: 40 },
            props: {
              ...createDefaultTextProps(),
              content:
                'シンプルさの中にある洗練された美しさを探求します。\n\n✨ 本質的な要素への集中\n🎯 無駄を削ぎ落とした機能美\n🔍 細部への繊細なこだわり\n💫 静謐で力強い表現力',
              fontSize: 20,
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.9)'
            },
            zIndex: 10
          },
          // 右カラム：ビジュアル要素（ミニマル）
          {
            id: 'simple-visual-container',
            type: 'shape',
            position: { x: 60, y: 35 },
            size: { width: 30, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderStyle: 'solid',
              borderRadius: 12
            },
            zIndex: 5
          },
          // ビジュアル内要素1（シンプル）
          {
            id: 'simple-visual-dot-1',
            type: 'shape',
            position: { x: 70, y: 48 },
            size: { width: 3, height: 3 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#9CA3AF',
              borderWidth: 0
            },
            zIndex: 6
          },
          // ビジュアル内要素2
          {
            id: 'simple-visual-dot-2',
            type: 'shape',
            position: { x: 78, y: 58 },
            size: { width: 3, height: 3 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: '#9CA3AF',
              borderWidth: 0
            },
            zIndex: 6
          },
          // ビジュアル内要素3
          {
            id: 'simple-visual-line',
            type: 'shape',
            position: { x: 68, y: 62 },
            size: { width: 14, height: 0.2 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#9CA3AF',
              borderWidth: 0,
              borderRadius: 1
            },
            zIndex: 6
          }
        ],
        layout: {
          template: 'two-column',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 160,
            from: '#6B7280',
            to: '#4B5563'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // まとめスライド
      {
        id: 'simple-summary-slide',
        type: 'content',
        title: 'エッセンス',
        elements: [
          // 背景装飾（中央配置）
          {
            id: 'bg-summary-circle',
            type: 'shape',
            position: { x: 85, y: 20 },
            size: { width: 18, height: 18 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'circle',
              fillColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 0
            },
            zIndex: 1,
            opacity: 0.6
          },
          // アクセント線
          {
            id: 'summary-accent',
            type: 'shape',
            position: { x: 10, y: 28 },
            size: { width: 8, height: 0.4 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: '#9CA3AF',
              borderWidth: 0,
              borderRadius: 2
            },
            zIndex: 10
          },
          // タイトル
          {
            id: 'summary-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'エッセンス',
              fontSize: 36,
              fontWeight: 'bold',
              color: '#FFFFFF',
              align: 'left'
            },
            zIndex: 10
          },
          // 中央配置テキスト
          {
            id: 'summary-content',
            type: 'text',
            position: { x: 15, y: 45 },
            size: { width: 70, height: 30 },
            props: {
              ...createDefaultTextProps(),
              content:
                'シンプルさは究極の洗練である\n\n真の美しさは、何を加えるかではなく\n何を取り除くかによって決まる',
              fontSize: 24,
              align: 'center',
              lineHeight: 1.8,
              color: 'rgba(255, 255, 255, 0.9)'
            },
            zIndex: 10
          }
        ],
        layout: {
          template: 'free',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'gradient',
          gradient: {
            direction: 160,
            from: '#6B7280',
            to: '#4B5563'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }
]

// テンプレート検索・フィルター関数
export const getTemplatesByCategory = (category: SlideTemplate['category']): SlideTemplate[] => {
  return slideTemplates.filter((template) => template.category === category)
}

export const getTemplateById = (id: string): SlideTemplate | undefined => {
  return slideTemplates.find((template) => template.id === id)
}

export const getAllCategories = (): SlideTemplate['category'][] => {
  return ['business', 'education', 'creative', 'simple']
}

export const getCategoryDisplayName = (category: SlideTemplate['category']): string => {
  const categoryNames = {
    business: 'ビジネス',
    education: '教育',
    creative: 'クリエイティブ',
    simple: 'シンプル'
  }
  return categoryNames[category]
}
