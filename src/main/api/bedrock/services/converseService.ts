import {
  ContentBlock,
  ConverseCommand,
  ConverseCommandInput,
  ConverseCommandOutput,
  ConverseStreamCommand,
  ConverseStreamCommandInput,
  ConverseStreamCommandOutput,
  Message
} from '@aws-sdk/client-bedrock-runtime'
import { createRuntimeClient } from '../client'
import { processImageContent } from '../utils/imageUtils'
import { getAlternateRegionOnThrottling } from '../utils/awsUtils'
import type { CallConverseAPIProps, ServiceContext } from '../types'

/**
 * Bedrock Converse APIと連携するサービスクラス
 * リクエストの前処理やエラーハンドリングを担当
 */
export class ConverseService {
  private static readonly MAX_RETRIES = 30
  private static readonly RETRY_DELAY = 5000

  constructor(private context: ServiceContext) {}

  /**
   * 非ストリーミングのConverseAPIを呼び出す
   */
  async converse(props: CallConverseAPIProps, retries = 0): Promise<ConverseCommandOutput> {
    try {
      // リクエストパラメータの準備
      const { commandParams } = await this.prepareCommandParameters(props)
      const runtimeClient = createRuntimeClient(this.context.store.get('aws'))

      // APIリクエストを送信
      const command = new ConverseCommand(commandParams)
      return await runtimeClient.send(command)
    } catch (error: any) {
      return this.handleError(error, props, retries, 'converse', ConverseCommand)
    }
  }

  /**
   * ストリーミング形式のConverseAPIを呼び出す
   */
  async converseStream(
    props: CallConverseAPIProps,
    retries = 0
  ): Promise<ConverseStreamCommandOutput> {
    try {
      // リクエストパラメータの準備
      const { commandParams } = await this.prepareCommandParameters(props)
      const runtimeClient = createRuntimeClient(this.context.store.get('aws'))

      // APIリクエストを送信
      const command = new ConverseStreamCommand(commandParams)
      return await runtimeClient.send(command)
    } catch (error: any) {
      return this.handleError(error, props, retries, 'converseStream', ConverseStreamCommand)
    }
  }

  /**
   * APIリクエスト用のパラメータを準備
   * メッセージの処理とコマンドパラメータの作成を行う
   */
  private async prepareCommandParameters(props: CallConverseAPIProps): Promise<{
    commandParams: ConverseCommandInput | ConverseStreamCommandInput
    processedMessages?: Message[]
  }> {
    const { modelId, messages, system, toolConfig } = props

    // 画像データを含むメッセージを処理
    const processedMessages = this.processMessages(messages)

    // デバッグ用：空のテキストフィールドのチェック
    this.logEmptyTextFields(processedMessages)

    // メッセージを正規化
    const sanitizedMessages = this.normalizeMessages(processedMessages)

    // 推論パラメータを取得
    const inferenceParams = this.context.store.get('inferenceParams')

    const thinkingMode = this.context.store.get('thinkingMode')

    // Claude 3.7 Sonnet でThinking Modeが有効な場合、additionalModelRequestFieldsを追加
    let additionalModelRequestFields: Record<string, any> | undefined = undefined

    // thinkingモードが有効かつmodelIdがClaude 3.7 Sonnetの場合のみ設定
    if (modelId.includes('anthropic.claude-3-7-sonnet') && thinkingMode?.type === 'enabled') {
      additionalModelRequestFields = {
        thinking: {
          type: thinkingMode.type,
          budget_tokens: thinkingMode.budget_tokens
        }
      }
      inferenceParams.topP = undefined // reasoning は topP は不要
      inferenceParams.temperature = 1 // reasoning は temperature を 1 必須
    }

    // コマンドパラメータを作成
    const commandParams: ConverseCommandInput | ConverseStreamCommandInput = {
      modelId,
      messages: sanitizedMessages,
      system,
      toolConfig,
      inferenceConfig: inferenceParams,
      additionalModelRequestFields
    }

    return { commandParams, processedMessages }
  }

  /**
   * メッセージを処理し、画像データを正しい形式に変換
   */
  private processMessages(messages: Message[]): Message[] {
    return messages.map((msg) => ({
      ...msg,
      content: Array.isArray(msg.content) ? processImageContent(msg.content) : msg.content
    }))
  }

  /**
   * 空のテキストフィールドを持つメッセージをログに出力
   */
  private logEmptyTextFields(messages: Message[]): void {
    const emptyTextFieldMsgs = messages.filter(
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
  }

  /**
   * コンテンツブロックのテキストフィールドが空でないことを確認
   */
  private sanitizeContentBlocks(content: ContentBlock[] | unknown): ContentBlock[] | undefined {
    if (!Array.isArray(content)) {
      return undefined
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
    }) as ContentBlock[]
  }

  /**
   * メッセージの各コンテンツブロックを正規化
   */
  private normalizeMessages(messages: Message[]): Message[] {
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
            message.content = this.sanitizeContentBlocks(validBlocks)
          }
        } else {
          message.content = this.sanitizeContentBlocks(message.content)
        }
      }
      return message
    })
  }

  /**
   * エラー処理を行う
   */
  private async handleError<T extends ConverseCommandOutput | ConverseStreamCommandOutput>(
    error: any,
    props: CallConverseAPIProps,
    retries: number,
    methodName: 'converse' | 'converseStream',
    CommandClass: typeof ConverseCommand | typeof ConverseStreamCommand
  ): Promise<T> {
    // スロットリングまたはサービス利用不可の場合
    if (error.name === 'ThrottlingException' || error.name === 'ServiceUnavailableException') {
      console.log({ retry: retries, error, errorName: error.name })

      // 最大リトライ回数を超えた場合はエラーをスロー
      if (retries >= ConverseService.MAX_RETRIES) {
        throw error
      }

      // スロットリングの場合は別リージョンでの実行を試みる
      if (error.name === 'ThrottlingException') {
        const alternateResult = await this.tryAlternateRegion(props, error, CommandClass)
        if (alternateResult) {
          return alternateResult as T
        }
      }

      // 待機してから再試行
      await new Promise((resolve) => setTimeout(resolve, ConverseService.RETRY_DELAY))
      return methodName === 'converse'
        ? ((await this.converse(props, retries + 1)) as T)
        : ((await this.converseStream(props, retries + 1)) as T)
    }

    // バリデーションエラーの場合
    if (error.name === 'ValidationException') {
      console.error(`ValidationException in ${methodName}:`, {
        errorMessage: error.message,
        errorDetails: error.$metadata
        // メッセージスナップショットはここでは利用できないため除去
      })
    }

    console.log({ error })
    throw error
  }

  /**
   * 別リージョンでのAPIコール実行を試みる
   */
  private async tryAlternateRegion<T extends ConverseCommandOutput | ConverseStreamCommandOutput>(
    props: CallConverseAPIProps,
    _error: any,
    CommandClass: typeof ConverseCommand | typeof ConverseStreamCommand
  ): Promise<T | null> {
    const awsConfig = this.context.store.get('aws')
    const bedrockSettings = this.context.store.get('bedrockSettings')

    if (!bedrockSettings?.enableRegionFailover) {
      return null
    }

    const availableRegions = bedrockSettings.availableFailoverRegions || []
    const alternateRegion = getAlternateRegionOnThrottling(
      awsConfig.region,
      props.modelId,
      availableRegions
    )

    // 別のリージョンが現在のリージョンと同じ場合はスキップ
    if (alternateRegion === awsConfig.region) {
      return null
    }

    console.log({
      message: 'Switching to alternate region due to throttling',
      currentRegion: awsConfig.region,
      alternateRegion
    })

    try {
      // 別リージョン用のクライアントを作成
      const alternateClient = createRuntimeClient({
        ...awsConfig,
        region: alternateRegion
      })

      // リクエストパラメータを再作成
      const { commandParams } = await this.prepareCommandParameters(props)

      // コマンドクラスに応じて適切なインスタンスを作成
      if (CommandClass === ConverseCommand) {
        const command = new ConverseCommand(commandParams)
        return (await alternateClient.send(command)) as T
      } else {
        const command = new ConverseStreamCommand(commandParams)
        return (await alternateClient.send(command)) as T
      }
    } catch (alternateError) {
      console.log({ alternateRegionError: alternateError })
      return null // 別リージョンでもエラーの場合は null を返し、通常の再試行へ
    }
  }
}
