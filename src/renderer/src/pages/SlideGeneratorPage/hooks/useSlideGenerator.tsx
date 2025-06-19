import { useCallback, useMemo } from 'react'
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
interface SlideGenerationRequest {
  content: string
  slideCount?: number
  theme?: PresentationTheme
  presentationTitle?: string
}

interface UseSlideGeneratorReturn {
  generating: boolean
  error: string | null
  messages: any[]
  generateSlides: (request: SlideGenerationRequest) => Promise<void>
  clearError: () => void
  getLatestResponseText: () => string
  parseAIResponse: (aiResponse: string, theme: PresentationTheme) => Slide[]
}

export const useSlideGenerator = (): UseSlideGeneratorReturn => {
  const { currentLLM } = useSetting()

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

  const clearError = useCallback(() => {
    clearChat()
  }, [clearChat])

  const parseAIResponse = useCallback((aiResponse: string, theme: PresentationTheme): Slide[] => {
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
          background: {
            type: 'color',
            color: theme.backgroundColor
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // 要素を生成
        if (slideData.elements && Array.isArray(slideData.elements)) {
          slide.elements = slideData.elements.map((elementData: any, elemIndex: number) => {
            const element: ContentElement = {
              id: `element-${Date.now()}-${index}-${elemIndex}`,
              type: elementData.type || 'text',
              position: elementData.position || { x: 10, y: 30 },
              size: elementData.size || { width: 80, height: 40 },
              props: createElementProps(elementData, theme)
            }
            return element
          })
        } else {
          // デフォルト要素を作成
          if (slide.type === 'title') {
            slide.elements = createTitleSlideElements(slideData, theme)
          } else {
            slide.elements = createContentSlideElements(slideData, theme)
          }
        }

        return slide
      })
    } catch (err) {
      console.error('Failed to parse AI response:', err)
      return createFallbackSlides(theme)
    }
  }, [])

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
        // プロンプトを構築
        const userPrompt = `以下の内容でプレゼンテーションスライドを作成してください：

${request.content}

タイトル: ${request.presentationTitle || ''}
スライド数: ${request.slideCount || 5}枚`

        // useAgentChatのhandleSubmitを使用してAIにリクエスト
        await handleSubmit(userPrompt)
      } catch (err) {
        console.error('Slide generation error:', err)
      }
    },
    [handleSubmit]
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

  return {
    generating,
    error: null, // useAgentChatがエラーハンドリングを行うため
    messages,
    generateSlides,
    clearError,
    getLatestResponseText,
    parseAIResponse
  }
}
