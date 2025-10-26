import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  VscCode,
  VscEye,
  VscZoomIn,
  VscZoomOut,
  VscScreenFull,
  VscCloudDownload
} from 'react-icons/vsc'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Mermaid } from './Mermaid'
import { ResizableContainer } from './ResizableContainer'
import mermaid from 'mermaid'

type MermaidBlockProps = {
  code: string
  className?: string
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code, className = '' }) => {
  const { t } = useTranslation()
  const [isPreviewMode, setIsPreviewMode] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)

  const toggleMode = () => {
    setIsPreviewMode(!isPreviewMode)
  }

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    setZoomLevel(1)
  }

  const downloadAsPNG = async () => {
    try {
      // MermaidからSVGを生成
      const { svg } = await mermaid.render(`download-${Date.now()}`, code)

      // SVGのサイズを正確に取得
      const parser = new DOMParser()
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
      const svgElement = svgDoc.querySelector('svg')

      let width = 800
      let height = 600

      if (svgElement) {
        // width/height属性があれば使用
        const svgWidth = svgElement.getAttribute('width')
        const svgHeight = svgElement.getAttribute('height')

        if (svgWidth && svgHeight) {
          width = parseFloat(svgWidth.replace('px', ''))
          height = parseFloat(svgHeight.replace('px', ''))
        } else {
          // viewBox属性からサイズを取得
          const viewBox = svgElement.getAttribute('viewBox')
          if (viewBox) {
            const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number)
            width = vbWidth || 800
            height = vbHeight || 600
          }
        }
      }

      // 高解像度レンダリング（3倍解像度）
      const scale = 3
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 高解像度でcanvasサイズを設定
        canvas.width = width * scale
        canvas.height = height * scale

        // コンテキストをスケール
        if (ctx) {
          ctx.scale(scale, scale)

          // 白い背景を追加
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, width, height)

          // 高画質レンダリング設定
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // SVGをcanvasに描画
          ctx.drawImage(img, 0, 0, width, height)
        }

        // PNGとしてダウンロード
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `mermaid-diagram-${Date.now()}.png`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }
          },
          'image/png',
          1.0
        ) // 最高品質で出力
      }

      img.onerror = () => {
        console.error('Failed to load SVG image for PNG conversion')
      }

      // SVGをData URLに直接変換（Blob URLではなく）
      const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
      img.src = svgDataUrl
    } catch (error) {
      console.error('Failed to download PNG:', error)
    }
  }

  return (
    <div
      className={`my-4 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}
    >
      {/* Header with toggle buttons */}
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-600">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mermaid</span>
        <div className="flex items-center space-x-2">
          {/* Zoom controls and download button - only show in preview mode */}
          {isPreviewMode && (
            <>
              <button
                onClick={downloadAsPNG}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Download as PNG"
              >
                <VscCloudDownload size={14} />
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <VscZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <VscZoomIn size={14} />
              </button>
              <button
                onClick={resetZoom}
                className="p-1 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Reset Zoom"
              >
                <VscScreenFull size={14} />
              </button>
            </>
          )}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={toggleMode}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              !isPreviewMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <VscCode size={12} />
            <span>{t('Source')}</span>
          </button>
          <button
            onClick={toggleMode}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
              isPreviewMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <VscEye size={12} />
            <span>{t('Preview')}</span>
          </button>
        </div>
      </div>

      {/* Resizable Content area */}
      <ResizableContainer initialHeight={800} minHeight={200} maxHeight={800}>
        {/* Preview mode - always rendered but hidden when not in preview mode */}
        <div
          className={`h-full bg-white dark:bg-gray-900 overflow-auto border-0 ${
            isPreviewMode ? 'block' : 'hidden'
          }`}
        >
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              minWidth: `${100 * zoomLevel}%`,
              minHeight: `${100 * zoomLevel}%`,
              padding: '1rem'
            }}
            className="transition-transform duration-200"
          >
            <Mermaid chart={code} />
          </div>
        </div>

        {/* Source mode - always rendered but hidden when in preview mode */}
        <div
          className={`h-full bg-gray-50 dark:bg-gray-900 overflow-auto ${
            isPreviewMode ? 'hidden' : 'block'
          }`}
        >
          <SyntaxHighlighter
            language="mermaid"
            style={tomorrow}
            showLineNumbers
            wrapLines
            className="!m-0 !bg-transparent h-full"
            customStyle={{
              background: 'transparent',
              padding: '1rem',
              height: '100%'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </ResizableContainer>
    </div>
  )
}

export default MermaidBlock
