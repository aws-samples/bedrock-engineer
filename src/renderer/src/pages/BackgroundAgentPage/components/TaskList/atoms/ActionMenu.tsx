import React, { useState, useEffect, useRef } from 'react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'

interface ActionMenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  separator?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  title?: string
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items, title = 'More actions' }) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setShowMenu(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        title={title}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
          <div className="py-1">
            {items.map((item, index) => (
              <React.Fragment key={item.key}>
                {item.separator && index > 0 && (
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                )}
                <button
                  onClick={() => handleItemClick(item)}
                  className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                    item.variant === 'danger'
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
