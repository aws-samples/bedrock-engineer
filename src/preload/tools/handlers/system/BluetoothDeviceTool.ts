/**
 * BluetoothDeviceTool - Bluetooth デバイスとの通信を行うツール
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { BluetoothInput, BluetoothResult } from '../../../../types/bluetooth'
import { ipc } from '../../../ipc-client'

/**
 * Bluetoothデバイス操作ツール
 */
export class BluetoothDeviceTool extends BaseTool<BluetoothInput, BluetoothResult> {
  static readonly toolName = 'bluetoothDevice' as const
  static readonly toolDescription =
    'Connect to and interact with Bluetooth devices nearby. Scan for devices, connect to them, and read/write data from their services and characteristics.'

  readonly name = BluetoothDeviceTool.toolName as any
  readonly description = BluetoothDeviceTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: BluetoothDeviceTool.toolName,
    description: BluetoothDeviceTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['scan', 'connect', 'disconnect', 'read', 'write', 'subscribe', 'unsubscribe'],
            description: 'The operation to perform on Bluetooth devices'
          },
          deviceId: {
            type: 'string',
            description:
              'Device ID or address for the target device (required for operations other than scan)'
          },
          serviceUuid: {
            type: 'string',
            description:
              'UUID of the GATT service to interact with (required for read/write operations)'
          },
          characteristicUuid: {
            type: 'string',
            description:
              'UUID of the GATT characteristic to interact with (required for read/write operations)'
          },
          value: {
            type: 'string',
            description:
              'Base64 encoded data to write to the characteristic (required for write operation)'
          },
          scanDuration: {
            type: 'integer',
            description: 'Duration in seconds to scan for devices (for scan operation, default: 5)'
          },
          scanFilter: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Filter devices by name'
              },
              serviceUuids: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Filter devices by service UUIDs'
              }
            },
            description: 'Filters to apply when scanning for devices'
          }
        },
        required: ['operation']
      }
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(input: BluetoothInput): ValidationResult {
    const errors: string[] = []

    // Check operation
    if (!input.operation) {
      errors.push('Operation is required')
    } else if (
      !['scan', 'connect', 'disconnect', 'read', 'write', 'subscribe', 'unsubscribe'].includes(
        input.operation
      )
    ) {
      errors.push(`Invalid operation: ${input.operation}`)
    }

    // Validate based on operation
    switch (input.operation) {
      case 'connect':
      case 'disconnect':
        if (!input.deviceId) {
          errors.push(`deviceId is required for ${input.operation} operation`)
        }
        break

      case 'read':
      case 'write':
      case 'subscribe':
      case 'unsubscribe':
        if (!input.deviceId) {
          errors.push(`deviceId is required for ${input.operation} operation`)
        }
        if (!input.serviceUuid) {
          errors.push(`serviceUuid is required for ${input.operation} operation`)
        }
        if (!input.characteristicUuid) {
          errors.push(`characteristicUuid is required for ${input.operation} operation`)
        }

        // Write operation requires value
        if (input.operation === 'write' && !input.value) {
          errors.push('value is required for write operation')
        }
        break

      case 'scan':
        // scanDuration validation (optional)
        if (
          input.scanDuration !== undefined &&
          (typeof input.scanDuration !== 'number' || input.scanDuration <= 0)
        ) {
          errors.push('scanDuration must be a positive number')
        }

        // scanFilter validation (optional)
        if (input.scanFilter) {
          if (typeof input.scanFilter !== 'object') {
            errors.push('scanFilter must be an object')
          } else {
            if (input.scanFilter.serviceUuids && !Array.isArray(input.scanFilter.serviceUuids)) {
              errors.push('scanFilter.serviceUuids must be an array')
            }
          }
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: BluetoothInput): Promise<BluetoothResult> {
    try {
      this.logger.info('Executing Bluetooth device operation', {
        operation: input.operation,
        deviceId: input.deviceId || 'N/A'
      })

      switch (input.operation) {
        case 'scan':
          return this.executeScan(input)
        case 'connect':
          return this.executeConnect(input)
        case 'disconnect':
          return this.executeDisconnect(input)
        case 'read':
          return this.executeRead(input)
        case 'write':
          return this.executeWrite(input)
        default:
          throw new Error(`Operation ${input.operation} not implemented`)
      }
    } catch (error) {
      this.logger.error('Error executing Bluetooth device operation', {
        operation: input.operation,
        error: error instanceof Error ? error.message : String(error)
      })

      throw new Error(
        JSON.stringify({
          success: false,
          name: 'bluetoothDevice',
          error: `Bluetooth operation failed: ${input.operation}`,
          message: error instanceof Error ? error.message : String(error)
        })
      )
    }
  }

  /**
   * Execute scan operation
   */
  private async executeScan(input: BluetoothInput): Promise<BluetoothResult> {
    // Check Bluetooth availability
    const availabilityCheck = await ipc('bluetooth:is-available')
    if (!availabilityCheck.available) {
      return {
        success: false,
        name: 'bluetoothDevice',
        message: 'Bluetooth is not available on this system'
      }
    }

    // Prepare scan options
    const scanOptions = {
      duration: input.scanDuration || 5,
      serviceUuids: input.scanFilter?.serviceUuids,
      allowDuplicates: false
    }

    // Execute scan
    this.logger.info('Starting Bluetooth scan', { options: scanOptions })
    const scanResult = await ipc('bluetooth:scan-devices', scanOptions)

    // Apply name filter if specified
    let devices = scanResult.devices
    if (input.scanFilter?.name) {
      const nameFilter = input.scanFilter.name.toLowerCase()
      devices = devices.filter((device) => device.name.toLowerCase().includes(nameFilter))
    }

    this.logger.info('Bluetooth scan completed', {
      found: devices.length,
      deviceNames: devices.map((d) => d.name)
    })

    return {
      success: true,
      name: 'bluetoothDevice',
      message: `Found ${devices.length} Bluetooth device(s)`,
      result: {
        operation: 'scan',
        devices
      }
    }
  }

  /**
   * Execute connect operation
   */
  private async executeConnect(input: BluetoothInput): Promise<BluetoothResult> {
    if (!input.deviceId) {
      throw new Error('deviceId is required for connect operation')
    }

    this.logger.info('Connecting to Bluetooth device', { deviceId: input.deviceId })
    const connectResult = await ipc('bluetooth:connect-device', input.deviceId)

    if (!connectResult.success) {
      return {
        success: false,
        name: 'bluetoothDevice',
        message: `Failed to connect to device ${input.deviceId}`,
        result: {
          operation: 'connect',
          error: 'Connection failed'
        }
      }
    }

    // Get available services
    const servicesResult = await ipc('bluetooth:get-services', input.deviceId)

    return {
      success: true,
      name: 'bluetoothDevice',
      message: `Successfully connected to device ${input.deviceId}`,
      result: {
        operation: 'connect',
        device: {
          id: input.deviceId,
          name: '', // We don't have the name at this point without extra query
          address: input.deviceId,
          rssi: 0, // Unknown at this point
          connectable: true,
          paired: true // Since we're connected
        },
        services: servicesResult.services
      }
    }
  }

  /**
   * Execute disconnect operation
   */
  private async executeDisconnect(input: BluetoothInput): Promise<BluetoothResult> {
    if (!input.deviceId) {
      throw new Error('deviceId is required for disconnect operation')
    }

    this.logger.info('Disconnecting from Bluetooth device', { deviceId: input.deviceId })
    const disconnectResult = await ipc('bluetooth:disconnect-device', input.deviceId)

    if (!disconnectResult.success) {
      return {
        success: false,
        name: 'bluetoothDevice',
        message: `Failed to disconnect from device ${input.deviceId}`,
        result: {
          operation: 'disconnect',
          error: 'Disconnection failed'
        }
      }
    }

    return {
      success: true,
      name: 'bluetoothDevice',
      message: `Successfully disconnected from device ${input.deviceId}`,
      result: {
        operation: 'disconnect'
      }
    }
  }

  /**
   * Execute read operation
   */
  private async executeRead(input: BluetoothInput): Promise<BluetoothResult> {
    if (!input.deviceId || !input.serviceUuid || !input.characteristicUuid) {
      throw new Error(
        'deviceId, serviceUuid and characteristicUuid are required for read operation'
      )
    }

    this.logger.info('Reading Bluetooth characteristic', {
      deviceId: input.deviceId,
      serviceUuid: input.serviceUuid,
      characteristicUuid: input.characteristicUuid
    })

    const readResult = await ipc(
      'bluetooth:read-characteristic',
      input.deviceId,
      input.serviceUuid,
      input.characteristicUuid
    )

    // Attempt to decode value as UTF-8 if it's text
    let decodedValue: string | number[] | undefined
    try {
      const buffer = Buffer.from(readResult.value, 'base64')

      // Try to detect if it's readable text
      if (this.isUtf8(buffer)) {
        decodedValue = buffer.toString('utf8')
      } else {
        // Otherwise return array of bytes
        decodedValue = Array.from(buffer)
      }
    } catch (error) {
      this.logger.warn('Failed to decode characteristic value', { error })
      // Fall back to raw base64
      decodedValue = readResult.value
    }

    return {
      success: true,
      name: 'bluetoothDevice',
      message: `Successfully read characteristic from device ${input.deviceId}`,
      result: {
        operation: 'read',
        value: decodedValue
      }
    }
  }

  /**
   * Execute write operation
   */
  private async executeWrite(input: BluetoothInput): Promise<BluetoothResult> {
    if (!input.deviceId || !input.serviceUuid || !input.characteristicUuid || !input.value) {
      throw new Error(
        'deviceId, serviceUuid, characteristicUuid and value are required for write operation'
      )
    }

    this.logger.info('Writing to Bluetooth characteristic', {
      deviceId: input.deviceId,
      serviceUuid: input.serviceUuid,
      characteristicUuid: input.characteristicUuid
    })

    let valueToWrite: string

    // Handle different input value types
    if (typeof input.value === 'string') {
      // Check if it's already Base64
      if (this.isBase64(input.value)) {
        valueToWrite = input.value
      } else {
        // Convert string to Base64
        valueToWrite = Buffer.from(input.value).toString('base64')
      }
    } else if (Array.isArray(input.value)) {
      // Convert number array to Base64
      valueToWrite = Buffer.from(input.value).toString('base64')
    } else if (Buffer.isBuffer(input.value)) {
      // Convert Buffer to Base64
      valueToWrite = input.value.toString('base64')
    } else {
      throw new Error('Unsupported value type for write operation')
    }

    const withoutResponse = false // No response is more reliable for now

    await ipc(
      'bluetooth:write-characteristic',
      input.deviceId,
      input.serviceUuid,
      input.characteristicUuid,
      valueToWrite,
      withoutResponse
    )

    return {
      success: true,
      name: 'bluetoothDevice',
      message: `Successfully wrote to characteristic on device ${input.deviceId}`,
      result: {
        operation: 'write'
      }
    }
  }

  /**
   * Check if a string is a valid Base64 string
   */
  private isBase64(str: string): boolean {
    // Basic check for Base64 format
    const base64Regex = /^[A-Za-z0-9+/=]+$/

    // Must be valid Base64 characters and have valid length
    if (!base64Regex.test(str)) return false

    // Check padding
    if (str.length % 4 !== 0) return false

    try {
      // Try to decode and re-encode to check if it's valid Base64
      const decoded = Buffer.from(str, 'base64')
      return Buffer.from(decoded).toString('base64') === str
    } catch {
      return false
    }
  }

  /**
   * Check if a buffer contains utf8 text
   */
  private isUtf8(buffer: Buffer): boolean {
    // Simple heuristic: check if buffer contains mostly printable ASCII characters
    let printableChars = 0
    let controlChars = 0

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i]
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        printableChars++
      } else {
        controlChars++
      }
    }

    // If buffer is mostly printable characters, assume it's text
    return printableChars > controlChars && buffer.length > 0
  }

  /**
   * Sanitize input for logging
   */
  protected sanitizeInputForLogging(input: BluetoothInput): any {
    // Mask sensitive data like device IDs
    return {
      operation: input.operation,
      deviceId: input.deviceId ? '**masked**' : undefined,
      serviceUuid: input.serviceUuid,
      characteristicUuid: input.characteristicUuid,
      hasValue: !!input.value,
      scanDuration: input.scanDuration,
      scanFilter: input.scanFilter
    }
  }

  /**
   * Whether errors should be returned as JSON strings
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
