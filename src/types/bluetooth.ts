/**
 * Bluetooth device types and interfaces
 */

// Bluetooth デバイス情報
export interface BluetoothDeviceInfo {
  id: string
  name: string
  address: string
  rssi: number
  connectable: boolean
  paired: boolean
  serviceUUIDs?: string[]
  manufacturerData?: {
    id: number
    data: Buffer
  }
}

// Bluetooth GATT Service 情報
export interface BluetoothServiceInfo {
  uuid: string
  name?: string
  isPrimary: boolean
  deviceId: string
}

// Bluetooth GATT Characteristic 情報
export interface BluetoothCharacteristicInfo {
  uuid: string
  name?: string
  serviceUuid: string
  properties: {
    read: boolean
    write: boolean
    writeWithoutResponse: boolean
    notify: boolean
    indicate: boolean
  }
  value?: Buffer
  descriptors?: BluetoothDescriptorInfo[]
}

// Bluetooth GATT Descriptor 情報
export interface BluetoothDescriptorInfo {
  uuid: string
  name?: string
  value?: Buffer
}

// デバイス接続ステータス
export type BluetoothConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

// ツール入力パラメータの型
export interface BluetoothInput {
  type: 'bluetoothDevice'
  operation: 'scan' | 'connect' | 'disconnect' | 'read' | 'write' | 'subscribe' | 'unsubscribe'
  deviceId?: string
  serviceUuid?: string
  characteristicUuid?: string
  value?: string | number[] | Buffer
  scanDuration?: number // スキャン時間（秒）
  scanFilter?: {
    name?: string
    serviceUuids?: string[]
  }
}

// ツール出力の型
export interface BluetoothResult {
  success: boolean
  name: 'bluetoothDevice'
  message: string
  result?: {
    operation: string
    devices?: BluetoothDeviceInfo[]
    device?: BluetoothDeviceInfo
    services?: BluetoothServiceInfo[]
    characteristics?: BluetoothCharacteristicInfo[]
    value?: string | number[] | Buffer
    error?: string
  }
}

// BluetoothManagerの共通インターフェース（プラットフォーム非依存）
export interface BluetoothManager {
  startScan(options?: {
    duration?: number
    serviceUuids?: string[]
    allowDuplicates?: boolean
  }): Promise<void>

  stopScan(): Promise<void>

  getScannedDevices(): BluetoothDeviceInfo[]

  connect(deviceId: string): Promise<boolean>

  disconnect(deviceId: string): Promise<boolean>

  getServices(deviceId: string): Promise<BluetoothServiceInfo[]>

  getCharacteristics(deviceId: string, serviceUuid: string): Promise<BluetoothCharacteristicInfo[]>

  readCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<Buffer>

  writeCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    value: Buffer,
    withoutResponse?: boolean
  ): Promise<void>

  subscribeToCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    listener: (data: Buffer) => void
  ): Promise<void>

  unsubscribeFromCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void>

  getConnectionState(deviceId: string): BluetoothConnectionState

  isBluetoothAvailable(): boolean
}
