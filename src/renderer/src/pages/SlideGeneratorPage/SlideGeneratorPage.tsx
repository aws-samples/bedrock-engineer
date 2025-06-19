import { useState, useEffect } from 'react'
import { Tooltip } from 'flowbite-react'
import { AiOutlineReload } from 'react-icons/ai'
import { GrClearOption } from 'react-icons/gr'
import {
  HiOutlineDocumentText,
  HiOutlineTemplate,
  HiOutlinePencil,
  HiOutlineEye
} from 'react-icons/hi'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { SlidePreview } from './components/SlidePreview'
import { SlideEditor } from './components/SlideEditor'
import { TemplateSelector } from './components/TemplateSelector'
import { Slide, Presentation, PresentationTheme, PresentationSettings } from './types/slide'
import { createDefaultTextProps, createDefaultShapeProps } from './types/element'
import { SlideTemplate } from './templates/templates'
import { useSlideGenerator } from './hooks/useSlideGenerator'
import { AttachedImage, TextArea } from '../ChatPage/components/InputForm/TextArea'
import useSetting from '@renderer/hooks/useSetting'
import { SlidePromptButtons } from './components/SlidePromptButtons'
import { useSystemPromptModal } from '../ChatPage/modals/useSystemPromptModal'
import { DEFAULT_AGENTS } from '../ChatPage/constants/DEFAULT_AGENTS'

export default function SlideGeneratorPage() {
  const [userInput, setUserInput] = useState('')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null)

  // Settings hook
  const { sendMsgKey } = useSetting()

  // AI生成フック
  const {
    generating,
    messages,
    generateSlides,
    clearError,
    getLatestResponseText,
    parseAIResponse
  } = useSlideGenerator()

  // システムプロンプトモーダル
  const slideAgent = DEFAULT_AGENTS.find((agent) => agent.id === 'slideGeneratorAgent')
  const systemPrompt = slideAgent?.system || ''

  const {
    show: showSystemPromptModal,
    handleClose: handleCloseSystemPromptModal,
    handleOpen: handleOpenSystemPromptModal,
    SystemPromptModal
  } = useSystemPromptModal()

  // デフォルトプレゼンテーション作成
  const createDefaultPresentation = (): Presentation => {
    const now = new Date()

    const defaultTheme: PresentationTheme = {
      id: 'default',
      name: 'Modern Gradient',
      primaryColor: '#667EEA',
      secondaryColor: '#764BA2',
      backgroundColor: '#FFFFFF',
      textColor: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: {
        title: 48,
        subtitle: 24,
        body: 18
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
            content: 'プレゼンテーションタイトル',
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
            content: 'サブタイトルやプレゼンテーションの概要',
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

  const [presentation, setPresentation] = useState<Presentation>(createDefaultPresentation())

  const handleRefresh = () => {
    setPresentation(createDefaultPresentation())
    setCurrentSlideIndex(0)
    setUserInput('')
    clearError()
  }

  const onSubmit = async (input: string, _images: AttachedImage[]) => {
    if (!input.trim()) return

    await generateSlides({
      content: input,
      slideCount: 5,
      theme: presentation.theme,
      presentationTitle: ''
    })

    setUserInput('')
  }

  // メッセージが更新されたらスライドを生成
  useEffect(() => {
    if (!generating && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (
        lastMessage?.id &&
        lastMessage.id !== lastProcessedMessageId &&
        lastMessage.role === 'assistant'
      ) {
        const responseText = getLatestResponseText()
        if (responseText) {
          const slides = parseAIResponse(responseText, presentation.theme)

          if (slides && slides.length > 0) {
            const now = new Date()
            const newPresentation: Presentation = {
              id: `ai-presentation-${Date.now()}`,
              title: 'AI生成プレゼンテーション',
              description: `Generated from user input`,
              author: '',
              theme: presentation.theme,
              slides: slides,
              settings: presentation.settings,
              createdAt: now,
              updatedAt: now
            }

            setPresentation(newPresentation)
            setCurrentSlideIndex(0)
            setLastProcessedMessageId(lastMessage.id)
          }
        }
      }
    }
  }, [generating, messages, lastProcessedMessageId, getLatestResponseText, parseAIResponse])

  const handlePrevSlide = () => {
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex(Math.min(presentation.slides.length - 1, currentSlideIndex + 1))
  }

  const handleTemplateSelect = (template: SlideTemplate) => {
    const now = new Date()

    // テンプレートからプレゼンテーションを作成
    const newPresentation: Presentation = {
      id: `presentation-${Date.now()}`,
      title: template.name,
      description: template.description,
      author: '',
      theme: {
        id: template.theme?.id || 'template-theme',
        name: template.theme?.name || template.name,
        primaryColor: template.theme?.primaryColor || '#3B82F6',
        secondaryColor: template.theme?.secondaryColor || '#10B981',
        backgroundColor: template.theme?.backgroundColor || '#FFFFFF',
        textColor: template.theme?.textColor || '#1F2937',
        fontFamily: template.theme?.fontFamily || 'Arial, sans-serif',
        fontSize: {
          title: 32,
          subtitle: 24,
          body: 16
        }
      },
      slides: template.slides,
      settings: {
        aspectRatio: '16:9',
        slideSize: { width: 1920, height: 1080 },
        autoSave: true,
        transitions: true,
        animationDuration: 300
      },
      createdAt: now,
      updatedAt: now
    }

    setPresentation(newPresentation)
    setSelectedTemplateId(template.id)
    setCurrentSlideIndex(0)
    setShowTemplateSelector(false)
  }

  const handleTemplatePreview = (template: SlideTemplate) => {
    // プレビュー機能（今回は省略）
    console.log('Template preview:', template.name)
  }

  const handleSlidesUpdate = (updatedSlides: Slide[]) => {
    setPresentation((prev) => ({
      ...prev,
      slides: updatedSlides,
      updatedAt: new Date()
    }))
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  const currentSlide = presentation.slides[currentSlideIndex]

  return (
    <div className="flex flex-col p-3 h-[calc(100vh-11rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex pb-2 justify-between">
        <div className="font-bold flex flex-col gap-2 w-full">
          <div className="flex justify-between">
            <h1 className="content-center dark:text-white text-lg flex items-center gap-2">
              <HiOutlineDocumentText className="text-xl" />
              Slide Generator
            </h1>
            <span
              className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700"
              onClick={handleOpenSystemPromptModal}
            >
              SYSTEM_PROMPT
            </span>
          </div>

          <div className="flex justify-between w-full">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{presentation.title}</span>
              <div className="flex gap-1 items-center text-xs text-gray-500">
                <span>
                  スライド {currentSlideIndex + 1} / {presentation.slides.length}
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Tooltip
                content={isEditMode ? 'プレビューモード' : '編集モード'}
                placement="bottom"
                animation="duration-500"
              >
                <button
                  className={`cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isEditMode
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : ''
                  }`}
                  onClick={toggleEditMode}
                  disabled={generating}
                >
                  {isEditMode ? (
                    <HiOutlineEye className="text-xl" />
                  ) : (
                    <HiOutlinePencil className="text-xl" />
                  )}
                </button>
              </Tooltip>

              <Tooltip content="テンプレート選択" placement="bottom" animation="duration-500">
                <button
                  className="cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setShowTemplateSelector(true)}
                  disabled={generating}
                >
                  <HiOutlineTemplate className="text-xl" />
                </button>
              </Tooltip>

              <Tooltip content="再読み込み" placement="bottom" animation="duration-500">
                <button
                  className="cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleRefresh}
                  disabled={generating}
                >
                  <AiOutlineReload className="text-xl" />
                </button>
              </Tooltip>

              <Tooltip content="クリア" placement="bottom" animation="duration-500">
                <button
                  className="cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={handleRefresh}
                  disabled={generating}
                >
                  <GrClearOption className="text-xl" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 justify-center items-center">
        {/* Slide Preview Area with Navigation */}
        <div className="relative flex items-center justify-center">
          {/* Previous Button */}
          {presentation.slides.length > 1 && (
            <button
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0}
              className={`absolute left-[-50px] top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-all ${
                currentSlideIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <IoChevronBack className="text-2xl" />
            </button>
          )}

          {/* Slide Preview/Editor */}
          <div className="flex flex-col items-center">
            {isEditMode ? (
              <SlideEditor
                slide={currentSlide}
                theme={presentation.theme}
                settings={presentation.settings}
                slides={presentation.slides}
                onSlidesUpdate={handleSlidesUpdate}
                isEditing={true}
              />
            ) : (
              <SlidePreview
                slide={currentSlide}
                theme={presentation.theme}
                settings={presentation.settings}
                isLoading={generating}
              />
            )}

            {/* Dot Navigation */}
            {presentation.slides.length > 1 && (
              <div className="flex gap-1 mt-4">
                {presentation.slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlideIndex ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Next Button */}
          {presentation.slides.length > 1 && (
            <button
              onClick={handleNextSlide}
              disabled={currentSlideIndex === presentation.slides.length - 1}
              className={`absolute right-[-50px] top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-all ${
                currentSlideIndex === presentation.slides.length - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <IoChevronForward className="text-2xl" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="flex gap-2 fixed bottom-0 left-[5rem] right-5 bottom-3 z-10">
        <div className="relative w-full">
          <div className="flex gap-2 justify-between pb-2">
            <div className="overflow-x-auto flex-grow">
              <SlidePromptButtons onSelect={setUserInput} />
            </div>
          </div>

          <TextArea
            value={userInput}
            onChange={setUserInput}
            disabled={generating}
            onSubmit={(input, attachedImages) => onSubmit(input, attachedImages)}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
          />
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        selectedTemplateId={selectedTemplateId}
        onSelect={handleTemplateSelect}
        onPreview={handleTemplatePreview}
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
      />

      {/* System Prompt Modal */}
      <SystemPromptModal
        isOpen={showSystemPromptModal}
        onClose={handleCloseSystemPromptModal}
        systemPrompt={systemPrompt}
      />
    </div>
  )
}
