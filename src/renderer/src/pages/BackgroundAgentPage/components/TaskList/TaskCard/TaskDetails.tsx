import React from 'react'
import { ClockIcon, DocumentTextIcon, CpuChipIcon } from '@heroicons/react/24/outline'
import { AgentIcon } from '../atoms/AgentIcon'
import { ProjectPathDisplay } from '../atoms/ProjectPathDisplay'

interface TaskDetailsProps {
  cronExpression: string
  agent: { icon?: string; iconColor?: string; name: string } | null
  agentName: string
  modelName: string
  projectDirectory?: string
  onShowSystemPrompt: () => void
  systemPromptButtonTitle: string
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  cronExpression,
  agent,
  agentName,
  modelName,
  projectDirectory,
  onShowSystemPrompt,
  systemPromptButtonTitle
}) => {
  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <div className="flex items-center space-x-2">
        <div className="w-5 flex justify-start items-center">
          <ClockIcon className="h-4 w-4" />
        </div>
        <span>{cronExpression}</span>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-5 flex justify-start items-center">
            <AgentIcon agent={agent} size="sm" />
          </div>
          <span className="text-sm font-medium truncate" title={agentName}>
            {agentName}
          </span>
          <button
            onClick={onShowSystemPrompt}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title={systemPromptButtonTitle}
          >
            <DocumentTextIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 flex justify-start items-center">
            <CpuChipIcon className="h-4 w-4 text-gray-400" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate" title={modelName}>
            {modelName}
          </span>
        </div>
      </div>
      <div className="h-6 flex items-center">
        {projectDirectory && (
          <ProjectPathDisplay path={projectDirectory} variant="card" className="max-w-full" />
        )}
      </div>
    </div>
  )
}
