import { useState } from 'react'
import { motion } from 'framer-motion'
import { MdClose, MdContentCopy } from 'react-icons/md'
import { Tooltip } from 'flowbite-react'
import ReactMarkdown from 'react-markdown'
import { filterJsonFromStreamingContent } from '../utils/flowParser'

interface FlowExplanationViewProps {
  explanation: string
  isStreaming: boolean
  isVisible: boolean
  onClose: () => void
  hasMessages: boolean
}

export function FlowExplanationView({
  explanation,
  isStreaming,
  isVisible,
  onClose,
  hasMessages
}: FlowExplanationViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const textToCopy = filterJsonFromStreamingContent(explanation)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const filteredExplanation = isStreaming
    ? filterJsonFromStreamingContent(explanation)
    : explanation

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flow Explanation</h3>
        <div className="flex items-center gap-2">
          {hasMessages && (
            <Tooltip content={copied ? 'Copied!' : 'Copy explanation'}>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <MdContentCopy className="text-lg text-gray-600 dark:text-gray-400" />
              </button>
            </Tooltip>
          )}
          <Tooltip content="Close explanation">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <MdClose className="text-lg text-gray-600 dark:text-gray-400" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredExplanation ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{filteredExplanation}</ReactMarkdown>
            {isStreaming && (
              <motion.div
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-gray-400 dark:bg-gray-500 ml-1"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="mb-2">No explanation available yet</p>
              <p className="text-sm">Generate a flowchart to see the explanation here</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
