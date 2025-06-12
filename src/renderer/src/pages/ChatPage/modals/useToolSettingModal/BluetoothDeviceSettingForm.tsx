import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaBluetooth, FaInfoCircle } from 'react-icons/fa'
import { HiOutlineDeviceMobile } from 'react-icons/hi'
import { Alert } from 'flowbite-react'

export const BluetoothDeviceSettingForm: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="prose dark:prose-invert max-w-none">
      {/* ツールの説明 */}
      <div className="mb-6 w-full">
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          {t(
            'tool info.bluetoothDevice.description',
            'The Bluetooth tool allows interaction with nearby Bluetooth devices. You can scan for devices, connect to them, and read/write data from their services and characteristics. This enables communication with sensors, peripherals, and smart devices.'
          )}
        </p>
      </div>

      {/* 使用方法セクション */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">{t('Usage Information')}</h4>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 dark:border dark:border-blue-700 rounded-md">
          <h5 className="font-medium mb-2 flex items-center dark:text-blue-300">
            <FaBluetooth className="mr-2" />
            {t('Supported Operations')}
          </h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>
              • <strong>scan</strong>: {t('Scan for nearby Bluetooth devices')}
            </li>
            <li>
              • <strong>connect</strong>: {t('Connect to a specific device')}
            </li>
            <li>
              • <strong>disconnect</strong>: {t('Disconnect from a connected device')}
            </li>
            <li>
              • <strong>read</strong>: {t('Read data from device characteristics')}
            </li>
            <li>
              • <strong>write</strong>: {t('Write data to device characteristics')}
            </li>
          </ul>
        </div>

        {/* 基本的な使用例 */}
        <div className="mt-2">
          <h5 className="font-medium mb-2 text-sm">{t('Example Usage')}</h5>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-auto">
            {`{
  "type": "bluetoothDevice",
  "operation": "scan",
  "scanDuration": 5
}`}
          </div>

          <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-auto">
            {`{
  "type": "bluetoothDevice",
  "operation": "connect",
  "deviceId": "00:11:22:33:44:55"
}`}
          </div>

          <div className="mt-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm font-mono overflow-auto">
            {`{
  "type": "bluetoothDevice",
  "operation": "read",
  "deviceId": "00:11:22:33:44:55",
  "serviceUuid": "180F",
  "characteristicUuid": "2A19"
}`}
          </div>
        </div>
      </div>

      {/* プラットフォーム要件 */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200 flex items-center">
          <HiOutlineDeviceMobile className="mr-2" />
          {t('Platform Requirements')}
        </h4>

        <Alert color="warning" icon={FaInfoCircle}>
          <div className="font-medium">{t('Bluetooth Device Access')}</div>
          <div className="mt-1 text-sm">
            {t(
              'This tool requires Bluetooth hardware and appropriate permissions. Usage may vary by operating system.'
            )}
          </div>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-700 rounded-md">
            <h5 className="font-medium mb-2 dark:text-green-300">{t('Windows')}</h5>
            <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
              <li>• {t('Bluetooth adapter required')}</li>
              <li>• {t('Windows 10 or later recommended')}</li>
              <li>• {t('Pairing may be required for some devices')}</li>
            </ul>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-700 rounded-md">
            <h5 className="font-medium mb-2 dark:text-green-300">{t('macOS')}</h5>
            <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
              <li>• {t('Built-in Bluetooth hardware supported')}</li>
              <li>• {t('macOS 10.13 or later recommended')}</li>
              <li>• {t('May require user permission confirmation')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 dark:border dark:border-yellow-700 rounded-md">
          <h5 className="font-medium mb-2 dark:text-yellow-300">{t('Usage Tips')}</h5>
          <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
            <li>• {t('Ensure Bluetooth is enabled on your system')}</li>
            <li>• {t('Some devices may need to be in pairing mode')}</li>
            <li>• {t('Battery-powered devices should have sufficient power')}</li>
            <li>• {t('Keep devices within reasonable proximity (10m/30ft)')}</li>
          </ul>
        </div>
      </div>

      {/* セキュリティ情報 */}
      <div className="flex flex-col gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md mb-6 w-full">
        <h4 className="font-medium text-sm mb-2 dark:text-gray-200">{t('Security Information')}</h4>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t(
            'When using the Bluetooth tool, be aware that it provides access to nearby Bluetooth devices. Consider the security implications of allowing an AI agent to interact with peripherals in your environment.'
          )}
        </p>

        <Alert color="info">
          {t(
            'This tool is currently in beta. Functionality may be limited or vary by device type and operating system.'
          )}
        </Alert>
      </div>
    </div>
  )
}
