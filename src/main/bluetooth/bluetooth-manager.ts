/**
 * Bluetooth Manager Interface
 * Abstract class for different Bluetooth implementations
 */

import {
  BluetoothDeviceInfo,
  BluetoothServiceInfo,
  BluetoothCharacteristicInfo,
  BluetoothConnectionState,
  BluetoothManager
} from '../../types/bluetooth'
import { EventEmitter } from 'events'

// イベント型定義
export interface BluetoothEvents {
  scanStart: () => void
  scanStop: () => void
  discover: (device: BluetoothDeviceInfo) => void
  connect: (deviceId: string) => void
  disconnect: (deviceId: string) => void
  stateChange: (
    state: 'poweredOn' | 'poweredOff' | 'unauthorized' | 'unsupported' | 'unknown'
  ) => void
  error: (error: Error) => void
  characteristicValueChange: (
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    value: Buffer
  ) => void
}

/**
 * 抽象化されたBluetoothマネージャー
 * 異なるBluetooth実装（Noble, Web Bluetooth等）に対する統一インターフェース
 */
export abstract class AbstractBluetoothManager extends EventEmitter implements BluetoothManager {
  protected devices: Map<string, BluetoothDeviceInfo> = new Map()
  protected connectionStates: Map<string, BluetoothConnectionState> = new Map()
  protected listeners: Map<string, Set<(data: Buffer) => void>> = new Map()

  constructor() {
    super()
    this.initialize()
  }

  // 実装固有の初期化
  protected abstract initialize(): void

  // スキャン開始
  abstract startScan(options?: {
    duration?: number
    serviceUuids?: string[]
    allowDuplicates?: boolean
  }): Promise<void>

  // スキャン停止
  abstract stopScan(): Promise<void>

  // スキャンされたデバイス一覧取得
  getScannedDevices(): BluetoothDeviceInfo[] {
    return Array.from(this.devices.values())
  }

  // 接続
  abstract connect(deviceId: string): Promise<boolean>

  // 切断
  abstract disconnect(deviceId: string): Promise<boolean>

  // サービス取得
  abstract getServices(deviceId: string): Promise<BluetoothServiceInfo[]>

  // キャラクタリスティック取得
  abstract getCharacteristics(
    deviceId: string,
    serviceUuid: string
  ): Promise<BluetoothCharacteristicInfo[]>

  // キャラクタリスティック読み取り
  abstract readCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<Buffer>

  // キャラクタリスティック書き込み
  abstract writeCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    value: Buffer,
    withoutResponse?: boolean
  ): Promise<void>

  // キャラクタリスティック通知購読
  abstract subscribeToCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    listener: (data: Buffer) => void
  ): Promise<void>

  // キャラクタリスティック通知解除
  abstract unsubscribeFromCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void>

  // 接続状態取得
  getConnectionState(deviceId: string): BluetoothConnectionState {
    return this.connectionStates.get(deviceId) || 'disconnected'
  }

  // Bluetooth利用可否確認
  abstract isBluetoothAvailable(): boolean

  // リスナーキー生成
  protected getListenerKey(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): string {
    return `${deviceId}_${serviceUuid}_${characteristicUuid}`
  }

  // タイプセーフなイベント発行
  on<K extends keyof BluetoothEvents>(eventName: K, listener: BluetoothEvents[K]): this {
    return super.on(eventName, listener as any)
  }

  // タイプセーフなイベント発行（1回限り）
  once<K extends keyof BluetoothEvents>(eventName: K, listener: BluetoothEvents[K]): this {
    return super.once(eventName, listener as any)
  }

  // タイプセーフなイベント解除
  off<K extends keyof BluetoothEvents>(eventName: K, listener: BluetoothEvents[K]): this {
    return super.off(eventName, listener as any)
  }

  // 全てのリソース解放
  abstract dispose(): Promise<void>
}
