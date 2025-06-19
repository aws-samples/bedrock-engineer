import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlideTemplate,
  getAllCategories,
  getCategoryDisplayName,
  getTemplatesByCategory
} from '../templates/templates'
import { FiCheck, FiEye } from 'react-icons/fi'
import {
  HiOutlineOfficeBuilding,
  HiOutlineAcademicCap,
  HiOutlineColorSwatch,
  HiOutlineDocumentText
} from 'react-icons/hi'

interface TemplateSelectorProps {
  selectedTemplateId?: string
  onSelect: (template: SlideTemplate) => void
  onPreview?: (template: SlideTemplate) => void
  isOpen: boolean
  onClose: () => void
}

const getCategoryIcon = (category: SlideTemplate['category']) => {
  const iconProps = { className: 'w-5 h-5' }

  switch (category) {
    case 'business':
      return <HiOutlineOfficeBuilding {...iconProps} />
    case 'education':
      return <HiOutlineAcademicCap {...iconProps} />
    case 'creative':
      return <HiOutlineColorSwatch {...iconProps} />
    case 'simple':
      return <HiOutlineDocumentText {...iconProps} />
    default:
      return <HiOutlineDocumentText {...iconProps} />
  }
}

const getCategoryColor = (category: SlideTemplate['category']) => {
  switch (category) {
    case 'business':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'education':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'creative':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'simple':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const TemplateCard: React.FC<{
  template: SlideTemplate
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
}> = ({ template, isSelected, onSelect, onPreview }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
    >
      {/* テンプレートプレビュー領域 */}
      <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center relative overflow-hidden">
        {/* 簡単なプレビュー表示 */}
        <div className="w-full h-full p-2 bg-white rounded shadow-sm">
          <div className="text-xs font-bold mb-1 truncate">
            {template.slides[0]?.title || template.name}
          </div>
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1 bg-gray-300 rounded"
                style={{ width: `${100 - i * 10}%` }}
              />
            ))}
          </div>
        </div>

        {/* プレビューボタン */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <FiEye className="w-3 h-3" />
        </button>
      </div>

      {/* テンプレート情報 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-800 truncate">{template.name}</h3>
          {isSelected && (
            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>

        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 rounded-full text-xs border ${getCategoryColor(template.category)}`}
          >
            <span className="flex items-center gap-1">
              {getCategoryIcon(template.category)}
              {getCategoryDisplayName(template.category)}
            </span>
          </span>

          <span className="text-xs text-gray-500">{template.slides.length} スライド</span>
        </div>
      </div>
    </motion.div>
  )
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelect,
  onPreview,
  isOpen,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SlideTemplate['category']>('business')
  const categories = getAllCategories()

  const handleTemplateSelect = (template: SlideTemplate) => {
    onSelect(template)
    onClose()
  }

  const handleTemplatePreview = (template: SlideTemplate) => {
    if (onPreview) {
      onPreview(template)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">テンプレートを選択</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* カテゴリータブ */}
          <div className="px-6 pt-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      selectedCategory === category
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {getCategoryIcon(category)}
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>
          </div>

          {/* テンプレートグリッド */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getTemplatesByCategory(selectedCategory).map((template) => (
                <div key={template.id} className="group">
                  <TemplateCard
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onSelect={() => handleTemplateSelect(template)}
                    onPreview={() => handleTemplatePreview(template)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* フッター */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                テンプレートを選択してプレゼンテーションを開始しましょう
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
