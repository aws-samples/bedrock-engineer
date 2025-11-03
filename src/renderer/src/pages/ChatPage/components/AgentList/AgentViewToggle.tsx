import React from 'react'
import { motion } from 'framer-motion'
import { Tooltip } from 'flowbite-react'
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
        className="absolute top-0.5 h-8 w-10 bg-white/60 dark:bg-gray-600/60 rounded shadow-sm"
        animate={{
          x: viewMode === 'table' ? 40 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.3
        }}
      />

      {/* Card View button (Grid icon) */}
      <Tooltip content="Card" placement="bottom" animation="duration-500">
        <button
          onClick={() => onToggle('card')}
          className={`
            relative z-10 flex items-center justify-center
            w-10 h-8 rounded
            transition-colors duration-200
            ${
              viewMode === 'card'
                ? 'text-gray-700 dark:text-gray-200'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }
          `}
        >
          <HiViewGrid size={18} />
        </button>
      </Tooltip>

      {/* Table View button (List icon) */}
      <Tooltip content="Table" placement="bottom" animation="duration-500">
        <button
          onClick={() => onToggle('table')}
          className={`
            relative z-10 flex items-center justify-center
            w-10 h-5 rounded
            transition-colors duration-200
            ${
              viewMode === 'table'
                ? 'text-gray-700 dark:text-gray-200'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
            }
          `}
        >
          <HiViewList size={18} />
        </button>
      </Tooltip>
    </div>
  )
}
