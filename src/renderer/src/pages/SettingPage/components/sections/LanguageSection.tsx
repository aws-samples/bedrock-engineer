import React from 'react'
import { useTranslation } from 'react-i18next'
import { FcGlobe } from 'react-icons/fc'
import { SettingSection } from '../SettingSection'
import { SettingSelect } from '../SettingSelect'

interface LanguageSectionProps {
  currentLanguage: string
  onChangeLanguage: (language: 'ja' | 'en') => void
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({
  currentLanguage,
  onChangeLanguage
}) => {
  const { t } = useTranslation()

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' } // eslint-disable-line i18nhelper/no-jp-string
  ]

  return (
    <SettingSection title={t('Language')} icon={FcGlobe}>
      <SettingSelect
        label={t('Select Language')}
        value={currentLanguage}
        options={languageOptions}
        onChange={(e) => onChangeLanguage(e.target.value as 'ja' | 'en')}
      />
    </SettingSection>
  )
}
