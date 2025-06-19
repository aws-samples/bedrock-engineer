import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  Presentation,
  Slide,
  PresentationTheme,
  PresentationSettings
} from '../pages/SlideGeneratorPage/types/slide'
import { ContentElement } from '../pages/SlideGeneratorPage/types/slide'
import { createDefaultTextProps } from '../pages/SlideGeneratorPage/types/element'

interface SlideGeneratorContextType {
  // State
  presentation: Presentation
  currentSlideIndex: number
  loading: boolean
  error: string | null

  // Actions
  setPresentation: (presentation: Presentation) => void
  setCurrentSlideIndex: (index: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Slide Management
  addSlide: (slide?: Partial<Slide>, index?: number) => void
  removeSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  moveSlide: (fromIndex: number, toIndex: number) => void

  // Element Management
  addElement: (slideIndex: number, element: ContentElement) => void
  updateElement: (slideIndex: number, elementId: string, updates: Partial<ContentElement>) => void
  removeElement: (slideIndex: number, elementId: string) => void

  // Utility
  getCurrentSlide: () => Slide | null
  resetPresentation: () => void
  updatePresentationSettings: (updates: Partial<PresentationSettings>) => void
  updatePresentationTheme: (updates: Partial<PresentationTheme>) => void
}

const SlideGeneratorContext = createContext<SlideGeneratorContextType | undefined>(undefined)

interface SlideGeneratorProviderProps {
  children: ReactNode
}

// デフォルトプレゼンテーション作成関数
const createDefaultPresentation = (): Presentation => {
  const now = new Date()

  const defaultTheme: PresentationTheme = {
    id: 'default',
    name: 'Default',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'Arial, sans-serif',
    fontSize: {
      title: 32,
      subtitle: 24,
      body: 16
    }
  }

  const defaultSettings: PresentationSettings = {
    aspectRatio: '16:9',
    slideSize: {
      width: 1920,
      height: 1080
    },
    autoSave: true,
    transitions: true,
    animationDuration: 300
  }

  const titleSlide: Slide = {
    id: '1',
    type: 'title',
    title: 'プレゼンテーションタイトル',
    subtitle: 'サブタイトル',
    elements: [
      {
        id: 'title-text',
        type: 'text',
        position: { x: 10, y: 30 },
        size: { width: 80, height: 15 },
        props: {
          ...createDefaultTextProps(),
          content: 'プレゼンテーションタイトル',
          fontSize: 32,
          fontWeight: 'bold',
          align: 'center'
        }
      },
      {
        id: 'subtitle-text',
        type: 'text',
        position: { x: 10, y: 50 },
        size: { width: 80, height: 10 },
        props: {
          ...createDefaultTextProps(),
          content: 'サブタイトル',
          fontSize: 24,
          fontWeight: 'normal',
          align: 'center',
          color: '#6B7280'
        }
      }
    ],
    layout: {
      template: 'title-and-content',
      padding: { top: 5, right: 5, bottom: 5, left: 5 }
    },
    background: {
      type: 'color',
      color: '#FFFFFF'
    },
    createdAt: now,
    updatedAt: now
  }

  return {
    id: 'default-presentation',
    title: '新しいプレゼンテーション',
    description: '',
    author: '',
    theme: defaultTheme,
    slides: [titleSlide],
    settings: defaultSettings,
    createdAt: now,
    updatedAt: now
  }
}

export const SlideGeneratorProvider: React.FC<SlideGeneratorProviderProps> = ({ children }) => {
  const [presentation, setPresentation] = useState<Presentation>(createDefaultPresentation())
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Slide Management
  const addSlide = useCallback(
    (slide?: Partial<Slide>, index?: number) => {
      const newSlide: Slide = {
        id: `slide-${Date.now()}`,
        type: 'content',
        elements: [],
        layout: {
          template: 'free',
          padding: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        background: {
          type: 'color',
          color: presentation.theme.backgroundColor
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...slide
      }

      setPresentation((prev) => {
        const newSlides = [...prev.slides]
        const insertIndex = index !== undefined ? index : newSlides.length
        newSlides.splice(insertIndex, 0, newSlide)

        return {
          ...prev,
          slides: newSlides,
          updatedAt: new Date()
        }
      })
    },
    [presentation.theme.backgroundColor]
  )

  const removeSlide = useCallback(
    (index: number) => {
      setPresentation((prev) => {
        if (prev.slides.length <= 1) return prev // 最低1枚は残す

        const newSlides = prev.slides.filter((_, i) => i !== index)
        return {
          ...prev,
          slides: newSlides,
          updatedAt: new Date()
        }
      })

      // 現在のスライドインデックスを調整
      setCurrentSlideIndex((prev) => {
        if (prev >= presentation.slides.length - 1) {
          return Math.max(0, presentation.slides.length - 2)
        }
        return prev > index ? prev - 1 : prev
      })
    },
    [presentation.slides.length]
  )

  const duplicateSlide = useCallback(
    (index: number) => {
      const slideToClone = presentation.slides[index]
      if (!slideToClone) return

      const clonedSlide: Slide = {
        ...slideToClone,
        id: `slide-${Date.now()}`,
        elements: slideToClone.elements.map((element) => ({
          ...element,
          id: `${element.id}-copy-${Date.now()}`
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      addSlide(clonedSlide, index + 1)
    },
    [presentation.slides, addSlide]
  )

  const moveSlide = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPresentation((prev) => {
        const newSlides = [...prev.slides]
        const [movedSlide] = newSlides.splice(fromIndex, 1)
        newSlides.splice(toIndex, 0, movedSlide)

        return {
          ...prev,
          slides: newSlides,
          updatedAt: new Date()
        }
      })

      // 現在のスライドインデックスを調整
      if (currentSlideIndex === fromIndex) {
        setCurrentSlideIndex(toIndex)
      } else if (currentSlideIndex > fromIndex && currentSlideIndex <= toIndex) {
        setCurrentSlideIndex(currentSlideIndex - 1)
      } else if (currentSlideIndex < fromIndex && currentSlideIndex >= toIndex) {
        setCurrentSlideIndex(currentSlideIndex + 1)
      }
    },
    [currentSlideIndex]
  )

  // Element Management
  const addElement = useCallback((slideIndex: number, element: ContentElement) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides]
      if (newSlides[slideIndex]) {
        newSlides[slideIndex] = {
          ...newSlides[slideIndex],
          elements: [...newSlides[slideIndex].elements, element],
          updatedAt: new Date()
        }
      }

      return {
        ...prev,
        slides: newSlides,
        updatedAt: new Date()
      }
    })
  }, [])

  const updateElement = useCallback(
    (slideIndex: number, elementId: string, updates: Partial<ContentElement>) => {
      setPresentation((prev) => {
        const newSlides = [...prev.slides]
        if (newSlides[slideIndex]) {
          newSlides[slideIndex] = {
            ...newSlides[slideIndex],
            elements: newSlides[slideIndex].elements.map((element) =>
              element.id === elementId ? { ...element, ...updates } : element
            ),
            updatedAt: new Date()
          }
        }

        return {
          ...prev,
          slides: newSlides,
          updatedAt: new Date()
        }
      })
    },
    []
  )

  const removeElement = useCallback((slideIndex: number, elementId: string) => {
    setPresentation((prev) => {
      const newSlides = [...prev.slides]
      if (newSlides[slideIndex]) {
        newSlides[slideIndex] = {
          ...newSlides[slideIndex],
          elements: newSlides[slideIndex].elements.filter((element) => element.id !== elementId),
          updatedAt: new Date()
        }
      }

      return {
        ...prev,
        slides: newSlides,
        updatedAt: new Date()
      }
    })
  }, [])

  // Utility functions
  const getCurrentSlide = useCallback((): Slide | null => {
    return presentation.slides[currentSlideIndex] || null
  }, [presentation.slides, currentSlideIndex])

  const resetPresentation = useCallback(() => {
    setPresentation(createDefaultPresentation())
    setCurrentSlideIndex(0)
    setError(null)
  }, [])

  const updatePresentationSettings = useCallback((updates: Partial<PresentationSettings>) => {
    setPresentation((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
      updatedAt: new Date()
    }))
  }, [])

  const updatePresentationTheme = useCallback((updates: Partial<PresentationTheme>) => {
    setPresentation((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
      updatedAt: new Date()
    }))
  }, [])

  const value: SlideGeneratorContextType = {
    // State
    presentation,
    currentSlideIndex,
    loading,
    error,

    // Actions
    setPresentation,
    setCurrentSlideIndex,
    setLoading,
    setError,

    // Slide Management
    addSlide,
    removeSlide,
    duplicateSlide,
    moveSlide,

    // Element Management
    addElement,
    updateElement,
    removeElement,

    // Utility
    getCurrentSlide,
    resetPresentation,
    updatePresentationSettings,
    updatePresentationTheme
  }

  return <SlideGeneratorContext.Provider value={value}>{children}</SlideGeneratorContext.Provider>
}

export const useSlideGenerator = (): SlideGeneratorContextType => {
  const context = useContext(SlideGeneratorContext)
  if (context === undefined) {
    throw new Error('useSlideGenerator must be used within a SlideGeneratorProvider')
  }
  return context
}
