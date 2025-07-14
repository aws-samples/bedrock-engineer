import React, { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaTimes, FaSync } from 'react-icons/fa'
import { FaListCheck } from 'react-icons/fa6'

// Todo types (matching preload types)
export interface TodoItem {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface TodoList {
  id: string
  items: TodoItem[]
  createdAt: string
  updatedAt: string
}

interface TodoModalProps {
  isOpen: boolean
  onClose: () => void
  todoList?: TodoList | null
  onRefresh?: () => void
  loading?: boolean
}

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <FaClock className="text-yellow-500 dark:text-yellow-400" />
    case 'in_progress':
      return <FaSpinner className="text-blue-500 dark:text-blue-400 animate-spin" />
    case 'completed':
      return <FaCheckCircle className="text-green-500 dark:text-green-400" />
    case 'cancelled':
      return <FaTimesCircle className="text-red-500 dark:text-red-400" />
    default:
      return <FaClock className="text-gray-500 dark:text-gray-400" />
  }
}

// Todo Floating Window Component
export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  todoList,
  onRefresh,
  loading
}) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-hidden transform transition-all duration-200 ease-in-out opacity-100">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <FaListCheck className="text-blue-600 dark:text-blue-400" size={16} />
            <span className="font-semibold text-gray-900 dark:text-white">{t('TODO List')}</span>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                title={t('common.refresh')}
              >
                <FaSync
                  className={`text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`}
                  size={12}
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FaTimes className="text-gray-500 dark:text-gray-400" size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {!todoList || !todoList.items.length ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 dark:text-gray-400">
              <FaListCheck className="text-3xl mb-2 text-gray-300 dark:text-gray-600" />
              <h3 className="font-medium mb-1">{t('No TODO List Available')}</h3>
              <p className="text-xs">
                {t('Create a TODO list using the todoInit tool to see tasks here.')}
              </p>
            </div>
          ) : (
            // Simple task list
            <div className="space-y-2">
              {todoList.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>
                  <span className="flex-grow text-sm text-gray-900 dark:text-white truncate">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Custom hook for todo modal with real-time updates
export const useTodoModal = (messages?: any[]) => {
  const [show, setShow] = useState(false)
  const [todoList, setTodoList] = useState<TodoList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTodoList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.api.todo.getTodoList()
      setTodoList(data)
    } catch (err) {
      console.error('Failed to fetch TODO list:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch TODO list')
      setTodoList(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh when messages change (indicating tool execution)
  useEffect(() => {
    if (show && messages) {
      // Debounce the refresh to avoid excessive API calls
      const timer = setTimeout(() => {
        fetchTodoList()
      }, 1000) // 1 second delay

      return () => clearTimeout(timer)
    }
    return undefined
  }, [messages?.length, show, fetchTodoList])

  // Periodic refresh when modal is open
  useEffect(() => {
    if (!show) return

    const interval = setInterval(() => {
      fetchTodoList()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [show, fetchTodoList])

  const handleOpen = useCallback(
    async (list?: TodoList | null) => {
      if (list) {
        setTodoList(list)
      } else {
        // Fetch from API if no data provided
        await fetchTodoList()
      }
      setShow(true)
    },
    [fetchTodoList]
  )

  const handleClose = useCallback(() => {
    setShow(false)
    setError(null)
  }, [])

  const handleRefresh = useCallback(() => {
    fetchTodoList()
  }, [fetchTodoList])

  return {
    show,
    todoList,
    loading,
    error,
    handleOpen,
    handleClose,
    fetchTodoList,
    handleRefresh,
    TodoModal: (props: Omit<TodoModalProps, 'todoList' | 'onRefresh' | 'loading'>) => (
      <TodoModal {...props} todoList={todoList} onRefresh={handleRefresh} loading={loading} />
    )
  }
}
