import { MessageList } from '../../ChatPage/components/MessageList'
import { TextArea, AttachedImage } from '../../ChatPage/components/InputForm/TextArea'
import { IdentifiableMessage } from '@/types/chat/message'

interface ChatPanelProps {
  messages: IdentifiableMessage[]
  loading: boolean
  reasoning: boolean
  executingTools: Set<string>
  userInput: string
  onUserInputChange: (value: string) => void
  onSubmit: (input: string, images: AttachedImage[]) => void
  isComposing: boolean
  onComposingChange: (value: boolean) => void
  sendMsgKey: 'Enter' | 'Cmd+Enter'
}

export function ChatPanel({
  messages,
  loading,
  reasoning,
  executingTools,
  userInput,
  onUserInputChange,
  onSubmit,
  isComposing,
  onComposingChange,
  sendMsgKey
}: ChatPanelProps) {
  return (
    <>
      {/* Header */}
      <div className="flex pb-2 justify-between items-center">
        <h1 className="font-bold dark:text-white text-lg">Rich Website Generator</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {loading && 'Generating...'}
          {executingTools.size > 0 && ` (${Array.from(executingTools).join(', ')})`}
        </div>
      </div>

      {/* Message List Area - Scrollable */}
      <div className="flex-1 overflow-y-auto mb-3 min-h-0">
        <MessageList
          messages={messages}
          loading={loading}
          reasoning={reasoning}
          deleteMessage={undefined}
        />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0">
        <TextArea
          value={userInput}
          onChange={onUserInputChange}
          disabled={loading}
          onSubmit={onSubmit}
          isComposing={isComposing}
          setIsComposing={onComposingChange}
          sendMsgKey={sendMsgKey}
          hidePlanActToggle={true}
        />
      </div>
    </>
  )
}
