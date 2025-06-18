import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { createRuntimeClient } from '../client'
import type { ServiceContext } from '../types'
import { createCategoryLogger } from '../../../../common/logger'
import { ConverseService } from './converseService'
import path from 'path'
import fs from 'fs'

// 画像認識サービス専用のカテゴリロガーを作成
const imageLogger = createCategoryLogger('bedrock:image')

/**
 * Bedrock を利用した画像認識サービス
 * 複数のモデル（Claude, Nova）に対応し、画像分析と認識を行う
 */
export class ImageRecognitionService {
  constructor(private context: ServiceContext) {}

  /**
   * 画像認識を実行する
   * Claude系モデルとNova系モデルの両方に対応
   * @param props.imagePath 画像ファイルのパス
   * @param props.prompt オプションのプロンプト
   * @param props.modelId 使用するモデルのID
   * @returns 画像の説明
   */
  async recognizeImage(props: {
    imagePath: string
    prompt?: string
    modelId?: string
  }): Promise<string> {
    const {
      imagePath,
      prompt = 'Please explain in detail what this image is about.',
      modelId = 'amazon.nova-lite-v1:0'
    } = props

    imageLogger.debug('Recognizing image', {
      imagePath,
      modelId,
      hasCustomPrompt: !!prompt
    })

    try {
      // ファイル検証を実行
      this.validateImageFile(imagePath)

      // 画像をBase64エンコード
      const fileContent = fs.readFileSync(imagePath) as any
      const base64Data = Buffer.from(fileContent).toString('base64')

      // メディアタイプの取得
      const ext = path.extname(imagePath).toLowerCase()
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }
      const mediaType = mimeTypes[ext] || 'application/octet-stream'

      // モデルタイプの判定とモデル別の処理の実行
      const fileName = path.basename(imagePath)

      if (this.isNovaModel(modelId)) {
        imageLogger.info('Using Nova model for image recognition', {
          fileName,
          modelId
        })
        return await this.recognizeImageWithNova(imagePath, base64Data, mediaType, prompt, modelId)
      } else {
        imageLogger.info('Using Claude model for image recognition', {
          fileName,
          modelId
        })
        return await this.recognizeImageWithClaude(
          imagePath,
          base64Data,
          mediaType,
          prompt,
          modelId
        )
      }
    } catch (error: any) {
      imageLogger.error('Error in image recognition', {
        imagePath,
        error: error instanceof Error ? error.message : String(error),
        modelId
      })

      throw error
    }
  }

  /**
   * Nova系モデルかどうかを判定する
   */
  private isNovaModel(modelId: string): boolean {
    // クロスリージョン推論を考慮してベースモデルIDをチェック
    const baseModelId = modelId.replace(/^[a-z]{2}\./, '')
    return baseModelId.includes('amazon.nova')
  }

  /**
   * 画像ファイルの検証を行う
   * 存在確認、形式チェック、サイズ制限などを適用
   */
  private validateImageFile(imagePath: string): void {
    const fs = require('fs')
    const path = require('path')

    // ファイル存在確認
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`)
    }

    // 画像形式の確認
    const ext = path.extname(imagePath).toLowerCase()
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

    if (!supportedFormats.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}`)
    }

    // ファイルサイズの確認
    const stats = fs.statSync(imagePath)
    const maxSize = 3.75 * 1024 * 1024 // 3.75MB (Claude/Novaの共通制限)

    if (stats.size > maxSize) {
      throw new Error(`Image file too large: ${stats.size} bytes (max: ${maxSize} bytes)`)
    }
  }

  /**
   * Claude系モデルを使った画像認識
   */
  private async recognizeImageWithClaude(
    imagePath: string,
    base64Data: string,
    mediaType: string,
    prompt: string,
    modelId: string
  ): Promise<string> {
    const runtimeClient = createRuntimeClient(this.context.store.get('aws'))

    // Claude Messages APIのリクエスト形式を構築
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      system:
        'あなたは画像認識を行うアシスタントです。提供された画像を詳細に分析し、説明してください。'
    }

    imageLogger.info('Calling Bedrock for image recognition with Claude', {
      fileName: path.basename(imagePath),
      modelId
    })

    // InvokeModelCommand を使用して直接モデル呼び出し
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    })

    // リクエスト実行
    const response = await runtimeClient.send(command)

    // レスポンスをパース
    const responseBody = new TextDecoder().decode(response.body)
    const result = JSON.parse(responseBody)

    // レスポンスからテキスト部分を抽出
    let description = ''
    if (result.content) {
      if (Array.isArray(result.content)) {
        // コンテンツが配列の場合はテキスト部分を連結
        description = result.content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('\n')
      } else if (typeof result.content === 'string') {
        // 文字列の場合はそのまま使用
        description = result.content
      }
    }

    if (!description) {
      throw new Error('No text content in response')
    }

    imageLogger.info('Image recognition successful with Claude', {
      fileName: path.basename(imagePath),
      modelId,
      responseLength: description.length
    })

    return description
  }

  /**
   * Nova系モデルを使った画像認識（ConverseServiceを使用）
   */
  private async recognizeImageWithNova(
    imagePath: string,
    base64Data: string,
    mediaType: string,
    prompt: string,
    modelId: string
  ): Promise<string> {
    const path = require('path')

    // ConverseServiceをインポート
    const converseService = new ConverseService(this.context)

    imageLogger.info('Calling Bedrock for image recognition with Nova using Converse API', {
      fileName: path.basename(imagePath),
      modelId
    })

    // Converse API用のメッセージ形式

    const systemPrompt = [
      {
        text: 'あなたは画像認識を行うアシスタントです。提供された画像を詳細に分析し、説明してください。'
      }
    ]

    try {
      const response = await converseService.converse({
        modelId,
        messages: [
          {
            role: 'user',
            content: [
              {
                image: {
                  format: mediaType.split('/')[1] as any, // 'image/png' -> 'png'
                  source: {
                    bytes: Buffer.from(base64Data, 'base64') as any
                  }
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        system: systemPrompt
      })

      // レスポンスからテキスト部分を抽出
      let description = ''
      if (response.output?.message?.content) {
        if (Array.isArray(response.output.message.content)) {
          description = response.output.message.content
            .filter((item: any) => item.text)
            .map((item: any) => item.text)
            .join('\n')
        }
      }

      if (!description) {
        throw new Error('No text content in Nova response')
      }

      imageLogger.info('Image recognition successful with Nova', {
        fileName: path.basename(imagePath),
        modelId,
        responseLength: description.length
      })

      return description
    } catch (error: any) {
      imageLogger.error('Error in Nova image recognition', {
        fileName: path.basename(imagePath),
        modelId,
        error: error.message
      })
      throw error
    }
  }
}
