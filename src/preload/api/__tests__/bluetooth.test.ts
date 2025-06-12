import { ipcRenderer } from 'electron'
import { bluetoothAPI } from '../bluetooth'

// IPC Renderer のモック
jest.mock('electron', () => ({
  ipcRenderer: {
    invoke: jest.fn()
  }
}))

describe('bluetoothAPI', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('scanDevices', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      const mockDevices = [{ id: '00:11:22:33:44:55', name: 'Test Device' }]
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ devices: mockDevices })

      // テスト対象メソッド実行
      const options = { duration: 10 }
      const result = await bluetoothAPI.scanDevices(options)

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('bluetooth:scan-devices', options)
      expect(result).toEqual(mockDevices)
    })

    it('should use empty options object when no options provided', async () => {
      // モックの戻り値を設定
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ devices: [] })

      // テスト対象メソッド実行
      await bluetoothAPI.scanDevices()

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('bluetooth:scan-devices', {})
    })
  })

  describe('connectDevice', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ success: true })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const result = await bluetoothAPI.connectDevice(deviceId)

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('bluetooth:connect-device', deviceId)
      expect(result).toBe(true)
    })
  })

  describe('disconnectDevice', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ success: true })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const result = await bluetoothAPI.disconnectDevice(deviceId)

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('bluetooth:disconnect-device', deviceId)
      expect(result).toBe(true)
    })
  })

  describe('getServices', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      const mockServices = [{ uuid: '180F', name: 'Battery Service' }]
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ services: mockServices })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const result = await bluetoothAPI.getServices(deviceId)

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('bluetooth:get-services', deviceId)
      expect(result).toEqual(mockServices)
    })
  })

  describe('getCharacteristics', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      const mockCharacteristics = [{ uuid: '2A19', name: 'Battery Level' }]
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ characteristics: mockCharacteristics })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const serviceUuid = '180F'
      const result = await bluetoothAPI.getCharacteristics(deviceId, serviceUuid)

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'bluetooth:get-characteristics',
        deviceId,
        serviceUuid
      )
      expect(result).toEqual(mockCharacteristics)
    })
  })

  describe('readCharacteristic', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      const mockValue = 'SGVsbG8gV29ybGQ=' // "Hello World" in base64
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ value: mockValue })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const serviceUuid = '180F'
      const characteristicUuid = '2A19'
      const result = await bluetoothAPI.readCharacteristic(
        deviceId,
        serviceUuid,
        characteristicUuid
      )

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'bluetooth:read-characteristic',
        deviceId,
        serviceUuid,
        characteristicUuid
      )
      expect(result).toBe(mockValue)
    })
  })

  describe('writeCharacteristic', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ success: true })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const serviceUuid = '180F'
      const characteristicUuid = '2A19'
      const value = 'SGVsbG8gV29ybGQ=' // "Hello World" in base64
      const withoutResponse = true
      const result = await bluetoothAPI.writeCharacteristic(
        deviceId,
        serviceUuid,
        characteristicUuid,
        value,
        withoutResponse
      )

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'bluetooth:write-characteristic',
        deviceId,
        serviceUuid,
        characteristicUuid,
        value,
        withoutResponse
      )
      expect(result).toBe(true)
    })

    it('should use default withoutResponse (false) when not provided', async () => {
      // モックの戻り値を設定
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ success: true })

      // テスト対象メソッド実行
      const deviceId = '00:11:22:33:44:55'
      const serviceUuid = '180F'
      const characteristicUuid = '2A19'
      const value = 'SGVsbG8gV29ybGQ=' // "Hello World" in base64
      await bluetoothAPI.writeCharacteristic(deviceId, serviceUuid, characteristicUuid, value)

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'bluetooth:write-characteristic',
        deviceId,
        serviceUuid,
        characteristicUuid,
        value,
        false
      )
    })
  })

  describe('isAvailable', () => {
    it('should call ipcRenderer.invoke with correct arguments', async () => {
      // モックの戻り値を設定
      ;(ipcRenderer.invoke as jest.Mock).mockResolvedValue({ available: true })

      // テスト対象メソッド実行
      const result = await bluetoothAPI.isAvailable()

      // 検証
      expect(ipcRenderer.invoke).toHaveBeenCalledWith('bluetooth:is-available')
      expect(result).toBe(true)
    })
  })
})
