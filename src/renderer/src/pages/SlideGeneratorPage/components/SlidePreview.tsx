import React from 'react'
import { Slide, PresentationTheme, PresentationSettings } from '../types/slide'
import { ContentElement } from '../types/slide'
import { isTextProps, isImageProps, isListProps, isShapeProps } from '../types/element'

interface SlidePreviewProps {
  slide: Slide
  theme: PresentationTheme
  settings: PresentationSettings
  isLoading?: boolean
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slide,
  theme,
  settings,
  isLoading = false
}) => {
  // スライドのアスペクト比を計算
  const aspectRatio = settings.aspectRatio
  const [width, height] = aspectRatio.split(':').map(Number)
  const aspectRatioValue = width / height

  // レスポンシブサイズ計算 - 画面全体により大きく表示
  const availableWidth = window.innerWidth * 0.7 // 利用可能幅の70%
  const availableHeight = window.innerHeight * 0.6 // 利用可能高さの60%

  // アスペクト比を維持して最大サイズを計算
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

  // 最小サイズ制限
  containerWidth = Math.max(containerWidth, 600)
  containerHeight = Math.max(containerHeight, containerWidth / aspectRatioValue)

  const renderElement = (element: ContentElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: `${element.size.width}%`,
      height: `${element.size.height}%`,
      zIndex: element.zIndex || 1,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      opacity: element.opacity || 1,
      display: element.visible === false ? 'none' : 'block'
    }

    switch (element.type) {
      case 'text':
        if (isTextProps(element.props)) {
          return (
            <div
              key={element.id}
              style={{
                ...style,
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
          return (
            <div key={element.id} style={style}>
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
          return (
            <div key={element.id} style={style}>
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
          return (
            <div
              key={element.id}
              style={{
                ...style,
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
        return (
          <div
            key={element.id}
            style={{
              ...style,
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

    return null
  }

  if (isLoading) {
    return (
      <div
        style={{
          width: containerWidth,
          height: containerHeight,
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B7280'
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
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

      {/* Grid (if enabled) */}
      {slide.layout.grid?.visible && (
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
            opacity: 0.5,
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
          fontFamily: 'monospace'
        }}
      >
        {slide.type} | {slide.elements.length} elements
      </div>
    </div>
  )
}
