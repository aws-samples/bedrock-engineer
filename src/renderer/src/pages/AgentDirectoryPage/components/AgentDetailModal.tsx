import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CustomAgent } from '@/types/agent-chat'
import { BsCheck2Circle } from 'react-icons/bs'
import { RiCloseLine } from 'react-icons/ri'
import { TbRobot } from 'react-icons/tb'
import { HiClipboardCopy } from 'react-icons/hi'
import { getIconByValue } from '@renderer/components/icons/AgentIcons'

interface AgentDetailModalProps {
  agent: CustomAgent
  onClose: () => void
  onAddToMyAgents?: () => void
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onAddToMyAgents
}) => {
  const { t } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState<boolean | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleAddToMyAgents = async () => {
    if (onAddToMyAgents) {
      setIsAdding(true)
      try {
        onAddToMyAgents()
        setAddSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } catch (error) {
        setAddSuccess(false)
        console.error('Error adding agent:', error)
      } finally {
        setIsAdding(false)
      }
    }
  }

  // Handle ESC key press to close the modal
  useEffect(() => {
    const handleEscKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Add event listener when component mounts
    document.addEventListener('keydown', handleEscKeyPress)

    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener('keydown', handleEscKeyPress)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
          >
            <RiCloseLine size={24} />
          </button>

          {/* Header */}
          <div className="flex mb-6 items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-blue-100 dark:bg-blue-900/40">
              {agent.icon ? (
                getIconByValue(agent.icon, agent.iconColor || '#3B82F6') || (
                  <TbRobot className="w-6 h-6" style={{ color: agent.iconColor || '#3B82F6' }} />
                )
              ) : (
                <span className="text-2xl" style={{ color: agent.iconColor || '#3B82F6' }}>
                  👤
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">{agent.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{agent.description}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            {agent.author && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {t('authorLabel')}
                </span>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => open(`https://github.com/${agent.author}`)}
                >
                  <img
                    src={`https://github.com/${agent.author}.png`}
                    alt={`${agent.author} avatar`}
                    className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 border border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      // If image loading fails, replace with initials
                      e.currentTarget.style.display = 'none'
                      const sibling = e.currentTarget.nextElementSibling
                      if (sibling && sibling instanceof HTMLElement) {
                        sibling.style.display = 'flex'
                      }
                    }}
                  />
                  <div
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2"
                    style={{ display: 'none' }}
                  >
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {agent.author.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="dark:text-white">{agent.author}</span>
                </div>
              </div>
            )}

            {agent.tags && agent.tags.length > 0 && (
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tags</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {agent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* System Prompt */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 dark:text-white flex items-center">
              <span className="mr-2">{t('systemPromptLabel')}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Prompt
              </span>
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[30rem] border border-gray-200 dark:border-gray-700">
              <pre className="whitespace-pre-wrap text-sm dark:text-gray-200 font-mono">
                {agent.system}
              </pre>
            </div>
          </div>

          {/* MCP Servers */}
          {agent.mcpServers && agent.mcpServers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 dark:text-white flex items-center">
                <span className="mr-2">{t('mcpServersLabel')}</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                  {agent.mcpServers.length}
                </span>
              </h3>
              <div className="space-y-3">
                {agent.mcpServers.map((server, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="font-medium text-sm dark:text-white mb-2">{server.name}</h4>
                    {server.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {server.description}
                      </p>
                    )}
                    <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
                      <div>
                        <span className="text-blue-600 dark:text-blue-400">Command:</span>{' '}
                        {server.command}
                      </div>
                      {server.args && server.args.length > 0 && (
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">Args:</span>{' '}
                          {server.args.join(' ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {agent.tools && agent.tools.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 dark:text-white flex items-center">
                <span className="mr-2">{t('toolsLabel')}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                  {agent.tools.length}
                </span>
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded dark:bg-blue-900 dark:text-blue-300 flex items-center"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mr-1.5"></span>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scenarios */}
          {agent.scenarios && agent.scenarios.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 dark:text-white flex items-center">
                <span className="mr-2">{t('scenariosLabel')}</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300">
                  {agent.scenarios.length}
                </span>
              </h3>
              <div className="space-y-3">
                {agent.scenarios.map((scenario, index) => {
                  const handleCopyScenario = () => {
                    navigator.clipboard.writeText(scenario.content || '')
                    setCopiedIndex(index)
                    setTimeout(() => {
                      setCopiedIndex(null)
                    }, 2000) // Reset after 2 seconds
                  }

                  return (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm dark:text-white">{scenario.title}</h4>
                        <button
                          onClick={handleCopyScenario}
                          className={`text-xs flex items-center gap-1 ${
                            copiedIndex === index
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                          }`}
                          title={t('copyToClipboard')}
                        >
                          {copiedIndex === index ? (
                            <>
                              <BsCheck2Circle size={14} />
                              {t('copied')}
                            </>
                          ) : (
                            <>
                              <HiClipboardCopy size={14} />
                              {t('copy')}
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {scenario.content}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-transparent rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              onClick={onClose}
            >
              {t('close')}
            </button>

            {onAddToMyAgents && (
              <button
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isAdding
                    ? 'bg-gray-400 cursor-not-allowed'
                    : addSuccess
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
                onClick={handleAddToMyAgents}
                disabled={isAdding || addSuccess !== null}
              >
                {isAdding ? (
                  t('loading')
                ) : addSuccess !== null ? (
                  <div className="flex items-center">
                    {addSuccess ? (
                      <BsCheck2Circle className="mr-2" />
                    ) : (
                      <RiCloseLine className="mr-2" />
                    )}
                    {addSuccess ? t('agentAddedSuccess') : t('agentAddedError')}
                  </div>
                ) : (
                  t('addToMyAgents')
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
