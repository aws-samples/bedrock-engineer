/**
 * Bluetooth API for preload
 */
import { ipcRenderer } from 'electron'
import {
  BluetoothDeviceInfo,
  BluetoothServiceInfo,
  BluetoothCharacteristicInfo
} from '../../types/bluetooth'

/**
 * Bluetooth API exposed to renderer processes
 */
export const bluetoothAPI = {
  /**
   * Bluetooth デバイスをスキャン
   */
  scanDevices: async (options?: {
    duration?: number
    serviceUuids?: string[]
    allowDuplicates?: boolean
  }): Promise<BluetoothDeviceInfo[]> => {
    const result = await ipcRenderer.invoke('bluetooth:scan-devices', options || {})
    return result.devices
  },

  /**
   * デバイスに接続
   */
  connectDevice: async (deviceId: string): Promise<boolean> => {
    const result = await ipcRenderer.invoke('bluetooth:connect-device', deviceId)
    return result.success
  },

  /**
   * デバイスから切断
   */
  disconnectDevice: async (deviceId: string): Promise<boolean> => {
    const result = await ipcRenderer.invoke('bluetooth:disconnect-device', deviceId)
    return result.success
  },

  /**
   * デバイスのサービス一覧を取得
   */
  getServices: async (deviceId: string): Promise<BluetoothServiceInfo[]> => {
    const result = await ipcRenderer.invoke('bluetooth:get-services', deviceId)
    return result.services
  },

  /**
   * サービスのキャラクタリスティック一覧を取得
   */
  getCharacteristics: async (
    deviceId: string,
    serviceUuid: string
  ): Promise<BluetoothCharacteristicInfo[]> => {
    const result = await ipcRenderer.invoke('bluetooth:get-characteristics', deviceId, serviceUuid)
    return result.characteristics
  },

  /**
   * キャラクタリスティックの値を読み取り
   */
  readCharacteristic: async (
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<string> => {
    const result = await ipcRenderer.invoke(
      'bluetooth:read-characteristic',
      deviceId,
      serviceUuid,
      characteristicUuid
    )
    return result.value
  },

  /**
   * キャラクタリスティックに値を書き込み
   */
  writeCharacteristic: async (
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    value: string,
    withoutResponse: boolean = false
  ): Promise<boolean> => {
    const result = await ipcRenderer.invoke(
      'bluetooth:write-characteristic',
      deviceId,
      serviceUuid,
      characteristicUuid,
      value,
      withoutResponse
    )
    return result.success
  },

  /**
   * Bluetooth が利用可能かチェック
   */
  isAvailable: async (): Promise<boolean> => {
    const result = await ipcRenderer.invoke('bluetooth:is-available')
    return result.available
  }
}
