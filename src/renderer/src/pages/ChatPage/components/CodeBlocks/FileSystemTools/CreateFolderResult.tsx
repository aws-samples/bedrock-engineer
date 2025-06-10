import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaFolder } from 'react-icons/fa'
import { ToolResultHeader, PathDisplay } from '../common'

interface CreateFolderResultData {
  success: boolean
  name: 'createFolder'
  message: string
  error?: string
  result?: {
    path: string
  }
}

interface CreateFolderResultProps {
  result: CreateFolderResultData
}

export const CreateFolderResult: React.FC<CreateFolderResultProps> = ({ result }) => {
  const { t } = useTranslation()

  if (!result.success || !result.result) {
    return (
      <ToolResultHeader
        success={false}
        toolName="Create Folder"
        title={t('Create Folder Failed')}
        error={result.error}
      />
    )
  }

  return (
    <ToolResultHeader
      success={true}
      toolName="createFolder"
      title={t('Folder Created Successfully')}
      icon={<FaFolder className="text-green-600 dark:text-green-400 text-xl flex-shrink-0" />}
    >
      <PathDisplay path={result.result.path} type="folder" copyable />
    </ToolResultHeader>
  )
}
