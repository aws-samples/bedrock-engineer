import { IpcMainInvokeEvent, BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { promisify } from 'util'
import { log } from '../../common/logger'

const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

interface CameraCaptureOptions {
  deviceId?: string // 特定のカメラデバイスを選択するためのID
  width?: number // 希望する幅（ピクセル）
  height?: number // 希望する高さ（ピクセル）
  format?: 'png' | 'jpeg' // 出力形式
  quality?: number // JPEG品質（1-100）
  outputPath?: string // 出力ファイルパス（指定なしの場合は一時ディレクトリ）
}

interface CameraCaptureResult {
  success: boolean
  filePath: string
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
    timestamp: string
    deviceId?: string
  }
}

interface CameraDeviceInfo {
  deviceId: string
  label: string
  isDefault: boolean
}

interface PermissionCheckResult {
  hasPermission: boolean
  platform: string
  message: string
}

// 隠しBrowserWindowを使用してカメラにアクセスするヘルパー関数
async function captureFromCamera(options: CameraCaptureOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // 隠しウィンドウを作成
      const window = new BrowserWindow({
        width: 1,
        height: 1,
        show: false, // ユーザーには表示しない
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          // セキュリティ上の理由からカメラ使用時のみ有効にする
          enableRemoteModule: false,
          // メディアアクセスを許可
          webSecurity: true
        }
      })

      // カメラキャプチャ用のHTMLを読み込む
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Camera Capture</title>
        <style>
          body { margin: 0; padding: 0; }
          video, canvas { position: absolute; left: 0; top: 0; }
        </style>
      </head>
      <body>
        <video id="video" style="display:none;"></video>
        <canvas id="canvas" style="display:none;"></canvas>
        <script>
          // WebRTC APIを使用してカメラにアクセス
          const video = document.getElementById('video');
          const canvas = document.getElementById('canvas');
          const width = ${options.width || 1280};
          const height = ${options.height || 720};
          
          // カメラ設定
          const constraints = {
            video: {
              width: { ideal: width },
              height: { ideal: height },
              deviceId: ${options.deviceId ? `"${options.deviceId}"` : 'undefined'}
            }
          };

          // カメラストリームを取得
          navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
              video.srcObject = stream;
              video.onloadedmetadata = () => {
                video.play();
                
                // ストリームが準備できたら少し待ってからキャプチャ
                setTimeout(() => {
                  // キャンバスを設定
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext('2d');
                  
                  // ビデオフレームをキャンバスに描画
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  
                  // キャンバスをデータURLとして取得
                  const format = '${options.format || 'png'}';
                  const quality = ${options.format === 'jpeg' ? (options.quality || 90) / 100 : 1};
                  const dataUrl = canvas.toDataURL('image/' + format, quality);
                  
                  // ストリームを停止
                  stream.getTracks().forEach(track => track.stop());
                  
                  // 結果をメインプロセスに返す
                  window.electronAPI.sendCapturedImage({
                    dataUrl, 
                    width: canvas.width, 
                    height: canvas.height,
                    deviceId: stream.getVideoTracks()[0].getSettings().deviceId
                  });
                }, 1000); // 1秒待機してカメラが準備できるようにする
              };
            })
            .catch(error => {
              window.electronAPI.sendCaptureError(error.toString());
            });
        </script>
      </body>
      </html>
      `

      // 一時HTMLファイルを作成
      const tmpHtmlPath = path.join(os.tmpdir(), `camera-capture-${Date.now()}.html`)
      fs.writeFileSync(tmpHtmlPath, htmlContent)

      // IPC通信の設定
      window.webContents.ipc.handle('camera-capture-result', (_event, result) => {
        try {
          // Base64データをバッファに変換
          const base64Data = result.dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '')
          const imageBuffer = Buffer.from(base64Data, 'base64')

          // 一時HTMLファイルを削除
          fs.unlinkSync(tmpHtmlPath)

          // ウィンドウを閉じる
          window.destroy()

          // 結果を返す
          resolve({
            imageBuffer,
            width: result.width,
            height: result.height,
            deviceId: result.deviceId
          })
        } catch (error) {
          reject(error)
        }
      })

      window.webContents.ipc.handle('camera-capture-error', (_event, errorMessage) => {
        // 一時HTMLファイルを削除
        fs.unlinkSync(tmpHtmlPath)

        // ウィンドウを閉じる
        window.destroy()

        // エラーを返す
        reject(new Error(errorMessage))
      })

      // プリロード設定
      window.webContents.on('did-finish-load', () => {
        window.webContents.executeJavaScript(`
          window.electronAPI = {
            sendCapturedImage: (data) => window.ipcRenderer.invoke('camera-capture-result', data),
            sendCaptureError: (error) => window.ipcRenderer.invoke('camera-capture-error', error)
          };
        `)
      })

      // HTMLファイルをロード
      window.loadFile(tmpHtmlPath)
    } catch (error) {
      reject(error)
    }
  })
}

export const cameraHandlers = {
  // カメラデバイス一覧取得
  'camera:list-devices': async (_event: IpcMainInvokeEvent): Promise<CameraDeviceInfo[]> => {
    try {
      log.info('Getting camera device list')

      // 専用のBrowserWindowを作成してデバイス一覧を取得
      const window = new BrowserWindow({
        width: 1,
        height: 1,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })

      return new Promise((resolve, reject) => {
        window.webContents.ipc.handle('camera-devices-result', (_event, devices) => {
          window.destroy()
          resolve(devices)
        })

        window.webContents.ipc.handle('camera-devices-error', (_event, errorMessage) => {
          window.destroy()
          reject(new Error(errorMessage))
        })

        // プリロード設定
        window.webContents.on('did-finish-load', () => {
          window.webContents.executeJavaScript(`
            window.electronAPI = {
              sendDevices: (data) => window.ipcRenderer.invoke('camera-devices-result', data),
              sendError: (error) => window.ipcRenderer.invoke('camera-devices-error', error)
            };

            // デバイス一覧取得
            navigator.mediaDevices.enumerateDevices()
              .then(devices => {
                const videoDevices = devices
                  .filter(device => device.kind === 'videoinput')
                  .map((device, index) => ({
                    deviceId: device.deviceId,
                    label: device.label || \`Camera \${index + 1}\`,
                    isDefault: index === 0
                  }));
                window.electronAPI.sendDevices(videoDevices);
              })
              .catch(error => {
                window.electronAPI.sendError(error.toString());
              });
          `)
        })

        window.loadURL('data:text/html,<html><body>Camera Device Detection</body></html>')
      })
    } catch (error) {
      log.error('Failed to list camera devices', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // カメラキャプチャ実行
  'camera:capture': async (
    _event: IpcMainInvokeEvent,
    options: CameraCaptureOptions = {}
  ): Promise<CameraCaptureResult> => {
    try {
      // アクセスを記録
      const now = new Date().toISOString()
      log.info(`[PRIVACY_LOG] Camera access at ${now}`, {
        timestamp: now,
        action: 'camera_capture',
        deviceId: options.deviceId ? 'specific' : 'default',
        format: options.format || 'png',
        quality: options.quality
      })

      log.info('Starting camera capture', {
        deviceId: options.deviceId || 'default',
        format: options.format || 'png',
        quality: options.quality
      })

      // カメラからキャプチャ
      const captureResult = await captureFromCamera(options)

      // 出力パスの決定（一時ディレクトリ内の専用サブディレクトリを使用）
      const timestamp = Date.now()
      const format = options.format || 'png'
      const filename = `camera_capture_${timestamp}.${format}`

      // 一時ディレクトリ内に専用サブフォルダを作成（存在確認）
      const tempBasePath = path.join(os.tmpdir(), 'bedrock-engineer-camera-captures')
      try {
        if (!fs.existsSync(tempBasePath)) {
          fs.mkdirSync(tempBasePath, { recursive: true })
        }
      } catch (err) {
        log.warn('Failed to create temp directory, using OS temp dir', { error: err })
      }

      const outputPath = options.outputPath || path.join(tempBasePath, filename)

      // 画像を保存
      await writeFile(outputPath, captureResult.imageBuffer)

      // 古い一時ファイルをクリーンアップ（24時間以上前のファイル）
      try {
        if (fs.existsSync(tempBasePath)) {
          const files = fs.readdirSync(tempBasePath)
          const now = Date.now()
          const ONE_DAY = 24 * 60 * 60 * 1000 // 24時間（ミリ秒）

          for (const file of files) {
            if (!file.startsWith('camera_capture_')) continue

            const filePath = path.join(tempBasePath, file)
            const stats = fs.statSync(filePath)
            const fileAge = now - stats.mtimeMs

            if (fileAge > ONE_DAY) {
              fs.unlinkSync(filePath)
              log.debug('Cleaned up old temporary camera capture file', { file })
            }
          }
        }
      } catch (cleanupErr) {
        log.warn('Failed to cleanup old temporary files', { error: cleanupErr })
      }

      // ファイル情報の取得
      const stats = await stat(outputPath)

      log.info('Camera capture completed successfully', {
        path: outputPath,
        width: captureResult.width,
        height: captureResult.height,
        format,
        fileSize: stats.size
      })

      return {
        success: true,
        filePath: outputPath,
        metadata: {
          width: captureResult.width,
          height: captureResult.height,
          format,
          fileSize: stats.size,
          timestamp: new Date().toISOString(),
          deviceId: captureResult.deviceId
        }
      }
    } catch (error) {
      log.error('Failed to capture from camera', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // カメラ権限確認
  'camera:check-permissions': async (
    _event: IpcMainInvokeEvent
  ): Promise<PermissionCheckResult> => {
    try {
      log.debug('Checking camera permissions')

      // 専用のウィンドウで権限確認
      const window = new BrowserWindow({
        width: 1,
        height: 1,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })

      return new Promise((resolve, reject) => {
        window.webContents.ipc.handle('camera-permission-result', (_event, result) => {
          window.destroy()
          resolve({
            hasPermission: result.hasPermission,
            platform: process.platform,
            message: result.message
          })
        })

        window.webContents.ipc.handle('camera-permission-error', (_event, errorMessage) => {
          window.destroy()
          reject(new Error(errorMessage))
        })

        // プリロード設定
        window.webContents.on('did-finish-load', () => {
          window.webContents.executeJavaScript(`
            window.electronAPI = {
              sendResult: (data) => window.ipcRenderer.invoke('camera-permission-result', data),
              sendError: (error) => window.ipcRenderer.invoke('camera-permission-error', error)
            };

            // 権限チェック
            navigator.mediaDevices.getUserMedia({ video: true })
              .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                window.electronAPI.sendResult({
                  hasPermission: true,
                  message: 'Camera permissions granted'
                });
              })
              .catch(error => {
                window.electronAPI.sendResult({
                  hasPermission: false,
                  message: error.toString()
                });
              });
          `)
        })

        window.loadURL('data:text/html,<html><body>Camera Permission Check</body></html>')
      })
    } catch (error) {
      log.error('Camera permission check failed', {
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        hasPermission: false,
        platform: process.platform,
        message: error instanceof Error ? error.message : 'Permission check failed'
      }
    }
  }
} as const
