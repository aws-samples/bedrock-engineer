import { BaseTool } from '../../base/BaseTool'
import { ToolDependencies, ToolCategory } from '../../base/types'
import { ipcRenderer } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import os from 'os'
import fs from 'fs'

/**
 * カメラキャプチャツール
 * コンピュータのカメラを使用して画像を取得し、オプションでAI画像認識を実行
 */
class CameraCaptureTool extends BaseTool {
  constructor(dependencies: ToolDependencies) {
    super('cameraCapture', dependencies)
  }

  description(): string {
    return 'カメラで写真を撮影し、必要に応じて画像分析を実行します'
  }

  async validate(input: unknown): Promise<void> {
    const typedInput = input as {
      deviceId?: string
      width?: number
      height?: number
      recognizePrompt?: string
    }

    // すべてのパラメータはオプショナル
    if (typedInput.width !== undefined && typeof typedInput.width !== 'number') {
      throw new Error('width パラメータは数値である必要があります')
    }

    if (typedInput.height !== undefined && typeof typedInput.height !== 'number') {
      throw new Error('height パラメータは数値である必要があります')
    }

    if (typedInput.deviceId !== undefined && typeof typedInput.deviceId !== 'string') {
      throw new Error('deviceId パラメータは文字列である必要があります')
    }

    if (
      typedInput.recognizePrompt !== undefined &&
      typeof typedInput.recognizePrompt !== 'string'
    ) {
      throw new Error('recognizePrompt パラメータは文字列である必要があります')
    }
  }

  async execute(input: any): Promise<any> {
    try {
      // 権限チェック
      const permissionCheck = await ipcRenderer.invoke('camera:check-permissions')
      if (!permissionCheck.hasPermission) {
        return {
          error: {
            code: 'PERMISSION_DENIED',
            message: `カメラにアクセスする権限がありません: ${permissionCheck.message}`
          }
        }
      }

      // デバイスIDが指定されていない場合はデバイス一覧を取得
      let deviceId = input.deviceId
      if (!deviceId) {
        const devices = await ipcRenderer.invoke('camera:list-devices')
        if (devices && devices.length > 0) {
          // デフォルトデバイスを優先的に使用
          const defaultDevice = devices.find((d) => d.isDefault)
          deviceId = defaultDevice ? defaultDevice.deviceId : devices[0].deviceId
        } else {
          return {
            error: {
              code: 'NO_CAMERA_FOUND',
              message: 'カメラデバイスが見つかりませんでした。'
            }
          }
        }
      }

      // 出力ファイルパスを設定（指定がなければ一時ディレクトリに作成）
      const outputPath = path.join(os.tmpdir(), `camera-capture-${uuidv4()}.png`)

      // カメラキャプチャ実行
      const result = await ipcRenderer.invoke('camera:capture', {
        deviceId,
        width: input.width,
        height: input.height,
        format: 'png',
        outputPath
      })

      if (!result.success) {
        return {
          error: {
            code: 'CAPTURE_FAILED',
            message: 'カメラキャプチャに失敗しました。'
          }
        }
      }

      // 画像認識が要求されている場合は認識処理を行う
      let recognitionResult = null
      if (input.recognizePrompt && result.filePath && fs.existsSync(result.filePath)) {
        try {
          const imageBuffer = fs.readFileSync(result.filePath)
          const base64Image = imageBuffer.toString('base64')

          // 認識処理を実行
          recognitionResult = await ipcRenderer.invoke('bedrock:recognize-image', {
            imageBase64: base64Image,
            prompt: input.recognizePrompt
          })
        } catch (recognizeError) {
          this.logger.error('画像認識エラー:', recognizeError)
          // 認識エラーがあっても、キャプチャ自体は成功しているので続行
        }
      }

      return {
        filePath: result.filePath,
        metadata: result.metadata,
        recognitionResult
      }
    } catch (error) {
      this.logger.error('カメラキャプチャエラー:', error)
      return {
        error: {
          code: 'CAMERA_CAPTURE_ERROR',
          message: `カメラキャプチャ中にエラーが発生しました: ${error.message || error}`
        }
      }
    }
  }
}

/**
 * カメラツールを作成
 */
export function createCameraTools(dependencies: ToolDependencies): Array<{
  tool: BaseTool
  category: ToolCategory
}> {
  return [
    {
      tool: new CameraCaptureTool(dependencies),
      category: 'media'
    }
  ]
}