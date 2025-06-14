/**
 * Camera device utilities for web-based camera access
 * Uses navigator.mediaDevices.enumerateDevices() for device enumeration
 */

// カメラデバイス情報の型定義
export interface CameraDeviceInfo {
  id: string
  name: string
  enabled: boolean
  capabilities: {
    maxWidth: number
    maxHeight: number
    supportedFormats: string[]
  }
}

/**
 * 利用可能なカメラデバイスを取得
 * navigator.mediaDevices.enumerateDevices() を使用
 */
export async function enumerateCameraDevices(): Promise<CameraDeviceInfo[]> {
  try {
    // Check if getUserMedia API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('Camera enumeration API is not available in this browser')
    }

    // Get all media devices
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices.filter((device) => device.kind === 'videoinput')

    // Transform MediaDeviceInfo to CameraDeviceInfo
    const cameras: CameraDeviceInfo[] = videoDevices.map((device, index) => ({
      id: device.deviceId,
      name: device.label || `Camera ${index + 1}`, // Fallback name if label is empty
      enabled: true,
      capabilities: {
        // Default reasonable capabilities - actual capabilities would require getUserMedia test
        maxWidth: 1920,
        maxHeight: 1080,
        supportedFormats: ['jpg', 'png']
      }
    }))

    return cameras
  } catch (error) {
    console.error('Failed to enumerate camera devices:', error)
    throw new Error(
      `Camera device enumeration failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * 指定されたカメラデバイスが利用可能かチェック
 */
export async function isCameraDeviceAvailable(deviceId: string): Promise<boolean> {
  try {
    const cameras = await enumerateCameraDevices()
    return cameras.some((camera) => camera.id === deviceId)
  } catch {
    return false
  }
}

/**
 * カメラアクセス権限を要求し、デバイス一覧を取得
 * 権限が必要な場合、ユーザーに許可を求める
 */
export async function requestCameraPermissionAndEnumerate(): Promise<CameraDeviceInfo[]> {
  try {
    // First try to get devices without permission (may have empty labels)
    let cameras = await enumerateCameraDevices()

    // If we have devices but no labels, request permission to get proper labels
    const hasEmptyLabels = cameras.some(
      (camera) => !camera.name || camera.name.startsWith('Camera ')
    )

    if (cameras.length > 0 && hasEmptyLabels) {
      try {
        // Request permission by trying to access a camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: cameras[0].id }
        })

        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach((track) => track.stop())

        // Now get devices again with proper labels
        cameras = await enumerateCameraDevices()
      } catch (permissionError) {
        // Permission denied or device access failed
        console.warn('Camera permission request failed:', permissionError)
        // Return the cameras we got without proper labels
      }
    }

    return cameras
  } catch (error) {
    console.error('Failed to request camera permission and enumerate:', error)
    throw error
  }
}

/**
 * 指定されたデバイスIDのカメラでテストキャプチャを実行
 * デバイスが正常に動作するかテストする
 */
export async function testCameraDevice(deviceId: string): Promise<{
  success: boolean
  error?: string
  capabilities?: {
    width: number
    height: number
  }
}> {
  let stream: MediaStream | null = null

  try {
    // Try to access the specific camera
    stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    })

    // Get actual capabilities
    const videoTrack = stream.getVideoTracks()[0]
    const settings = videoTrack.getSettings()

    return {
      success: true,
      capabilities: {
        width: settings.width || 640,
        height: settings.height || 480
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Camera test failed'
    }
  } finally {
    // Always clean up the stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }
}
