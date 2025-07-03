import React from 'react'
import { VscGripper } from 'react-icons/vsc'
import { useResize } from './hooks/useResize'

type ResizableContainerProps = {
  children: React.ReactNode
  initialHeight?: number
  minHeight?: number
  maxHeight?: number
  className?: string
}

export const ResizableContainer: React.FC<ResizableContainerProps> = ({
  children,
  initialHeight = 800,
  minHeight = 200,
  maxHeight = 1800,
  className = ''
}) => {
  const { height, isResizing, handleMouseDown, containerRef } = useResize({
    initialHeight,
    minHeight,
    maxHeight
  })

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Content area with dynamic height */}
      <div style={{ height: `${height}px` }} className="overflow-hidden h-full">
        {children}
      </div>

      {/* Resize handle */}
      <div
        className={`flex items-center justify-center h-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 cursor-ns-resize hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
          isResizing ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      >
        <VscGripper
          size={12}
          className={`text-gray-400 dark:text-gray-500 ${isResizing ? 'text-blue-500' : ''}`}
        />
      </div>

      {/* Height indicator - shown during resize */}
      {isResizing && (
        <div className="absolute right-2 bottom-4 bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 rounded pointer-events-none z-10">
          {height}px
        </div>
      )}
    </div>
  )
}

export default ResizableContainer
