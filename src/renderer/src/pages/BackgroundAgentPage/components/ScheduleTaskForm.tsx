import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { ModelSelector } from '../../ChatPage/components/ModelSelector'
import { ScheduleConfig } from '../hooks/useBackgroundAgent'

interface ScheduleTaskFormProps {
  onSubmit: (config: ScheduleConfig) => Promise<void>
  onCancel: () => void
}

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5' },
  { label: 'Weekly on Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'Monthly on 1st at 9 AM', value: '0 9 1 * *' }
]

export const ScheduleTaskForm: React.FC<ScheduleTaskFormProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation()
  const { agents } = useSettings()

  const [formData, setFormData] = useState({
    name: '',
    cronExpression: '0 9 * * 1-5', // Default: Weekdays at 9 AM
    agentId: '',
    modelId: 'claude-3-5-sonnet-20241022-v2:0',
    projectDirectory: '',
    wakeWord: '',
    enabled: true
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // デフォルトのエージェントを設定
  useEffect(() => {
    if (agents.length > 0 && !formData.agentId) {
      setFormData((prev) => ({ ...prev, agentId: agents[0].id }))
    }
  }, [agents, formData.agentId])

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
          projectDirectory: formData.projectDirectory || undefined
        },
        wakeWord: formData.wakeWord,
        enabled: formData.enabled
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
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('backgroundAgent.form.title')}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('backgroundAgent.form.taskName')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={t('backgroundAgent.form.taskNamePlaceholder')}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Cron Expression */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('backgroundAgent.form.schedule')}
            </label>
            <select
              value={formData.cronExpression}
              onChange={(e) => setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
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
              onChange={(e) => setFormData((prev) => ({ ...prev, cronExpression: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0 9 * * 1-5"
            />
            {errors.cronExpression && (
              <p className="text-red-500 text-sm mt-1">{errors.cronExpression}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">{t('backgroundAgent.form.cronHelp')}</p>
          </div>

          {/* Agent Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('backgroundAgent.form.agent')}
            </label>
            <select
              value={formData.agentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, agentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">{t('backgroundAgent.form.selectAgent')}</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            {errors.agentId && <p className="text-red-500 text-sm mt-1">{errors.agentId}</p>}
            {selectedAgent && (
              <p className="text-gray-500 text-sm mt-1">{selectedAgent.description}</p>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('backgroundAgent.form.model')}
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-within:outline-none focus-within:ring-blue-500 focus-within:border-blue-500 dark:bg-gray-700 dark:border-gray-600">
              <ModelSelector
                openable={true}
                value={formData.modelId}
                onChange={(modelId) => setFormData((prev) => ({ ...prev, modelId }))}
                className="w-full"
              />
            </div>
            {errors.modelId && <p className="text-red-500 text-sm mt-1">{errors.modelId}</p>}
          </div>

          {/* Project Directory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('backgroundAgent.form.projectDirectory')}
            </label>
            <input
              type="text"
              value={formData.projectDirectory}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, projectDirectory: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={t('backgroundAgent.form.projectDirectoryPlaceholder')}
            />
            <p className="text-gray-500 text-xs mt-1">
              {t('backgroundAgent.form.projectDirectoryHelp')}
            </p>
          </div>

          {/* Wake Word */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('backgroundAgent.form.wakeWord')}
            </label>
            <textarea
              value={formData.wakeWord}
              onChange={(e) => setFormData((prev) => ({ ...prev, wakeWord: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder={t('backgroundAgent.form.wakeWordPlaceholder')}
            />
            {errors.wakeWord && <p className="text-red-500 text-sm mt-1">{errors.wakeWord}</p>}
            <p className="text-gray-500 text-xs mt-1">{t('backgroundAgent.form.wakeWordHelp')}</p>
          </div>

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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('common.creating') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
