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
    primaryColor: '#2563EB',
    secondaryColor: '#0EA5E9',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'Inter, Arial, sans-serif'
  },
  education: {
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    backgroundColor: '#F9FAFB',
    textColor: '#374151',
    fontFamily: 'Georgia, serif'
  },
  creative: {
    primaryColor: '#DC2626',
    secondaryColor: '#F59E0B',
    backgroundColor: '#FEF2F2',
    textColor: '#1F2937',
    fontFamily: 'Poppins, Arial, sans-serif'
  },
  simple: {
    primaryColor: '#6B7280',
    secondaryColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    fontFamily: 'Arial, sans-serif'
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
        title: 'プレゼンテーションタイトル',
        subtitle: 'サブタイトル・会社名',
        elements: [
          {
            id: 'title',
            type: 'text',
            position: { x: 15, y: 25 },
            size: { width: 70, height: 20 },
            props: {
              ...createDefaultTextProps(),
              content: 'プレゼンテーションタイトル',
              fontSize: 36,
              fontWeight: 'bold',
              align: 'center',
              color: themes.business.primaryColor
            }
          },
          {
            id: 'subtitle',
            type: 'text',
            position: { x: 15, y: 50 },
            size: { width: 70, height: 15 },
            props: {
              ...createDefaultTextProps(),
              content: 'サブタイトル・会社名',
              fontSize: 24,
              align: 'center',
              color: themes.business.textColor
            }
          },
          {
            id: 'date',
            type: 'text',
            position: { x: 15, y: 70 },
            size: { width: 70, height: 10 },
            props: {
              ...createDefaultTextProps(),
              content: new Date().toLocaleDateString('ja-JP'),
              fontSize: 16,
              align: 'center',
              color: themes.business.secondaryColor
            }
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: themes.business.backgroundColor
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
          {
            id: 'agenda-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'アジェンダ',
              fontSize: 32,
              fontWeight: 'bold',
              color: themes.business.primaryColor
            }
          },
          {
            id: 'agenda-list',
            type: 'list',
            position: { x: 15, y: 35 },
            size: { width: 70, height: 50 },
            props: {
              ...createDefaultListProps(),
              items: [
                { id: '1', text: '現状分析' },
                { id: '2', text: '課題の特定' },
                { id: '3', text: '解決策の提案' },
                { id: '4', text: '実施計画' },
                { id: '5', text: 'まとめ' }
              ],
              fontSize: 20,
              color: themes.business.textColor,
              spacing: 12
            }
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: themes.business.backgroundColor
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
          {
            id: 'content-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: 'メインコンテンツ',
              fontSize: 32,
              fontWeight: 'bold',
              color: themes.business.primaryColor
            }
          },
          {
            id: 'content-text',
            type: 'text',
            position: { x: 10, y: 35 },
            size: { width: 45, height: 40 },
            props: {
              ...createDefaultTextProps(),
              content:
                'ここにメインコンテンツの説明を記載します。重要なポイントを簡潔にまとめて伝えましょう。',
              fontSize: 18,
              lineHeight: 1.6
            }
          },
          {
            id: 'content-visual',
            type: 'shape',
            position: { x: 60, y: 35 },
            size: { width: 30, height: 40 },
            props: {
              ...createDefaultShapeProps(),
              shape: 'rectangle',
              fillColor: themes.business.secondaryColor,
              borderRadius: 8
            }
          }
        ],
        layout: {
          template: 'two-column',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: themes.business.backgroundColor
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
      {
        id: 'edu-title-slide',
        type: 'title',
        title: '学習テーマ',
        subtitle: '授業・講座名',
        elements: [
          {
            id: 'edu-title',
            type: 'text',
            position: { x: 10, y: 30 },
            size: { width: 80, height: 20 },
            props: {
              ...createDefaultTextProps(),
              content: '学習テーマ',
              fontSize: 38,
              fontWeight: 'bold',
              align: 'center',
              color: themes.education.primaryColor
            }
          },
          {
            id: 'edu-subtitle',
            type: 'text',
            position: { x: 10, y: 55 },
            size: { width: 80, height: 15 },
            props: {
              ...createDefaultTextProps(),
              content: '授業・講座名',
              fontSize: 22,
              align: 'center',
              color: themes.education.textColor
            }
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: themes.education.backgroundColor
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'edu-objectives-slide',
        type: 'content',
        title: '学習目標',
        elements: [
          {
            id: 'objectives-title',
            type: 'text',
            position: { x: 10, y: 15 },
            size: { width: 80, height: 12 },
            props: {
              ...createDefaultTextProps(),
              content: '学習目標',
              fontSize: 32,
              fontWeight: 'bold',
              color: themes.education.primaryColor
            }
          },
          {
            id: 'objectives-list',
            type: 'list',
            position: { x: 15, y: 35 },
            size: { width: 70, height: 50 },
            props: {
              ...createDefaultListProps(),
              items: [
                { id: '1', text: '基本概念の理解' },
                { id: '2', text: '実践的なスキルの習得' },
                { id: '3', text: '応用力の向上' }
              ],
              fontSize: 20,
              color: themes.education.textColor,
              spacing: 15
            }
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: themes.education.backgroundColor
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
      {
        id: 'simple-title-slide',
        type: 'title',
        title: 'シンプルタイトル',
        elements: [
          {
            id: 'simple-title',
            type: 'text',
            position: { x: 20, y: 40 },
            size: { width: 60, height: 20 },
            props: {
              ...createDefaultTextProps(),
              content: 'シンプルタイトル',
              fontSize: 40,
              fontWeight: 'bold',
              align: 'center',
              color: themes.simple.primaryColor
            }
          }
        ],
        layout: {
          template: 'title-and-content',
          padding: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        background: {
          type: 'color',
          color: themes.simple.backgroundColor
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'simple-content-slide',
        type: 'content',
        elements: [
          {
            id: 'simple-content',
            type: 'text',
            position: { x: 20, y: 30 },
            size: { width: 60, height: 40 },
            props: {
              ...createDefaultTextProps(),
              content: 'シンプルで分かりやすいコンテンツを心がけましょう。',
              fontSize: 24,
              align: 'center',
              lineHeight: 1.8,
              color: themes.simple.textColor
            }
          }
        ],
        layout: {
          template: 'free',
          padding: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        background: {
          type: 'color',
          color: themes.simple.backgroundColor
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
