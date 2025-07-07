import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCloseLine } from 'react-icons/ri'
import { FiCode, FiTarget } from 'react-icons/fi'

export const useBackgroundAgentHelpModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const BackgroundAgentHelpModal = () => {
    // Handle ESC key press to close the modal
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    return isOpen ? (
      <div className="fixed inset-0 z-50 overflow-y-auto" onKeyDown={handleKeyDown}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={closeModal}
              aria-label={t('close')}
            >
              <RiCloseLine size={24} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold dark:text-white">
                {t('backgroundAgent.help.title')}
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {t('backgroundAgent.help.subtitle')}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Main Use Cases */}
              <div>
                <h3 className="text-lg font-medium mb-4 dark:text-white flex items-center">
                  <FiTarget className="w-5 h-5 mr-2 text-blue-500" />
                  {t('backgroundAgent.help.useCases.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 dark:text-white">
                      {t('backgroundAgent.help.useCases.development.title')}
                    </h4>
                    <p className="text-sm dark:text-gray-300 leading-relaxed">
                      {t('backgroundAgent.help.useCases.development.description')}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 dark:text-white">
                      {t('backgroundAgent.help.useCases.maintenance.title')}
                    </h4>
                    <p className="text-sm dark:text-gray-300 leading-relaxed">
                      {t('backgroundAgent.help.useCases.maintenance.description')}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 dark:text-white">
                      {t('backgroundAgent.help.useCases.workflow.title')}
                    </h4>
                    <p className="text-sm dark:text-gray-300 leading-relaxed">
                      {t('backgroundAgent.help.useCases.workflow.description')}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 dark:text-white">
                      {t('backgroundAgent.help.useCases.business.title')}
                    </h4>
                    <p className="text-sm dark:text-gray-300 leading-relaxed">
                      {t('backgroundAgent.help.useCases.business.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prompt Tips */}
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-3 dark:text-white flex items-center">
                  <FiCode className="w-4 h-4 mr-2" />
                  {t('backgroundAgent.help.prompts.title')}
                </h4>
                <p className="text-sm dark:text-gray-300 leading-relaxed">
                  {t('backgroundAgent.help.prompts.description')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700"
                onClick={closeModal}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null
  }

  return {
    BackgroundAgentHelpModal,
    openModal,
    closeModal,
    isOpen
  }
}
