import { Modal, Button } from 'flowbite-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import JSONViewer from '@renderer/components/JSONViewer'
import type { Tool } from '@aws-sdk/client-bedrock-runtime'

interface ToolSpecJsonModalProps {
  isOpen: boolean
  onClose: () => void
  toolName: string
  toolSpec: Tool['toolSpec'] | undefined
}

const ToolSpecJsonModal = memo(
  ({ isOpen, onClose, toolName, toolSpec }: ToolSpecJsonModalProps) => {
    const { t } = useTranslation()

    return (
      <Modal
        dismissible
        size="4xl"
        show={isOpen}
        onClose={onClose}
        className="dark:bg-gray-800 border border-gray-200 dark:border-gray-500 shadow-lg dark:shadow-gray-900/50"
      >
        <Modal.Header className="border-b border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <span>{toolName}</span>
            <span className="text-gray-500 dark:text-gray-400">- Tool Specification</span>
          </div>
        </Modal.Header>

        <Modal.Body className="dark:bg-gray-800 rounded-b-lg">
          <div className="w-full">
            {toolSpec ? (
              <JSONViewer
                data={toolSpec}
                title={t('Tool Specification (JSON)')}
                maxHeight="500px"
                showCopyButton={true}
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('No tool specification available')}
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="dark:bg-gray-800 dark:border-t dark:border-gray-600 rounded-b-lg">
          <Button
            onClick={onClose}
            className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          >
            {t('Close')}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
)

ToolSpecJsonModal.displayName = 'ToolSpecJsonModal'

export default ToolSpecJsonModal
