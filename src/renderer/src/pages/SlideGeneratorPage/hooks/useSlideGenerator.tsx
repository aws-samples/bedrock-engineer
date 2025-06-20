import { useCallback, useMemo, useState, useEffect } from 'react'
import { Slide, PresentationTheme } from '../types/slide'
import { ContentElement } from '../types/slide'
import {
  createDefaultTextProps,
  createDefaultListProps,
  createDefaultShapeProps
} from '../types/element'
import useSetting from '@renderer/hooks/useSetting'
import { useAgentChat } from '../../ChatPage/hooks/useAgentChat'
import { DEFAULT_AGENTS } from '../../ChatPage/constants/DEFAULT_AGENTS'
import { useStreamingJsonParser } from './useStreamingJsonParser'
interface SlideGenerationRequest {
  content: string
  slideCount?: number
  theme?: PresentationTheme
  presentationTitle?: string
  selectedTemplate?: any // SlideTemplate type from templates
}

interface UseSlideGeneratorReturn {
  generating: boolean
  error: string | null
  messages: any[]
  generateSlides: (request: SlideGenerationRequest) => Promise<void>
  clearError: () => void
  getLatestResponseText: () => string
  parseAIResponse: (aiResponse: string, theme: PresentationTheme, selectedTemplate?: any) => Slide[]
  // ストリーミング関連の新しいプロパティ
  streamingSlides: Slide[]
  isStreamingComplete: boolean
  resetStreamingParser: () => void
}

export const useSlideGenerator = (): UseSlideGeneratorReturn => {
  const { currentLLM } = useSetting()

  // ストリーミング状態管理
  const [currentTheme, setCurrentTheme] = useState<PresentationTheme | null>(null)
  const [currentTemplate, setCurrentTemplate] = useState<any>(null)

  // SlideGeneratorAgentのシステムプロンプトを取得
  const systemPrompt = useMemo(() => {
    const slideAgent = DEFAULT_AGENTS.find((agent) => agent.id === 'slideGeneratorAgent')
    return slideAgent?.system || ''
  }, [])

  // useAgentChatを使用してAIチャット機能を利用
  const {
    messages,
    loading: generating,
    handleSubmit,
    clearChat
  } = useAgentChat(
    currentLLM.modelId,
    systemPrompt,
    'slideGeneratorAgent',
    undefined, // sessionId
    { enableHistory: false } // スライド生成では履歴を保存しない
  )

  // ストリーミングJSONパーサーの設定
  const {
    parseStreamingText,
    parsedSlides: streamingSlides,
    isParsingComplete: isStreamingComplete,
    resetParser: resetStreamingParser
  } = useStreamingJsonParser({
    onSlideDetected: useCallback((slide: Slide, index: number, isComplete: boolean) => {
      console.log(`Slide ${index + 1} detected:`, slide.title, { isComplete })
    }, []),
    onParsingComplete: useCallback((slides: Slide[]) => {
      console.log('All slides parsed:', slides.length)
    }, []),
    onError: useCallback((error: Error) => {
      console.error('Streaming parse error:', error)
    }, []),
    theme: currentTheme || {
      id: 'default',
      name: 'Default',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      fontFamily: 'Inter, sans-serif',
      fontSize: { title: 32, subtitle: 24, body: 16 }
    },
    selectedTemplate: currentTemplate
  })

  const clearError = useCallback(() => {
    clearChat()
    resetStreamingParser()
  }, [clearChat, resetStreamingParser])

  const parseAIResponse = useCallback(
    (aiResponse: string, theme: PresentationTheme, selectedTemplate?: any): Slide[] => {
      try {
        // AIレスポンスからJSONを抽出（マークダウンコードブロックを除去）
        let jsonString = aiResponse.trim()

        // ```json で始まり ``` で終わる場合は、その部分を抽出
        const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim()
        }

        // AIレスポンスをJSONとして解析
        const parsed = JSON.parse(jsonString)

        if (!parsed.slides || !Array.isArray(parsed.slides)) {
          throw new Error('Invalid AI response format')
        }

        return parsed.slides.map((slideData: any, index: number) => {
          console.log(
            'Processing slide',
            index,
            'with selectedTemplate:',
            selectedTemplate?.name || 'none'
          )

          // テンプレートの背景設定を取得
          let slideBackground = {
            type: 'color' as const,
            color: theme.backgroundColor
          }

          // テンプレートの装飾要素を取得
          let templateElements: ContentElement[] = []

          // 選択されたテンプレートがある場合、そのテンプレートの設定を使用
          if (selectedTemplate && selectedTemplate.slides && selectedTemplate.slides[0]) {
            console.log('Selected template has', selectedTemplate.slides.length, 'slides')
            const templateSlide =
              selectedTemplate.slides[Math.min(index, selectedTemplate.slides.length - 1)]

            console.log(
              'Using template slide',
              Math.min(index, selectedTemplate.slides.length - 1),
              'for content slide',
              index
            )

            // 背景設定を適用
            if (templateSlide.background) {
              slideBackground = templateSlide.background
              console.log('Applied background:', slideBackground)
            }

            // テンプレートの装飾要素を取得（背景装飾、アクセント線など）
            if (templateSlide.elements) {
              console.log(
                'Template slide elements:',
                templateSlide.elements.map((e) => ({ id: e.id, type: e.type, zIndex: e.zIndex }))
              )

              templateElements = templateSlide.elements
                .filter((element: any) => {
                  // 装飾要素のみを抽出（条件を緩和）
                  const isBackgroundElement = element.id?.includes('bg-')
                  const isAccentElement = element.id?.includes('accent-')
                  const isDecorationElement =
                    element.type === 'shape' && (element.zIndex == null || element.zIndex <= 5)

                  // コンテンツ要素は除外（main-title, subtitle, content-title, etc.）
                  const isContentElement =
                    element.id?.includes('main-title') ||
                    element.id?.includes('subtitle') ||
                    element.id?.includes('content-title') ||
                    element.id?.includes('content-text') ||
                    element.id?.includes('content-list') ||
                    element.id?.includes('date')

                  const shouldInclude =
                    (isBackgroundElement || isAccentElement || isDecorationElement) &&
                    !isContentElement

                  console.log(
                    `Element ${element.id}: bg=${isBackgroundElement}, accent=${isAccentElement}, decoration=${isDecorationElement}, content=${isContentElement}, include=${shouldInclude}`
                  )

                  return shouldInclude
                })
                .map((element: any, elemIndex: number) => ({
                  ...element,
                  id: `template-${element.id}-${Date.now()}-${elemIndex}` // IDを更新
                }))

              console.log(
                'Filtered template elements:',
                templateElements.length,
                templateElements.map((e) => e.id)
              )
            }
          }

          const slide: Slide = {
            id: `slide-${Date.now()}-${index}`,
            type: slideData.type || 'content',
            title: slideData.title,
            subtitle: slideData.subtitle,
            elements: [],
            layout: {
              template: slideData.layout || 'title-and-content',
              padding: { top: 5, right: 5, bottom: 5, left: 5 }
            },
            background: slideBackground,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          // まずテンプレートの装飾要素を追加
          slide.elements = [...templateElements]

          // 次にコンテンツ要素を生成して追加
          let contentElements: ContentElement[] = []

          if (slideData.elements && Array.isArray(slideData.elements)) {
            contentElements = slideData.elements.map((elementData: any, elemIndex: number) => {
              const element: ContentElement = {
                id: `content-${Date.now()}-${index}-${elemIndex}`,
                type: elementData.type || 'text',
                position: elementData.position || { x: 10, y: 30 },
                size: elementData.size || { width: 80, height: 40 },
                props: createElementProps(elementData, theme),
                zIndex: 10 // コンテンツは前面に
              }
              return element
            })
          } else {
            // デフォルト要素を作成
            if (slide.type === 'title') {
              contentElements = createTitleSlideElements(slideData, theme)
            } else {
              contentElements = createContentSlideElements(slideData, theme)
            }
          }

          // コンテンツ要素を追加
          slide.elements.push(...contentElements)

          return slide
        })
      } catch (err) {
        console.error('Failed to parse AI response:', err)
        return createFallbackSlides(theme)
      }
    },
    []
  )

  const createElementProps = (elementData: any, theme: PresentationTheme) => {
    switch (elementData.type) {
      case 'text':
        return {
          ...createDefaultTextProps(),
          content: elementData.content || '',
          fontSize: elementData.fontSize || theme.fontSize.body,
          fontFamily: elementData.fontFamily || theme.fontFamily,
          color: elementData.color || theme.textColor,
          align: elementData.align || 'left',
          fontWeight: elementData.fontWeight || 'normal'
        }

      case 'list':
        return {
          ...createDefaultListProps(),
          items: elementData.items || [],
          fontSize: elementData.fontSize || theme.fontSize.body,
          fontFamily: elementData.fontFamily || theme.fontFamily,
          color: elementData.color || theme.textColor,
          listType: elementData.listType || 'bullet'
        }

      case 'shape':
        return {
          ...createDefaultShapeProps(),
          shape: elementData.shape || 'rectangle',
          fillColor: elementData.fillColor || theme.primaryColor,
          borderColor: elementData.borderColor || theme.secondaryColor
        }

      default:
        return createDefaultTextProps()
    }
  }

  const createTitleSlideElements = (slideData: any, theme: PresentationTheme): ContentElement[] => {
    const elements: ContentElement[] = []

    // タイトル要素
    if (slideData.title) {
      elements.push({
        id: `title-${Date.now()}`,
        type: 'text',
        position: { x: 10, y: 25 },
        size: { width: 80, height: 20 },
        props: {
          ...createDefaultTextProps(),
          content: slideData.title,
          fontSize: theme.fontSize.title,
          fontWeight: 'bold',
          align: 'center',
          color: theme.primaryColor
        }
      })
    }

    // サブタイトル要素
    if (slideData.subtitle) {
      elements.push({
        id: `subtitle-${Date.now()}`,
        type: 'text',
        position: { x: 10, y: 50 },
        size: { width: 80, height: 15 },
        props: {
          ...createDefaultTextProps(),
          content: slideData.subtitle,
          fontSize: theme.fontSize.subtitle,
          align: 'center',
          color: theme.textColor
        }
      })
    }

    return elements
  }

  const createContentSlideElements = (
    slideData: any,
    theme: PresentationTheme
  ): ContentElement[] => {
    const elements: ContentElement[] = []

    // タイトル要素
    if (slideData.title) {
      elements.push({
        id: `content-title-${Date.now()}`,
        type: 'text',
        position: { x: 10, y: 15 },
        size: { width: 80, height: 12 },
        props: {
          ...createDefaultTextProps(),
          content: slideData.title,
          fontSize: theme.fontSize.subtitle,
          fontWeight: 'bold',
          color: theme.primaryColor
        }
      })
    }

    // コンテンツ要素
    if (slideData.content) {
      if (Array.isArray(slideData.content)) {
        // リスト形式
        elements.push({
          id: `content-list-${Date.now()}`,
          type: 'list',
          position: { x: 15, y: 35 },
          size: { width: 70, height: 50 },
          props: {
            ...createDefaultListProps(),
            items: slideData.content.map((item: string, index: number) => ({
              id: `item-${index}`,
              text: item
            })),
            fontSize: theme.fontSize.body,
            color: theme.textColor,
            spacing: 8
          }
        })
      } else {
        // テキスト形式
        elements.push({
          id: `content-text-${Date.now()}`,
          type: 'text',
          position: { x: 15, y: 35 },
          size: { width: 70, height: 50 },
          props: {
            ...createDefaultTextProps(),
            content: slideData.content,
            fontSize: theme.fontSize.body,
            color: theme.textColor,
            lineHeight: 1.6
          }
        })
      }
    }

    return elements
  }

  const createFallbackSlides = (theme: PresentationTheme): Slide[] => {
    return [
      {
        id: 'fallback-slide',
        type: 'content',
        title: 'スライドが生成されました',
        elements: [
          {
            id: 'fallback-text',
            type: 'text',
            position: { x: 20, y: 40 },
            size: { width: 60, height: 20 },
            props: {
              ...createDefaultTextProps(),
              content: 'AI がスライドを生成しました。\n詳細を編集してください。',
              fontSize: theme.fontSize.body,
              align: 'center',
              color: theme.textColor
            }
          }
        ],
        layout: {
          template: 'free',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: theme.backgroundColor
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  const generateSlides = useCallback(
    async (request: SlideGenerationRequest): Promise<void> => {
      try {
        // 現在のテーマとテンプレートを設定（ストリーミングパーサー用）
        setCurrentTheme(request.theme || null)
        setCurrentTemplate(request.selectedTemplate || null)

        // パーサーをリセット
        resetStreamingParser()

        // テンプレート情報を含むプロンプトを構築
        let templateInfo = ''
        if (request.selectedTemplate) {
          templateInfo = `

選択されたテンプレート: ${request.selectedTemplate.name}
テンプレートカテゴリ: ${request.selectedTemplate.category}
テンプレートの説明: ${request.selectedTemplate.description}

テーマ設定:
- プライマリカラー: ${request.selectedTemplate.theme?.primaryColor || request.theme?.primaryColor || '#3B82F6'}
- セカンダリカラー: ${request.selectedTemplate.theme?.secondaryColor || request.theme?.secondaryColor || '#10B981'}
- 背景色: ${request.selectedTemplate.theme?.backgroundColor || request.theme?.backgroundColor || '#FFFFFF'}
- テキストカラー: ${request.selectedTemplate.theme?.textColor || request.theme?.textColor || '#1F2937'}
- フォントファミリー: ${request.selectedTemplate.theme?.fontFamily || request.theme?.fontFamily || 'Inter, sans-serif'}

このテンプレートのスタイルとデザインに合わせてスライドを生成してください。`
        }

        const userPrompt = `以下の内容でプレゼンテーションスライドを作成してください：

${request.content}

タイトル: ${request.presentationTitle || ''}
スライド数: ${request.slideCount || 5}枚${templateInfo}`

        // useAgentChatのhandleSubmitを使用してAIにリクエスト
        await handleSubmit(userPrompt)
      } catch (err) {
        console.error('Slide generation error:', err)
      }
    },
    [handleSubmit, resetStreamingParser]
  )

  // 最新のAIレスポンステキストを抽出
  const getLatestResponseText = useCallback(() => {
    const lastAssistantMessage = messages.filter((msg) => msg.role === 'assistant').pop()
    if (!lastAssistantMessage?.content) {
      return ''
    }

    return lastAssistantMessage.content
      .filter((content) => 'text' in content)
      .map((content) => (content as { text: string }).text)
      .join('')
  }, [messages])

  // ストリーミングテキストの監視とパース
  useEffect(() => {
    if (generating && messages.length > 0) {
      const latestText = getLatestResponseText()
      if (latestText) {
        parseStreamingText(latestText)
      }
    }
  }, [messages, generating, getLatestResponseText, parseStreamingText])

  return {
    generating,
    error: null, // useAgentChatがエラーハンドリングを行うため
    messages,
    generateSlides,
    clearError,
    getLatestResponseText,
    parseAIResponse,
    // ストリーミング関連のプロパティ
    streamingSlides,
    isStreamingComplete,
    resetStreamingParser
  }
}
