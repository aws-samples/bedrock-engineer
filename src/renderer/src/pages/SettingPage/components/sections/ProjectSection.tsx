import React from 'react'
import { useTranslation } from 'react-i18next'
import { FcFolder } from 'react-icons/fc'
import { SettingSection } from '../SettingSection'

interface ProjectSectionProps {
  projectPath: string
  onSelectDirectory: () => Promise<void>
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  projectPath,
  onSelectDirectory
}) => {
  const { t } = useTranslation()

  return (
    <SettingSection title={t('Project Setting')}>
      <label
        onClick={onSelectDirectory}
        className="block text-md font-medium text-gray-900 dark:text-white
          cursor-pointer hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        <div className="flex gap-2 items-center">
          <FcFolder className="text-lg" />
          <span>{projectPath || t('Select Project Directory')}</span>
        </div>
      </label>
    </SettingSection>
  )
}
