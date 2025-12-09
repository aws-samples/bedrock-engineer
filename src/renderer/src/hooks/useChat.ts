import { StopReason } from '@aws-sdk/client-bedrock-runtime'
import { streamChatCompletion } from '@renderer/lib/api'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

type UseChatProps = {
  systemPrompt: string
  modelId: string
}
export const useChat = (props: UseChatProps) => {
  const [messages, setMessages] = useState<{ role: string; content: { text: string }[] }[]>([])
  const [loading, setLoading] = useState(false)
  const [lastText, setLatestText] = useState('')
  const [stopReason, setStopReason] = useState<StopReason>()
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const { t } = useTranslation()

  const handleSubmit = useCallback(
    async (input: string, messages) => {
      if (!input) {
        alert('Please enter a prompt')
        return
      }

      const msgs = [...messages, { role: 'user', content: [{ text: input }] }]
      setMessages(msgs)

      setLoading(true)
      setWaitingForResponse(false)

      // Track last data received time
      let lastDataTime = Date.now()
      const WAIT_THRESHOLD = 10000 // 10 seconds without data = waiting state

      const checkWaitingState = setInterval(() => {
        const timeSinceLastData = Date.now() - lastDataTime
        setWaitingForResponse(timeSinceLastData > WAIT_THRESHOLD)
      }, 1000)

      const generator = streamChatCompletion({
        messages: msgs,
        modelId: props.modelId,
        system: [
          {
            text: props.systemPrompt
          }
        ]
      })

      let s = ''
      try {
        for await (const json of generator) {
          lastDataTime = Date.now() // Update last data time on each chunk
          
          if (json.contentBlockDelta) {
            const text = json.contentBlockDelta.delta?.text
            if (text) {
              s = s + text
              setMessages([...msgs, { role: 'assistant', content: [{ text: s }] }])
              setLatestText(s)
            }
          }

          if (json.messageStop) {
            console.log({ stopReason: json.messageStop.stopReason })
            setStopReason(json.messageStop.stopReason)
          }
        }
      } catch (error: any) {
        console.error(error)
        toast.error(t('request error'))
        const msgsToset = [...msgs, { role: 'assistant', content: [{ text: error.message }] }]
        setMessages(msgsToset)
        setLoading(false)
        setWaitingForResponse(false)
        clearInterval(checkWaitingState)
      }

      clearInterval(checkWaitingState)
      setLoading(false)
      setWaitingForResponse(false)

      const msgsToset = [...msgs, { role: 'assistant', content: [{ text: s }] }]
      setMessages(msgsToset)
    },
    [props.modelId, props.systemPrompt, messages]
  )

  const initChat = () => {
    setMessages([])
    setLatestText('')
  }

  return { messages, handleSubmit, loading, initChat, lastText, setLoading, stopReason, waitingForResponse }
}
