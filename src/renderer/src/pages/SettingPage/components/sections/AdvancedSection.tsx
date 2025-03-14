import React from 'react'
import { useTranslation } from 'react-i18next'
import { Kbd } from 'flowbite-react'
import { SettingSection } from '../SettingSection'

interface AdvancedSectionProps {
  sendMsgKey: 'Enter' | 'Cmd+Enter'
  onUpdateSendMsgKey: (key: 'Enter' | 'Cmd+Enter') => void
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  sendMsgKey,
  onUpdateSendMsgKey
}) => {
  const { t } = useTranslation()

  return (
    <SettingSection title={t('Advanced Setting')}>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          <div className="flex gap-2 items-center">
            <span>
              {t('When writing a message, press')} <Kbd className="bg-gray-200">{t('Enter')}</Kbd>{' '}
              {t('to')}
            </span>
          </div>
        </label>

        <div className="space-y-2">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onUpdateSendMsgKey('Enter')}
          >
            <input
              checked={sendMsgKey === 'Enter'}
              onChange={() => onUpdateSendMsgKey('Enter')}
              type="radio"
              name="send-msg-key"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500
                dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2
                dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
            <label className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
              {t('Send the message')}
            </label>
          </div>

          <div
            className="flex items-center cursor-pointer"
            onClick={() => onUpdateSendMsgKey('Cmd+Enter')}
          >
            <input
              checked={sendMsgKey === 'Cmd+Enter'}
              onChange={() => onUpdateSendMsgKey('Cmd+Enter')}
              type="radio"
              name="send-msg-key"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500
                dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2
                dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            />
            <label className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer">
              {t('Start a new line (use')} <Kbd className="bg-gray-200">⌘</Kbd> +{' '}
              <Kbd className="bg-gray-200">{t('Enter')}</Kbd> {t('to send)')}
            </label>
          </div>
        </div>
      </div>
    </SettingSection>
  )
}
