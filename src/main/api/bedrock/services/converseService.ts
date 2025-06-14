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
import { getThinkingSupportedModelIds } from '../models'
import type { CallConverseAPIProps, ServiceContext } from '../types'
import { createCategoryLogger } from '../../../../common/logger'
import { ipcMain } from 'electron'

// Create category logger for converse service
const converseLogger = createCategoryLogger('bedrock:converse')

/**
 * Bedrock Converse APIと連携するサービスクラス
 * リクエストの前処理やエラーハンドリングを担当
 */
export class ConverseService {
  private static readonly MAX_RETRIES = 30
  private static readonly RETRY_DELAY = 5000
  // toolUse内容削減の係数（50%ずつ削減）
  private static readonly CONTENT_REDUCTION_FACTOR = 0.5
  
  constructor(private context: ServiceContext) {
    // IPCイベントハンドラーの設定
    this.setupIpcEventHandlers();
  }
  
  /**
   * IPC通信用のイベントハンドラーを設定
   */
  private setupIpcEventHandlers() {
    // メインプロセスからのイベントを処理
    ipcMain.on('content-size-reduced', (event, data) => {
      // ユーザーへの通知表示などのアクション
      converseLogger.debug('IPC event content-size-reduced', data);
      event.sender.send('show-notification', {
        type: 'warning',
        title: 'トークン制限に達しました',
        message: 'コンテンツのサイズが大きすぎたため、自動的に縮小して再試行しています。',
        data
      });
    });
  }

  /**
   * 非ストリーミングのConverseAPIを呼び出す
   */
  async converse(props: CallConverseAPIProps, retries = 0): Promise<ConverseCommandOutput> {
    try {
      // リクエストパラメータの準備
      const { commandParams } = await this.prepareCommandParameters(props)
      const runtimeClient = createRuntimeClient(this.context.store.get('aws'))
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
      const awsConfig = this.context.store.get('aws')

      // APIリクエスト前にログ出力
      converseLogger.debug('Sending stream converse request', {
        modelId: props.modelId,
        region: awsConfig.region,
        messageCount: props.messages.length
      })

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
    const { modelId, messages, system, toolConfig, guardrailConfig } = props

    // 画像データを含むメッセージを処理
    const processedMessages = this.processMessages(messages)

    // デバッグ用：空のテキストフィールドのチェック
    this.logEmptyTextFields(processedMessages)

    // メッセージを正規化
    const sanitizedMessages = this.normalizeMessages(processedMessages)

    // 推論パラメータを取得（リクエストで明示的に指定された場合はグローバル設定を書きする）
    const inferenceConfig = props?.inferenceConfig ?? this.context.store.get('inferenceParams')

    const thinkingMode = this.context.store.get('thinkingMode')
    const interleaveThinking = this.context.store.get('interleaveThinking')

    // models.tsでsupportsThinking=trueと定義されたモデルでThinking Modeが有効な場合、additionalModelRequestFieldsを追加
    let additionalModelRequestFields: Record<string, any> | undefined = undefined

    // Thinking対応モデルのIDリストを取得
    const thinkingSupportedModelIds = getThinkingSupportedModelIds()

    // thinkingモードが有効かつmodelIdがThinking対応モデルの場合のみ設定
    if (
      thinkingSupportedModelIds.some((id) => modelId.includes(id)) &&
      thinkingMode?.type === 'enabled'
    ) {
      additionalModelRequestFields = {
        thinking: {
          type: thinkingMode.type,
          budget_tokens: thinkingMode.budget_tokens
        }
      }

      // インターリーブ思考が有効な場合のみanthropic_betaを追加
      if (interleaveThinking) {
        additionalModelRequestFields.anthropic_beta = ['interleaved-thinking-2025-05-14']
      }
      inferenceConfig.topP = undefined // reasoning は topP は不要
      inferenceConfig.temperature = 1 // reasoning は temperature を 1 必須

      // Thinking Mode有効時の特別なログ出力
      converseLogger.debug('Enabling Thinking Mode', {
        modelId,
        thinkingType: thinkingMode.type,
        budgetTokens: thinkingMode.budget_tokens,
        messageCount: messages.length,
        assistantMessages: messages.filter((m) => m.role === 'assistant').length
      })
    }

    if (modelId.includes('nova')) {
      // https://docs.aws.amazon.com/nova/latest/userguide/tool-use-definition.html
      // For tool calling, the inference parameters should be set as inf_params = {"topP": 1, "temperature": 1} and additionalModelRequestFields= {"inferenceConfig": {"topK":1}}. This is because we encourage greedy decoding parameters for Amazon Nova tool calling.
      additionalModelRequestFields = {
        inferenceConfig: { topK: 1 }
      }
      inferenceConfig.topP = 1
      inferenceConfig.temperature = 1

      // If the number of parallel executions is 3 or more, it may not be stable, so process it in stages.
      system[0].text =
        system[0].text + '\n Do not run ToolUse in parallel, but proceed step by step.'
    }

    // コマンドパラメータを作成
    const commandParams: ConverseCommandInput | ConverseStreamCommandInput = {
      modelId,
      messages: sanitizedMessages,
      system,
      toolConfig,
      inferenceConfig,
      additionalModelRequestFields
    }

    // ガードレール設定が提供されている場合、または設定から有効になっている場合に追加
    if (guardrailConfig) {
      commandParams.guardrailConfig = guardrailConfig
      converseLogger.debug('Using provided guardrail', {
        guardrailId: guardrailConfig.guardrailIdentifier,
        guardrailVersion: guardrailConfig.guardrailVersion
      })
    } else {
      // 設定からガードレール設定を取得
      const storedGuardrailSettings = this.context.store.get('guardrailSettings')
      if (storedGuardrailSettings?.enabled && storedGuardrailSettings.guardrailIdentifier) {
        commandParams.guardrailConfig = {
          guardrailIdentifier: storedGuardrailSettings.guardrailIdentifier,
          guardrailVersion: storedGuardrailSettings.guardrailVersion,
          trace: storedGuardrailSettings.trace
        }
        converseLogger.debug('Using guardrail from settings', {
          guardrailId: storedGuardrailSettings.guardrailIdentifier,
          guardrailVersion: storedGuardrailSettings.guardrailVersion
        })
      }
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
      converseLogger.debug('Found empty text fields in content blocks before sanitization', {
        emptyTextFieldMsgs: JSON.stringify(emptyTextFieldMsgs),
        count: emptyTextFieldMsgs.length
      })
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

      // toolUseブロックの入力が空文字の場合、空のJSONオブジェクトに変換
      if (
        Object.prototype.hasOwnProperty.call(block, 'toolUse') &&
        block.toolUse &&
        Object.prototype.hasOwnProperty.call(block.toolUse, 'input') &&
        block.toolUse.input === ''
      ) {
        // 空の文字列を空のJSONオブジェクトに置き換える
        block.toolUse.input = {}
        converseLogger.debug(
          'Empty toolUse.input converted to empty JSON object in sanitizeContentBlocks',
          {
            toolName: block.toolUse.name
          }
        )
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

          // toolUseブロックの入力が空文字の場合、空のJSONオブジェクトに変換
          validBlocks.forEach((block) => {
            if (
              Object.prototype.hasOwnProperty.call(block, 'toolUse') &&
              block.toolUse &&
              Object.prototype.hasOwnProperty.call(block.toolUse, 'input') &&
              block.toolUse.input === ''
            ) {
              // 空の文字列を空のJSONオブジェクトに置き換える
              block.toolUse.input = {}
              converseLogger.debug('Empty toolUse.input converted to empty JSON object', {
                toolName: block.toolUse.name
              })
            }
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
      converseLogger.warn(`${error.name} occurred - retrying`, {
        retry: retries,
        errorName: error.name,
        message: error.message,
        modelId: props.modelId,
        method: methodName
      })

      // 最大リトライ回数を超えた場合はエラーをスロー
      if (retries >= ConverseService.MAX_RETRIES) {
        converseLogger.error('Maximum retries reached for Bedrock API request', {
          maxRetries: ConverseService.MAX_RETRIES,
          errorName: error.name,
          modelId: props.modelId,
          method: methodName
        })
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
      // max tokenを超えたエラーかどうかをチェック
      const isMaxTokenExceededError = 
        error.message && 
        (error.message.includes('max token') || 
         error.message.includes('maximum token') || 
         error.message.includes('token limit') ||
         error.message.includes('exceeds token'));

      if (isMaxTokenExceededError) {
        converseLogger.warn('Max token exceeded error detected - attempting to reduce content size and retry', {
          retry: retries,
          errorMessage: error.message,
          modelId: props.modelId,
          method: methodName
        });

        // 最大リトライ回数を超えた場合はエラーをスロー
        if (retries >= ConverseService.MAX_RETRIES) {
          converseLogger.error('Maximum retries reached for max token exceeded error', {
            maxRetries: ConverseService.MAX_RETRIES,
            errorMessage: error.message,
            modelId: props.modelId,
            method: methodName
          })
          
          // ユーザーに通知するためのエラーを発生
          const tokenExceededError = new Error('Max token limit exceeded in toolUse. The content is too large to process.');
          tokenExceededError.name = 'MaxTokenExceededError';
          // 元のエラー情報を保持
          (tokenExceededError as any).originalError = error;
          throw tokenExceededError;
        }

        // toolUseを使用しているメッセージの内容を縮小
        const modifiedProps = this.reduceToolUseContent(props);
        
        // ユーザーに通知するためのイベントを発行（main/rendererプロセス間通信用）
        if (this.context.store && typeof this.context.store.emit === 'function') {
          this.context.store.emit('content-size-reduced', {
            reason: 'max-token-exceeded',
            retryCount: retries + 1
          });
        }

        // 待機してから再試行（短めの待機時間）
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return methodName === 'converse'
          ? ((await this.converse(modifiedProps, retries + 1)) as T)
          : ((await this.converseStream(modifiedProps, retries + 1)) as T)
      }
      
      // その他のバリデーションエラー
      converseLogger.error(`ValidationException in ${methodName}`, {
        errorMessage: error.message,
        errorDetails: error.$metadata,
        modelId: props.modelId
      })
    } else {
      // その他のエラー
      converseLogger.error(`Error in ${methodName}`, {
        errorName: error.name,
        errorMessage: error.message,
        modelId: props.modelId,
        stack: error.stack
      })
    }

    throw error
  }

  /**
   * toolUseのコンテンツサイズを縮小する
   * max tokenエラーが発生した場合、toolUseを使用しているメッセージの内容を縮小して
   * 再試行できるようにする
   */
  private reduceToolUseContent(props: CallConverseAPIProps): CallConverseAPIProps {
    // propsのクローンを作成
    const modifiedProps = { ...props };
    
    if (!modifiedProps.messages || !Array.isArray(modifiedProps.messages)) {
      return modifiedProps;
    }
    
    // メッセージ配列をクローン
    modifiedProps.messages = [...modifiedProps.messages];
    
    // toolUseを含むメッセージを特定して内容を縮小
    let modifiedAnyContent = false;
    
    for (let i = 0; i < modifiedProps.messages.length; i++) {
      const message = { ...modifiedProps.messages[i] };
      
      if (!message.content || !Array.isArray(message.content)) {
        continue;
      }
      
      const modifiedContent = [...message.content];
      
      // 各コンテンツブロックをチェック
      for (let j = 0; j < modifiedContent.length; j++) {
        const block = { ...modifiedContent[j] };
        
        // toolUseブロックを検出
        if (Object.prototype.hasOwnProperty.call(block, 'toolUse') && block.toolUse) {
          converseLogger.debug('Found toolUse block to reduce', {
            toolName: block.toolUse.name,
            originalInputLength: JSON.stringify(block.toolUse.input).length
          });
          
          // inputがある場合は縮小
          if (Object.prototype.hasOwnProperty.call(block.toolUse, 'input')) {
            try {
              // JSON形式ならば一部のコンテンツを削減
              const inputStr = (typeof block.toolUse.input === 'string') 
                ? block.toolUse.input 
                : JSON.stringify(block.toolUse.input);
              
              // 文字列長を計算して削減
              const currentLength = inputStr.length;
              const newLength = Math.floor(currentLength * ConverseService.CONTENT_REDUCTION_FACTOR);
              
              // 縮小した内容を設定
              if (typeof block.toolUse.input === 'string') {
                block.toolUse.input = inputStr.substring(0, newLength);
              } else {
                try {
                  // JSONオブジェクトを文字列に変換、縮小して再度パース
                  const reducedStr = inputStr.substring(0, newLength);
                  // JSONの整合性を保つために、途中で切れた場合は最後の閉じブラケットを追加
                  const fixedStr = this.ensureValidJson(reducedStr);
                  block.toolUse.input = JSON.parse(fixedStr);
                } catch (parseError) {
                  // JSONパースエラーの場合は文字列として設定
                  converseLogger.warn('Error parsing reduced JSON, using string instead', {
                    parseError
                  });
                  block.toolUse.input = reducedStr;
                }
              }
              
              converseLogger.debug('Reduced toolUse input size', {
                toolName: block.toolUse.name,
                originalLength: currentLength,
                newLength: JSON.stringify(block.toolUse.input).length
              });
              
              // 修正したブロックを格納
              modifiedContent[j] = block;
              modifiedAnyContent = true;
            } catch (error) {
              converseLogger.error('Error reducing toolUse content', {
                error
              });
            }
          }
        }
      }
      
      // 修正したコンテンツでメッセージを更新
      if (modifiedAnyContent) {
        message.content = modifiedContent;
        modifiedProps.messages[i] = message;
      }
    }
    
    if (modifiedAnyContent) {
      converseLogger.info('Modified toolUse content for retry', {
        messageCount: modifiedProps.messages.length
      });
    } else {
      converseLogger.warn('No toolUse content found to modify', {
        messageCount: modifiedProps.messages.length
      });
    }
    
    return modifiedProps;
  }
  
  /**
   * 切り詰められたJSONが有効なJSONになるように修復する
   */
  private ensureValidJson(jsonStr: string): string {
    // カッコ、ブラケットの数をカウント
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    
    // 文字列内のカッコ、ブラケットをカウント
    for (let i = 0; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') openBraces++;
      else if (jsonStr[i] === '}') closeBraces++;
      else if (jsonStr[i] === '[') openBrackets++;
      else if (jsonStr[i] === ']') closeBrackets++;
    }
    
    // 閉じカッコ、ブラケットが足りない場合は追加
    let fixedStr = jsonStr;
    
    // JSONが中途半端に切れている場合は修復を試みる
    if (openBraces > closeBraces || openBrackets > closeBrackets) {
      // 不足している閉じブラケットを追加
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedStr += ']';
      }
      
      // 不足している閉じカッコを追加
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedStr += '}';
      }
    }
    
    return fixedStr;
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

    converseLogger.info('Switching to alternate region due to throttling', {
      currentRegion: awsConfig.region,
      alternateRegion,
      modelId: props.modelId
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
    } catch (alternateError: any) {
      converseLogger.error('Error in alternate region request', {
        region: alternateRegion,
        modelId: props.modelId,
        errorName: alternateError?.name,
        errorMessage: alternateError?.message,
        stack: alternateError?.stack
      })
      return null // 別リージョンでもエラーの場合は null を返し、通常の再試行へ
    }
  }
}
