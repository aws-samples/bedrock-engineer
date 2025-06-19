import { ElementProps } from './element'

export interface Slide {
  id: string
  type: 'title' | 'content' | 'section' | 'conclusion'
  title?: string
  subtitle?: string
  elements: ContentElement[]
  layout: SlideLayout
  background?: BackgroundConfig
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ContentElement {
  id: string
  type: 'text' | 'image' | 'list' | 'chart' | 'shape' | 'table'
  position: Position
  size: Size
  zIndex?: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  props: ElementProps
}

export interface Position {
  x: number // 0-100 (%)
  y: number // 0-100 (%)
}

export interface Size {
  width: number // 0-100 (%)
  height: number // 0-100 (%)
}

export interface SlideLayout {
  template: 'free' | 'two-column' | 'three-column' | 'title-and-content' | 'section'
  grid?: GridConfig
  padding: Padding
  guides?: GuideConfig[]
}

export interface GridConfig {
  enabled: boolean
  size: number // グリッドサイズ（px）
  snap: boolean // スナップ機能
  visible: boolean // グリッド表示
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface GuideConfig {
  id: string
  type: 'horizontal' | 'vertical'
  position: number // 0-100 (%)
  color?: string
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image'
  color?: string
  gradient?: GradientConfig
  image?: ImageConfig
}

export interface GradientConfig {
  from: string
  to: string
  direction: number // 角度（0-360度）
  type?: 'linear' | 'radial'
}

export interface ImageConfig {
  src: string
  fit: 'cover' | 'contain' | 'fill' | 'tile'
  opacity?: number
  blur?: number
}

export interface Presentation {
  id: string
  title: string
  description?: string
  author?: string
  theme: PresentationTheme
  slides: Slide[]
  settings: PresentationSettings
  createdAt: Date
  updatedAt: Date
}

export interface PresentationTheme {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontSize: {
    title: number
    subtitle: number
    body: number
  }
}

export interface PresentationSettings {
  aspectRatio: '16:9' | '4:3' | '16:10'
  slideSize: {
    width: number
    height: number
  }
  autoSave: boolean
  transitions: boolean
  animationDuration: number
}

// 型ガード関数
export const isSlide = (obj: any): obj is Slide => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    Array.isArray(obj.elements) &&
    obj.layout &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  )
}

export const isContentElement = (obj: any): obj is ContentElement => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    obj.position &&
    obj.size &&
    obj.props
  )
}
