import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { ModelSelector } from '../../ChatPage/components/ModelSelector'
import { DirectorySelector } from '../../ChatPage/components/InputForm/DirectorySelector'
import { AgentSelector } from '../../ChatPage/components/AgentSelector'
import { useAgentSettingsModal } from '../../ChatPage/modals/useAgentSettingsModal'
import { IgnoreSettingsModal } from '@renderer/components/IgnoreSettingsModal'
import { ScheduleConfig } from '../hooks/useBackgroundAgent'

interface ScheduleTaskFormProps {
  onSubmit: (config: ScheduleConfig) => Promise<void>
  onCancel: () => void
}

export const ScheduleTaskForm: React.FC<ScheduleTaskFormProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation()
  const { agents } = useSettings()

  const CRON_PRESETS = [
    { label: t('backgroundAgent.cronPresets.everyMinute'), value: '* * * * *' },
    { label: t('backgroundAgent.cronPresets.every5Minutes'), value: '*/5 * * * *' },
    { label: t('backgroundAgent.cronPresets.everyHour'), value: '0 * * * *' },
    { label: t('backgroundAgent.cronPresets.dailyAt9AM'), value: '0 9 * * *' },
    { label: t('backgroundAgent.cronPresets.weekdaysAt9AM'), value: '0 9 * * 1-5' },
    { label: t('backgroundAgent.cronPresets.weeklyMondayAt9AM'), value: '0 9 * * 1' },
    { label: t('backgroundAgent.cronPresets.monthlyFirst9AM'), value: '0 9 1 * *' }
  ]

  const [formData, setFormData] = useState({
    name: '',
    cronExpression: '0 9 * * 1-5', // Default: Weekdays at 9 AM
    agentId: '',
    modelId: 'claude-3-5-sonnet-20241022-v2:0',
    projectDirectory: '',
    wakeWord: '',
    enabled: true,
    maxTokens: 4096, // Default max tokens
    continueSession: false, // セッション継続フラグ
    continueSessionPrompt: '' // セッション継続時専用プロンプト
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showProjectIgnoreModal, setShowProjectIgnoreModal] = useState(false)

  // Agent Settings Modal
  const {
    show: showAgentSettingModal,
    handleOpen: openAgentSettingsModal,
    handleClose: handleCloseAgentSettingsModal,
    AgentSettingsModal
  } = useAgentSettingsModal()

  // プロジェクトディレクトリ選択ハンドラー
  const handleSelectDirectory = async () => {
    try {
      const selectedPath = await window.api.openDirectory()
      if (selectedPath) {
        setFormData((prev) => ({ ...prev, projectDirectory: selectedPath }))
      }
    } catch (error) {
      console.error('Failed to select directory:', error)
    }
  }

  // プロジェクト固有の.ignoreモーダルを開く
  const handleOpenIgnoreModal = () => {
    if (formData.projectDirectory) {
      setShowProjectIgnoreModal(true)
    }
  }

  // デフォルトのエージェントを設定
  useEffect(() => {
    if (agents.length > 0 && !formData.agentId) {
      setFormData((prev) => ({ ...prev, agentId: agents[0].id }))
    }
  }, [agents, formData.agentId])

  // モデル変更時にmaxTokensの制限を調整
  useEffect(() => {
    const updateMaxTokens = async () => {
      try {
        const result = await window.api.bedrock.getModelMaxTokens(formData.modelId)
        const maxTokensLimit = result.maxTokens

        if (formData.maxTokens > maxTokensLimit) {
          setFormData((prev) => ({ ...prev, maxTokens: maxTokensLimit }))
        }
      } catch (error) {
        console.error('Failed to get model max tokens:', error)
        // エラーの場合はデフォルト値を使用
        const defaultMaxTokens = 8192
        if (formData.maxTokens > defaultMaxTokens) {
          setFormData((prev) => ({ ...prev, maxTokens: defaultMaxTokens }))
        }
      }
    }

    updateMaxTokens()
  }, [formData.modelId, formData.maxTokens])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('backgroundAgent.form.errors.nameRequired')
    }

    if (!formData.cronExpression.trim()) {
      newErrors.cronExpression = t('backgroundAgent.form.errors.cronRequired')
    }

    if (!formData.agentId) {
      newErrors.agentId = t('backgroundAgent.form.errors.agentRequired')
    }

    if (!formData.modelId) {
      newErrors.modelId = t('backgroundAgent.form.errors.modelRequired')
    }

    if (!formData.wakeWord.trim()) {
      newErrors.wakeWord = t('backgroundAgent.form.errors.wakeWordRequired')
    }

    if (formData.maxTokens < 1 || formData.maxTokens > 64000) {
      newErrors.maxTokens = t('backgroundAgent.form.errors.invalidMaxTokens')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const config: ScheduleConfig = {
        name: formData.name,
        cronExpression: formData.cronExpression,
        agentConfig: {
          modelId: formData.modelId,
          agentId: formData.agentId,
          projectDirectory: formData.projectDirectory || undefined,
          inferenceConfig: {
            maxTokens: formData.maxTokens
          }
        },
        wakeWord: formData.wakeWord,
        enabled: formData.enabled,
        continueSession: formData.continueSession,
        continueSessionPrompt: formData.continueSessionPrompt || undefined
      }

      await onSubmit(config)
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedAgent = agents.find((agent) => agent.id === formData.agentId)

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 w-full max-w-5xl">
        <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('backgroundAgent.form.title')}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Task Name - Full width */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('backgroundAgent.form.taskName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder={t('backgroundAgent.form.taskNamePlaceholder')}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* 2-column grid for form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Settings */}
                <div className="space-y-4">
                  {/* Cron Expression */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('backgroundAgent.form.schedule')}
                    </label>
                    <select
                      value={formData.cronExpression}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white mb-2"
                    >
                      {CRON_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label} ({preset.value})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.cronExpression}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="0 9 * * 1-5"
                    />
                    {errors.cronExpression && (
                      <p className="text-red-500 text-sm mt-1">{errors.cronExpression}</p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {t('backgroundAgent.form.cronHelp')}
                    </p>
                  </div>

                  {/* Agent Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('backgroundAgent.form.agent')}
                    </label>

                    <AgentSelector
                      agents={agents}
                      selectedAgent={formData.agentId}
                      onOpenSettings={openAgentSettingsModal}
                    />

                    {errors.agentId && (
                      <p className="text-red-500 text-sm mt-1">{errors.agentId}</p>
                    )}
                    {selectedAgent && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t(selectedAgent.description)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column - Execution Settings */}
                <div className="space-y-4">
                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('backgroundAgent.form.model')}
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-within:outline-none focus-within:ring-blue-500 focus-within:border-blue-500 dark:bg-gray-800 dark:border-gray-600">
                      <ModelSelector
                        openable={true}
                        value={formData.modelId}
                        onChange={(modelId) => setFormData((prev) => ({ ...prev, modelId }))}
                        className="w-full"
                      />
                    </div>
                    {errors.modelId && (
                      <p className="text-red-500 text-sm mt-1">{errors.modelId}</p>
                    )}
                  </div>

                  {/* Project Directory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('backgroundAgent.form.projectDirectory')}
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:border-gray-600">
                      <DirectorySelector
                        projectPath={
                          formData.projectDirectory ||
                          t('backgroundAgent.form.selectProjectDirectory')
                        }
                        onSelectDirectory={handleSelectDirectory}
                        onOpenIgnoreModal={handleOpenIgnoreModal}
                      />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {t('backgroundAgent.form.projectDirectoryHelp')}
                    </p>
                  </div>

                  {/* Max Output Tokens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('backgroundAgent.form.maxTokens')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="64000"
                      value={formData.maxTokens}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxTokens: parseInt(e.target.value) || 1
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="4096"
                    />
                    {errors.maxTokens && (
                      <p className="text-red-500 text-sm mt-1">{errors.maxTokens}</p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {t('backgroundAgent.form.maxTokensHelp')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wake Word - Full width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('backgroundAgent.form.wakeWord')}
                </label>
                <textarea
                  value={formData.wakeWord}
                  onChange={(e) => setFormData((prev) => ({ ...prev, wakeWord: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder={t('backgroundAgent.form.wakeWordPlaceholder')}
                />
                {errors.wakeWord && <p className="text-red-500 text-sm mt-1">{errors.wakeWord}</p>}
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  {t('backgroundAgent.form.wakeWordHelp')}
                </p>
              </div>

              {/* Continue Session Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="continueSession"
                  checked={formData.continueSession}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, continueSession: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="continueSession"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                >
                  {t('backgroundAgent.form.continueSession')}
                </label>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {t('backgroundAgent.form.continueSessionHelp')}
              </p>

              {/* Continue Session Prompt - Only show when continueSession is true */}
              {formData.continueSession && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('backgroundAgent.form.continueSessionPrompt')}
                  </label>
                  <textarea
                    value={formData.continueSessionPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, continueSessionPrompt: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    placeholder={t('backgroundAgent.form.continueSessionPromptPlaceholder')}
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {t('backgroundAgent.form.continueSessionPromptHelp')}
                  </p>
                </div>
              )}

              {/* Enabled Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="enabled"
                  className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                >
                  {t('backgroundAgent.form.enableTask')}
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                  {isSubmitting ? t('common.creating') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Ignore Settings Modal */}
      <IgnoreSettingsModal
        isOpen={showProjectIgnoreModal}
        onClose={() => setShowProjectIgnoreModal(false)}
        projectPath={formData.projectDirectory}
      />

      {/* Agent Settings Modal */}
      <AgentSettingsModal
        isOpen={showAgentSettingModal}
        onClose={handleCloseAgentSettingsModal}
        selectedAgentId={formData.agentId}
        onSelectAgent={(agentId) => setFormData((prev) => ({ ...prev, agentId }))}
      />
    </div>
  )
}
