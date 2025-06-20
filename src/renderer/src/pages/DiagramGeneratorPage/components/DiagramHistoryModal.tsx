import { Fragment, useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useDiagramHistory } from '../hooks/useDiagramHistory'
import { motion } from 'framer-motion'
import { DrawIoEmbed } from 'react-drawio'

interface DiagramHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSession: (sessionId: string) => void
}

export function DiagramHistoryModal({
  isOpen,
  onClose,
  onSelectSession
}: DiagramHistoryModalProps) {
  const { getDiagramSessions, getDiagramFromSession, truncateExplanation } = useDiagramHistory()

  // ホバー時の遅延ロード状態管理
  const [hoveredCards, setHoveredCards] = useState<Set<string>>(new Set())
  const [loadedPreviews, setLoadedPreviews] = useState<Set<string>>(new Set())

  const diagramSessions = getDiagramSessions()

  const handleSessionSelect = (sessionId: string) => {
    onSelectSession(sessionId)
    onClose()
  }

  // カードホバー開始
  const handleCardMouseEnter = useCallback((sessionId: string) => {
    setHoveredCards((prev) => new Set([...prev, sessionId]))
  }, [])

  // カードホバー終了
  const handleCardMouseLeave = useCallback((sessionId: string) => {
    setHoveredCards((prev) => {
      const newSet = new Set(prev)
      newSet.delete(sessionId)
      return newSet
    })
  }, [])

  // プレビューの遅延ロード処理
  const handlePreviewLoad = useCallback((sessionId: string) => {
    setLoadedPreviews((prev) => new Set([...prev, sessionId]))
  }, [])

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-4 sm:w-[98%] sm:max-w-[98%] sm:max-h-full sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ClockIcon
                      className="h-6 w-6 text-blue-600 dark:text-blue-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900 dark:text-white"
                    >
                      Diagram History
                    </Dialog.Title>
                    <div className="mt-4">
                      {diagramSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                            No diagram history
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Create your first diagram to see it here.
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {diagramSessions.map((session, index) => {
                              const diagramData = getDiagramFromSession(session.id)
                              const explanation =
                                diagramData?.explanation || 'No explanation available'
                              const truncatedExplanation = truncateExplanation(explanation, 100)

                              // プレビュー表示の判定（ホバー中または既にロード済み）
                              const isHovered = hoveredCards.has(session.id)
                              const isLoaded = loadedPreviews.has(session.id)
                              const shouldShowPreview = isHovered || isLoaded

                              return (
                                <motion.div
                                  key={session.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer p-4"
                                  onClick={() => handleSessionSelect(session.id)}
                                  onMouseEnter={() => handleCardMouseEnter(session.id)}
                                  onMouseLeave={() => handleCardMouseLeave(session.id)}
                                >
                                  <div className="space-y-4">
                                    {/* プレビューエリア */}
                                    <div className="w-full">
                                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 h-80 overflow-hidden">
                                        {shouldShowPreview && diagramData?.xml ? (
                                          <div className="w-full h-full">
                                            <DrawIoEmbed
                                              xml={diagramData.xml}
                                              configuration={{
                                                toolbar: false,
                                                sidebarWidth: 0,
                                                editable: false,
                                                fitContainer: true,
                                                zoom: 0.3
                                              }}
                                              urlParameters={{
                                                dark: window.matchMedia(
                                                  '(prefers-color-scheme: dark)'
                                                ).matches,
                                                ui: 'min'
                                              }}
                                              onLoad={() => handlePreviewLoad(session.id)}
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                            <DocumentTextIcon className="w-12 h-12 mb-2" />
                                            {!shouldShowPreview && diagramData?.xml && (
                                              <p className="text-xs text-center">
                                                Hover to preview diagram
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* コンテンツエリア */}
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 pr-2">
                                          {session.title}
                                        </h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                                          {new Date(session.updatedAt).toLocaleDateString()}
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        {diagramData?.diagramMode && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {diagramData.diagramMode === 'aws' && 'AWS'}
                                            {diagramData.diagramMode === 'software-architecture' &&
                                              'Software'}
                                            {diagramData.diagramMode === 'business-process' &&
                                              'Business'}
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {session.messageCount} messages
                                        </span>
                                      </div>

                                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                                        {truncatedExplanation}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
