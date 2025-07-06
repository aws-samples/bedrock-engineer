import React from 'react'
import { FcFolder } from 'react-icons/fc'

type DirectorySelectorProps = {
  projectPath: string
  onSelectDirectory: () => void
  onOpenIgnoreModal: () => void
}

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({
  projectPath,
  onSelectDirectory,
  onOpenIgnoreModal
}) => {
  // プロジェクトパスが有効に選択されているかを判定
  const isProjectSelected =
    projectPath &&
    projectPath.trim() !== '' &&
    !projectPath.includes('選択') &&
    !projectPath.includes('Select') &&
    (projectPath.startsWith('/') || projectPath.match(/^[A-Za-z]:/))

  return (
    <div className="flex gap-2">
      <label
        onClick={onSelectDirectory}
        className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-gray-500"
      >
        <div className="flex gap-2 items-center">
          <FcFolder className="text-lg" />
          <span>{projectPath}</span>
        </div>
      </label>
      {isProjectSelected && (
        <label
          onClick={onOpenIgnoreModal}
          className="block text-sm font-medium text-gray-500 dark:text-white cursor-pointer hover:text-gray-500"
        >
          .ignore
        </label>
      )}
    </div>
  )
}
