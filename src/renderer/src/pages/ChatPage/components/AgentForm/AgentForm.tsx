import React from 'react'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import { AgentFormProps } from './types'
import { useAgentForm } from './useAgentForm'
import { BasicSection } from './BasicSection'
import { SystemPromptSection } from './SystemPromptSection'
import { ScenariosSection } from './ScenariosSection'
import { TagsSection } from './TagsSection'
import { useAgentGenerator } from '../../hooks/useAgentGenerator'
import { useScenarioGenerator } from '../../hooks/useScenarioGenerator'
import toast from 'react-hot-toast'
import { FiSave } from 'react-icons/fi'
import { useAgentFilter } from '../AgentList'

export const AgentForm: React.FC<AgentFormProps> = ({ agent, onSave, onCancel }) => {
  const { t } = useTranslation()
  const { projectPath, allowedCommands, knowledgeBases, bedrockAgents, agents } = useSetting()
  const { availableTags } = useAgentFilter(agents)

  const { formData, updateField, handleSubmit } = useAgentForm(agent, onSave)
  const { generateAgentSystemPrompt, generatedAgentSystemPrompt, isGenerating } =
    useAgentGenerator()
  const {
    generateScenarios,
    generatedScenarios,
    isGenerating: isGeneratingScenarios
  } = useScenarioGenerator()

  const handleAutoGeneratePrompt = async () => {
    if (!formData.name || !formData.description) {
      toast.error(t('pleaseEnterNameAndDescription'))
      return
    }
    await generateAgentSystemPrompt(formData.name, formData.description)
  }

  const handleGenerateScenarios = async () => {
    if (!formData.name || !formData.description || !formData.system) {
      toast.error(t('inputAgentInfoError'))
      return
    }
    await generateScenarios(formData.name, formData.description, formData.system)
  }

  // Update system prompt when generated
  React.useEffect(() => {
    if (generatedAgentSystemPrompt) {
      updateField('system', generatedAgentSystemPrompt)
    }
  }, [generatedAgentSystemPrompt])

  // Update scenarios when generated
  React.useEffect(() => {
    if (generatedScenarios.length > 0) {
      updateField('scenarios', generatedScenarios)
    }
  }, [generatedScenarios])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BasicSection
        name={formData.name}
        description={formData.description}
        icon={formData.icon}
        iconColor={formData.iconColor}
        onChange={(field, value) => updateField(field, value)}
      />

      <SystemPromptSection
        system={formData.system}
        name={formData.name}
        description={formData.description}
        onChange={(value) => updateField('system', value)}
        onAutoGenerate={handleAutoGeneratePrompt}
        isGenerating={isGenerating}
        projectPath={projectPath}
        allowedCommands={allowedCommands}
        knowledgeBases={knowledgeBases}
        bedrockAgents={bedrockAgents}
      />

      <ScenariosSection
        scenarios={formData.scenarios}
        name={formData.name}
        description={formData.description}
        system={formData.system}
        onChange={(scenarios) => updateField('scenarios', scenarios)}
        isGenerating={isGeneratingScenarios}
        onAutoGenerate={handleGenerateScenarios}
      />

      <TagsSection
        tags={formData.tags || []}
        availableTags={availableTags}
        onChange={(tags) => updateField('tags', tags)}
      />

      <div className="flex justify-end pt-4 pb-4 space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isGenerating || isGeneratingScenarios}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-all duration-200
            ${
              isGenerating || isGeneratingScenarios
                ? 'text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-70'
                : 'text-white bg-blue-600 dark:bg-blue-700 border-transparent hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
        >
          {isGenerating || isGeneratingScenarios ? (
            <>
              <svg
                className="w-4 h-4 mr-1 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p>{t('generating')}...</p>
            </>
          ) : (
            <>
              <FiSave />
              <p>{t('save')}</p>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
