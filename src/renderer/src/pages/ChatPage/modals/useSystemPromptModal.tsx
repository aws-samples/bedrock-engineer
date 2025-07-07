import React, { useState } from 'react'
import MD from '@renderer/components/Markdown/MD'
import { Modal } from 'flowbite-react'

interface SystemPromptModalProps {
  isOpen: boolean
  onClose: () => void
  systemPrompt: string
}

export const useSystemPromptModal = () => {
  const [show, setShow] = useState(false)
  const handleOpen = () => {
    setShow(true)
  }
  const handleClose = () => {
    setShow(false)
  }

  return {
    show: show,
    handleOpen: handleOpen,
    handleClose: handleClose,
    SystemPromptModal: SystemPromptModal
  }
}

const SystemPromptModal = React.memo(
  ({ isOpen, onClose, systemPrompt }: SystemPromptModalProps) => {
    if (!isOpen) return null

    return (
      <Modal dismissible show={isOpen} onClose={onClose} size="7xl" className="dark:bg-gray-900">
        <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
          <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
            SYSTEM PROMPT
          </Modal.Header>
          <Modal.Body className="p-0 bg-white dark:bg-gray-900 rounded-b-lg">
            <div className="p-6 dark:text-white">
              <MD>{systemPrompt}</MD>
            </div>
          </Modal.Body>
        </div>
      </Modal>
    )
  }
)

SystemPromptModal.displayName = 'SystemPromptModal'
