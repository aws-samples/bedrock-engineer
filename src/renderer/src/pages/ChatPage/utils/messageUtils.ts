import { Message } from '@aws-sdk/client-bedrock-runtime'

/**
 * メッセージの送信時に、Trace を全て載せると InputToken が逼迫するので取り除く
 */
export function removeTraces(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.content && Array.isArray(message.content)) {
      return {
        ...message,
        content: message.content.map((item) => {
          if (item.toolResult && item.toolResult.content) {
            return {
              ...item,
              toolResult: {
                ...item.toolResult,
                content: item.toolResult.content.map((c) => {
                  if (
                    c &&
                    typeof c === 'object' &&
                    'json' in c &&
                    c.json &&
                    typeof c.json === 'object' &&
                    'result' in c.json &&
                    c.json.result &&
                    typeof c.json.result === 'object' &&
                    'completion' in c.json.result &&
                    c.json.result.completion
                  ) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { traces, ...restCompletion } = c.json.result.completion as any
                    return {
                      ...c,
                      json: {
                        ...c.json,
                        result: {
                          ...c.json.result,
                          completion: restCompletion
                        }
                      }
                    }
                  }
                  return c
                })
              }
            }
          }
          return item
        })
      }
    }
    return message
  })
}
