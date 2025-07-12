import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCloseLine } from 'react-icons/ri'
import { FiCode, FiCpu, FiZap } from 'react-icons/fi'

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
            <div className="space-y-8">
              {/* Main Use Cases */}
              <div>
                <h3 className="text-xl font-semibold mb-6 dark:text-white text-center">
                  {t('backgroundAgent.help.useCases.title')}
                </h3>
                <div className="space-y-6">
                  {/* Development Tasks */}
                  <div className="flex items-start p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm transition-shadow">
                    <div className="flex-shrink-0 mr-6">
                      <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                        <FiCode className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-3 dark:text-white">
                        {t('backgroundAgent.help.useCases.development.title')}
                      </h4>
                      <p className="text-sm dark:text-gray-300 leading-relaxed">
                        {t('backgroundAgent.help.useCases.development.description')}
                      </p>
                    </div>
                  </div>

                  {/* Workflow Support */}
                  <div className="flex items-start p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm transition-shadow">
                    <div className="flex-shrink-0 mr-6">
                      <div className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                        <FiCpu className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-3 dark:text-white">
                        {t('backgroundAgent.help.useCases.workflow.title')}
                      </h4>
                      <p className="text-sm dark:text-gray-300 leading-relaxed">
                        {t('backgroundAgent.help.useCases.workflow.description')}
                      </p>
                    </div>
                  </div>

                  {/* Business Automation */}
                  <div className="flex items-start p-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl shadow-sm transition-shadow">
                    <div className="flex-shrink-0 mr-6">
                      <div className="w-16 h-16 bg-orange-500 dark:bg-orange-600 rounded-full flex items-center justify-center">
                        <FiZap className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-3 dark:text-white">
                        {t('backgroundAgent.help.useCases.business.title')}
                      </h4>
                      <p className="text-sm dark:text-gray-300 leading-relaxed">
                        {t('backgroundAgent.help.useCases.business.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompt Tips */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-6 rounded-xl">
                <h4 className="font-semibold mb-3 dark:text-white flex items-center">
                  <FiCode className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
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
