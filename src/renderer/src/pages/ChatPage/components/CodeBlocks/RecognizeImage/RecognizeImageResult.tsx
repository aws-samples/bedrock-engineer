import React, { useState } from 'react'
import LocalImage from '@renderer/components/LocalImage'
import { useTranslation } from 'react-i18next'

export interface RecognizeImageResponse {
  success: boolean
  name: string
  message: string
  result: {
    images: Array<{
      path: string
      description: string
      success: boolean
    }>
    modelUsed: string
  }
}

export const RecognizeImageResult: React.FC<{ response: RecognizeImageResponse }> = ({
  response
}) => {
  const { t } = useTranslation()
  const { result } = response
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showAllImages, setShowAllImages] = useState(false)

  // 単一画像の場合は従来の表示方法を使用
  const isSingleImage = result.images.length === 1

  // アクティブな画像を取得
  const activeImage = result.images[activeImageIndex]

  // 単一の画像表示コンポーネント
  const renderSingleImageView = (
    image: { path: string; description: string; success: boolean },
    index: number
  ) => (
    <div
      key={`image-${index}`}
      className="flex flex-col md:flex-row gap-4 bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-hidden shadow-sm border border-gray-700 dark:border-gray-800 mb-4"
    >
      {/* 左側：画像表示 */}
      <div className="flex-shrink-0 md:w-1/3">
        <LocalImage
          src={image.path}
          alt={'Analyzed image'}
          className="aspect-auto h-[25vh] object-contain"
        />
        <div className="mt-2 text-xs text-gray-400 truncate" title={image.path}>
          {image.path}
        </div>
      </div>

      {/* 右側：解析結果 */}
      <div className="flex-1 h-[25vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-2">
          {!isSingleImage && `Image ${index + 1}: `}
          {t('Image Analysis')}
        </h3>

        {!image.success ? (
          <div className="bg-red-900/20 text-red-400 p-3 rounded-md">
            <p className="whitespace-pre-wrap">Error analyzing this image: {image.description}</p>
          </div>
        ) : (
          <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded-md">
            <p className="text-gray-300 whitespace-pre-wrap">{image.description}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {/* タブナビゲーションとコントロール - 複数画像かつ全表示モードでない場合 */}
      {!isSingleImage && (
        <div className="mb-4">
          <div className="flex flex-wrap justify-between items-center mb-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {result.images.map((_, index) => (
                <button
                  key={`tab-${index}`}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    activeImageIndex === index && !showAllImages
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                  onClick={() => {
                    setActiveImageIndex(index)
                    setShowAllImages(false)
                  }}
                  disabled={showAllImages}
                >
                  Image {index + 1}
                  {!result.images[index].success && ' ⚠️'}
                </button>
              ))}
            </div>

            <button
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                showAllImages
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
              onClick={() => setShowAllImages(!showAllImages)}
            >
              {showAllImages ? 'Show One by One' : 'Show All'}
            </button>
          </div>
        </div>
      )}

      {/* 画像と解析結果の表示 */}
      {showAllImages ? (
        // すべての画像を一度に表示
        <div>{result.images.map((image, index) => renderSingleImageView(image, index))}</div>
      ) : (
        // アクティブな画像のみを表示
        renderSingleImageView(activeImage, activeImageIndex)
      )}

      {/* モデル情報（共通フッター） */}
      <div className="mt-2 text-xs text-gray-400 text-right">
        {t('Analyzed with')}: <span className="font-mono">{result.modelUsed}</span>
      </div>
    </div>
  )
}
