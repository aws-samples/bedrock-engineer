import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KnowledgeBasesContentProps } from '../../types'
import { preventEventPropagation } from '../../utils/eventUtils'

/**
 * ナレッジベース設定コンポーネント
 */
export const KnowledgeBasesContent: React.FC<KnowledgeBasesContentProps> = ({
  knowledgeBases,
  onChange
}) => {
  const { t } = useTranslation()
  const [newId, setNewId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editMode, setEditMode] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ knowledgeBaseId: string; description: string }>({
    knowledgeBaseId: '',
    description: ''
  })

  const handleAddKnowledgeBase = () => {
    if (newId.trim() && newDescription.trim()) {
      onChange([
        ...knowledgeBases,
        {
          knowledgeBaseId: newId.trim(),
          description: newDescription.trim()
        }
      ])
      setNewId('')
      setNewDescription('')
    }
  }

  const handleRemoveKnowledgeBase = (id: string) => {
    onChange(knowledgeBases.filter((kb) => kb.knowledgeBaseId !== id))
  }

  const handleEditKnowledgeBase = (kb: { knowledgeBaseId: string; description: string }) => {
    setEditMode(kb.knowledgeBaseId)
    setEditData({ ...kb })
  }

  const handleSaveEdit = () => {
    if (editData.knowledgeBaseId.trim() && editData.description.trim()) {
      onChange(knowledgeBases.map((kb) => (kb.knowledgeBaseId === editMode ? { ...editData } : kb)))
      setEditMode(null)
      setEditData({
        knowledgeBaseId: '',
        description: ''
      })
    }
  }

  const handleCancelEdit = () => {
    setEditMode(null)
    setEditData({
      knowledgeBaseId: '',
      description: ''
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('Configure which knowledge bases this agent can access.')}
      </p>

      {/* Knowledge Base 追加フォーム */}
      <div className="flex flex-col gap-2 mt-4">
        <h4 className="font-medium text-sm mb-2">{t('Add New Knowledge Base')}</h4>

        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Knowledge Base ID')}
          </label>
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder={t('e.g., KB123456')}
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          />
        </div>

        <div className="mt-2">
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            {t('Description')}
          </label>
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="e.g., Customer support knowledge base"
            rows={2}
            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
          />
        </div>

        <button
          onClick={(e) => {
            preventEventPropagation(e)
            handleAddKnowledgeBase()
          }}
          disabled={!newId.trim() || !newDescription.trim()}
          className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2 w-fit"
        >
          {t('Add Knowledge Base')}
        </button>
      </div>

      {/* 登録済み Knowledge Base リスト */}
      <div className="space-y-3 mt-6">
        <h4 className="font-medium text-sm">{t('Available Knowledge Bases')}</h4>
        <div className="grid grid-cols-1 gap-2">
          {knowledgeBases.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('No knowledge bases registered yet')}
            </p>
          ) : (
            knowledgeBases.map((kb) => (
              <div
                key={kb.knowledgeBaseId}
                className="flex flex-col p-3 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
              >
                {editMode === kb.knowledgeBaseId ? (
                  // 編集モード
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {t('Knowledge Base ID')}
                      </label>
                      <input
                        type="text"
                        value={editData.knowledgeBaseId}
                        onChange={(e) =>
                          setEditData({ ...editData, knowledgeBaseId: e.target.value })
                        }
                        className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                      />
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
                        disabled={!editData.knowledgeBaseId.trim() || !editData.description.trim()}
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
                        <span className="font-medium">{kb.description}</span>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <div>
                            <span className="font-mono">ID:</span> {kb.knowledgeBaseId}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            preventEventPropagation(e)
                            handleEditKnowledgeBase(kb)
                          }}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          title={t('Edit')}
                          aria-label={t('Edit knowledge base')}
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
                            handleRemoveKnowledgeBase(kb.knowledgeBaseId)
                          }}
                          className="text-red-500 hover:text-red-600 p-1"
                          title={t('Remove')}
                          aria-label={t('Remove knowledge base')}
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
