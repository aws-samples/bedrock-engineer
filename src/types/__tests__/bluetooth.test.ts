import {
  BluetoothDeviceInfo,
  BluetoothServiceInfo,
  BluetoothCharacteristicInfo,
  BluetoothInput,
  BluetoothResult
} from '../bluetooth'

describe('Bluetooth types', () => {
  test('BluetoothDeviceInfo type should have required properties', () => {
    const deviceInfo: BluetoothDeviceInfo = {
      id: '00:11:22:33:44:55',
      name: 'Test Device',
      address: '00:11:22:33:44:55',
      rssi: -65,
      connectable: true,
      paired: false
    }

    expect(deviceInfo).toHaveProperty('id')
    expect(deviceInfo).toHaveProperty('name')
    expect(deviceInfo).toHaveProperty('address')
    expect(deviceInfo).toHaveProperty('rssi')
    expect(deviceInfo).toHaveProperty('connectable')
    expect(deviceInfo).toHaveProperty('paired')
  })

  test('BluetoothServiceInfo type should have required properties', () => {
    const serviceInfo: BluetoothServiceInfo = {
      uuid: '1800',
      name: 'Generic Access',
      isPrimary: true,
      deviceId: '00:11:22:33:44:55'
    }

    expect(serviceInfo).toHaveProperty('uuid')
    expect(serviceInfo).toHaveProperty('isPrimary')
    expect(serviceInfo).toHaveProperty('deviceId')
  })

  test('BluetoothCharacteristicInfo type should have required properties', () => {
    const characteristicInfo: BluetoothCharacteristicInfo = {
      uuid: '2A00',
      name: 'Device Name',
      serviceUuid: '1800',
      properties: {
        read: true,
        write: false,
        writeWithoutResponse: false,
        notify: false,
        indicate: false
      }
    }

    expect(characteristicInfo).toHaveProperty('uuid')
    expect(characteristicInfo).toHaveProperty('serviceUuid')
    expect(characteristicInfo).toHaveProperty('properties')
    expect(characteristicInfo.properties).toHaveProperty('read')
    expect(characteristicInfo.properties).toHaveProperty('write')
    expect(characteristicInfo.properties).toHaveProperty('notify')
  })

  test('BluetoothInput type should validate scan operation', () => {
    const input: BluetoothInput = {
      type: 'bluetoothDevice',
      operation: 'scan',
      scanDuration: 10,
      scanFilter: {
        serviceUuids: ['180F']
      }
    }

    expect(input.type).toBe('bluetoothDevice')
    expect(input.operation).toBe('scan')
    expect(input.scanDuration).toBe(10)
  })

  test('BluetoothInput type should validate read operation', () => {
    const input: BluetoothInput = {
      type: 'bluetoothDevice',
      operation: 'read',
      deviceId: '00:11:22:33:44:55',
      serviceUuid: '180F',
      characteristicUuid: '2A19'
    }

    expect(input.type).toBe('bluetoothDevice')
    expect(input.operation).toBe('read')
    expect(input.deviceId).toBe('00:11:22:33:44:55')
    expect(input.serviceUuid).toBe('180F')
    expect(input.characteristicUuid).toBe('2A19')
  })

  test('BluetoothResult type should contain success result', () => {
    const result: BluetoothResult = {
      success: true,
      name: 'bluetoothDevice',
      message: 'Successfully found 2 devices',
      result: {
        operation: 'scan',
        devices: [
          {
            id: '00:11:22:33:44:55',
            name: 'Test Device 1',
            address: '00:11:22:33:44:55',
            rssi: -65,
            connectable: true,
            paired: false
          },
          {
            id: 'AA:BB:CC:DD:EE:FF',
            name: 'Test Device 2',
            address: 'AA:BB:CC:DD:EE:FF',
            rssi: -72,
            connectable: true,
            paired: false
          }
        ]
      }
    }

    expect(result.success).toBe(true)
    expect(result.name).toBe('bluetoothDevice')
    expect(result.result?.operation).toBe('scan')
    expect(result.result?.devices?.length).toBe(2)
  })

  test('BluetoothResult type should contain error result', () => {
    const result: BluetoothResult = {
      success: false,
      name: 'bluetoothDevice',
      message: 'Failed to connect to device',
      result: {
        operation: 'connect',
        error: 'Device not found or not available'
      }
    }

    expect(result.success).toBe(false)
    expect(result.name).toBe('bluetoothDevice')
    expect(result.result?.operation).toBe('connect')
    expect(result.result?.error).toBeDefined()
  })
})
