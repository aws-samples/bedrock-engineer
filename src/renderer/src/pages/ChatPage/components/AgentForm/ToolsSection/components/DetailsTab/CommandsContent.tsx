import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CommandsContentProps } from '../../types'
import { preventEventPropagation } from '../../utils/eventUtils'

/**
 * コマンド設定コンポーネント
 */
export const CommandsContent: React.FC<CommandsContentProps> = ({ commands = [], onChange }) => {
  const { t } = useTranslation()
  const [newCommand, setNewCommand] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editMode, setEditMode] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ pattern: string; description: string }>({
    pattern: '',
    description: ''
  })

  const handleAddCommand = () => {
    if (newCommand.trim() && newDescription.trim()) {
      onChange([
        ...commands,
        {
          pattern: newCommand.trim(),
          description: newDescription.trim()
        }
      ])
      setNewCommand('')
      setNewDescription('')
    }
  }

  const handleRemoveCommand = (pattern: string) => {
    onChange(commands.filter((cmd) => cmd.pattern !== pattern))
  }

  const handleEditCommand = (command: { pattern: string; description: string }) => {
    setEditMode(command.pattern)
    setEditData({ ...command })
  }

  const handleSaveEdit = () => {
    if (editData.pattern.trim() && editData.description.trim()) {
      onChange(commands.map((cmd) => (cmd.pattern === editMode ? { ...editData } : cmd)))
      setEditMode(null)
      setEditData({ pattern: '', description: '' })
    }
  }

  const handleCancelEdit = () => {
    setEditMode(null)
    setEditData({ pattern: '', description: '' })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('Configure which system commands the agent is allowed to execute.')}
      </p>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
        <h5 className="font-medium mb-1 text-yellow-800 dark:text-yellow-300 text-sm">
          {t('Security Warning')}
        </h5>
        <p className="text-xs text-gray-700 dark:text-gray-300">
          {t(
            'Only allow commands that you trust this agent to execute. Use wildcards (*) to define patterns.'
          )}
        </p>
      </div>

      {/* コマンド追加フォーム */}
      <div className="flex flex-col gap-2 mt-4">
        <h4 className="font-medium text-sm mb-2">{t('Add New Command Pattern')}</h4>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Command Pattern')}
          </label>
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="e.g., ls *"
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('Use * as a wildcard (e.g., "npm *" allows all npm commands)')}
          </p>
        </div>
        <div className="mt-2">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Description')}
          </label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="e.g., List directory contents"
            rows={2}
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
          />
        </div>
        <button
          onClick={(e) => {
            preventEventPropagation(e)
            handleAddCommand()
          }}
          disabled={!newCommand.trim() || !newDescription.trim()}
          className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2 w-fit"
        >
          {t('Add Command Pattern')}
        </button>
      </div>

      {/* 登録済みコマンドリスト */}
      <div className="space-y-3 mt-6">
        <h4 className="font-medium text-sm">{t('Allowed Commands')}</h4>
        <div className="grid grid-cols-1 gap-2">
          {commands.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('No commands allowed yet')}
            </p>
          ) : (
            commands.map((cmd) => (
              <div
                key={cmd.pattern}
                className="flex flex-col p-3 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
              >
                {editMode === cmd.pattern ? (
                  // 編集モード
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('Command Pattern')}
                      </label>
                      <input
                        type="text"
                        value={editData.pattern}
                        onChange={(e) => setEditData({ ...editData, pattern: e.target.value })}
                        className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('Use * as a wildcard')}
                      </p>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('Description')}
                      </label>
                      <textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={2}
                        className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          preventEventPropagation(e)
                          handleCancelEdit()
                        }}
                        className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {t('Cancel')}
                      </button>
                      <button
                        onClick={(e) => {
                          preventEventPropagation(e)
                          handleSaveEdit()
                        }}
                        disabled={!editData.pattern.trim() || !editData.description.trim()}
                        className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {t('Save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{cmd.description}</span>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <div>
                            <span className="font-mono">Pattern:</span> {cmd.pattern}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            preventEventPropagation(e)
                            handleEditCommand(cmd)
                          }}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          title={t('Edit')}
                          aria-label={t('Edit command')}
                        >
                          <span className="sr-only">{t('Edit')}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            preventEventPropagation(e)
                            handleRemoveCommand(cmd.pattern)
                          }}
                          className="text-red-500 hover:text-red-600 p-1"
                          title={t('Remove')}
                          aria-label={t('Remove command')}
                        >
                          <span className="sr-only">{t('Remove')}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
