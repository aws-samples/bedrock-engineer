import { useState, useCallback, useRef } from 'react'
import { Slide, PresentationTheme } from '../types/slide'
import { createDefaultTextProps } from '../types/element'

interface StreamingJsonParserOptions {
  onSlideDetected: (slide: Slide, index: number, isComplete: boolean) => void
  onParsingComplete: (slides: Slide[]) => void
  onError: (error: Error) => void
  theme: PresentationTheme
  selectedTemplate?: any
}

interface ParsedSlideData {
  slides: any[]
}

export const useStreamingJsonParser = (options: StreamingJsonParserOptions) => {
  const { onSlideDetected, onParsingComplete, onError, theme, selectedTemplate } = options

  const [parsedSlides, setParsedSlides] = useState<Slide[]>([])
  const [isParsingComplete, setIsParsingComplete] = useState(false)

  // パース状態を管理するref
  const parsingState = useRef({
    buffer: '',
    processedSlides: 0,
    isComplete: false
  })

  // JSONの構造を検出して部分的にパースする関数
  const extractCompleteSlides = useCallback(
    (jsonText: string): { slides: any[]; isComplete: boolean } => {
      try {
        // まずマークダウンコードブロックを除去
        let cleanJson = jsonText.trim()
        const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (codeBlockMatch) {
          cleanJson = codeBlockMatch[1].trim()
        }

        // 完全なJSONかどうかチェック
        let parsedData: ParsedSlideData
        let isCompleteJson = false

        try {
          parsedData = JSON.parse(cleanJson)
          isCompleteJson = true
        } catch {
          // 不完全なJSONの場合、部分的なパースを試行
          parsedData = parsePartialJson(cleanJson)
        }

        if (parsedData && parsedData.slides && Array.isArray(parsedData.slides)) {
          return {
            slides: parsedData.slides,
            isComplete: isCompleteJson
          }
        }

        return { slides: [], isComplete: false }
      } catch (error) {
        console.warn('JSON extraction failed:', error)
        return { slides: [], isComplete: false }
      }
    },
    []
  )

  // 部分的なJSONをパースする関数
  const parsePartialJson = useCallback((partialJson: string): ParsedSlideData => {
    try {
      // "slides"配列の開始を探す
      const slidesMatch = partialJson.match(/"slides"\s*:\s*\[([\s\S]*)/i)
      if (!slidesMatch) {
        return { slides: [] }
      }

      const slidesContent = slidesMatch[1]
      const slides: any[] = []

      // 各スライドオブジェクトを個別に抽出
      let braceCount = 0
      let inString = false
      let escapeNext = false
      let objectStart = -1

      for (let i = 0; i < slidesContent.length; i++) {
        const char = slidesContent[i]

        if (escapeNext) {
          escapeNext = false
          continue
        }

        if (char === '\\') {
          escapeNext = true
          continue
        }

        if (char === '"' && !escapeNext) {
          inString = !inString
          continue
        }

        if (inString) continue

        if (char === '{') {
          if (braceCount === 0) {
            objectStart = i
          }
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0 && objectStart >= 0) {
            // 完全なオブジェクトが見つかった
            const objectStr = slidesContent.slice(objectStart, i + 1)
            try {
              const slideObj = JSON.parse(objectStr)
              slides.push(slideObj)
              objectStart = -1
            } catch (parseError) {
              console.warn('Failed to parse slide object:', parseError)
            }
          }
        }
      }

      return { slides }
    } catch (error) {
      console.warn('Partial JSON parse failed:', error)
      return { slides: [] }
    }
  }, [])

  // スライドデータをSlideオブジェクトに変換する関数
  const convertToSlide = useCallback(
    (slideData: any, index: number): Slide => {
      const slideId = `stream-slide-${Date.now()}-${index}`

      // テンプレートの背景設定を取得
      let slideBackground = {
        type: 'color' as const,
        color: theme.backgroundColor
      }

      // 選択されたテンプレートがある場合、その設定を使用
      if (selectedTemplate && selectedTemplate.slides && selectedTemplate.slides[0]) {
        const templateSlide =
          selectedTemplate.slides[Math.min(index, selectedTemplate.slides.length - 1)]
        if (templateSlide.background) {
          slideBackground = templateSlide.background
        }
      }

      const slide: Slide = {
        id: slideId,
        type: slideData.type || 'content',
        title: slideData.title || '',
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

      // エレメントの作成は簡略化（ストリーミング用）
      if (slideData.title) {
        slide.elements.push({
          id: `title-${slideId}`,
          type: 'text',
          position: { x: 10, y: 20 },
          size: { width: 80, height: 15 },
          props: {
            ...createDefaultTextProps(),
            content: slideData.title,
            fontSize: theme.fontSize.title || 32,
            fontWeight: 'bold',
            align: 'center',
            color: theme.primaryColor,
            fontFamily: theme.fontFamily
          },
          zIndex: 10
        })
      }

      if (slideData.content) {
        const contentY = slideData.title ? 40 : 25
        slide.elements.push({
          id: `content-${slideId}`,
          type: 'text',
          position: { x: 15, y: contentY },
          size: { width: 70, height: 50 },
          props: {
            ...createDefaultTextProps(),
            content: Array.isArray(slideData.content)
              ? slideData.content.join('\n• ')
              : slideData.content,
            fontSize: theme.fontSize.body || 16,
            fontWeight: 'normal',
            align: 'left',
            color: theme.textColor,
            fontFamily: theme.fontFamily,
            lineHeight: 1.5
          },
          zIndex: 10
        })
      }

      return slide
    },
    [theme, selectedTemplate]
  )

  // メインのパース処理関数
  const parseStreamingText = useCallback(
    (streamText: string) => {
      try {
        // バッファーを更新
        parsingState.current.buffer = streamText

        // 完全なスライドを抽出
        const { slides: extractedSlides, isComplete } = extractCompleteSlides(streamText)

        if (extractedSlides.length > 0) {
          const convertedSlides: Slide[] = []

          // 新しく検出されたスライドのみ処理
          for (let i = parsingState.current.processedSlides; i < extractedSlides.length; i++) {
            const slideData = extractedSlides[i]
            const convertedSlide = convertToSlide(slideData, i)
            convertedSlides.push(convertedSlide)

            // 個別のスライド検出イベントを発火
            onSlideDetected(convertedSlide, i, isComplete)
          }

          // 処理済みスライド数を更新
          parsingState.current.processedSlides = extractedSlides.length

          // 全体のスライドリストを更新
          const allSlides = extractedSlides.map((slideData, index) =>
            convertToSlide(slideData, index)
          )
          setParsedSlides(allSlides)

          // 完全なJSONが受信された場合
          if (isComplete && !parsingState.current.isComplete) {
            parsingState.current.isComplete = true
            setIsParsingComplete(true)
            onParsingComplete(allSlides)
          }
        }
      } catch (error) {
        console.error('Streaming parse error:', error)
        onError(error as Error)
      }
    },
    [extractCompleteSlides, convertToSlide, onSlideDetected, onParsingComplete, onError]
  )

  // パース状態をリセットする関数
  const resetParser = useCallback(() => {
    parsingState.current = {
      buffer: '',
      processedSlides: 0,
      isComplete: false
    }
    setParsedSlides([])
    setIsParsingComplete(false)
  }, [])

  return {
    parseStreamingText,
    parsedSlides,
    isParsingComplete,
    resetParser
  }
}
