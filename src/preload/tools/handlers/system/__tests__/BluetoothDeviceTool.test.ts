import { BluetoothDeviceTool } from '../BluetoothDeviceTool'
import { BluetoothInput } from '../../../../../types/bluetooth'

// IPCクライアントのモック
jest.mock('../../../../ipc-client', () => ({
  ipc: jest.fn()
}))

import { ipc } from '../../../../ipc-client'

describe('BluetoothDeviceTool', () => {
  let tool: BluetoothDeviceTool

  beforeEach(() => {
    jest.clearAllMocks()
    tool = new BluetoothDeviceTool()
  })

  describe('validateInput', () => {
    it('should validate scan operation with minimal input', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'scan'
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should validate scan operation with full options', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'scan',
        scanDuration: 10,
        scanFilter: {
          name: 'Test',
          serviceUuids: ['180F']
        }
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should invalidate scan with negative duration', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'scan',
        scanDuration: -5
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate connect operation with required fields', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'connect',
        deviceId: '00:11:22:33:44:55'
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should invalidate connect operation without deviceId', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'connect'
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('deviceId is required')
    })

    it('should validate read operation with required fields', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'read',
        deviceId: '00:11:22:33:44:55',
        serviceUuid: '180F',
        characteristicUuid: '2A19'
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should invalidate read operation with missing fields', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'read',
        deviceId: '00:11:22:33:44:55'
        // Missing serviceUuid and characteristicUuid
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBe(2)
      expect(result.errors[0]).toContain('serviceUuid is required')
      expect(result.errors[1]).toContain('characteristicUuid is required')
    })

    it('should validate write operation with all required fields', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'write',
        deviceId: '00:11:22:33:44:55',
        serviceUuid: '180F',
        characteristicUuid: '2A19',
        value: 'SGVsbG8gV29ybGQ=' // Base64 for "Hello World"
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should invalidate write operation without value', () => {
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'write',
        deviceId: '00:11:22:33:44:55',
        serviceUuid: '180F',
        characteristicUuid: '2A19'
        // Missing value
      }

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('value is required for write operation')
    })

    it('should invalidate operation with unknown operation type', () => {
      const input = {
        type: 'bluetoothDevice',
        operation: 'invalid' // Invalid operation
      } as unknown as BluetoothInput

      const result = tool.validateInput(input)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Invalid operation')
    })
  })

  describe('executeInternal', () => {
    it('should execute scan operation', async () => {
      // モックの設定
      const mockDevices = [
        {
          id: '00:11:22:33:44:55',
          name: 'Test Device',
          address: '00:11:22:33:44:55',
          rssi: -65,
          connectable: true,
          paired: false
        }
      ]
      ;(ipc as jest.Mock).mockImplementation(async (channel: string, ..._args) => {
        if (channel === 'bluetooth:is-available') {
          return { available: true }
        } else if (channel === 'bluetooth:scan-devices') {
          return { devices: mockDevices }
        }
        return {}
      })

      // 実行
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'scan'
      }

      const result = await tool['executeInternal'](input)

      // 検証
      expect(result.success).toBe(true)
      expect(result.name).toBe('bluetoothDevice')
      expect(result.result?.operation).toBe('scan')
      expect(result.result?.devices).toEqual(mockDevices)

      expect(ipc).toHaveBeenCalledWith('bluetooth:is-available')
      expect(ipc).toHaveBeenCalledWith('bluetooth:scan-devices', expect.any(Object))
    })

    it('should handle Bluetooth not available', async () => {
      // モックの設定
      ;(ipc as jest.Mock).mockImplementation(async (channel: string) => {
        if (channel === 'bluetooth:is-available') {
          return { available: false }
        }
        return {}
      })

      // 実行
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'scan'
      }

      const result = await tool['executeInternal'](input)

      // 検証
      expect(result.success).toBe(false)
      expect(result.message).toContain('not available')
    })

    it('should execute connect operation', async () => {
      // モックの設定
      const mockServices = [
        { uuid: '180F', name: 'Battery Service', isPrimary: true, deviceId: '00:11:22:33:44:55' }
      ]
      ;(ipc as jest.Mock).mockImplementation(async (channel: string) => {
        if (channel === 'bluetooth:connect-device') {
          return { success: true }
        } else if (channel === 'bluetooth:get-services') {
          return { services: mockServices }
        }
        return {}
      })

      // 実行
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'connect',
        deviceId: '00:11:22:33:44:55'
      }

      const result = await tool['executeInternal'](input)

      // 検証
      expect(result.success).toBe(true)
      expect(result.name).toBe('bluetoothDevice')
      expect(result.result?.operation).toBe('connect')
      expect(result.result?.services).toEqual(mockServices)

      expect(ipc).toHaveBeenCalledWith('bluetooth:connect-device', '00:11:22:33:44:55')
      expect(ipc).toHaveBeenCalledWith('bluetooth:get-services', '00:11:22:33:44:55')
    })

    it('should execute read operation and decode data', async () => {
      // モックの設定
      const mockValue = Buffer.from('Hello World').toString('base64')
      ;(ipc as jest.Mock).mockImplementation(async (channel: string) => {
        if (channel === 'bluetooth:read-characteristic') {
          return { value: mockValue }
        }
        return {}
      })

      // 実行
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'read',
        deviceId: '00:11:22:33:44:55',
        serviceUuid: '180F',
        characteristicUuid: '2A19'
      }

      const result = await tool['executeInternal'](input)

      // 検証
      expect(result.success).toBe(true)
      expect(result.name).toBe('bluetoothDevice')
      expect(result.result?.operation).toBe('read')
      expect(result.result?.value).toBe('Hello World')

      expect(ipc).toHaveBeenCalledWith(
        'bluetooth:read-characteristic',
        '00:11:22:33:44:55',
        '180F',
        '2A19'
      )
    })

    it('should handle errors gracefully', async () => {
      // モックの設定
      ;(ipc as jest.Mock).mockImplementation(() => {
        throw new Error('Test error')
      })

      // 実行
      const input: BluetoothInput = {
        type: 'bluetoothDevice',
        operation: 'scan'
      }

      // エラーを期待
      await expect(tool['executeInternal'](input)).rejects.toThrow()
    })
  })
})
