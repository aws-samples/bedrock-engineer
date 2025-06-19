// 各要素タイプの共通プロパティ
export type ElementProps = TextProps | ImageProps | ListProps | ChartProps | ShapeProps | TableProps

// テキスト要素のプロパティ
export interface TextProps {
  type: 'text'
  content: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | 'lighter'
  fontStyle?: 'normal' | 'italic'
  color?: string
  backgroundColor?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  letterSpacing?: number
  textDecoration?: 'none' | 'underline' | 'line-through'
  textShadow?: TextShadowConfig
  border?: BorderConfig
  borderRadius?: number
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// 画像要素のプロパティ
export interface ImageProps {
  type: 'image'
  src: string
  alt?: string
  fit?: 'cover' | 'contain' | 'fill' | 'none'
  crop?: CropConfig
  filter?: ImageFilterConfig
  border?: BorderConfig
  borderRadius?: number
  shadow?: ShadowConfig
}

// リスト要素のプロパティ
export interface ListProps {
  type: 'list'
  items: ListItem[]
  listType?: 'bullet' | 'number' | 'none' | 'custom'
  customBullet?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | 'lighter'
  color?: string
  backgroundColor?: string
  lineHeight?: number
  spacing?: number
  indent?: number
  border?: BorderConfig
  borderRadius?: number
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// チャート要素のプロパティ
export interface ChartProps {
  type: 'chart'
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'area'
  data: ChartData
  title?: string
  titleFontSize?: number
  colors?: string[]
  backgroundColor?: string
  showLegend?: boolean
  showGrid?: boolean
  showLabels?: boolean
  border?: BorderConfig
  borderRadius?: number
  shadow?: ShadowConfig
}

// 図形要素のプロパティ
export interface ShapeProps {
  type: 'shape'
  shape: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'star' | 'diamond'
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderRadius?: number
  shadow?: ShadowConfig
  gradient?: GradientConfig
}

// テーブル要素のプロパティ
export interface TableProps {
  type: 'table'
  headers: string[]
  rows: TableRow[]
  headerStyle?: TableCellStyle
  cellStyle?: TableCellStyle
  alternateRowColor?: boolean
  alternateRowColors?: {
    even: string
    odd: string
  }
  border?: BorderConfig
  borderRadius?: number
  shadow?: ShadowConfig
}

// サポート用の型定義

export interface ListItem {
  id: string
  text: string
  level?: number // ネストレベル（0が最上位）
  style?: Partial<TextProps>
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
}

export interface TableRow {
  id: string
  cells: TableCell[]
}

export interface TableCell {
  id: string
  content: string
  colspan?: number
  rowspan?: number
  style?: TableCellStyle
}

export interface TableCellStyle {
  fontSize?: number
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | 'lighter'
  color?: string
  backgroundColor?: string
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  border?: BorderConfig
}

export interface CropConfig {
  x: number // 0-100 (%)
  y: number // 0-100 (%)
  width: number // 0-100 (%)
  height: number // 0-100 (%)
}

export interface ImageFilterConfig {
  brightness?: number // 0-200 (%)
  contrast?: number // 0-200 (%)
  saturation?: number // 0-200 (%)
  hue?: number // 0-360 (degrees)
  blur?: number // 0-10 (px)
  grayscale?: number // 0-100 (%)
  sepia?: number // 0-100 (%)
}

export interface BorderConfig {
  width: number
  style: 'solid' | 'dashed' | 'dotted' | 'double'
  color: string
}

export interface ShadowConfig {
  offsetX: number
  offsetY: number
  blur: number
  spread?: number
  color: string
}

export interface TextShadowConfig {
  offsetX: number
  offsetY: number
  blur: number
  color: string
}

export interface GradientConfig {
  from: string
  to: string
  direction: number // 角度（0-360度）
  type?: 'linear' | 'radial'
}

// 要素タイプ判定用のユーティリティ関数
export const isTextProps = (props: ElementProps): props is TextProps => {
  return props.type === 'text'
}

export const isImageProps = (props: ElementProps): props is ImageProps => {
  return props.type === 'image'
}

export const isListProps = (props: ElementProps): props is ListProps => {
  return props.type === 'list'
}

export const isChartProps = (props: ElementProps): props is ChartProps => {
  return props.type === 'chart'
}

export const isShapeProps = (props: ElementProps): props is ShapeProps => {
  return props.type === 'shape'
}

export const isTableProps = (props: ElementProps): props is TableProps => {
  return props.type === 'table'
}

// デフォルト要素プロパティファクトリー
export const createDefaultTextProps = (): TextProps => ({
  type: 'text',
  content: 'テキストを入力してください',
  fontSize: 16,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  color: '#000000',
  align: 'left',
  verticalAlign: 'top',
  lineHeight: 1.5
})

export const createDefaultImageProps = (): ImageProps => ({
  type: 'image',
  src: '',
  alt: '',
  fit: 'cover'
})

export const createDefaultListProps = (): ListProps => ({
  type: 'list',
  items: [
    { id: '1', text: 'リスト項目 1' },
    { id: '2', text: 'リスト項目 2' },
    { id: '3', text: 'リスト項目 3' }
  ],
  listType: 'bullet',
  fontSize: 16,
  fontFamily: 'Arial',
  color: '#000000',
  lineHeight: 1.5,
  spacing: 8
})

export const createDefaultChartProps = (): ChartProps => ({
  type: 'chart',
  chartType: 'bar',
  data: {
    labels: ['項目1', '項目2', '項目3'],
    datasets: [
      {
        label: 'データセット',
        data: [10, 20, 15],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
      }
    ]
  },
  title: 'チャートタイトル',
  showLegend: true,
  showGrid: true,
  showLabels: true
})

export const createDefaultShapeProps = (): ShapeProps => ({
  type: 'shape',
  shape: 'rectangle',
  fillColor: '#3B82F6',
  borderColor: '#1E40AF',
  borderWidth: 2,
  borderStyle: 'solid'
})

export const createDefaultTableProps = (): TableProps => ({
  type: 'table',
  headers: ['列1', '列2', '列3'],
  rows: [
    {
      id: '1',
      cells: [
        { id: '1-1', content: 'データ1-1' },
        { id: '1-2', content: 'データ1-2' },
        { id: '1-3', content: 'データ1-3' }
      ]
    },
    {
      id: '2',
      cells: [
        { id: '2-1', content: 'データ2-1' },
        { id: '2-2', content: 'データ2-2' },
        { id: '2-3', content: 'データ2-3' }
      ]
    }
  ],
  headerStyle: {
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    align: 'center'
  },
  alternateRowColor: true,
  alternateRowColors: {
    even: '#FFFFFF',
    odd: '#F9FAFB'
  }
})
