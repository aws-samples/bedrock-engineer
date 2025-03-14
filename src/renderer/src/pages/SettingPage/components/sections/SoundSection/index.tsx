import React from 'react'
import { useTranslation } from 'react-i18next'
import { SettingSection } from '../../SettingSection'
import { SettingSelect } from '../../SettingSelect'
import { SoundType } from '@/types/sound'

interface SoundSectionProps {
  soundType: SoundType
  onUpdateSoundType: (type: SoundType) => void
}

export const SoundSection: React.FC<SoundSectionProps> = ({ soundType, onUpdateSoundType }) => {
  const { t } = useTranslation()

  const soundOptions = [
    { value: SoundType.NONE, label: t('None') },
    { value: SoundType.SND01, label: t('Sine') },
    { value: SoundType.SND02, label: t('Piano') },
    { value: SoundType.SND03, label: t('Industrial') }
  ]

  const handleSoundTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSoundType(e.target.value as SoundType)
  }

  return (
    <SettingSection
      title={t('Sound Settings')}
      description={t('Configure sound settings for typing')}
    >
      <div className="flex flex-col gap-4">
        <SettingSelect
          label={t('Sound Type')}
          value={soundType}
          options={soundOptions}
          onChange={handleSoundTypeChange}
        />
      </div>
    </SettingSection>
  )
}
