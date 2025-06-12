/**
 * Noble based Bluetooth manager implementation
 */

import { AbstractBluetoothManager } from './bluetooth-manager'
import {
  BluetoothDeviceInfo,
  BluetoothServiceInfo,
  BluetoothCharacteristicInfo
} from '../../types/bluetooth'
import { log } from '../../common/logger'

// Noble型定義
type Noble = any
type NoblePeripheral = any
type NobleService = any
type NobleCharacteristic = any

export class NobleBluetoothManager extends AbstractBluetoothManager {
  private noble: Noble | null = null
  private peripherals: Map<string, NoblePeripheral> = new Map()
  private isScanning = false
  private scanTimeout: NodeJS.Timeout | null = null

  protected initialize(): void {
    try {
      // Noble動的インポート（Native Moduleなので動的インポート）
      import('noble')
        .then((nobleModule) => {
          this.noble = nobleModule.default || nobleModule

          // Nobleイベントハンドラー設定
          this.noble.on('stateChange', (state: string) => {
            log.info('Bluetooth adapter state changed', { state })
            this.emit('stateChange', state as any)
          })

          this.noble.on('discover', (peripheral: NoblePeripheral) => {
            this.handleDiscoveredPeripheral(peripheral)
          })

          this.noble.on('scanStart', () => {
            log.info('Bluetooth scan started')
            this.isScanning = true
            this.emit('scanStart')
          })

          this.noble.on('scanStop', () => {
            log.info('Bluetooth scan stopped')
            this.isScanning = false
            this.emit('scanStop')
          })

          this.noble.on('warning', (message: string) => {
            log.warn('Bluetooth warning', { message })
          })

          log.info('Noble Bluetooth manager initialized')
        })
        .catch((error) => {
          log.error('Failed to initialize Noble Bluetooth manager', { error })
          this.noble = null
        })
    } catch (error) {
      log.error('Error initializing Noble Bluetooth manager', { error })
      this.noble = null
    }
  }

  // デバイス発見ハンドラー
  private handleDiscoveredPeripheral(peripheral: NoblePeripheral): void {
    try {
      const deviceInfo: BluetoothDeviceInfo = {
        id: peripheral.id,
        name: peripheral.advertisement?.localName || 'Unknown Device',
        address: peripheral.address || peripheral.id,
        rssi: peripheral.rssi,
        connectable: peripheral.connectable === undefined ? true : peripheral.connectable,
        paired: false, // Nobleは現在のペアリング状態を提供しない
        serviceUUIDs: peripheral.advertisement?.serviceUuids || []
      }

      // 製造元データがあれば追加
      if (peripheral.advertisement?.manufacturerData) {
        deviceInfo.manufacturerData = {
          id: peripheral.advertisement.manufacturerData.readUInt16LE(0),
          data: peripheral.advertisement.manufacturerData
        }
      }

      // デバイス情報保存
      this.devices.set(peripheral.id, deviceInfo)
      this.peripherals.set(peripheral.id, peripheral)

      // イベント発生
      this.emit('discover', deviceInfo)
    } catch (error) {
      log.error('Error handling discovered peripheral', {
        error,
        deviceId: peripheral?.id
      })
    }
  }

  async startScan(options?: {
    duration?: number
    serviceUuids?: string[]
    allowDuplicates?: boolean
  }): Promise<void> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    if (this.isScanning) {
      await this.stopScan()
    }

    // スキャン前にデバイスリストをクリア
    this.devices.clear()
    this.peripherals.clear()

    return new Promise<void>((resolve, reject) => {
      // NoblesがpoweredOnであることを確認
      if (this.noble!.state !== 'poweredOn') {
        log.warn('Bluetooth adapter not powered on', { state: this.noble!.state })

        // 一定時間待ってからpoweredOnになるのを待つ
        const stateChangeHandler = (state: string) => {
          if (state === 'poweredOn') {
            this.noble!.removeListener('stateChange', stateChangeHandler)
            this.startScanInternal(options).then(resolve).catch(reject)
          } else if (
            state === 'poweredOff' ||
            state === 'unauthorized' ||
            state === 'unsupported'
          ) {
            this.noble!.removeListener('stateChange', stateChangeHandler)
            reject(new Error(`Bluetooth adapter in invalid state: ${state}`))
          }
        }

        this.noble!.on('stateChange', stateChangeHandler)

        // タイムアウト設定
        setTimeout(() => {
          this.noble!.removeListener('stateChange', stateChangeHandler)
          reject(new Error('Timed out waiting for Bluetooth adapter to power on'))
        }, 5000) // 5秒でタイムアウト
      } else {
        this.startScanInternal(options).then(resolve).catch(reject)
      }
    })
  }

  private async startScanInternal(options?: {
    duration?: number
    serviceUuids?: string[]
    allowDuplicates?: boolean
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const scanOptions = {
          allowDuplicates: options?.allowDuplicates || false
        }

        const serviceUuids = options?.serviceUuids || []

        // スキャン開始
        this.noble!.startScanning(
          serviceUuids.length > 0 ? serviceUuids : [],
          scanOptions.allowDuplicates,
          (error: Error | null) => {
            if (error) {
              log.error('Error starting scan', { error })
              reject(error)
              return
            }

            log.info('Scan started successfully', {
              serviceUuids,
              options: scanOptions
            })

            // スキャン時間設定
            if (options?.duration && options.duration > 0) {
              this.scanTimeout = setTimeout(() => {
                this.stopScan().catch((err) => {
                  log.error('Error stopping scan after duration', { error: err })
                })
              }, options.duration * 1000)
            }

            resolve()
          }
        )
      } catch (error) {
        log.error('Exception starting scan', { error })
        reject(error)
      }
    })
  }

  async stopScan(): Promise<void> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout)
      this.scanTimeout = null
    }

    return new Promise<void>((resolve, reject) => {
      if (!this.isScanning) {
        resolve()
        return
      }

      try {
        this.noble!.stopScanning((error: Error | null) => {
          if (error) {
            log.error('Error stopping scan', { error })
            reject(error)
            return
          }

          log.info('Scan stopped successfully')
          resolve()
        })
      } catch (error) {
        log.error('Exception stopping scan', { error })
        reject(error)
      }
    })
  }

  async connect(deviceId: string): Promise<boolean> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    // 接続状態更新
    this.connectionStates.set(deviceId, 'connecting')

    return new Promise<boolean>((resolve, reject) => {
      peripheral.connect((error: Error | null) => {
        if (error) {
          log.error('Error connecting to device', { deviceId, error })
          this.connectionStates.set(deviceId, 'disconnected')
          reject(error)
          return
        }

        log.info('Connected to device', { deviceId })
        this.connectionStates.set(deviceId, 'connected')

        // 切断イベントリスナー
        peripheral.once('disconnect', () => {
          log.info('Device disconnected', { deviceId })
          this.connectionStates.set(deviceId, 'disconnected')
          this.emit('disconnect', deviceId)
        })

        this.emit('connect', deviceId)
        resolve(true)
      })
    })
  }

  async disconnect(deviceId: string): Promise<boolean> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    this.connectionStates.set(deviceId, 'disconnecting')

    return new Promise<boolean>((resolve, reject) => {
      peripheral.disconnect((error: Error | null) => {
        if (error) {
          log.error('Error disconnecting from device', { deviceId, error })
          // 接続は継続しているかもしれないが状態を不明に
          reject(error)
          return
        }

        log.info('Disconnected from device', { deviceId })
        this.connectionStates.set(deviceId, 'disconnected')
        resolve(true)
      })
    })
  }

  async getServices(deviceId: string): Promise<BluetoothServiceInfo[]> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    if (this.connectionStates.get(deviceId) !== 'connected') {
      throw new Error(`Device ${deviceId} not connected`)
    }

    return new Promise<BluetoothServiceInfo[]>((resolve, reject) => {
      peripheral.discoverServices([], (error: Error | null, services: NobleService[]) => {
        if (error) {
          log.error('Error discovering services', { deviceId, error })
          reject(error)
          return
        }

        const serviceInfos: BluetoothServiceInfo[] = services.map((service) => ({
          uuid: service.uuid,
          name: this.getServiceName(service.uuid),
          isPrimary: true, // NobleはprimaryとsecondaryサービスのAPIを公開していない
          deviceId
        }))

        log.info('Discovered services', {
          deviceId,
          count: serviceInfos.length,
          serviceUuids: serviceInfos.map((s) => s.uuid)
        })

        resolve(serviceInfos)
      })
    })
  }

  async getCharacteristics(
    deviceId: string,
    serviceUuid: string
  ): Promise<BluetoothCharacteristicInfo[]> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    if (this.connectionStates.get(deviceId) !== 'connected') {
      throw new Error(`Device ${deviceId} not connected`)
    }

    return new Promise<BluetoothCharacteristicInfo[]>((resolve, reject) => {
      peripheral.discoverServices(
        [serviceUuid],
        (error: Error | null, services: NobleService[]) => {
          if (error) {
            log.error('Error discovering service', { deviceId, serviceUuid, error })
            reject(error)
            return
          }

          if (services.length === 0) {
            reject(new Error(`Service ${serviceUuid} not found`))
            return
          }

          const service = services[0]
          service.discoverCharacteristics(
            [],
            (error: Error | null, characteristics: NobleCharacteristic[]) => {
              if (error) {
                log.error('Error discovering characteristics', {
                  deviceId,
                  serviceUuid,
                  error
                })
                reject(error)
                return
              }

              const characteristicInfos: BluetoothCharacteristicInfo[] = characteristics.map(
                (char) => ({
                  uuid: char.uuid,
                  name: this.getCharacteristicName(char.uuid),
                  serviceUuid,
                  properties: {
                    read: char.properties.includes('read'),
                    write: char.properties.includes('write'),
                    writeWithoutResponse: char.properties.includes('writeWithoutResponse'),
                    notify: char.properties.includes('notify'),
                    indicate: char.properties.includes('indicate')
                  }
                })
              )

              log.info('Discovered characteristics', {
                deviceId,
                serviceUuid,
                count: characteristicInfos.length,
                characteristicUuids: characteristicInfos.map((c) => c.uuid)
              })

              resolve(characteristicInfos)
            }
          )
        }
      )
    })
  }

  async readCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<Buffer> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    if (this.connectionStates.get(deviceId) !== 'connected') {
      throw new Error(`Device ${deviceId} not connected`)
    }

    return new Promise<Buffer>((resolve, reject) => {
      peripheral.discoverServices(
        [serviceUuid],
        (error: Error | null, services: NobleService[]) => {
          if (error) {
            reject(error)
            return
          }

          if (services.length === 0) {
            reject(new Error(`Service ${serviceUuid} not found`))
            return
          }

          const service = services[0]
          service.discoverCharacteristics(
            [characteristicUuid],
            (error: Error | null, characteristics: NobleCharacteristic[]) => {
              if (error) {
                reject(error)
                return
              }

              if (characteristics.length === 0) {
                reject(new Error(`Characteristic ${characteristicUuid} not found`))
                return
              }

              const characteristic = characteristics[0]
              characteristic.read((error: Error | null, data: Buffer) => {
                if (error) {
                  log.error('Error reading characteristic', {
                    deviceId,
                    serviceUuid,
                    characteristicUuid,
                    error
                  })
                  reject(error)
                  return
                }

                log.info('Characteristic read', {
                  deviceId,
                  serviceUuid,
                  characteristicUuid,
                  dataLength: data.length,
                  dataHex: data.toString('hex')
                })

                resolve(data)
              })
            }
          )
        }
      )
    })
  }

  async writeCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    value: Buffer,
    withoutResponse: boolean = false
  ): Promise<void> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    if (this.connectionStates.get(deviceId) !== 'connected') {
      throw new Error(`Device ${deviceId} not connected`)
    }

    return new Promise<void>((resolve, reject) => {
      peripheral.discoverServices(
        [serviceUuid],
        (error: Error | null, services: NobleService[]) => {
          if (error) {
            reject(error)
            return
          }

          if (services.length === 0) {
            reject(new Error(`Service ${serviceUuid} not found`))
            return
          }

          const service = services[0]
          service.discoverCharacteristics(
            [characteristicUuid],
            (error: Error | null, characteristics: NobleCharacteristic[]) => {
              if (error) {
                reject(error)
                return
              }

              if (characteristics.length === 0) {
                reject(new Error(`Characteristic ${characteristicUuid} not found`))
                return
              }

              const characteristic = characteristics[0]
              characteristic.write(value, withoutResponse, (error?: Error | null) => {
                if (error) {
                  log.error('Error writing characteristic', {
                    deviceId,
                    serviceUuid,
                    characteristicUuid,
                    withoutResponse,
                    error
                  })
                  reject(error)
                  return
                }

                log.info('Characteristic written', {
                  deviceId,
                  serviceUuid,
                  characteristicUuid,
                  dataLength: value.length,
                  withoutResponse,
                  dataHex: value.toString('hex')
                })

                resolve()
              })
            }
          )
        }
      )
    })
  }

  async subscribeToCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    listener: (data: Buffer) => void
  ): Promise<void> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    if (this.connectionStates.get(deviceId) !== 'connected') {
      throw new Error(`Device ${deviceId} not connected`)
    }

    const listenerKey = this.getListenerKey(deviceId, serviceUuid, characteristicUuid)

    return new Promise<void>((resolve, reject) => {
      peripheral.discoverServices(
        [serviceUuid],
        (error: Error | null, services: NobleService[]) => {
          if (error) {
            reject(error)
            return
          }

          if (services.length === 0) {
            reject(new Error(`Service ${serviceUuid} not found`))
            return
          }

          const service = services[0]
          service.discoverCharacteristics(
            [characteristicUuid],
            (error: Error | null, characteristics: NobleCharacteristic[]) => {
              if (error) {
                reject(error)
                return
              }

              if (characteristics.length === 0) {
                reject(new Error(`Characteristic ${characteristicUuid} not found`))
                return
              }

              const characteristic = characteristics[0]

              // リスナー管理用セットを取得または作成
              let listeners = this.listeners.get(listenerKey)
              if (!listeners) {
                listeners = new Set()
                this.listeners.set(listenerKey, listeners)
              }

              // リスナーを追加
              listeners.add(listener)

              // 最初のリスナーの場合のみsubscribe
              if (listeners.size === 1) {
                const dataHandler = (data: Buffer) => {
                  // 全てのリスナーに通知
                  const currentListeners = this.listeners.get(listenerKey)
                  if (currentListeners) {
                    currentListeners.forEach((l) => {
                      try {
                        l(data)
                      } catch (error) {
                        log.error('Error in characteristic notification listener', { error })
                      }
                    })
                  }

                  // イベント発行
                  this.emit(
                    'characteristicValueChange',
                    deviceId,
                    serviceUuid,
                    characteristicUuid,
                    data
                  )
                }

                // dataハンドラをデバイスIDと関連付けて保存
                characteristic._dataHandler = dataHandler

                // 通知開始
                characteristic.subscribe((error?: Error | null) => {
                  if (error) {
                    log.error('Error subscribing to characteristic', {
                      deviceId,
                      serviceUuid,
                      characteristicUuid,
                      error
                    })
                    reject(error)
                    return
                  }

                  log.info('Subscribed to characteristic', {
                    deviceId,
                    serviceUuid,
                    characteristicUuid
                  })

                  // data イベントハンドラーを登録
                  characteristic.on('data', dataHandler)

                  resolve()
                })
              } else {
                // 既にsubscribe済みの場合は即時成功
                resolve()
              }
            }
          )
        }
      )
    })
  }

  async unsubscribeFromCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string
  ): Promise<void> {
    if (!this.noble) {
      throw new Error('Bluetooth manager not initialized')
    }

    const peripheral = this.peripherals.get(deviceId)
    if (!peripheral) {
      throw new Error(`Device ${deviceId} not found`)
    }

    const listenerKey = this.getListenerKey(deviceId, serviceUuid, characteristicUuid)

    // リスナーが存在しない場合は何もしない
    if (!this.listeners.has(listenerKey)) {
      return Promise.resolve()
    }

    // リスナーをクリア
    this.listeners.delete(listenerKey)

    // デバイスが接続されていない場合は終了
    if (this.connectionStates.get(deviceId) !== 'connected') {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      peripheral.discoverServices(
        [serviceUuid],
        (error: Error | null, services: NobleService[]) => {
          if (error) {
            reject(error)
            return
          }

          if (services.length === 0) {
            resolve() // サービスが見つからない場合は既にunsubscribeされている
            return
          }

          const service = services[0]
          service.discoverCharacteristics(
            [characteristicUuid],
            (error: Error | null, characteristics: NobleCharacteristic[]) => {
              if (error) {
                reject(error)
                return
              }

              if (characteristics.length === 0) {
                resolve() // キャラクタリスティックが見つからない場合は既にunsubscribeされている
                return
              }

              const characteristic = characteristics[0]

              // 登録されたデータハンドラを削除
              if (characteristic._dataHandler) {
                characteristic.removeListener('data', characteristic._dataHandler)
                delete characteristic._dataHandler
              }

              // 通知解除
              characteristic.unsubscribe((error?: Error | null) => {
                if (error) {
                  log.error('Error unsubscribing from characteristic', {
                    deviceId,
                    serviceUuid,
                    characteristicUuid,
                    error
                  })
                  reject(error)
                  return
                }

                log.info('Unsubscribed from characteristic', {
                  deviceId,
                  serviceUuid,
                  characteristicUuid
                })

                resolve()
              })
            }
          )
        }
      )
    })
  }

  isBluetoothAvailable(): boolean {
    return this.noble !== null && this.noble.state === 'poweredOn'
  }

  // BLEサービスUUIDに対応する名前を返す
  private getServiceName(uuid: string): string | undefined {
    // よく知られたサービスUUIDに対する名前マッピング
    const serviceNames: Record<string, string> = {
      '1800': 'Generic Access',
      '1801': 'Generic Attribute',
      '180a': 'Device Information',
      '180f': 'Battery Service',
      '1812': 'Human Interface Device',
      '1819': 'Location and Navigation',
      '181c': 'User Data',
      '181d': 'Weight Scale'
      // 他のサービス名は必要に応じて追加
    }

    // 16ビットUUIDの場合（短縮形）
    const shortUuid = uuid.toLowerCase().replace(/-/g, '')
    if (serviceNames[shortUuid]) {
      return serviceNames[shortUuid]
    }

    // 128ビットUUIDから16ビット部分を抽出
    const match = uuid.match(/0000([a-fA-F0-9]{4})-0000-1000-8000-00805f9b34fb/i)
    if (match && serviceNames[match[1].toLowerCase()]) {
      return serviceNames[match[1].toLowerCase()]
    }

    return undefined
  }

  // BLEキャラクタリスティックUUIDに対応する名前を返す
  private getCharacteristicName(uuid: string): string | undefined {
    // よく知られたキャラクタリスティックUUIDに対する名前マッピング
    const characteristicNames: Record<string, string> = {
      '2a00': 'Device Name',
      '2a01': 'Appearance',
      '2a19': 'Battery Level',
      '2a29': 'Manufacturer Name String',
      '2a24': 'Model Number String',
      '2a25': 'Serial Number String',
      '2a27': 'Hardware Revision String',
      '2a26': 'Firmware Revision String',
      '2a28': 'Software Revision String'
      // 他のキャラクタリスティック名は必要に応じて追加
    }

    // 16ビットUUIDの場合（短縮形）
    const shortUuid = uuid.toLowerCase().replace(/-/g, '')
    if (characteristicNames[shortUuid]) {
      return characteristicNames[shortUuid]
    }

    // 128ビットUUIDから16ビット部分を抽出
    const match = uuid.match(/0000([a-fA-F0-9]{4})-0000-1000-8000-00805f9b34fb/i)
    if (match && characteristicNames[match[1].toLowerCase()]) {
      return characteristicNames[match[1].toLowerCase()]
    }

    return undefined
  }

  // リソース解放
  async dispose(): Promise<void> {
    try {
      // スキャン停止
      if (this.isScanning) {
        await this.stopScan().catch((error) => {
          log.error('Error stopping scan during dispose', { error })
        })
      }

      // 接続中のデバイスを全て切断
      const connectedDeviceIds = Array.from(this.connectionStates.entries())
        .filter(([_, state]) => state === 'connected' || state === 'connecting')
        .map(([id]) => id)

      for (const deviceId of connectedDeviceIds) {
        try {
          await this.disconnect(deviceId)
        } catch (error) {
          log.error('Error disconnecting device during dispose', { deviceId, error })
        }
      }

      // リスナークリア
      this.listeners.clear()
      this.devices.clear()
      this.peripherals.clear()
      this.connectionStates.clear()

      // Nobleリスナークリア
      if (this.noble) {
        this.noble.removeAllListeners()
      }
    } catch (error) {
      log.error('Error during Bluetooth manager dispose', { error })
    }
  }
}
