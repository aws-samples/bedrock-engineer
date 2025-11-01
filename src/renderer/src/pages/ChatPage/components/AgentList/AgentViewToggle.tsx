import React from 'react'
import { motion } from 'framer-motion'
import { HiViewGrid, HiViewList } from 'react-icons/hi'

interface AgentViewToggleProps {
  viewMode: 'card' | 'table'
  onToggle: (viewMode: 'card' | 'table') => void
  className?: string
}

export const AgentViewToggle: React.FC<AgentViewToggleProps> = ({
  viewMode,
  onToggle,
  className = ''
}) => {
  return (
    <div
      className={`
        relative inline-flex items-center
        bg-gray-100 dark:bg-gray-800
        rounded p-0.5
        border border-gray-200 dark:border-gray-700
        cursor-pointer
        ${className}
      `}
    >
      {/* Animation background */}
      <motion.div
        className="absolute top-0.5 h-5 w-8 bg-white/60 dark:bg-gray-600/60 rounded shadow-sm"
        animate={{
          x: viewMode === 'table' ? 32 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
      />

      {/* Card View button (Grid icon) */}
      <button
        onClick={() => onToggle('card')}
        className={`
          relative z-10 flex items-center justify-center
          w-8 h-5 rounded
          transition-colors duration-200
          ${
            viewMode === 'card'
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
          }
        `}
        title="Card View"
      >
        <HiViewGrid size={14} />
      </button>

      {/* Table View button (List icon) */}
      <button
        onClick={() => onToggle('table')}
        className={`
          relative z-10 flex items-center justify-center
          w-8 h-5 rounded
          transition-colors duration-200
          ${
            viewMode === 'table'
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
          }
        `}
        title="Table View"
      >
        <HiViewList size={14} />
      </button>
    </div>
  )
}
