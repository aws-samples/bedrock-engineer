import {
  ContentBlock,
  ConverseCommand,
  ConverseCommandOutput,
  ConverseStreamCommand,
  ConverseStreamCommandOutput,
  Message
} from '@aws-sdk/client-bedrock-runtime'
import { createRuntimeClient } from '../client'
import { processImageContent } from '../utils/imageUtils'
import { getAlternateRegionOnThrottling } from '../utils/awsUtils'
import type { CallConverseAPIProps, ServiceContext } from '../types'

// contentBlockのテキストフィールドが空でないことを確認する関数
function sanitizeContentBlocks(content: ContentBlock[] | any): ContentBlock[] | any {
  if (!Array.isArray(content)) {
    return content
  }

  return content.map((block) => {
    // テキストフィールドが空または実質的に空（空白・改行のみ）の場合
    if (
      Object.prototype.hasOwnProperty.call(block, 'text') &&
      (block.text === '' || !block.text?.trim())
    ) {
      // スペース1文字をプレースホルダーとして設定
      block.text = ' '
    }
    return block
  })
}

// メッセージの各コンテンツブロックを処理する
function sanitizeMessages(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.content) {
      // コンテンツが配列の場合、空のテキストブロックを除去してからサニタイズ
      if (Array.isArray(message.content)) {
        // 空のコンテンツブロックを持たないように配列をフィルタリング
        const validBlocks = message.content.filter((block) => {
          // テキストブロックで、かつ中身が実質的に空の場合はフィルタリング
          if (
            Object.prototype.hasOwnProperty.call(block, 'text') &&
            (!block.text || !block.text.trim())
          ) {
            // ツールの使用結果など他のブロックタイプがある場合は保持する
            return Object.keys(block).length > 1
          }
          return true
        })

        // 配列が空になってしまった場合は、最低1つの有効なブロックを確保
        if (validBlocks.length === 0) {
          message.content = [{ text: ' ' }]
        } else {
          // 残ったブロックをサニタイズ
          message.content = sanitizeContentBlocks(validBlocks)
        }
      } else {
        message.content = sanitizeContentBlocks(message.content)
      }
    }
    return message
  })
}

export class ConverseService {
  private static readonly MAX_RETRIES = 30
  private static readonly RETRY_DELAY = 5000
  constructor(private context: ServiceContext) {}

  async converse(props: CallConverseAPIProps, retries = 0): Promise<ConverseCommandOutput> {
    // スコープ外で変数を宣言して、catch ブロックでもアクセスできるようにする
    let processedMessages: Message[] = []
    let commandParams: any

    try {
      const { modelId, messages, system, toolConfig } = props

      // Process messages to ensure image data is in correct format
      processedMessages = messages.map((msg) => ({
        ...msg,
        content: Array.isArray(msg.content) ? processImageContent(msg.content) : msg.content
      }))

      // Check for empty text fields before sanitization (debugging purposes)
      const emptyTextFieldMsgs = processedMessages.filter(
        (msg) =>
          Array.isArray(msg.content) &&
          msg.content.some(
            (block) =>
              Object.prototype.hasOwnProperty.call(block, 'text') &&
              (!block.text || !block.text.trim())
          )
      )

      if (emptyTextFieldMsgs.length > 0) {
        console.log('Found empty text fields in content blocks before sanitization:')
        console.log(JSON.stringify(emptyTextFieldMsgs, null, 2))
      }

      // Sanitize messages to handle empty text fields
      const sanitizedMessages = sanitizeMessages(processedMessages)

      const { maxTokens, temperature, topP } = this.context.store.get('inferenceParams')
      commandParams = {
        modelId,
        messages: sanitizedMessages,
        system,
        toolConfig,
        inferenceConfig: { maxTokens, temperature, topP }
      }

      const runtimeClient = createRuntimeClient(this.context.store.get('aws'))
      return runtimeClient.send(new ConverseCommand(commandParams))
    } catch (error: any) {
      if (error.name === 'ThrottlingException' || error.name === 'ServiceUnavailableException') {
        console.log({ retry: retries, error, errorName: error.name })
        if (retries >= ConverseService.MAX_RETRIES) {
          throw error
        }

        // ThrottlingException の場合、設定に応じて別のリージョンを試す
        if (error.name === 'ThrottlingException') {
          const awsConfig = this.context.store.get('aws')
          const bedrockSettings = this.context.store.get('bedrockSettings')

          if (bedrockSettings?.enableRegionFailover) {
            const availableRegions = bedrockSettings.availableRegions || []
            const alternateRegion = getAlternateRegionOnThrottling(
              awsConfig.region,
              props.modelId,
              availableRegions
            )

            // 別のリージョンが利用可能な場合は、そのリージョンで再試行
            if (alternateRegion !== awsConfig.region) {
              console.log({
                message: 'Switching to alternate region due to throttling',
                currentRegion: awsConfig.region,
                alternateRegion
              })
              const alternateClient = createRuntimeClient({
                ...awsConfig,
                region: alternateRegion
              })
              try {
                const command = new ConverseCommand(commandParams)
                return await alternateClient.send(command)
              } catch (alternateError) {
                console.log({ alternateRegionError: alternateError })
                // 別リージョンでもエラーの場合は通常の再試行へ
              }
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, ConverseService.RETRY_DELAY))
        return this.converse(props, retries + 1)
      }

      if (error.name === 'ValidationException') {
        console.error('ValidationException in converse:', {
          errorMessage: error.message,
          errorDetails: error.$metadata,
          messagesSnapshot: processedMessages
            ? JSON.stringify(processedMessages, null, 2)
            : 'No messages data'
        })
      }

      console.log({ error })
      throw error
    }
  }

  async converseStream(
    props: CallConverseAPIProps,
    retries = 0
  ): Promise<ConverseStreamCommandOutput> {
    // スコープ外で変数を宣言して、catch ブロックでもアクセスできるようにする
    let processedMessages: Message[] = []
    let commandParams: any

    try {
      const { modelId, messages, system, toolConfig } = props

      processedMessages = messages.map((msg) => ({
        ...msg,
        content: Array.isArray(msg.content) ? processImageContent(msg.content) : msg.content
      }))

      // Check for empty text fields before sanitization (debugging purposes)
      const emptyTextFieldMsgs = processedMessages.filter(
        (msg) =>
          Array.isArray(msg.content) &&
          msg.content.some(
            (block) =>
              Object.prototype.hasOwnProperty.call(block, 'text') &&
              (!block.text || !block.text.trim())
          )
      )

      if (emptyTextFieldMsgs.length > 0) {
        console.log('Found empty text fields in content blocks before sanitization:')
        console.log(JSON.stringify(emptyTextFieldMsgs, null, 2))
      }

      // Sanitize messages to handle empty text fields
      const sanitizedMessages = sanitizeMessages(processedMessages)

      commandParams = {
        modelId,
        messages: sanitizedMessages,
        system,
        toolConfig,
        inferenceConfig: this.context.store.get('inferenceParams')
      }

      const runtimeClient = createRuntimeClient(this.context.store.get('aws'))
      return await runtimeClient.send(new ConverseStreamCommand(commandParams))
    } catch (error: any) {
      if (error.name === 'ThrottlingException' || error.name === 'ServiceUnavailableException') {
        console.log({ retry: retries, error, errorName: error.name })
        if (retries >= ConverseService.MAX_RETRIES) {
          throw error
        }

        // ThrottlingException の場合、設定に応じて別のリージョンを試す
        if (error.name === 'ThrottlingException') {
          const awsConfig = this.context.store.get('aws')
          const bedrockSettings = this.context.store.get('bedrockSettings')

          if (bedrockSettings?.enableRegionFailover) {
            const availableRegions = bedrockSettings.availableRegions || []
            const alternateRegion = getAlternateRegionOnThrottling(
              awsConfig.region,
              props.modelId,
              availableRegions
            )

            // 別のリージョンが利用可能な場合は、そのリージョンで再試行
            if (alternateRegion !== awsConfig.region) {
              console.log({
                message: 'Switching to alternate region due to throttling',
                currentRegion: awsConfig.region,
                alternateRegion
              })
              const alternateClient = createRuntimeClient({
                ...awsConfig,
                region: alternateRegion
              })
              try {
                const command = new ConverseStreamCommand(commandParams)
                return await alternateClient.send(command)
              } catch (alternateError) {
                console.log({ alternateRegionError: alternateError })
                // 別リージョンでもエラーの場合は通常の再試行へ
              }
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, ConverseService.RETRY_DELAY))
        return this.converseStream(props, retries + 1)
      }

      if (error.name === 'ValidationException') {
        console.error('ValidationException in converseStream:', {
          errorMessage: error.message,
          errorDetails: error.$metadata,
          messagesSnapshot: processedMessages
            ? JSON.stringify(processedMessages, null, 2)
            : 'No messages data'
        })
      }

      console.log({ error })
      throw error
    }
  }
}
