import { Message } from '@aws-sdk/client-bedrock-runtime'
import React, { useState, useRef, useEffect } from 'react'
import { Avatar } from './Avatar'
import { Accordion } from 'flowbite-react'
import { JSONCodeBlock } from '../CodeBlocks/JSONCodeBlock'
import { TextCodeBlock } from '../CodeBlocks/TextCodeBlock'
import CodeRenderer from '../Code/CodeRenderer'
import { toolIcons } from '../Tool/ToolIcons'
import { FaCheck } from 'react-icons/fa'
import { MdErrorOutline } from 'react-icons/md'
import { FiTrash2, FiCopy } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ReasoningContent } from '../CodeBlocks/Reasoning/ReasoningContent'

// 拡張されたMessageタイプ
type ExtendedMessage = Message & {
  status?: 'idle' | 'streaming' | 'complete' | 'error'
}

type ChatMessageProps = {
  message: ExtendedMessage
  onDeleteMessage?: () => void
  reasoning: boolean
}

// Helper function to convert various image data formats to data URL
function convertImageToDataUrl(imageData: any, format: string = 'png'): string {
  if (!imageData) return ''

  // If it's already a base64 string
  if (typeof imageData === 'string') {
    // Check if it's already a data URL
    if (imageData.startsWith('data:')) {
      return imageData
    }
    // Convert base64 to data URL
    return `data:image/${format};base64,${imageData}`
  }

  // If it's a Uint8Array
  if (imageData instanceof Uint8Array) {
    // Convert Uint8Array to base64
    const binary = Array.from(imageData)
      .map((byte) => String.fromCharCode(byte))
      .join('')
    const base64 = btoa(binary)
    return `data:image/${format};base64,${base64}`
  }

  // If it's a plain object (serialized Uint8Array)
  if (typeof imageData === 'object' && 'bytes' in imageData) {
    return convertImageToDataUrl(imageData.bytes, format)
  }

  console.warn('Unsupported image data format:', imageData)
  return ''
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onDeleteMessage,
  reasoning
}) => {
  const { t } = useTranslation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  // メッセージの内容をテキスト形式で抽出する関数
  const extractMessageText = (message: Message): string => {
    if (!message.content) return ''

    // メッセージ内容をテキストとして連結
    return message.content
      .map((block) => {
        if ('text' in block) {
          return block.text || ''
        } else if ('toolUse' in block && block.toolUse?.input) {
          return `Tool: ${block.toolUse.name}\nInput: ${JSON.stringify(block.toolUse.input, null, 2)}`
        } else if ('toolResult' in block) {
          if (block.toolResult?.content) {
            return block.toolResult.content
              .map((content) => {
                if ('text' in content) return content.text
                if ('json' in content) return JSON.stringify(content.json, null, 2)
                return ''
              })
              .join('\n')
          }
          return `Tool Result: ${block.toolResult?.status}`
        }
        return ''
      })
      .join('\n\n')
  }

  const handleCopyMessage = () => {
    const textToCopy = extractMessageText(message)
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast.success(t('Message copied to clipboard'))
        setIsDropdownOpen(false)
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err)
        toast.error(t('Failed to copy message'))
      })
  }

  const handleDeleteMessage = () => {
    if (onDeleteMessage) {
      if (window.confirm(t('Are you sure you want to delete this message?'))) {
        onDeleteMessage()
        toast.success(t('Message deleted successfully'))
        setIsDropdownOpen(false)
      }
    }
  }

  // 外部クリック時にドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [avatarRef])

  return (
    <div className="flex gap-4 relative">
      <div className="relative" ref={avatarRef}>
        <div
          className="cursor-pointer hover:bg-gray-200 rounded-md"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title={t('Click for options')}
        >
          <Avatar role={message.role} />
        </div>
        {isDropdownOpen && (
          <div className="absolute left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 min-w-32 py-1 border dark:border-gray-700 whitespace-nowrap p-1">
            <button
              className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={handleCopyMessage}
            >
              <FiCopy className="text-blue-500" />
              <span>{t('Copy to clipboard')}</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 w-full text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              onClick={handleDeleteMessage}
            >
              <FiTrash2 className="text-red-500" />
              <span>{t('Delete message')}</span>
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 w-full">
        <span className="text-xs text-gray-500 relative">{message.role}</span>
        {message.content?.map((c, index) => {
          if ('text' in c) {
            return (
              <div key={index} className="relative">
                <CodeRenderer text={c.text} />
              </div>
            )
          } else if ('reasoningContent' in c) {
            const isLoading =
              reasoning && !!message.content?.length && message.content[1].text === ''
            return (
              <div key={index} className="relative">
                <ReasoningContent content={c.reasoningContent} isLoading={isLoading} />
              </div>
            )
          } else if ('toolUse' in c) {
            return (
              <div key={index} className="flex flex-col gap-2 text-xs w-full relative">
                <Accordion className="w-full" collapseAll>
                  <Accordion.Panel>
                    <Accordion.Title>
                      <div className="flex gap-6 items-center">
                        <span>{toolIcons[c.toolUse?.name || 'unknown']}</span>
                        <div className="flex gap-2">
                          <span>ToolUse:</span>
                          <span className="border rounded-md bg-gray-200 px-2 dark:text-gray-800">
                            {c.toolUse?.name}
                          </span>
                          <span>{c.toolUse?.toolUseId}</span>
                        </div>
                      </div>
                    </Accordion.Title>
                    <Accordion.Content>
                      <JSONCodeBlock json={c.toolUse?.input} />
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>
              </div>
            )
          } else if ('toolResult' in c) {
            return (
              <div key={index} className="flex flex-col gap-2 text-xs w-full relative">
                <Accordion className="w-full" collapseAll>
                  <Accordion.Panel>
                    <Accordion.Title>
                      <div className="flex gap-6 items-center">
                        <span className={`rounded-md`}>
                          {c.toolResult?.status === 'success' ? (
                            <FaCheck className="size-6 text-green-500" />
                          ) : (
                            <MdErrorOutline className="size-6 text-red-700" />
                          )}
                        </span>
                        <div className="flex gap-2">
                          <span>ToolResult:</span>
                          <span
                            className={`rounded-md px-2 ${c.toolResult?.status === 'success' ? 'bg-green-500 text-white' : 'bg-red-700 text-white'}`}
                          >
                            {c.toolResult?.status}
                          </span>
                        </div>
                        <span>{c.toolResult?.toolUseId}</span>
                      </div>
                    </Accordion.Title>
                    <Accordion.Content className="w-full">
                      {c.toolResult?.content?.map((content, index) => {
                        if ('text' in content) {
                          return <TextCodeBlock key={index} text={content.text ?? ''} />
                        } else if ('json' in content) {
                          return <JSONCodeBlock key={index} json={content.json} />
                        } else {
                          throw new Error('Invalid tool result content')
                        }
                      })}
                    </Accordion.Content>
                  </Accordion.Panel>
                </Accordion>
              </div>
            )
          } else if ('image' in c) {
            const imageUrl = convertImageToDataUrl(c.image?.source?.bytes)
            return (
              <div key={index} className="max-w-lg relative">
                <img
                  src={imageUrl}
                  alt="image"
                  className="rounded-lg shadow-sm max-h-[512px] object-contain"
                />
              </div>
            )
          } else {
            console.error(c)
            console.error('Invalid message content')
            return (
              <div key={index} className="relative">
                <CodeRenderer text={JSON.stringify(c)} />
              </div>
            )
          }
        })}
      </div>
    </div>
  )
}
