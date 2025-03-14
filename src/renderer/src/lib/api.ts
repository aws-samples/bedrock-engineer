import { LLM } from '@/types/llm'
import { RetrieveAndGenerateCommandInput } from '@aws-sdk/client-bedrock-agent-runtime'
import { ConverseStreamOutput, Message, ToolConfiguration } from '@aws-sdk/client-bedrock-runtime'

export type StreamChatCompletionProps = {
  modelId: string
  system: { text: string }[] | undefined
  messages: Message[]
  toolConfig?: ToolConfiguration
}

const API_ENDPOINT = window.store.get('apiEndpoint')

export async function* streamChatCompletion(
  props: StreamChatCompletionProps,
  abortSignal?: AbortSignal
): AsyncGenerator<ConverseStreamOutput, void, unknown> {
  const res = await fetch(`${API_ENDPOINT}/converse/stream`, {
    method: 'POST',
    body: JSON.stringify(props),
    headers: {
      'Content-Type': 'application/json'
    },
    signal: abortSignal
  })
  const reader = res.body?.getReader()

  if (!reader) {
    throw new Error('Request failed')
  }

  const decoder = new TextDecoder('utf-8')

  if (res.status !== 200) {
    const { value } = await reader.read()
    const msg = decoder.decode(value)
    throw new Error(msg)
  }

  try {
    let done = false
    while (!done) {
      const { done: readDone, value } = await reader.read()
      if (readDone) {
        done = readDone
        reader.releaseLock()
      } else {
        let token = decoder.decode(value, { stream: true })

        const boundary = token.lastIndexOf(`\n`)
        // 2つ以上の JSON オブジェクトが連なっている場合
        if (boundary !== -1) {
          const completeData = token.substring(0, boundary)
          token = token.substring(boundary + 1)

          for (const chunk of completeData.split('\n')) {
            if (chunk) {
              try {
                yield JSON.parse(chunk)
              } catch (e) {
                console.error(`Error parsing JSON:`, e)
              }
            }
          }
        } else {
          yield JSON.parse(token)
        }
      }
    }
  } catch (error) {
    reader.releaseLock()
    throw error
  }
}

type ConverseProps = {
  modelId: string
  system: { text: string }[] | undefined
  messages: Message[]
  toolConfig?: ToolConfiguration
}

export async function converse(props: ConverseProps, abortSignal?: AbortSignal) {
  const res = await fetch(`${API_ENDPOINT}/converse`, {
    method: 'POST',
    body: JSON.stringify(props),
    headers: {
      'Content-Type': 'application/json'
    },
    signal: abortSignal
  })
  return res.json()
}

export async function retrieveAndGenerate(
  props: RetrieveAndGenerateCommandInput,
  abortSignal?: AbortSignal
) {
  const res = await fetch(`${API_ENDPOINT}/retrieveAndGenerate`, {
    method: 'POST',
    body: JSON.stringify(props),
    headers: {
      'Content-Type': 'application/json'
    },
    signal: abortSignal
  })
  return res
}

export async function listModels(): Promise<LLM[]> {
  const res = await fetch(`${API_ENDPOINT}/listModels`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return res.json()
}

export async function listAgentTags(): Promise<string[]> {
  const res = await fetch(`${API_ENDPOINT}/listAgentTags`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return res.json()
}
