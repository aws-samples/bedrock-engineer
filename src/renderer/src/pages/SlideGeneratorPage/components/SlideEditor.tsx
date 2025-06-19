import React from 'react'
import { Slide, PresentationTheme, PresentationSettings, ContentElement } from '../types/slide'
import { isTextProps, isImageProps, isListProps, isShapeProps } from '../types/element'
import { useSlideEditor } from '../hooks/useSlideEditor'

interface SlideEditorProps {
  slide: Slide
  theme: PresentationTheme
  settings: PresentationSettings
  slides: Slide[]
  onSlidesUpdate: (updatedSlides: Slide[]) => void
  isEditing?: boolean
}

interface ResizeHandleProps {
  position: string
  onMouseDown: (e: React.MouseEvent, handle: string) => void
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ position, onMouseDown }) => {
  const getHandleStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#3B82F6',
      border: '1px solid white',
      borderRadius: '2px',
      cursor: getCursor(),
      zIndex: 10
    }

    switch (position) {
      case 'nw':
        return { ...baseStyle, top: '-4px', left: '-4px' }
      case 'ne':
        return { ...baseStyle, top: '-4px', right: '-4px' }
      case 'sw':
        return { ...baseStyle, bottom: '-4px', left: '-4px' }
      case 'se':
        return { ...baseStyle, bottom: '-4px', right: '-4px' }
      case 'n':
        return { ...baseStyle, top: '-4px', left: '50%', transform: 'translateX(-50%)' }
      case 's':
        return { ...baseStyle, bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }
      case 'e':
        return { ...baseStyle, right: '-4px', top: '50%', transform: 'translateY(-50%)' }
      case 'w':
        return { ...baseStyle, left: '-4px', top: '50%', transform: 'translateY(-50%)' }
      default:
        return baseStyle
    }
  }

  const getCursor = (): string => {
    switch (position) {
      case 'nw':
      case 'se':
        return 'nw-resize'
      case 'ne':
      case 'sw':
        return 'ne-resize'
      case 'n':
      case 's':
        return 'n-resize'
      case 'e':
      case 'w':
        return 'e-resize'
      default:
        return 'default'
    }
  }

  return <div style={getHandleStyle()} onMouseDown={(e) => onMouseDown(e, position)} />
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  theme,
  settings,
  slides,
  onSlidesUpdate,
  isEditing = false
}) => {
  const slideEditor = useSlideEditor(slides, onSlidesUpdate)

  // スライドのアスペクト比を計算
  const aspectRatio = settings.aspectRatio
  const [width, height] = aspectRatio.split(':').map(Number)
  const aspectRatioValue = width / height

  // レスポンシブサイズ計算
  const availableWidth = window.innerWidth * 0.7
  const availableHeight = window.innerHeight * 0.6

  const widthBasedHeight = availableWidth / aspectRatioValue
  const heightBasedWidth = availableHeight * aspectRatioValue

  let containerWidth: number
  let containerHeight: number

  if (widthBasedHeight <= availableHeight) {
    containerWidth = availableWidth
    containerHeight = widthBasedHeight
  } else {
    containerWidth = heightBasedWidth
    containerHeight = availableHeight
  }

  containerWidth = Math.max(containerWidth, 600)
  containerHeight = Math.max(containerHeight, containerWidth / aspectRatioValue)

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    if (!isEditing) return
    e.stopPropagation()
    slideEditor.selectElement(elementId, slide.id)
  }

  const handleSlideClick = (e: React.MouseEvent) => {
    if (!isEditing) return
    if (e.target === e.currentTarget) {
      slideEditor.clearSelection()
    }
  }

  const renderElement = (element: ContentElement) => {
    const isSelected = slideEditor.editingState.selectedElement?.elementId === element.id

    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.size.width}%`,
      height: `${element.size.height}%`,
      zIndex: element.zIndex || 1,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      opacity: element.opacity || 1,
      display: element.visible === false ? 'none' : 'block',
      cursor: isEditing ? 'pointer' : 'default',
      outline: isSelected ? '2px solid #3B82F6' : 'none',
      outlineOffset: '2px'
    }

    const contentStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      pointerEvents: isEditing ? 'none' : 'auto'
    }

    let content: React.ReactNode = null

    switch (element.type) {
      case 'text':
        if (isTextProps(element.props)) {
          content = (
            <div
              style={{
                ...contentStyle,
                fontSize: `${element.props.fontSize || theme.fontSize.body}px`,
                fontFamily: element.props.fontFamily || theme.fontFamily,
                fontWeight: element.props.fontWeight || 'normal',
                fontStyle: element.props.fontStyle || 'normal',
                color: element.props.color || theme.textColor,
                backgroundColor: element.props.backgroundColor || 'transparent',
                textAlign: element.props.align || 'left',
                display: 'flex',
                alignItems:
                  element.props.verticalAlign === 'middle'
                    ? 'center'
                    : element.props.verticalAlign === 'bottom'
                      ? 'flex-end'
                      : 'flex-start',
                lineHeight: element.props.lineHeight || 1.5,
                letterSpacing: element.props.letterSpacing
                  ? `${element.props.letterSpacing}px`
                  : 'normal',
                textDecoration: element.props.textDecoration || 'none',
                borderRadius: element.props.borderRadius
                  ? `${element.props.borderRadius}px`
                  : undefined,
                padding: element.props.padding
                  ? `${element.props.padding.top}px ${element.props.padding.right}px ${element.props.padding.bottom}px ${element.props.padding.left}px`
                  : undefined,
                border: element.props.border
                  ? `${element.props.border.width}px ${element.props.border.style} ${element.props.border.color}`
                  : undefined
              }}
            >
              {element.props.content}
            </div>
          )
        }
        break

      case 'image':
        if (isImageProps(element.props)) {
          content = (
            <div style={contentStyle}>
              {element.props.src ? (
                <img
                  src={element.props.src}
                  alt={element.props.alt || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: element.props.fit || 'cover',
                    borderRadius: element.props.borderRadius
                      ? `${element.props.borderRadius}px`
                      : undefined,
                    border: element.props.border
                      ? `${element.props.border.width}px ${element.props.border.style} ${element.props.border.color}`
                      : undefined
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280',
                    fontSize: '14px'
                  }}
                >
                  画像
                </div>
              )}
            </div>
          )
        }
        break

      case 'list':
        if (isListProps(element.props)) {
          const listProps = element.props
          content = (
            <div style={contentStyle}>
              <ul
                style={{
                  fontSize: `${listProps.fontSize || theme.fontSize.body}px`,
                  fontFamily: listProps.fontFamily || theme.fontFamily,
                  fontWeight: listProps.fontWeight || 'normal',
                  color: listProps.color || theme.textColor,
                  backgroundColor: listProps.backgroundColor || 'transparent',
                  lineHeight: listProps.lineHeight || 1.5,
                  listStyleType:
                    listProps.listType === 'bullet'
                      ? 'disc'
                      : listProps.listType === 'number'
                        ? 'decimal'
                        : 'none',
                  paddingLeft: listProps.indent ? `${listProps.indent}px` : '20px',
                  margin: 0
                }}
              >
                {listProps.items.map((item, index) => (
                  <li
                    key={item.id || index}
                    style={{
                      marginBottom: listProps.spacing ? `${listProps.spacing}px` : '4px'
                    }}
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        break

      case 'shape':
        if (isShapeProps(element.props)) {
          content = (
            <div
              style={{
                ...contentStyle,
                backgroundColor: element.props.fillColor || theme.primaryColor,
                border: `${element.props.borderWidth || 0}px ${element.props.borderStyle || 'solid'} ${element.props.borderColor || 'transparent'}`,
                borderRadius:
                  element.props.shape === 'circle'
                    ? '50%'
                    : element.props.borderRadius
                      ? `${element.props.borderRadius}px`
                      : '0'
              }}
            />
          )
        }
        break

      default:
        content = (
          <div
            style={{
              ...contentStyle,
              backgroundColor: '#F9FAFB',
              border: '1px dashed #D1D5DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#6B7280'
            }}
          >
            {element.type}
          </div>
        )
    }

    return (
      <div
        key={element.id}
        style={elementStyle}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => {
          if (isSelected && isEditing) {
            slideEditor.startDrag(e, element.id)
          }
        }}
      >
        {content}

        {/* リサイズハンドル */}
        {isSelected && isEditing && (
          <>
            <ResizeHandle position="nw" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="ne" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="sw" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="se" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="n" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="s" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="e" onMouseDown={slideEditor.startResize} />
            <ResizeHandle position="w" onMouseDown={slideEditor.startResize} />
          </>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        width: containerWidth,
        height: containerHeight,
        position: 'relative',
        backgroundColor: slide.background?.color || theme.backgroundColor,
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        cursor: isEditing ? 'default' : 'auto'
      }}
      onClick={handleSlideClick}
      onMouseMove={slideEditor.handleDrag}
      onMouseUp={slideEditor.endDrag}
    >
      {/* Background */}
      {slide.background?.type === 'gradient' && slide.background.gradient && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(${slide.background.gradient.direction}deg, ${slide.background.gradient.from}, ${slide.background.gradient.to})`
          }}
        />
      )}

      {/* Grid (if enabled and editing) */}
      {isEditing && slide.layout.grid?.visible && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(to right, #E5E7EB 1px, transparent 1px),
              linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
            `,
            backgroundSize: `${slide.layout.grid.size}px ${slide.layout.grid.size}px`,
            opacity: 0.3,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Elements */}
      {slide.elements.map(renderElement)}

      {/* Slide Info Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontFamily: 'monospace',
          opacity: isEditing ? 0.5 : 1
        }}
      >
        {slide.type} | {slide.elements.length} elements
        {isEditing && slideEditor.editingState.selectedElement && ' | 編集中'}
      </div>
    </div>
  )
}
