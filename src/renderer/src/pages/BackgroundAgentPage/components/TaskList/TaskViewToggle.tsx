import React from 'react'
import { motion } from 'framer-motion'
import { Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline'

interface TaskViewToggleProps {
  isTableView: boolean
  onToggle: (isTableView: boolean) => void
  className?: string
}

export const TaskViewToggle: React.FC<TaskViewToggleProps> = ({
  isTableView,
  onToggle,
  className = ''
}) => {
  return (
    <div
      className={`
        relative inline-flex items-center
        bg-gray-100 dark:bg-gray-800
        rounded p-1
        border border-gray-200 dark:border-gray-700
        cursor-pointer
        ${className}
      `}
    >
      {/* アニメーション背景 */}
      <motion.div
        className="absolute top-0.5 h-6 w-8 bg-white/60 dark:bg-gray-600/60 rounded shadow-sm"
        animate={{
          x: isTableView ? 32 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
      />

      {/* LIST ボタン (カードアイコン) */}
      <button
        onClick={() => onToggle(false)}
        className={`
          relative z-10 flex items-center justify-center
          w-8 h-5 rounded
          transition-colors duration-200
          ${
            !isTableView
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
          }
        `}
        title="Switch to List View"
      >
        <Squares2X2Icon className="w-5 h-5" />
      </button>

      {/* TABLE ボタン (テーブルアイコン) */}
      <button
        onClick={() => onToggle(true)}
        className={`
          relative z-10 flex items-center justify-center
          w-8 h-5 rounded
          transition-colors duration-200
          ${
            isTableView
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
          }
        `}
        title="Switch to Table View"
      >
        <TableCellsIcon className="w-5 h-5" />
      </button>
    </div>
  )
}
