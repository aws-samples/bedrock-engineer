import React from 'react'
import { motion } from 'framer-motion'

interface SlidePrompt {
  title: string
  value: string
}

interface SlidePromptButtonsProps {
  onSelect: (value: string) => void
}

const slidePrompts: SlidePrompt[] = [
  {
    title: '営業報告',
    value:
      '四半期の営業実績報告用のプレゼンテーションスライドを作成してください。売上目標、達成率、主要顧客、課題と改善策を含めてください。'
  },
  {
    title: '製品紹介',
    value:
      '新製品の特徴、メリット、競合比較、価格設定を含む製品紹介プレゼンテーションを作成してください。'
  },
  {
    title: '企画提案',
    value:
      '新規事業企画の提案書として、背景、目的、実施計画、期待効果、必要リソースを含むスライドを作成してください。'
  },
  {
    title: '研修資料',
    value:
      '社内研修用の教育資料として、学習目標、重要ポイント、実践例、まとめを含むスライドを作成してください。'
  },
  {
    title: '会社紹介',
    value:
      '会社概要、事業内容、強み・特徴、実績、今後の展望を含む会社紹介プレゼンテーションを作成してください。'
  },
  {
    title: '月次報告',
    value:
      '月次業績報告として、KPI達成状況、主要な成果、課題、来月の取り組み計画を含むスライドを作成してください。'
  }
]

export const SlidePromptButtons: React.FC<SlidePromptButtonsProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-nowrap gap-2 min-w-0 whitespace-nowrap overflow-x-auto pb-2">
      {slidePrompts.map((prompt, index) => (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          key={prompt.title}
          className="cursor-pointer rounded-full border p-2 text-xs hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:border-gray-600 whitespace-nowrap flex-shrink-0 dark:text-white dark:border-gray-600"
          onClick={() => onSelect(prompt.value)}
        >
          {prompt.title}
        </motion.button>
      ))}
    </div>
  )
}
