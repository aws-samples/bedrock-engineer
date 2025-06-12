import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaBluetooth, FaChevronDown, FaChevronRight, FaCheck } from 'react-icons/fa'
import { HiOutlineChip, HiOutlineInformationCircle, HiOutlineDeviceMobile } from 'react-icons/hi'

export interface BluetoothDeviceResponse {
  success: boolean
  name: string
  message: string
  result: {
    operation: string
    devices?: Array<{
      id: string
      name: string
      address: string
      rssi: number
      connectable: boolean
      paired: boolean
      serviceUUIDs?: string[]
    }>
    device?: {
      id: string
      name: string
      address: string
      rssi: number
      connectable: boolean
      paired: boolean
    }
    services?: Array<{
      uuid: string
      name?: string
      isPrimary: boolean
      deviceId: string
    }>
    characteristics?: Array<{
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
    }>
    value?: string | number[] | Buffer
    error?: string
  }
}

export const BluetoothDeviceResult: React.FC<{ response: BluetoothDeviceResponse }> = ({
  response
}) => {
  const { t } = useTranslation()
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)

  // RSSI値からシグナル強度を視覚的に表示
  const getRssiStrength = (rssi: number) => {
    if (rssi >= -60) return 'bg-green-500'
    if (rssi >= -70) return 'bg-green-400'
    if (rssi >= -80) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  // 操作に基づくUI表示
  const renderOperationResult = () => {
    const { operation } = response.result

    switch (operation) {
      case 'scan':
        return renderScanResult()
      case 'connect':
        return renderConnectResult()
      case 'disconnect':
        return renderDisconnectResult()
      case 'read':
        return renderReadResult()
      case 'write':
        return renderWriteResult()
      default:
        return (
          <div className="p-4 bg-gray-800 dark:bg-gray-700 rounded-md">
            <p>{t('Operation {{operation}} result', { operation })}</p>
            <pre className="mt-2 p-2 bg-gray-900 dark:bg-gray-800 rounded overflow-auto">
              {JSON.stringify(response.result, null, 2)}
            </pre>
          </div>
        )
    }
  }

  // スキャン結果表示
  const renderScanResult = () => {
    const { devices = [] } = response.result

    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{t('Bluetooth Scan Results')}</h3>
          <p className="text-sm text-gray-400">
            {t('Found {{count}} devices', { count: devices.length })}
          </p>
        </div>

        {devices.length === 0 ? (
          <div className="p-4 bg-gray-800 dark:bg-gray-700 rounded-md text-center">
            <p>{t('No Bluetooth devices found')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-3 bg-gray-800 dark:bg-gray-700 rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                onClick={() => setExpandedDevice(expandedDevice === device.id ? null : device.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-400">
                      <FaBluetooth size={18} />
                    </div>
                    <div>
                      <h4 className="font-medium">{device.name || t('Unknown Device')}</h4>
                      <p className="text-xs text-gray-400">{device.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <div className="w-6 h-3 rounded-full bg-gray-600 relative overflow-hidden">
                        <div
                          className={`h-full ${getRssiStrength(device.rssi)}`}
                          style={{ width: `${Math.min(100, (100 + device.rssi) / 0.6)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs ml-1">{device.rssi} dBm</span>
                    </div>
                    {expandedDevice === device.id ? (
                      <FaChevronDown className="text-gray-400" />
                    ) : (
                      <FaChevronRight className="text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedDevice === device.id && (
                  <div className="mt-3 pt-3 border-t border-gray-700 dark:border-gray-600">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{t('Connectable')}:</span>
                        {device.connectable ? (
                          <FaCheck className="text-green-400" />
                        ) : (
                          <span className="text-red-400">✕</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{t('Paired')}:</span>
                        {device.paired ? <FaCheck className="text-green-400" /> : <span>-</span>}
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 mr-2">{t('Address')}:</span>
                        <span>{device.address}</span>
                      </div>
                      {device.serviceUUIDs && device.serviceUUIDs.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-400 block mb-1">{t('Services')}:</span>
                          <div className="flex flex-wrap gap-1">
                            {device.serviceUUIDs.map((uuid, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-700 dark:bg-gray-600 rounded text-xs"
                              >
                                {uuid}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 接続結果表示
  const renderConnectResult = () => {
    const { device, services = [] } = response.result

    if (!device) {
      return (
        <div className="p-4 bg-gray-800 rounded-md">
          {t('Device connection details unavailable')}
        </div>
      )
    }

    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{t('Connected to Device')}</h3>
          <div className="flex items-center mt-1">
            <FaBluetooth className="text-blue-400 mr-2" />
            <span className="font-medium">{device.name || device.id}</span>
          </div>
        </div>

        <div className="p-3 bg-gray-800 dark:bg-gray-700 rounded-md mb-4">
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <HiOutlineDeviceMobile className="mr-2" />
            {t('Device Information')}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">{t('ID')}:</span> {device.id}
            </div>
            {device.address && (
              <div>
                <span className="text-gray-400">{t('Address')}:</span> {device.address}
              </div>
            )}
            {device.rssi !== undefined && (
              <div>
                <span className="text-gray-400">{t('Signal')}:</span>{' '}
                <span className={`${device.rssi > -70 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {device.rssi} dBm
                </span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <HiOutlineChip className="mr-2" />
            {t('Available Services')} ({services.length})
          </h4>

          {services.length > 0 ? (
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.uuid}
                  className="p-2 bg-gray-800 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 rounded-md"
                >
                  <div className="text-sm font-medium">
                    {service.name || t('Service')}{' '}
                    <span className="text-xs font-mono text-gray-400">{service.uuid}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-gray-800 dark:bg-gray-700 rounded-md text-center">
              <p className="text-sm text-gray-400">{t('No services discovered')}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 切断結果表示
  const renderDisconnectResult = () => {
    return (
      <div className="p-4 bg-gray-800 dark:bg-gray-700 rounded-md text-center">
        <FaBluetooth className="text-blue-400 mx-auto mb-2" size={24} />
        <h3 className="text-lg font-medium">{t('Device Disconnected')}</h3>
        <p className="text-sm text-gray-400">{response.message}</p>
      </div>
    )
  }

  // 読み取り結果表示
  const renderReadResult = () => {
    const { value } = response.result

    // 値の種類に基づいて表示を変える
    let displayValue: JSX.Element

    if (Array.isArray(value)) {
      // バイト配列の場合
      displayValue = (
        <div className="font-mono bg-gray-900 dark:bg-gray-800 p-2 rounded-md overflow-auto">
          {value.map((byte, index) => (
            <span
              key={index}
              className="inline-block px-1 py-0.5 m-0.5 bg-gray-800 dark:bg-gray-700 rounded text-xs"
            >
              {typeof byte === 'number' ? `0x${byte.toString(16).padStart(2, '0')}` : byte}
            </span>
          ))}
        </div>
      )
    } else if (typeof value === 'string') {
      // テキストの場合
      displayValue = (
        <div className="bg-gray-900 dark:bg-gray-800 p-2 rounded-md overflow-auto">
          {/* テキストとしてそのまま表示する */}
          {value}
        </div>
      )
    } else {
      // その他の場合はJSON表示
      displayValue = (
        <pre className="bg-gray-900 dark:bg-gray-800 p-2 rounded-md overflow-auto text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }

    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-medium">{t('Characteristic Read Result')}</h3>
          <p className="text-sm text-gray-400">{response.message}</p>
        </div>

        <div className="mt-3">
          <h4 className="text-sm font-medium mb-1">{t('Value')}:</h4>
          {displayValue}
        </div>
      </div>
    )
  }

  // 書き込み結果表示
  const renderWriteResult = () => {
    return (
      <div className="p-4 bg-gray-800 dark:bg-gray-700 rounded-md">
        <div className="flex items-center justify-center mb-2">
          <div className="rounded-full bg-green-500/20 p-2">
            <FaCheck className="text-green-500" size={16} />
          </div>
        </div>
        <h3 className="text-lg font-medium text-center">{t('Write Successful')}</h3>
        <p className="text-sm text-gray-400 text-center mt-1">{response.message}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-700 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 p-4 pb-2 border-b border-gray-700 dark:border-gray-600">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FaBluetooth className="text-blue-400" />
            {t('Bluetooth Device')}
          </h3>
          <div className="text-xs text-gray-500">
            {response.result.operation && (
              <span className="bg-blue-500/20 text-blue-400 rounded px-2 py-0.5">
                {response.result.operation.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="p-4">
          {!response.success && response.result?.error ? (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-md">
              <div className="flex items-start">
                <HiOutlineInformationCircle className="text-red-400 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-red-400">{t('Operation Failed')}</h4>
                  <p className="text-sm mt-1">{response.result.error}</p>
                </div>
              </div>
            </div>
          ) : (
            renderOperationResult()
          )}
        </div>
      </div>
    </div>
  )
}
