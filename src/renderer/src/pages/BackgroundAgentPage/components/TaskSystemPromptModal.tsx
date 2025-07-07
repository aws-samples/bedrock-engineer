import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'flowbite-react'
import MD from '@renderer/components/Markdown/MD'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface TaskSystemPromptModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string | null
  taskName?: string
  getTaskSystemPrompt: (taskId: string) => Promise<string>
}

export const useTaskSystemPromptModal = () => {
  const [show, setShow] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskName, setTaskName] = useState<string>('')

  const handleOpen = (id: string, name?: string) => {
    setTaskId(id)
    setTaskName(name || '')
    setShow(true)
  }

  const handleClose = () => {
    setShow(false)
    setTaskId(null)
    setTaskName('')
  }

  return {
    show,
    taskId,
    taskName,
    handleOpen,
    handleClose,
    TaskSystemPromptModal
  }
}

const TaskSystemPromptModal = React.memo(
  ({ isOpen, onClose, taskId, taskName, getTaskSystemPrompt }: TaskSystemPromptModalProps) => {
    const { t } = useTranslation()
    const [systemPrompt, setSystemPrompt] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // タスクIDが変更されたときにシステムプロンプトを取得
    useEffect(() => {
      const fetchSystemPrompt = async () => {
        if (!isOpen || !taskId) return

        try {
          setIsLoading(true)
          setError(null)
          const prompt = await getTaskSystemPrompt(taskId)
          setSystemPrompt(prompt)
        } catch (err: any) {
          console.error('Failed to fetch system prompt:', err)
          setError(err.message || t('backgroundAgent.errors.getSystemPrompt'))
        } finally {
          setIsLoading(false)
        }
      }

      fetchSystemPrompt()
    }, [isOpen, taskId, getTaskSystemPrompt, t])

    // モーダルが閉じられたときにステートをクリア
    useEffect(() => {
      if (!isOpen) {
        setSystemPrompt('')
        setError(null)
      }
    }, [isOpen])

    if (!isOpen) return null

    return (
      <Modal dismissible show={isOpen} onClose={onClose} size="7xl" className="dark:bg-gray-900">
        <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
          <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <span>{t('backgroundAgent.systemPrompt.title')}</span>
              {taskName && (
                <span className="text-sm text-gray-500 dark:text-gray-400">- {taskName}</span>
              )}
            </div>
          </Modal.Header>
          <Modal.Body className="p-0 bg-white dark:bg-gray-900 rounded-b-lg">
            <div className="p-6 dark:text-white">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 h-[70vh]">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {t('backgroundAgent.systemPrompt.loading')}
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 h-[70vh]">
                  <div className="text-center">
                    <div className="text-red-600 dark:text-red-400 mb-2">
                      {t('backgroundAgent.systemPrompt.error')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{error}</div>
                  </div>
                </div>
              ) : systemPrompt ? (
                <div className="h-[70vh] overflow-y-auto">
                  <MD>{systemPrompt}</MD>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 h-[70vh]">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    {t('backgroundAgent.systemPrompt.empty')}
                  </div>
                </div>
              )}
            </div>
          </Modal.Body>
        </div>
      </Modal>
    )
  }
)

TaskSystemPromptModal.displayName = 'TaskSystemPromptModal'
