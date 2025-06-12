import { bluetoothHandlers } from '../bluetooth-handlers'
import { NobleBluetoothManager } from '../../bluetooth/noble-bluetooth-manager'

// ノーブルマネージャーのモック
jest.mock('../../bluetooth/noble-bluetooth-manager', () => {
  return {
    NobleBluetoothManager: jest.fn().mockImplementation(() => {
      return {
        startScan: jest.fn(),
        stopScan: jest.fn(),
        getScannedDevices: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        getServices: jest.fn(),
        getCharacteristics: jest.fn(),
        readCharacteristic: jest.fn(),
        writeCharacteristic: jest.fn(),
        isBluetoothAvailable: jest.fn(),
        dispose: jest.fn()
      }
    })
  }
})

describe('bluetoothHandlers', () => {
  let mockManager: any

  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks()

    // ノーブルマネージャーのインスタンスを取得
    mockManager = new NobleBluetoothManager()
  })

  describe('bluetooth:scan-devices', () => {
    it('should scan devices with default options', async () => {
      // モックデータ設定
      const mockDevices = [
        {
          id: '00:11:22:33:44:55',
          name: 'Test Device 1',
          address: '00:11:22:33:44:55',
          rssi: -65,
          connectable: true,
          paired: false
        }
      ]
      mockManager.getScannedDevices.mockReturnValue(mockDevices)

      // 実行
      const result = await bluetoothHandlers['bluetooth:scan-devices']({} as any, {})

      // 検証
      expect(mockManager.startScan).toHaveBeenCalled()
      expect(mockManager.stopScan).toHaveBeenCalled()
      expect(mockManager.getScannedDevices).toHaveBeenCalled()
      expect(result).toEqual({ devices: mockDevices })
    })

    it('should scan devices with custom duration and filter', async () => {
      // モックデータ設定
      const mockDevices = [
        {
          id: '00:11:22:33:44:55',
          name: 'Test Device 1',
          address: '00:11:22:33:44:55',
          rssi: -65,
          connectable: true,
          paired: false,
          serviceUUIDs: ['180F']
        }
      ]
      mockManager.getScannedDevices.mockReturnValue(mockDevices)

      const options = {
        duration: 2,
        serviceUuids: ['180F'],
        allowDuplicates: true
      }

      // 実行
      const result = await bluetoothHandlers['bluetooth:scan-devices']({} as any, options)

      // 検証
      expect(mockManager.startScan).toHaveBeenCalledWith(options)
      expect(mockManager.getScannedDevices).toHaveBeenCalled()
      expect(result).toEqual({ devices: mockDevices })
    })

    it('should handle scan errors', async () => {
      // エラー設定
      const mockError = new Error('Scan failed')
      mockManager.startScan.mockRejectedValue(mockError)

      // 実行と検証
      await expect(bluetoothHandlers['bluetooth:scan-devices']({} as any, {})).rejects.toThrow(
        'Scan failed'
      )
    })
  })

  describe('bluetooth:connect-device', () => {
    it('should connect to a device', async () => {
      // モック設定
      mockManager.connect.mockResolvedValue(true)

      // 実行
      const result = await bluetoothHandlers['bluetooth:connect-device'](
        {} as any,
        '00:11:22:33:44:55'
      )

      // 検証
      expect(mockManager.connect).toHaveBeenCalledWith('00:11:22:33:44:55')
      expect(result).toEqual({ success: true })
    })

    it('should handle connection errors', async () => {
      // エラー設定
      const mockError = new Error('Connection failed')
      mockManager.connect.mockRejectedValue(mockError)

      // 実行と検証
      await expect(
        bluetoothHandlers['bluetooth:connect-device']({} as any, '00:11:22:33:44:55')
      ).rejects.toThrow('Connection failed')
    })
  })

  describe('bluetooth:get-services', () => {
    it('should get device services', async () => {
      // モックデータ設定
      const mockServices = [
        {
          uuid: '180F',
          name: 'Battery Service',
          isPrimary: true,
          deviceId: '00:11:22:33:44:55'
        }
      ]
      mockManager.getServices.mockResolvedValue(mockServices)

      // 実行
      const result = await bluetoothHandlers['bluetooth:get-services'](
        {} as any,
        '00:11:22:33:44:55'
      )

      // 検証
      expect(mockManager.getServices).toHaveBeenCalledWith('00:11:22:33:44:55')
      expect(result).toEqual({ services: mockServices })
    })
  })

  describe('bluetooth:get-characteristics', () => {
    it('should get service characteristics', async () => {
      // モックデータ設定
      const mockCharacteristics = [
        {
          uuid: '2A19',
          name: 'Battery Level',
          serviceUuid: '180F',
          properties: {
            read: true,
            write: false,
            writeWithoutResponse: false,
            notify: true,
            indicate: false
          }
        }
      ]
      mockManager.getCharacteristics.mockResolvedValue(mockCharacteristics)

      // 実行
      const result = await bluetoothHandlers['bluetooth:get-characteristics'](
        {} as any,
        '00:11:22:33:44:55',
        '180F'
      )

      // 検証
      expect(mockManager.getCharacteristics).toHaveBeenCalledWith('00:11:22:33:44:55', '180F')
      expect(result).toEqual({ characteristics: mockCharacteristics })
    })
  })

  describe('bluetooth:read-characteristic', () => {
    it('should read characteristic value', async () => {
      // モックデータ設定
      const mockDataBuffer = Buffer.from([0x42]) // 66% battery level
      mockManager.readCharacteristic.mockResolvedValue(mockDataBuffer)

      // 実行
      const result = await bluetoothHandlers['bluetooth:read-characteristic'](
        {} as any,
        '00:11:22:33:44:55',
        '180F',
        '2A19'
      )

      // 検証
      expect(mockManager.readCharacteristic).toHaveBeenCalledWith(
        '00:11:22:33:44:55',
        '180F',
        '2A19'
      )
      expect(result).toEqual({ value: mockDataBuffer.toString('base64') })
    })
  })

  describe('bluetooth:write-characteristic', () => {
    it('should write value to characteristic', async () => {
      // モックデータ設定
      mockManager.writeCharacteristic.mockResolvedValue(undefined)

      // 実行
      const result = await bluetoothHandlers['bluetooth:write-characteristic'](
        {} as any,
        '00:11:22:33:44:55',
        '180F',
        '2A19',
        'Qg==', // Base64 for [0x42]
        false
      )

      // 検証
      expect(mockManager.writeCharacteristic).toHaveBeenCalledWith(
        '00:11:22:33:44:55',
        '180F',
        '2A19',
        expect.any(Buffer),
        false
      )
      expect(result).toEqual({ success: true })
    })
  })

  describe('bluetooth:is-available', () => {
    it('should check Bluetooth availability - available', () => {
      // モック設定
      mockManager.isBluetoothAvailable.mockReturnValue(true)

      // 実行
      const result = bluetoothHandlers['bluetooth:is-available']({} as any)

      // 検証
      expect(mockManager.isBluetoothAvailable).toHaveBeenCalled()
      expect(result).toEqual({ available: true })
    })

    it('should check Bluetooth availability - not available', () => {
      // モック設定
      mockManager.isBluetoothAvailable.mockReturnValue(false)

      // 実行
      const result = bluetoothHandlers['bluetooth:is-available']({} as any)

      // 検証
      expect(mockManager.isBluetoothAvailable).toHaveBeenCalled()
      expect(result).toEqual({ available: false })
    })

    it('should handle errors gracefully', () => {
      // モック設定
      mockManager.isBluetoothAvailable.mockImplementation(() => {
        throw new Error('Something went wrong')
      })

      // 実行
      const result = bluetoothHandlers['bluetooth:is-available']({} as any)

      // 検証
      expect(result).toEqual({ available: false })
    })
  })
})
