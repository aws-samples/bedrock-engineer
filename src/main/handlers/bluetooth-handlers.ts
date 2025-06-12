/**
 * Bluetooth IPC handlers
 */
import { IpcMainInvokeEvent } from 'electron'
import { NobleBluetoothManager } from '../bluetooth/noble-bluetooth-manager'
import { log } from '../../common/logger'
import {
  BluetoothDeviceInfo,
  BluetoothServiceInfo,
  BluetoothCharacteristicInfo
} from '../../types/bluetooth'

// シングルトンインスタンス
let bluetoothManager: NobleBluetoothManager | null = null

// BluetoothManagerの取得・初期化
function getBluetoothManager(): NobleBluetoothManager {
  if (!bluetoothManager) {
    bluetoothManager = new NobleBluetoothManager()

    // クリーンアップ関数の登録
    process.once('exit', () => {
      if (bluetoothManager) {
        bluetoothManager.dispose().catch((err) => {
          log.error('Failed to dispose Bluetooth manager on exit', { err })
        })
      }
    })
  }
  return bluetoothManager
}

export const bluetoothHandlers = {
  // デバイスの検索
  'bluetooth:scan-devices': async (
    _event: IpcMainInvokeEvent,
    options?: {
      duration?: number
      serviceUuids?: string[]
      allowDuplicates?: boolean
    }
  ): Promise<{ devices: BluetoothDeviceInfo[] }> => {
    try {
      const manager = getBluetoothManager()

      // スキャン開始
      await manager.startScan(options)

      // スキャン時間を設定（デフォルト5秒）
      const scanDuration = options?.duration || 5

      // スキャン完了を待機
      await new Promise<void>((resolve) => setTimeout(resolve, scanDuration * 1000))

      // スキャン停止
      await manager.stopScan()

      // 検出したデバイスを返す
      const devices = manager.getScannedDevices()

      log.info('Bluetooth scan completed', {
        deviceCount: devices.length,
        deviceNames: devices.map((d) => d.name)
      })

      return { devices }
    } catch (error) {
      log.error('Error scanning Bluetooth devices', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // デバイスへの接続
  'bluetooth:connect-device': async (
    _event: IpcMainInvokeEvent,
    deviceId: string
  ): Promise<{ success: boolean }> => {
    try {
      const manager = getBluetoothManager()
      const result = await manager.connect(deviceId)

      log.info('Bluetooth device connection result', {
        deviceId,
        success: result
      })

      return { success: result }
    } catch (error) {
      log.error('Error connecting to Bluetooth device', {
        deviceId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // デバイスの切断
  'bluetooth:disconnect-device': async (
    _event: IpcMainInvokeEvent,
    deviceId: string
  ): Promise<{ success: boolean }> => {
    try {
      const manager = getBluetoothManager()
      const result = await manager.disconnect(deviceId)

      log.info('Bluetooth device disconnection result', {
        deviceId,
        success: result
      })

      return { success: result }
    } catch (error) {
      log.error('Error disconnecting from Bluetooth device', {
        deviceId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // デバイスのサービス一覧取得
  'bluetooth:get-services': async (
    _event: IpcMainInvokeEvent,
    deviceId: string
  ): Promise<{ services: BluetoothServiceInfo[] }> => {
    try {
      const manager = getBluetoothManager()
      const services = await manager.getServices(deviceId)

      log.info('Bluetooth device services result', {
        deviceId,
        serviceCount: services.length,
        serviceUuids: services.map((s) => s.uuid)
      })

      return { services }
    } catch (error) {
      log.error('Error getting Bluetooth device services', {
        deviceId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // サービスのキャラクタリスティック一覧取得
  'bluetooth:get-characteristics': async (
    _event: IpcMainInvokeEvent,
    deviceId: string,
    serviceUuid: string
  ): Promise<{ characteristics: BluetoothCharacteristicInfo[] }> => {
    try {
      const manager = getBluetoothManager()
      const characteristics = await manager.getCharacteristics(deviceId, serviceUuid)

      log.info('Bluetooth service characteristics result', {
        deviceId,
        serviceUuid,
        characteristicCount: characteristics.length,
        characteristicUuids: characteristics.map((c) => c.uuid)
      })

      return { characteristics }
    } catch (error) {
      log.error('Error getting Bluetooth service characteristics', {
        deviceId,
        serviceUuid,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // キャラクタリスティックの読み取り
  'bluetooth:read-characteristic': async (
    _event: IpcMainInvokeEvent,
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<{ value: string }> => {
    try {
      const manager = getBluetoothManager()
      const dataBuffer = await manager.readCharacteristic(deviceId, serviceUuid, characteristicUuid)

      // バッファをBase64に変換
      const value = dataBuffer.toString('base64')

      log.info('Bluetooth characteristic read result', {
        deviceId,
        serviceUuid,
        characteristicUuid,
        valueLength: dataBuffer.length,
        value
      })

      return { value }
    } catch (error) {
      log.error('Error reading Bluetooth characteristic', {
        deviceId,
        serviceUuid,
        characteristicUuid,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // キャラクタリスティックの書き込み
  'bluetooth:write-characteristic': async (
    _event: IpcMainInvokeEvent,
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    value: string,
    withoutResponse: boolean = false
  ): Promise<{ success: boolean }> => {
    try {
      const manager = getBluetoothManager()

      // Base64からバッファに変換
      const dataBuffer = Buffer.from(value, 'base64')

      await manager.writeCharacteristic(
        deviceId,
        serviceUuid,
        characteristicUuid,
        dataBuffer,
        withoutResponse
      )

      log.info('Bluetooth characteristic write result', {
        deviceId,
        serviceUuid,
        characteristicUuid,
        valueLength: dataBuffer.length,
        withoutResponse,
        success: true
      })

      return { success: true }
    } catch (error) {
      log.error('Error writing to Bluetooth characteristic', {
        deviceId,
        serviceUuid,
        characteristicUuid,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  // キャラクタリスティック通知の購読（未実装 - WebSocketや他の双方向通信で実装予定）
  // IPC本来は単方向通信なのでここでは実装しない。必要な場合はipcRenderer.sendを使用してメインプロセスから
  // レンダラープロセスにイベントを送信する方式を検討する

  // Bluetoothの利用可否確認
  'bluetooth:is-available': (_event: IpcMainInvokeEvent): { available: boolean } => {
    try {
      const manager = getBluetoothManager()
      const available = manager.isBluetoothAvailable()

      log.info('Bluetooth availability check', { available })

      return { available }
    } catch (error) {
      log.error('Error checking Bluetooth availability', {
        error: error instanceof Error ? error.message : String(error)
      })
      return { available: false }
    }
  }
} as const
