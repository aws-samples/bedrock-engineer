import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { Loader } from '@renderer/components/Loader'
import { FiImage, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { getImageGenerationModelsForRegion } from '@/common/models/models'
import { BedrockSupportRegion } from '@/types/llm'

type AspectRatio = '1:1' | '16:9' | '2:3' | '3:2' | '4:5' | '5:4' | '9:16' | '9:21'
type OutputFormat = 'png' | 'jpeg' | 'webp'

interface ImageSize {
  label: string
  aspectRatio: AspectRatio
  width: number
  height: number
}

const IMAGE_SIZES: ImageSize[] = [
  { label: '1024×1024 (1:1)', aspectRatio: '1:1', width: 1024, height: 1024 },
  { label: '512×512 (1:1)', aspectRatio: '1:1', width: 512, height: 512 },
  { label: '1024×576 (16:9)', aspectRatio: '16:9', width: 1024, height: 576 },
  { label: '1280×720 (16:9)', aspectRatio: '16:9', width: 1280, height: 720 },
  { label: '576×1024 (9:16)', aspectRatio: '9:16', width: 576, height: 1024 },
  { label: '720×1280 (9:16)', aspectRatio: '9:16', width: 720, height: 1280 },
  { label: '1024×768 (4:3)', aspectRatio: '4:5', width: 1024, height: 768 },
  { label: '768×1024 (3:4)', aspectRatio: '5:4', width: 768, height: 1024 },
  { label: '1152×768 (3:2)', aspectRatio: '3:2', width: 1152, height: 768 },
  { label: '768×1152 (2:3)', aspectRatio: '2:3', width: 768, height: 1152 }
]

interface GeneratedImageData {
  base64: string
  prompt: string
  seed?: number
  aspectRatio: AspectRatio
  size?: string
}

export default function ImageGeneratorPage() {
  const { t } = useTranslation()
  const { projectPath } = useSetting()
  const { generateImageModel, setGenerateImageModel, awsRegion } = useSettings()

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [selectedSize, setSelectedSize] = useState<ImageSize>(IMAGE_SIZES[0])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageData | null>(null)
  const [imageHistory, setImageHistory] = useState<GeneratedImageData[]>([])
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const models = getImageGenerationModelsForRegion(awsRegion as BedrockSupportRegion)
    setAvailableModels(models)
  }, [awsRegion])

  const sortedModels = useMemo(() => {
    return [...availableModels].sort((a, b) => {
      const aIsAmazon = a.id.startsWith('amazon.')
      const bIsAmazon = b.id.startsWith('amazon.')
      if (aIsAmazon && !bIsAmazon) return -1
      if (!aIsAmazon && bIsAmazon) return 1
      return a.name.localeCompare(b.name)
    })
  }, [availableModels])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error(t('imageGenerator.promptRequired', 'Please enter a prompt'))
      return
    }

    setLoading(true)
    try {
      const timestamp = Date.now()
      const outputPath = projectPath
        ? `${projectPath}/generated-images/image-${timestamp}.${outputFormat}`
        : `/tmp/bedrock-engineer/generated-images/image-${timestamp}.${outputFormat}`

      const result = await window.api.bedrock.executeTool({
        type: 'generateImage',
        prompt: prompt.trim(),
        outputPath,
        modelId: generateImageModel as any,
        negativePrompt: negativePrompt.trim() || undefined,
        aspect_ratio: selectedSize.aspectRatio,
        output_format: outputFormat
      })

      // Handle both string and ToolResult responses
      if (typeof result === 'string') {
        toast.error(result)
        return
      }

      if (result.success) {
        // Load the generated image as base64 for display
        const imageData = await window.api.images.getLocalImage(result.result.imagePath)
        const newImage: GeneratedImageData = {
          base64: imageData,
          prompt: prompt.trim(),
          seed: result.result.seed,
          aspectRatio: selectedSize.aspectRatio,
          size: selectedSize.label
        }
        setGeneratedImage(newImage)
        setImageHistory((prev) => [newImage, ...prev].slice(0, 10))
        toast.success(t('imageGenerator.success', 'Image generated successfully'))
      } else {
        toast.error(result.message || t('imageGenerator.error', 'Failed to generate image'))
      }
    } catch (error) {
      console.error('Image generation error:', error)
      toast.error(
        error instanceof Error ? error.message : t('imageGenerator.error', 'Failed to generate image')
      )
    } finally {
      setLoading(false)
    }
  }, [prompt, negativePrompt, selectedSize, outputFormat, projectPath, generateImageModel, t])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !loading) {
      handleGenerate()
    }
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel - Controls */}
      <div className="w-96 border-r dark:border-gray-700 p-4 overflow-y-auto bg-white dark:bg-gray-800">
        <h1 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
          <FiImage />
          {t('imageGenerator.title', 'Image Generator')}
        </h1>

        <div className="space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              {t('imageGenerator.prompt', 'Prompt')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('imageGenerator.promptPlaceholder', 'Describe the image you want to generate...')}
              className="w-full h-32 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              disabled={loading}
            />
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              {t('imageGenerator.negativePrompt', 'Negative Prompt')}
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={t('imageGenerator.negativePromptPlaceholder', 'Things to exclude from the image...')}
              className="w-full h-20 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              disabled={loading}
            />
          </div>

          {/* Image Size */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              {t('imageGenerator.imageSize', 'Image Size')}
            </label>
            <select
              value={IMAGE_SIZES.findIndex((s) => s.label === selectedSize.label)}
              onChange={(e) => setSelectedSize(IMAGE_SIZES[parseInt(e.target.value)])}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            >
              {IMAGE_SIZES.map((size, idx) => (
                <option key={idx} value={idx}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* Output Format */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              {t('imageGenerator.outputFormat', 'Output Format')}
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              {t('imageGenerator.modelInfo', 'Model')}
            </label>
            <select
              value={generateImageModel}
              onChange={(e) => setGenerateImageModel(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            >
              {sortedModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader />
                {t('imageGenerator.generating', 'Generating...')}
              </>
            ) : (
              <>
                <FiRefreshCw />
                {t('imageGenerator.generate', 'Generate Image')}
              </>
            )}
          </button>

          {/* History */}
          {imageHistory.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                {t('imageGenerator.history', 'Recent')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {imageHistory.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGeneratedImage(img)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      generatedImage === img ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={img.base64}
                      alt={img.prompt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        {generatedImage ? (
          <div className="max-w-full max-h-full flex flex-col items-center gap-4">
            <img
              src={generatedImage.base64}
              alt={generatedImage.prompt}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            />
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                {generatedImage.prompt}
              </p>
              {generatedImage.seed && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Seed: {generatedImage.seed}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <FiImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t('imageGenerator.noImage', 'Generated images will appear here')}</p>
            <p className="text-sm mt-2">
              {t('imageGenerator.hint', 'Press ⌘+Enter to generate')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
